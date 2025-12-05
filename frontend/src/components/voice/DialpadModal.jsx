import React, { useState, useEffect } from 'react';
import {
  fetchMyNumbers,
  selectMyNumbers,
} from '../../features/numbers/numbersSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';

const dialDigits = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function DialpadModal({ isOpen, onClose, onCall, fromNumber, setFromNumber, callState, initialDial = '' }) {
  const dispatch = useAppDispatch();
  const myNumbers = useAppSelector(selectMyNumbers);
  const loadingMyNumbers = useAppSelector((state) => state.numbers.loadingMyNumbers);

  // Filter numbers to only show those with connection_id
  const numbersWithConnection = myNumbers.filter(
    (num) => num.phone_number_connection_id !== null && num.phone_number_connection_id !== undefined
  );

  const [dial, setDial] = useState(initialDial);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchMyNumbers());
      setDial(initialDial);
    }
  }, [isOpen, dispatch, initialDial]);

  const handleDigit = (d) => {
    if (callState !== 'idle') {
      return; // Don't allow dialing during active call
    }
    setDial((prev) => prev + d);
  };

  const handleCall = () => {
    if (!dial || !fromNumber) {
      return;
    }
    if (onCall) {
      onCall(dial, fromNumber);
    }
    setDial('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1050,
      }}
      onClick={onClose}
    >
      <div
        className="card bg-slate-800"
        style={{ minWidth: '400px', maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Dialpad</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <input
              type="text"
              className="form-control form-control-lg text-center"
              placeholder="Enter number"
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              disabled={callState !== 'idle'}
              style={{ fontSize: '1.5rem' }}
            />
          </div>

          <div className="d-grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {dialDigits.map((d) => (
              <button
                key={d}
                type="button"
                className="btn btn-outline-light btn-lg"
                onClick={() => handleDigit(d)}
                disabled={callState !== 'idle'}
                style={{ fontSize: '1.5rem', minHeight: '60px' }}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <label className="form-label text-white">From Number</label>
            <select
              className="form-select"
              value={fromNumber}
              onChange={(e) => setFromNumber(e.target.value)}
              disabled={loadingMyNumbers || callState !== 'idle'}
            >
              <option value="">Select your Telnyx number</option>
              {numbersWithConnection.map((num) => {
                const phoneNumber = num.phone_number || num.phoneNumber || '';
                return (
                  <option key={num._id || phoneNumber} value={phoneNumber}>
                    {phoneNumber}
                  </option>
                );
              })}
            </select>
            {loadingMyNumbers && (
              <small className="text-muted">Loading your numbers...</small>
            )}
            {!loadingMyNumbers && numbersWithConnection.length === 0 && (
              <small className="text-warning">
                No voice-enabled numbers available. Please enable voice call for a number first.
              </small>
            )}
          </div>

          <button
            type="button"
            className="btn btn-success w-100 btn-lg"
            onClick={handleCall}
            disabled={!dial || !fromNumber || callState !== 'idle'}
          >
            Call
          </button>
        </div>
      </div>
    </div>
  );
}

export default DialpadModal;

