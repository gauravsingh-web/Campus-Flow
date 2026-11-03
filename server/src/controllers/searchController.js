const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const LostFoundItem = require('../models/LostFoundItem');
const Room = require('../models/Room');
const User = require('../models/User');

const globalSearch = async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    const user = req.user;

    if (!q.trim() || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        results: {
          announcements: [],
          events: [],
          lostFound: [],
          rooms: [],
          people: [],
        },
      });
    }

    const regex = new RegExp(q.trim(), 'i');

    // 1. Announcements
    const announcementQuery = {
      status: 'published',
      $or: [{ title: regex }, { description: regex }, { category: regex }],
    };
    if (user.role === 'student') {
      announcementQuery.targetAudience = { $in: ['All', 'Students'] };
    }

    // 2. Events
    const eventQuery = {
      $or: [{ title: regex }, { description: regex }, { venue: regex }, { category: regex }],
    };

    // 3. Lost & Found
    const lostFoundQuery = {
      $or: [{ title: regex }, { description: regex }, { location: regex }, { category: regex }],
    };

    // 4. Rooms
    const roomQuery = {
      $or: [{ roomId: regex }, { name: regex }, { building: regex }, { type: regex }],
    };

    // Run parallel searches
    const [announcements, events, lostFound, rooms] = await Promise.all([
      Announcement.find(announcementQuery).select('title category priority createdAt').limit(5),
      Event.find(eventQuery).select('title category date venue registeredCount capacity').limit(5),
      LostFoundItem.find(lostFoundQuery).select('title category reportType location status').limit(5),
      Room.find(roomQuery).select('roomId name type building capacity status').limit(5),
    ]);

    // 5. People (Only for Admin & Faculty)
    let people = [];
    if (['admin', 'faculty'].includes(user.role)) {
      people = await User.find({
        status: 'active',
        $or: [{ name: regex }, { email: regex }],
      })
        .select('name email role avatar department')
        .populate('department', 'name code')
        .limit(5);
    }

    return res.status(200).json({
      success: true,
      query: q.trim(),
      results: {
        announcements,
        events,
        lostFound,
        rooms,
        people,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  globalSearch,
};
