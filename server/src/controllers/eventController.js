const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { eventSchema } = require('../validators/schemas');
const { generateQrDataUrl, verifyEventTicket } = require('../services/qrService');
const { broadcastGlobal } = require('../sockets/socketHandler');

const getEvents = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email role')
      .sort({ date: 1 });

    // Check current user's registration status for each event
    const eventIds = events.map((e) => e._id);
    const userRegistrations = await EventRegistration.find({
      event: { $in: eventIds },
      user: req.user._id,
    });

    const registeredMap = {};
    for (const reg of userRegistrations) {
      registeredMap[reg.event.toString()] = reg;
    }

    const enrichedEvents = events.map((event) => {
      const reg = registeredMap[event._id.toString()];
      return {
        ...event.toObject(),
        isRegistered: !!reg,
        registrationDetails: reg || null,
      };
    });

    return res.status(200).json({
      success: true,
      events: enrichedEvents,
    });
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email role');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const userRegistration = await EventRegistration.findOne({
      event: event._id,
      user: req.user._id,
    });

    let qrTicketDataUrl = null;
    if (userRegistration) {
      qrTicketDataUrl = await generateQrDataUrl(userRegistration.ticketToken);
    }

    return res.status(200).json({
      success: true,
      event,
      isRegistered: !!userRegistration,
      registration: userRegistration,
      qrTicketDataUrl,
    });
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const validatedData = eventSchema.parse(req.body);

    const bannerUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const event = new Event({
      ...validatedData,
      organizer: req.user._id,
      bannerUrl,
      registeredCount: 0,
    });

    await event.save();

    const populated = await Event.findById(event._id).populate('organizer', 'name email role');

    broadcastGlobal('event:new', populated);

    return res.status(201).json({
      success: true,
      message: 'Campus event created successfully.',
      event: populated,
    });
  } catch (err) {
    next(err);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Event registration deadline has passed.',
      });
    }

    // Atomically increment registered count if capacity permits
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        $expr: { $lt: ['$registeredCount', '$capacity'] },
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, this event has reached full seating capacity.',
      });
    }

    let registration;
    try {
      registration = new EventRegistration({
        event: event._id,
        user: req.user._id,
      });
      await registration.save();
    } catch (regErr) {
      // Rollback registered count if duplicate or error occurs
      await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: -1 } });
      if (regErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'You are already registered for this campus event.',
        });
      }
      throw regErr;
    }

    const qrTicketDataUrl = await generateQrDataUrl(registration.ticketToken);

    return res.status(201).json({
      success: true,
      message: 'Successfully registered for event! Your entry pass is ready.',
      registration,
      qrTicketDataUrl,
    });
  } catch (err) {
    next(err);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await EventRegistration.findOneAndDelete({
      event: req.params.id,
      user: req.user._id,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found.',
      });
    }

    await Event.findByIdAndUpdate(req.params.id, {
      $inc: { registeredCount: -1 },
    });

    return res.status(200).json({
      success: true,
      message: 'Event registration cancelled successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const getEventAttendees = async (req, res, next) => {
  try {
    const attendees = await EventRegistration.find({ event: req.params.id })
      .populate('user', 'name email role department phone')
      .sort({ registeredAt: 1 });

    return res.status(200).json({
      success: true,
      attendees,
    });
  } catch (err) {
    next(err);
  }
};

const verifyAttendance = async (req, res, next) => {
  try {
    const { ticketToken } = req.body;
    if (!ticketToken) {
      return res.status(400).json({
        success: false,
        message: 'Ticket token is required for attendance validation.',
      });
    }

    const result = await verifyEventTicket(req.params.id, ticketToken);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        alreadyAttended: result.alreadyAttended,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      attendee: result.registration.user,
      registration: result.registration,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  registerForEvent,
  cancelRegistration,
  getEventAttendees,
  verifyAttendance,
};
