const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', semester = '' } = req.query;

    const query = { role: 'student' };

    if (department) {
      query.department = department;
    }

    if (search && search.trim()) {
      const term = search.trim();
      const matchingProfiles = await StudentProfile.find({
        $or: [
          { studentId: { $regex: term, $options: 'i' } },
          { enrolmentNumber: { $regex: term, $options: 'i' } },
        ],
      }).select('user');

      const userIdsFromProfile = matchingProfiles.map((p) => p.user);

      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { _id: { $in: userIdsFromProfile } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let users = await User.find(query)
      .populate('department', 'name code')
      .populate('studentProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    if (semester) {
      users = users.filter(
        (u) => u.studentProfile && u.studentProfile.semester === parseInt(semester, 10)
      );
    }

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      students: users,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .populate('department', 'name code')
      .populate('studentProfile');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (err) {
    next(err);
  }
};

const updateStudentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended.',
      });
    }

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { status },
      { new: true }
    )
      .populate('department', 'name code')
      .populate('studentProfile');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student status updated to ${status}.`,
      student,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudentStatus,
};
