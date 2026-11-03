const DateSheet = require('../models/DateSheet');

const getDateSheets = async (req, res, next) => {
  try {
    const isStaff = ['admin', 'faculty'].includes(req.user.role);
    const query = isStaff ? {} : { status: 'published' };

    const dateSheets = await DateSheet.find(query)
      .populate('publishedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      hasPublished: dateSheets.some((ds) => ds.status === 'published'),
      emptyStateMessage: 'Official end-term date sheet has not been published yet',
      dateSheets,
    });
  } catch (err) {
    next(err);
  }
};

const createOrPublishDateSheet = async (req, res, next) => {
  try {
    const {
      title = 'End-Term Theory Examination Date Sheet - December 2026',
      academicSession = '2026-27',
      semester = 'Odd Semester (Dec 2026)',
      department = 'All',
      notes = 'Official University of Delhi End-Term Theory Date Sheet',
      status = 'published',
    } = req.body;

    const fileUrl = req.file
      ? `/uploads/${req.file.filename}`
      : '/source-data/Exam theory datesheet-December,2026.pdf';
    const fileName = req.file
      ? req.file.originalname
      : 'Exam theory datesheet-December,2026.pdf';

    const dateSheet = new DateSheet({
      title,
      academicSession,
      semester,
      department,
      fileName,
      fileUrl,
      fileSize: req.file ? `${Math.round(req.file.size / 1024)} KB` : '307 KB',
      status,
      publishedBy: req.user._id,
      publishedAt: status === 'published' ? new Date() : null,
      notes,
    });

    await dateSheet.save();

    return res.status(201).json({
      success: true,
      message: 'Examination date sheet recorded successfully.',
      dateSheet,
    });
  } catch (err) {
    next(err);
  }
};

const toggleDateSheetStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const dateSheet = await DateSheet.findById(req.params.id);

    if (!dateSheet) {
      return res.status(404).json({ success: false, message: 'Date sheet not found.' });
    }

    dateSheet.status = status;
    if (status === 'published' && !dateSheet.publishedAt) {
      dateSheet.publishedAt = new Date();
      dateSheet.publishedBy = req.user._id;
    }

    await dateSheet.save();

    return res.status(200).json({
      success: true,
      message: `Date sheet status updated to ${status}.`,
      dateSheet,
    });
  } catch (err) {
    next(err);
  }
};

const deleteDateSheet = async (req, res, next) => {
  try {
    const dateSheet = await DateSheet.findByIdAndDelete(req.params.id);
    if (!dateSheet) {
      return res.status(404).json({ success: false, message: 'Date sheet not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Date sheet removed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDateSheets,
  createOrPublishDateSheet,
  toggleDateSheetStatus,
  deleteDateSheet,
};
