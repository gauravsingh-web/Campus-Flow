const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const LostFoundItem = require('../models/LostFoundItem');
const Subject = require('../models/Subject');

const getAdminAnalytics = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalAnnouncements,
      totalComplaints,
      resolvedComplaints,
      totalSubjects,
      upcomingEvents,
      totalRooms,
      totalBookings,
      pendingBookings,
      lostFoundOpen,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      Announcement.countDocuments({ status: 'published' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Resolved' }),
      Subject.countDocuments(),
      Event.countDocuments({ status: 'Upcoming' }),
      Room.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      LostFoundItem.countDocuments({ status: 'Open' }),
    ]);

    // Complaints by Category Aggregation
    const complaintsByCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // Complaints by Status Aggregation
    const complaintsByStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    // Events Participation Statistics
    const eventStats = await Event.find()
      .select('title capacity registeredCount category date')
      .sort({ date: -1 })
      .limit(6);

    // Recent 5 complaints for immediate admin overview
    const recentComplaints = await Complaint.find()
      .populate('student', 'name email')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalFaculty,
        totalAnnouncements,
        totalComplaints,
        resolvedComplaints,
        totalSubjects,
        upcomingEvents,
        totalRooms,
        totalBookings,
        pendingBookings,
        lostFoundOpen,
      },
      complaintsByCategory,
      complaintsByStatus,
      eventStats,
      recentComplaints,
    });
  } catch (err) {
    next(err);
  }
};

const getFacultyAnalytics = async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    const [assignedTotal, assignedPending, assignedResolved, departmentNotices] =
      await Promise.all([
        Complaint.countDocuments({ assignedTo: facultyId }),
        Complaint.countDocuments({
          assignedTo: facultyId,
          status: { $in: ['Assigned', 'In Progress', 'Under Review'] },
        }),
        Complaint.countDocuments({ assignedTo: facultyId, status: 'Resolved' }),
        Announcement.countDocuments({ department: req.user.department }),
      ]);

    const myAssignedComplaints = await Complaint.find({ assignedTo: facultyId })
      .populate('student', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      stats: {
        assignedTotal,
        assignedPending,
        assignedResolved,
        departmentNotices,
      },
      myAssignedComplaints,
    });
  } catch (err) {
    next(err);
  }
};

const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const [
      myComplaintsCount,
      myResolvedComplaints,
      myEventRegistrationsCount,
      myBookingsCount,
    ] = await Promise.all([
      Complaint.countDocuments({ student: studentId }),
      Complaint.countDocuments({ student: studentId, status: 'Resolved' }),
      EventRegistration.countDocuments({ user: studentId }),
      Booking.countDocuments({ requester: studentId }),
    ]);

    const recentComplaints = await Complaint.find({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(4);

    const upcomingEvents = await Event.find({ status: 'Upcoming' })
      .sort({ date: 1 })
      .limit(3);

    return res.status(200).json({
      success: true,
      stats: {
        myComplaintsCount,
        myResolvedComplaints,
        myEventRegistrationsCount,
        myBookingsCount,
      },
      recentComplaints,
      upcomingEvents,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminAnalytics,
  getFacultyAnalytics,
  getStudentAnalytics,
};
