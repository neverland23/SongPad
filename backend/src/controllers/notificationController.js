const Notification = require('../models/Notification');

const listNotifications = async (req, res) => {
  const { unread } = req.query;
  const filter = { user: req.user._id };
  if (unread === 'true') {
    filter.read = false;
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notifications);
};

const markAsRead = async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  notification.read = true;
  await notification.save();

  res.json(notification);
};

module.exports = {
  listNotifications,
  markAsRead,
};
