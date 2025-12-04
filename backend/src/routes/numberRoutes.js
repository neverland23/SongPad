const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCountries,
  searchNumbers,
  orderNumber,
  listMyNumbers,
  enableVoiceCall,
  deleteNumber,
} = require('../controllers/numberController');

router.get('/countries', authMiddleware, getCountries);
router.get('/search', authMiddleware, searchNumbers);
router.post('/order', authMiddleware, orderNumber);
router.get('/mine', authMiddleware, listMyNumbers);
router.patch('/enable-voice', authMiddleware, enableVoiceCall);
router.delete('/:phoneNumber', authMiddleware, deleteNumber);

module.exports = router;
