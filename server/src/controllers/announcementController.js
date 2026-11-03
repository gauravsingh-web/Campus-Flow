const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { announcementSchema } = require('../validators/schemas');
const { broadcastGlobal, notifyRole, notifyDepartment } = require('../sockets/socketHandler');

const getAnnouncements = async (req, res, next) => {
  try {
    const { category, priority, search, department } = req.query;
    const user = req.user;

    const query = { status: 'published' };

    // Role-based visibility
    if (user.role === 'student') {
      query.$or = [
        { targetAudience: 'All' },
        { targetAudience: 'Students' },
        { targetAudience: 'Department', department: user.department },
      ];
    } else if (user.role === 'faculty') {
      query.$or = [
        { targetAudience: 'All' },
        { targetAudience: 'Faculty' },
        { targetAudience: 'Department', department: user.department },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (priority) {
      query.priority = priority;
    }

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'name email role avatar')
      .populate('department', 'name code')
      .sort({ priority: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      announcements,
    });
  } catch (err) {
    next(err);
  }
};

const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'name email role avatar')
      .populate('department', 'name code');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    return res.status(200).json({
      success: true,
      announcement,
    });
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const validatedData = announcementSchema.parse(req.body);

    const announcement = new Announcement({
      ...validatedData,
      author: req.user._id,
      attachmentUrl: req.file ? `/uploads/${req.file.filename}` : req.body.attachmentUrl || '',
    });

    await announcement.save();

    const populated = await Announcement.findById(announcement._id)
      .populate('author', 'name email role avatar')
      .populate('department', 'name code');

    // Create notifications for audience and emit real-time event
    if (announcement.priority === 'Urgent') {
      broadcastGlobal('notification:urgent', {
        title: `🚨 Urgent: ${announcement.title}`,
        announcement: populated,
      });
    }

    broadcastGlobal('announcement:new', populated);

    // Save notifications to DB for target users asynchronously
    const targetQuery = { status: 'active' };
    if (announcement.targetAudience === 'Students') {
      targetQuery.role = 'student';
    } else if (announcement.targetAudience === 'Faculty') {
      targetQuery.role = 'faculty';
    }
    if (announcement.department) {
      targetQuery.department = announcement.department;
    }

    // Persist notification for up to 50 active users to avoid unbounded memory
    const targetUsers = await User.find(targetQuery).select('_id').limit(100);
    const notificationsToInsert = targetUsers.map((u) => ({
      recipient: u._id,
      sender: req.user._id,
      type: 'Announcement',
      title: announcement.priority === 'Urgent' ? `🚨 Urgent Notice: ${announcement.title}` : `New Notice: ${announcement.title}`,
      message: announcement.description.substring(0, 120) + '...',
      link: `/announcements`,
    }));

    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
    }

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      announcement: populated,
    });
  } catch (err) {
    next(err);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this announcement.',
      });
    }

    const validatedData = announcementSchema.partial().parse(req.body);
    Object.assign(announcement, validatedData);

    if (req.file) {
      announcement.attachmentUrl = `/uploads/${req.file.filename}`;
    }

    await announcement.save();

    const populated = await Announcement.findById(announcement._id)
      .populate('author', 'name email role avatar')
      .populate('department', 'name code');

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement: populated,
    });
  } catch (err) {
    next(err);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    if (req.user.role !== 'admin' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this announcement.',
      });
    }

    await announcement.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Announcement removed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });

    return res.status(200).json({
      success: true,
      message: 'Marked as read.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
};
