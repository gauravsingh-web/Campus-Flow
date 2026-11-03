const express = require('express');
const router = express.Router();
const {
  getDateSheets,
  createOrPublishDateSheet,
  toggleDateSheetStatus,
  deleteDateSheet,
} = require('../controllers/datesheetController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getDateSheets);
router.post(
  '/',
  authorize('admin', 'faculty'),
  upload.single('file'),
  createOrPublishDateSheet
);
router.patch(
  '/:id/status',
  authorize('admin', 'faculty'),
  toggleDateSheetStatus
);
router.delete('/:id', authorize('admin'), deleteDateSheet);

module.exports = router;
