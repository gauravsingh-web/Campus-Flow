const Department = require('../models/Department');

const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('headOfDepartment', 'name email')
      .sort({ name: 1 });
    return res.status(200).json({
      success: true,
      departments,
    });
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, headOfDepartment } = req.body;
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Department name and unique code are required.',
      });
    }

    const existing = await Department.findOne({
      $or: [{ code: code.toUpperCase() }, { name }],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A department with this name or code already exists.',
      });
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
      description: description || '',
      headOfDepartment: headOfDepartment || null,
    });

    await department.save();

    return res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
};
