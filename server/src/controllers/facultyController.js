const User = require('../models/User');
const FacultyProfile = require('../models/FacultyProfile');
const Department = require('../models/Department');
const { createFacultySchema } = require('../validators/schemas');

const getFacultyList = async (req, res, next) => {
  try {
    const { department = '', search = '' } = req.query;

    const query = { role: 'faculty' };

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const faculty = await User.find(query)
      .populate('department', 'name code')
      .populate('facultyProfile')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      faculty,
    });
  } catch (err) {
    next(err);
  }
};

const getFacultyById = async (req, res, next) => {
  try {
    const faculty = await User.findOne({ _id: req.params.id, role: 'faculty' })
      .populate('department', 'name code')
      .populate('facultyProfile');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found.',
      });
    }

    return res.status(200).json({
      success: true,
      faculty,
    });
  } catch (err) {
    next(err);
  }
};

const createFaculty = async (req, res, next) => {
  try {
    const validatedData = createFacultySchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const existingEmpId = await FacultyProfile.findOne({
      employeeId: validatedData.employeeId.toUpperCase(),
    });
    if (existingEmpId) {
      return res.status(409).json({
        success: false,
        message: 'Employee ID is already registered.',
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
      role: 'faculty',
      department: department._id,
      phone: validatedData.phone || '',
      status: 'active',
    });

    await user.save();

    const specializationArray = Array.isArray(validatedData.specialization)
      ? validatedData.specialization
      : validatedData.specialization
      ? [validatedData.specialization]
      : [];

    const facultyProfile = new FacultyProfile({
      user: user._id,
      employeeId: validatedData.employeeId.toUpperCase(),
      designation: validatedData.designation,
      specialization: specializationArray,
      officeRoom: validatedData.officeRoom || '',
    });

    await facultyProfile.save();

    const populatedFaculty = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('facultyProfile');

    return res.status(201).json({
      success: true,
      message: 'Faculty account created successfully.',
      faculty: populatedFaculty,
    });
  } catch (err) {
    next(err);
  }
};

const updateFacultyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended.',
      });
    }

    const faculty = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'faculty' },
      { status },
      { new: true }
    )
      .populate('department', 'name code')
      .populate('facultyProfile');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Faculty account status updated to ${status}.`,
      faculty,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFacultyList,
  getFacultyById,
  createFaculty,
  updateFacultyStatus,
};
