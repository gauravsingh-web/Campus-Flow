const express = require('express');
const router = express.Router();
const {
  getItems,
  getItemById,
  createItem,
  getMatchedItems,
  submitClaim,
  verifyClaim,
  updateItemStatus,
} = require('../controllers/lostFoundController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', upload.single('image'), createItem);
router.get('/:id/matches', getMatchedItems);
router.post('/:id/claim', submitClaim);
router.patch('/claims/:claimId/verify', authorize('admin'), verifyClaim);
router.patch('/:id/status', updateItemStatus);

module.exports = router;
