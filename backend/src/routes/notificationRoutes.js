const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  listNotifications,
  markAsRead,
} = require('../controllers/notificationController');

router.get('/', authMiddleware, listNotifications);
router.patch('/:id/read', authMiddleware, markAsRead);

module.exports = router;
