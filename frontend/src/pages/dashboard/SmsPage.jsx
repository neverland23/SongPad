import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchContacts,
  fetchConversation,
  sendSms,
  setCurrentContact,
  selectContacts,
  selectConversation,
  selectCurrentContact,
  selectSmsError,
} from '../../features/sms/smsSlice';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';

function SmsPage() {
  const dispatch = useAppDispatch();
  const contacts = useAppSelector(selectContacts);
  const conversation = useAppSelector(selectConversation);
  const currentContact = useAppSelector(selectCurrentContact);
  const error = useAppSelector(selectSmsError);

  const loadingContacts = useAppSelector((state) => state.sms.loadingContacts);
  const loadingConversation = useAppSelector((state) => state.sms.loadingConversation);
  const sending = useAppSelector((state) => state.sms.sending);

  const [fromNumber, setFromNumber] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  useEffect(() => {
    if (currentContact) {
      dispatch(fetchConversation(currentContact));
      setToNumber(currentContact);
    }
  }, [dispatch, currentContact]);

  const handleSelectContact = (contact) => {
    dispatch(setCurrentContact(contact));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!fromNumber || !toNumber || !text) return;

    const resultAction = await dispatch(
      sendSms({ from: fromNumber, to: toNumber, text }),
    );
    if (sendSms.fulfilled.match(resultAction)) {
      setText('');
    }
  };

  return (
    <section id="smsSection">
      <h2 className="h5 mb-3">SMS</h2>
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card bg-slate-800 h-100">
            <div className="card-body">
              <h5 className="card-title">Contacts</h5>
              {loadingContacts && <Loader label="Loading contacts..." />}
              <ul className="list-group list-group-flush" id="contactsList">
                {contacts.length === 0 && !loadingContacts && (
                  <li className="list-group-item bg-slate-900 text-slate-300 small">
                    No contacts yet.
                  </li>
                )}
                {contacts.map((c) => (
                  <li
                    key={c}
                    className={`list-group-item bg-slate-900 text-slate-300 small ${
                      currentContact === c ? 'fw-semibold' : ''
                    }`}
                    role="button"
                    onClick={() => handleSelectContact(c)}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-9">
          <div className="card bg-slate-800 h-100">
            <div className="card-body d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">
                  Conversation {currentContact ? `with ${currentContact}` : ''}
                </h5>
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm"
                  onClick={() => currentContact && dispatch(fetchConversation(currentContact))}
                  disabled={!currentContact}
                >
                  Refresh
                </button>
              </div>
              <div
                className="flex-grow-1 mb-3 p-3 rounded bg-slate-900"
                style={{ maxHeight: '320px', overflowY: 'auto' }}
              >
                {loadingConversation && <Loader label="Loading conversation..." />}
                {conversation.length === 0 && !loadingConversation && (
                  <div className="text-slate-400 small">No messages yet.</div>
                )}
                {conversation.map((msg) => (
                  <div
                    key={msg._id}
                    className={`d-flex mb-2 ${
                      msg.direction === 'outbound' ? 'justify-content-end' : 'justify-content-start'
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded-3 small ${
                        msg.direction === 'outbound'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      <div>{msg.body}</div>
                      <div className="text-slate-300 mt-1">
                        <span className="me-2">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                        </span>
                        <span className="text-slate-400">{msg.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend}>
                <div className="row g-2 mb-2">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="From number"
                      value={fromNumber}
                      onChange={(e) => setFromNumber(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="To number"
                      value={toNumber}
                      onChange={(e) => setToNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Type your message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                <ErrorMessage message={error} />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sending || !fromNumber || !toNumber || !text}
                >
                  {sending ? 'Sending…' : 'Send SMS'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SmsPage;
