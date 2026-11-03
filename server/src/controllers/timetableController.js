const Timetable = require('../models/Timetable');
const StudentProfile = require('../models/StudentProfile');

// Get Timetable entries with filters
const getTimetable = async (req, res, next) => {
  try {
    const { department = 'CSE', year = '2nd Year', section = 'A', day } = req.query;
    const query = {};

    if (department && department !== 'All') {
      query.department = department.toUpperCase();
    }
    if (year && year !== 'All') {
      query.year = year;
    }
    if (section && section !== 'All') {
      query.section = section.toUpperCase();
    }
    if (day && day !== 'All') {
      query.day = day;
    }

    const slots = await Timetable.find(query).sort({
      day: 1,
      timeSlot: 1,
    });

    // Provide distinct available filter options
    const [departments, years, sections] = await Promise.all([
      Timetable.distinct('department'),
      Timetable.distinct('year'),
      Timetable.distinct('section'),
    ]);

    return res.status(200).json({
      success: true,
      filterOptions: {
        departments: departments.length > 0 ? departments : ['CSE', 'ECE', 'EE'],
        years: years.length > 0 ? years : ['2nd Year'],
        sections: sections.length > 0 ? sections : ['A', 'B'],
      },
      timetable: slots,
    });
  } catch (err) {
    next(err);
  }
};

// Get current logged-in student's personalised timetable
const getMyTimetable = async (req, res, next) => {
  try {
    let department = 'CSE';
    let year = '2nd Year';
    let section = 'A';

    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (profile) {
        section = profile.section || 'A';
      }
      if (req.user.department && req.user.department.code) {
        department = req.user.department.code;
      }
    }

    const slots = await Timetable.find({
      department,
      section,
    }).sort({
      day: 1,
      timeSlot: 1,
    });

    return res.status(200).json({
      success: true,
      studentConfig: { department, year, section },
      timetable: slots,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTimetable,
  getMyTimetable,
};
