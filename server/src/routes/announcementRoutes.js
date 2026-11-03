const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
} = require('../controllers/announcementController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);
router.post('/', authorize('admin', 'faculty'), upload.single('attachment'), createAnnouncement);
router.put('/:id', authorize('admin', 'faculty'), upload.single('attachment'), updateAnnouncement);
router.delete('/:id', authorize('admin', 'faculty'), deleteAnnouncement);
router.post('/:id/read', markAsRead);

module.exports = router;
