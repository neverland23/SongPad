import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { login, selectAuthError, selectAuthStatus } from '../features/auth/authSlice';
import ErrorMessage from '../components/ui/ErrorMessage';
import Loader from '../components/ui/Loader';

function LoginPage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(login({ emailOrUsername, password }));
    if (login.fulfilled.match(resultAction)) {
      navigate(from, { replace: true });
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="bg-slate-900 text-slate-100 min-vh-100 d-flex align-items-center justify-content-center">
      <div className="bg-slate-800 rounded-3 shadow p-4 w-100" style={{ maxWidth: '420px' }}>
        <div className="d-flex align-items-center p-4 justify-content-center gap-2 cursor-pointer">
          <span className="h3 fw-bold">SongPad</span>
          <span className="badge bg-primary">Crypto Version</span>
        </div>
        <h1 className="h4 mb-3 text-center">Login</h1>
        <p className="text-slate-300 small text-center mb-4">
          Sign in to manage phone numbers, calls and messaging.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="mb-3">
            <label className="form-label">Email or Username</label>
            <input
              type="text"
              className="form-control"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
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
            {isLoading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        {isLoading && (
          <div className="mt-2">
            <Loader label="Authenticating..." />
          </div>
        )}
        <p className="text-center text-sm text-slate-300 mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-400">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
