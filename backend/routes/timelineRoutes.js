const express = require('express');
const router = express.Router();
const { extractTimelineEvents, getTimeline, getTimelineStats } = require('../controllers/timelineController');
const protect = require('../middlewares/authMiddleware');

router.post('/extract', protect, extractTimelineEvents);
router.get('/events', protect, getTimeline);
router.get('/stats', protect, getTimelineStats);

module.exports = router; 