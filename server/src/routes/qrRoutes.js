const express = require('express');
const router = express.Router();
const {
  getMyIdentityQR,
  verifyIdentityToken,
  regenerateIdentityQR,
} = require('../controllers/qrController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/my-identity', getMyIdentityQR);
router.post('/regenerate', regenerateIdentityQR);
// Security guards, faculty and admin can verify student/faculty badges
router.post('/verify-identity', authorize('admin', 'faculty'), verifyIdentityToken);

module.exports = router;
