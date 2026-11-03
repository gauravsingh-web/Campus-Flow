const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
} = require('../controllers/roomController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', authorize('admin'), createRoom);
router.put('/:id', authorize('admin'), updateRoom);

module.exports = router;
