const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Department = require('../models/Department');
const { registerStudentSchema, loginSchema } = require('../validators/schemas');
const { generateQrDataUrl } = require('../services/qrService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'super_secret_campusflow_jwt_key_2026_dev_only',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Student Self-Registration (Strictly students only)
const registerStudent = async (req, res, next) => {
  try {
    const validatedData = registerStudentSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const existingStudentId = await StudentProfile.findOne({
      studentId: validatedData.studentId.toUpperCase(),
    });
    if (existingStudentId) {
      return res.status(409).json({
        success: false,
        message: 'This Student ID / Roll number is already registered.',
      });
    }

    const department = await Department.findById(validatedData.department);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Selected department does not exist.',
      });
    }

    const user = new User({
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      password: validatedData.password,
      role: 'student',
      department: department._id,
      phone: validatedData.phone || '',
      status: 'active',
    });

    await user.save();

    const studentProfile = new StudentProfile({
      user: user._id,
      studentId: validatedData.studentId.toUpperCase(),
      semester: validatedData.semester,
      section: validatedData.section || 'A',
      batch: validatedData.batch || '2022-2026',
    });

    await studentProfile.save();

    const token = generateToken(user);

    const populatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('studentProfile');

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      token,
      user: populatedUser,
    });
  } catch (err) {
    next(err);
  }
};

// User Login (Student, Faculty, Admin)
const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('department', 'name code')
      .populate('studentProfile')
      .populate('facultyProfile');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact the university administrator.`,
      });
    }

    const token = generateToken(user);

    // Remove password before responding
    const userJson = user.toJSON();
    delete userJson.password;

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: userJson,
    });
  } catch (err) {
    next(err);
  }
};

// Get Current User Profile Session
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name code')
      .populate('studentProfile')
      .populate('facultyProfile');

    const qrDataUrl = await generateQrDataUrl(user.qrToken);

    return res.status(200).json({
      success: true,
      user,
      qrDataUrl,
    });
  } catch (err) {
    next(err);
  }
};

// Update Profile Information
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, section, semester, officeRoom, designation } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // If Student
    if (user.role === 'student' && user.studentProfile) {
      const profile = await StudentProfile.findOne({ user: user._id });
      if (profile) {
        if (section) profile.section = section;
        if (semester) profile.semester = semester;
        await profile.save();
      }
    }

    // If Faculty
    if (user.role === 'faculty' && user.facultyProfile) {
      const profile = await FacultyProfile.findOne({ user: user._id });
      if (profile) {
        if (officeRoom !== undefined) profile.officeRoom = officeRoom;
        if (designation && user.role === 'admin') profile.designation = designation;
        await profile.save();
      }
    }

    const updatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('studentProfile')
      .populate('facultyProfile');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

// Change Password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password (min 6 chars) are required.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match our records.',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please keep your credentials secure.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerStudent,
  login,
  getMe,
  updateProfile,
  changePassword,
};
