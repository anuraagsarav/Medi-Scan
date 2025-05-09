const express = require("express");
const { updateFullProfile } = require("../controllers/profileController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.put("/full-update", protect, updateFullProfile);

module.exports = router;