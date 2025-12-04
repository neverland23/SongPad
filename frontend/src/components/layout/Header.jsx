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
    <header className="d-flex justify-content-between align-items-center border-bottom border-slate-700 px-4 py-3">
      <div>
        <h1 className="h4 mb-0">Dashboard</h1>
        <small className="text-slate-400">
          {user ? `${user.username} (${user.email})` : 'Not signed in'}
        </small>
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
            <div id="notificationsDropdown" className="show">
              <div className="p-2 border-bottom border-slate-700">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-semibold">Recent</span>
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
                      n.read ? 'text-slate-400' : 'fw-semibold'
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
        <button type="button" className="btn btn-outline-light" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
