const express = require('express');
const router = express.Router();
const { getSubjects, getSubjectById } = require('../controllers/subjectController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getSubjects);
router.get('/:id', getSubjectById);

module.exports = router;
