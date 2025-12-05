import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import DialpadModal from '../voice/DialpadModal';
import { useWebRTC } from '../../hooks/useWebRTC';
import {
  fetchMyNumbers,
} from '../../features/numbers/numbersSlice';

function TopNav() {
  const dispatch = useAppDispatch();
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const [fromNumber, setFromNumber] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { callState, makeCall } = useWebRTC();

  useEffect(() => {
    dispatch(fetchMyNumbers());
  }, [dispatch]);

  const handleDialpadCall = async (dial, from) => {
    try {
      await makeCall(from, dial);
      setDialpadOpen(false);
    } catch (err) {
      console.error('Failed to make call:', err);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `nav-link px-3 py-2 ${
      isActive
        ? 'active bg-slate-700 rounded text-white fw-semibold'
        : 'text-slate-200'
    }`;

  return (
    <>
      <nav className="bg-slate-800 border-bottom border-slate-700 px-4">
        <div className="d-flex justify-content-between align-items-center py-2">
          {/* Mobile menu toggle */}
          <button
            className="navbar-toggler d-lg-none border-0 me-3"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            style={{ 
              backgroundColor: 'transparent', 
              padding: '0.25rem 0.5rem',
              color: 'white'
            }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navigation links - visible on desktop, hidden on mobile until toggled */}
          <div className={`d-none d-lg-flex align-items-center gap-3`}>
            <NavLink
              to="/dashboard/numbers"
              end
              className={navLinkClass}
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Phone Number Order
            </NavLink>
            <NavLink
              to="/dashboard/voice"
              className={navLinkClass}
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Voice Call
            </NavLink>
            <NavLink
              to="/dashboard/sms"
              className={navLinkClass}
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              SMS
            </NavLink>
          </div>

          {/* Dial button */}
          <div className="d-flex align-items-center ms-auto">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setDialpadOpen(true)}
              title="Open Dialpad"
            >
              <span className="d-none d-md-inline">Dial</span>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="d-lg-none pb-2">
            <div className="d-flex flex-column gap-2">
              <NavLink
                to="/dashboard/numbers"
                end
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                Phone Number Order
              </NavLink>
              <NavLink
                to="/dashboard/voice"
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                Voice Call
              </NavLink>
              <NavLink
                to="/dashboard/sms"
                className={navLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                SMS
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      <DialpadModal
        isOpen={dialpadOpen}
        onClose={() => setDialpadOpen(false)}
        onCall={handleDialpadCall}
        fromNumber={fromNumber}
        setFromNumber={setFromNumber}
        callState={callState}
      />
    </>
  );
}

export default TopNav;
