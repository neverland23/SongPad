import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout, selectCurrentUser } from '../../features/auth/authSlice';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
} from '../../features/notifications/notificationsSlice';

function AppHeader() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => {
      dispatch(fetchNotifications({ unread: 'true' }));
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleNotifications = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      dispatch(fetchNotifications());
    }
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllNotificationsRead());
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await dispatch(markNotificationRead(notification._id));
    }
  };

  return (
    <header className="bg-slate-900 border-bottom border-slate-700 px-4 py-3">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold">SongPad</span>
          <span className="badge bg-primary">Crypto Version</span>
        </div>
        <div className="d-flex align-items-center gap-3 position-relative">
          <div className="position-relative">
            <button
              type="button"
              className="btn btn-outline-light position-relative"
              onClick={toggleNotifications}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
                  {unreadCount}
                </span>
              )}
            </button>
            {open && (
              <div
                className="position-absolute end-0 mt-2 bg-slate-800 border border-slate-700 rounded shadow-lg"
                style={{ minWidth: '350px', maxWidth: '400px', zIndex: 1050 }}
              >
                <div className="p-2 border-bottom border-slate-700">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold text-white">Recent</span>
                    <span className="text-slate-400 small">
                      {notifications.length ? `${notifications.length} items` : 'No notifications'}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <div className="mt-1 text-right">
                      <a
                        href="#"
                        className="text-decoration-none text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMarkAllAsRead();
                        }}
                        style={{ fontSize: '0.7rem' }}
                      >
                        Mark all as read
                      </a>
                    </div>
                  )}
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 && (
                    <div className="p-3 text-slate-400 small">No notifications yet.</div>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2 border-bottom border-slate-800 small ${
                        n.read ? 'text-slate-400' : 'fw-semibold text-white'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div>{n.title}</div>
                      <div className="text-slate-400">{n.message}</div>
                      <div className="text-slate-500">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="text-end">
            <div className="text-white small">{user?.username || 'User'}</div>
            <div className="text-slate-400" style={{ fontSize: '0.75rem' }}>
              {user?.email || ''}
            </div>
          </div>
          <button type="button" className="btn btn-outline-light" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
