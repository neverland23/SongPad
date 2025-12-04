const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  listNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

router.get('/', authMiddleware, listNotifications);
router.patch('/:id/read', authMiddleware, markAsRead);
router.patch('/mark-all-read', authMiddleware, markAllAsRead);

module.exports = router;
