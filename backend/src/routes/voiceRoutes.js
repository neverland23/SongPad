const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { initiateCall, listCallLogs } = require('../controllers/voiceController');

router.post('/call', authMiddleware, initiateCall);
router.get('/logs', authMiddleware, listCallLogs);

module.exports = router;
