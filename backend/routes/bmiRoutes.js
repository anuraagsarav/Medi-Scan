const express = require('express');
const router = express.Router();
const { generateDietPlan } = require('../controllers/bmiController');

router.post('/diet', generateDietPlan);

module.exports = router;
