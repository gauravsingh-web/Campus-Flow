const { generateQrDataUrl, verifyCampusIdentityToken } = require('../services/qrService');
const User = require('../models/User');

const getMyIdentityQR = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name code')
      .populate('studentProfile')
      .populate('facultyProfile');

    const qrDataUrl = await generateQrDataUrl(user.qrToken);

    return res.status(200).json({
      success: true,
      qrToken: user.qrToken,
      qrDataUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department?.name,
        studentId: user.studentProfile?.studentId,
        employeeId: user.facultyProfile?.employeeId,
        designation: user.facultyProfile?.designation,
        semester: user.studentProfile?.semester,
        section: user.studentProfile?.section,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

const verifyIdentityToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'QR Identity token is required for campus verification.',
      });
    }

    const result = await verifyCampusIdentityToken(token);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        user: result.user || null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Campus Identity Verified Successfully.',
      identity: result.user,
    });
  } catch (err) {
    next(err);
  }
};

const regenerateIdentityQR = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const newToken = user.regenerateQrToken();
    await user.save();

    const qrDataUrl = await generateQrDataUrl(newToken);

    return res.status(200).json({
      success: true,
      message: 'Campus Identity QR Token regenerated successfully.',
      qrToken: newToken,
      qrDataUrl,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyIdentityQR,
  verifyIdentityToken,
  regenerateIdentityQR,
};
