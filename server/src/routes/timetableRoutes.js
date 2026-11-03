const express = require('express');
const router = express.Router();
const { getTimetable, getMyTimetable } = require('../controllers/timetableController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getTimetable);
router.get('/my', getMyTimetable);

module.exports = router;
