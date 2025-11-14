const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  sendSms,
  listContacts,
  getConversation,
} = require('../controllers/smsController');

router.post('/send', authMiddleware, sendSms);
router.get('/contacts', authMiddleware, listContacts);
router.get('/conversation', authMiddleware, getConversation);

module.exports = router;
