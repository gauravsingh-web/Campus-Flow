const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { complaintSchema, updateComplaintStatusSchema } = require('../validators/schemas');
const { notifyUser, notifyRole } = require('../sockets/socketHandler');

const getComplaints = async (req, res, next) => {
  try {
    const user = req.user;
    const { status, category, priority, search } = req.query;

    const query = {};

    if (user.role === 'student') {
      // Students can ONLY view their own complaints
      query.student = user._id;
    } else if (user.role === 'faculty') {
      // Faculty view complaints assigned to them or their department
      query.$or = [{ assignedTo: user._id }];
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('student', 'name email role department')
      .populate('assignedTo', 'name email role')
      .populate('history.changedBy', 'name role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      complaints,
    });
  } catch (err) {
    next(err);
  }
};

const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name email role phone department')
      .populate('assignedTo', 'name email role')
      .populate('history.changedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.',
      });
    }

    // Role check: Students can only view their own
    if (
      req.user.role === 'student' &&
      complaint.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this complaint.',
      });
    }

    return res.status(200).json({
      success: true,
      complaint,
    });
  } catch (err) {
    next(err);
  }
};

const createComplaint = async (req, res, next) => {
  try {
    const validatedData = complaintSchema.parse(req.body);

    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const complaint = new Complaint({
      ...validatedData,
      student: req.user._id,
      attachmentUrl,
      history: [
        {
          status: 'Submitted',
          changedBy: req.user._id,
          notes: 'Grievance ticket created by student.',
          timestamp: new Date(),
        },
      ],
    });

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('student', 'name email role department')
      .populate('history.changedBy', 'name role');

    // Notify admins in real-time
    notifyRole('admin', 'complaint:new', populated);

    return res.status(201).json({
      success: true,
      message: `Complaint registered successfully with ID: ${complaint.complaintId}`,
      complaint: populated,
    });
  } catch (err) {
    next(err);
  }
};

const assignComplaint = async (req, res, next) => {
  try {
    const { assignedTo, notes = '' } = req.body;
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Assigned faculty or staff user ID is required.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    complaint.assignedTo = assignedTo;
    complaint.status = 'Assigned';
    complaint.history.push({
      status: 'Assigned',
      changedBy: req.user._id,
      notes: notes || `Complaint assigned to staff/faculty member.`,
      timestamp: new Date(),
    });

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('student', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('history.changedBy', 'name role');

    // Real-time socket notification to the assigned faculty
    notifyUser(assignedTo, 'complaint:assigned', populated);

    // Save persistent notification for assigned faculty
    await Notification.create({
      recipient: assignedTo,
      sender: req.user._id,
      type: 'Complaint_Assigned',
      title: `Assigned: ${complaint.complaintId}`,
      message: `You have been assigned complaint: "${complaint.title}" at ${complaint.location}`,
      link: `/complaints`,
    });

    // Notify student of assignment
    notifyUser(complaint.student, 'complaint:updated', populated);

    return res.status(200).json({
      success: true,
      message: 'Complaint assigned successfully.',
      complaint: populated,
    });
  } catch (err) {
    next(err);
  }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, resolutionNotes, assignedTo } = updateComplaintStatusSchema.parse(req.body);

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Faculty can only update if assigned to them or if admin
    if (
      req.user.role === 'faculty' &&
      (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only update complaints assigned to you.',
      });
    }

    complaint.status = status;
    if (resolutionNotes) {
      complaint.resolutionNotes = resolutionNotes;
    }
    if (assignedTo && req.user.role === 'admin') {
      complaint.assignedTo = assignedTo;
    }

    complaint.history.push({
      status,
      changedBy: req.user._id,
      notes: resolutionNotes || `Status updated to ${status}`,
      timestamp: new Date(),
    });

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('student', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('history.changedBy', 'name role');

    // Notify student via Socket and create Notification record
    notifyUser(complaint.student._id, 'complaint:status_change', populated);

    await Notification.create({
      recipient: complaint.student._id,
      sender: req.user._id,
      type: 'Complaint_Status',
      title: `Complaint ${complaint.complaintId} status changed`,
      message: `Your grievance "${complaint.title}" is now marked as ${status}. ${resolutionNotes ? `Notes: ${resolutionNotes}` : ''}`,
      link: `/complaints`,
    });

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      complaint: populated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  assignComplaint,
  updateComplaintStatus,
};
