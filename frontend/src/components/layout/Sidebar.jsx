import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  const linkBase = 'nav-link sidebar-link d-block px-3 py-2 small text-start';

  return (
    <aside
      className="bg-slate-900 border-end border-slate-800"
      style={{ minWidth: '240px', maxWidth: '260px' }}
    >
      <div className="p-3 border-bottom border-slate-800">
        <h2 className="h5 mb-0 text-light">VOIP Admin</h2>
        <small className="text-slate-400">Telephony control panel</small>
      </div>
      <nav className="nav flex-column p-2" id="sidebarNav">
        <NavLink
          to="/dashboard/numbers"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'active bg-slate-800 rounded' : 'text-slate-200'}`
          }
        >
          Phone Number Order
        </NavLink>
        <NavLink
          to="/dashboard/voice"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'active bg-slate-800 rounded' : 'text-slate-200'}`
          }
        >
          Voice Call
        </NavLink>
        <NavLink
          to="/dashboard/sms"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'active bg-slate-800 rounded' : 'text-slate-200'}`
          }
        >
          SMS
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
