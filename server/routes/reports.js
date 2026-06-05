const express = require('express');
const { getReports } = require('../controllers/reportsController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getReports);

module.exports = router;
