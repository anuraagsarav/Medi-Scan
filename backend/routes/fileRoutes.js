const express = require("express");
const {
  uploadToS3,
  getUserFiles,
  deleteFile,
  getSignedUrlForFile
} = require("../controllers/fileController");
const protect = require("../middlewares/authMiddleware");
const File = require('../models/fileModel');

const router = express.Router();

router.post("/upload", protect, uploadToS3);
router.get("/folders", protect, getUserFiles);

// Filter files by hospital
router.get("/", protect, async (req, res) => {
  const hospital = req.query.hospital?.trim();
  if (!hospital) return res.status(400).json({ msg: "Hospital is required" });

  try {
    const files = await File.find({ user: req.user.id, hospital });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching files" });
  }
});

router.get("/signed-url", protect, getSignedUrlForFile);
router.delete("/:id", protect, deleteFile);

// Get upload statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month

    // Get all uploads for the month
    const uploads = await File.find({
      user: req.user.id,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: 1 });

    // Create daily statistics
    const stats = [];
    const daysInMonth = endDate.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
      const nextDate = new Date(parseInt(year), parseInt(month) - 1, day + 1);
      
      const dayUploads = uploads.filter(upload => {
        const uploadDate = new Date(upload.createdAt);
        return uploadDate >= currentDate && uploadDate < nextDate;
      });

      stats.push({
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uploads: dayUploads.length
      });
    }

    // Format logs with more details
    const logs = uploads.map(upload => ({
      fileName: upload.originalName || 'Unnamed File',
      hospital: upload.hospital,
      date: new Date(upload.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    res.json({
      stats,
      logs
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ msg: 'Failed to fetch statistics' });
  }
});

module.exports = router;
