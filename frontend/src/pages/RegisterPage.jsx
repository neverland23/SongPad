import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { register, selectAuthError, selectAuthStatus } from '../features/auth/authSlice';
import ErrorMessage from '../components/ui/ErrorMessage';
import Loader from '../components/ui/Loader';

function RegisterPage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(register({ username, email, password }));
    if (register.fulfilled.match(resultAction)) {
      navigate('/dashboard', { replace: true });
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="bg-slate-900 text-slate-100 min-vh-100 d-flex align-items-center justify-content-center">
      <div className="bg-slate-800 rounded-3 shadow p-4 w-100" style={{ maxWidth: '480px' }}>
        <div className="d-flex align-items-center p-4 justify-content-center gap-2  cursor-pointer">
          <span className="h3 fw-bold">SongPad</span>
          <span className="badge bg-primary">Crypto Version</span>
        </div>
        <h1 className="h4 mb-3 text-center">Create an account</h1>
        <p className="text-slate-300 small text-center mb-4">
          Provision numbers, place calls, and send SMS from a single dashboard.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <ErrorMessage message={error} />
          <button
            type="submit"
            className="btn btn-primary w-100 mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        {isLoading && (
          <div className="mt-2">
            <Loader label="Registering..." />
          </div>
        )}
        <p className="text-center text-sm text-slate-300 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
