const Subject = require('../models/Subject');

// Get all subjects with filtering by department, semester, paperType, search
const getSubjects = async (req, res, next) => {
  try {
    const { department, semester, paperType, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (department && department !== 'All') {
      query.department = new RegExp(department, 'i');
    }

    if (semester && semester !== 'All') {
      query.semester = semester;
    }

    if (paperType && paperType !== 'All') {
      query.paperType = new RegExp(paperType, 'i');
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { upcCode: { $regex: term, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Subject.countDocuments(query);
    const subjects = await Subject.find(query)
      .sort({ sNo: 1, upcCode: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      subjects,
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

const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
    return res.status(200).json({ success: true, subject });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
};
