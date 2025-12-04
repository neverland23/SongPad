import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchCallLogs,
  initiateCall,
  selectCallLogs,
  selectVoiceError,
} from '../../features/voice/voiceSlice';
import {
  fetchMyNumbers,
  selectMyNumbers,
} from '../../features/numbers/numbersSlice';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';

const dialDigits = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function VoicePage() {
  const dispatch = useAppDispatch();
  const logs = useAppSelector(selectCallLogs);
  const error = useAppSelector(selectVoiceError);
  const loadingLogs = useAppSelector((state) => state.voice.loadingLogs);
  const calling = useAppSelector((state) => state.voice.calling);
  const myNumbers = useAppSelector(selectMyNumbers);
  const loadingMyNumbers = useAppSelector((state) => state.numbers.loadingMyNumbers);

  const [dial, setDial] = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    dispatch(fetchCallLogs());
    dispatch(fetchMyNumbers());
  }, [dispatch]);

  const handleDigit = (d) => {
    setDial((prev) => prev + d);
  };

  const handleCall = async () => {
    if (!dial || !fromNumber) {
      setStatusMessage('Please enter the destination number and select your Telnyx number from the dropdown.');
      return;
    }
    setStatusMessage('');
    const resultAction = await dispatch(
      initiateCall({
        from: fromNumber,
        to: dial,
      }),
    );
    if (initiateCall.fulfilled.match(resultAction)) {
      setStatusMessage('Call initiated successfully.');
      setDial('');
    } else {
      setStatusMessage(resultAction.payload || 'Failed to initiate call.');
    }
  };

  return (
    <section id="voiceSection">
      <h2 className="h5 mb-3">Voice Call</h2>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card bg-slate-800">
            <div className="card-body">
              <h5 className="card-title text-white">Dialpad</h5>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter number"
                  value={dial}
                  onChange={(e) => setDial(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {dialDigits.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => handleDigit(d)}
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
                  disabled={loadingMyNumbers}
                >
                  <option value="">Select your Telnyx number</option>
                  {myNumbers.map((num) => {
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
                {!loadingMyNumbers && myNumbers.length === 0 && (
                  <small className="text-warning">
                    No purchased numbers available. Please purchase a number first.
                  </small>
                )}
              </div>
              <button
                type="button"
                className="btn btn-success w-100"
                onClick={handleCall}
                disabled={calling}
              >
                {calling ? 'Calling…' : 'Call'}
              </button>
              <p className="small mt-2 text-slate-300">{statusMessage}</p>
              <ErrorMessage message={error} />
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <h5>Call Logs</h5>
          {loadingLogs && <Loader label="Loading call logs..." />}
          <div className="table-responsive">
            <table className="table table-dark table-striped" id="callLogsTable">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Direction</th>
                  <th>Duration (s)</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 small">
                      No calls found yet.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</td>
                    <td>{log.from}</td>
                    <td>{log.to}</td>
                    <td>{log.status}</td>
                    <td>{log.direction}</td>
                    <td>{log.durationSeconds ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VoicePage;
