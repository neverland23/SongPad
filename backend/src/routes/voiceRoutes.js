const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  initiateCall,
  initiateOutboundCall,
  listCallLogs,
  answerCall,
  connectWebRTC,
  hangupCall,
  sendDTMF,
} = require('../controllers/voiceController');

// Legacy endpoint (backward compatibility)
router.post('/call', authMiddleware, initiateCall);
// Call Control v2 endpoint
router.post('/calls/outbound', authMiddleware, initiateOutboundCall);
router.get('/logs', authMiddleware, listCallLogs);

// Call Control v2 actions
router.post('/calls/:callControlId/answer', authMiddleware, answerCall);
router.post('/calls/:callControlId/connect-webrtc', authMiddleware, connectWebRTC);
router.post('/calls/:callControlId/hangup', authMiddleware, hangupCall);
router.post('/calls/:callControlId/dtmf', authMiddleware, sendDTMF);

module.exports = router;
