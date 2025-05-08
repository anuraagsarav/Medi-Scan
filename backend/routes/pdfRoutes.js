const express = require('express');
const router = express.Router();
const { summarizePDF } = require('../controllers/pdfSummaryController');
const Summary = require('../models/summaryModel');
const protect = require('../middlewares/authMiddleware');

router.post('/summarize', protect, summarizePDF);

// Get cached summary
router.get('/summary/:fileId', protect, async (req, res) => {
  try {
    const summary = await Summary.findOne({ fileId: req.params.fileId });
    if (summary) {
      res.json({ summary: summary.summary, fromCache: true });
    } else {
      res.status(404).json({ msg: 'No cached summary found' });
    }
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch cached summary' });
  }
});

module.exports = router;
