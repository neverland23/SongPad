const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCountries,
  searchNumbers,
  orderNumber,
  listMyNumbers,
} = require('../controllers/numberController');

router.get('/countries', authMiddleware, getCountries);
router.get('/search', authMiddleware, searchNumbers);
router.post('/order', authMiddleware, orderNumber);
router.get('/mine', authMiddleware, listMyNumbers);

module.exports = router;
