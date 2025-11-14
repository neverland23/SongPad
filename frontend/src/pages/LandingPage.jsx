import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="bg-slate-900 text-slate-100 min-vh-100 d-flex flex-column">
      <header className="border-bottom border-slate-800 py-3 px-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold">SongPad</span>
          <span className="badge bg-primary">Crypto Version</span>
        </div>
        <nav className="d-flex gap-2">
          <Link to="/login" className="btn btn-outline-light btn-sm">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Register
          </Link>
        </nav>
      </header>

      <main className="flex-grow-1 container py-5 d-flex align-items-center">
        <div className="row g-4 align-items-center w-100">
          <div className="col-md-6">
            <h1 className="display-5 fw-bold mb-3">A Smarter Way to Connect Your Business</h1>
            <p className="lead text-slate-300 mb-4">
              AI-powered voice, video, and messaging — all in one place.
            </p>
            <p className="lead text-slate-300 mb-4">
              Fast. Reliable. Secure. Built for teams that move fast.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get started
              </Link>
              <Link to="/login" className="btn btn-outline-light btn-lg">
                I already have an account
              </Link>
            </div>
            <p className="mt-4 text-slate-400 small">
              Trusted by teams across Healthcare, Finance, IT, Sales, and Customer Support.
            </p>
          </div>
          <div className="col-md-6">
            <div className="bg-slate-800 rounded-3 p-4 shadow">
              <h2 className="h5 mb-3">What you can do</h2>
              <ul className="list-unstyled text-slate-300 small mb-0">
                <li className="mb-2">• Global Phone Numbers</li>
                <li className="mb-2">• Voice Phone Calls</li>
                <li className="mb-2">• Send and receive SMS with threaded conversations</li>
                <li className="mb-2">• Track activity with a simple notification feed</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-3 text-center text-slate-500 small border-top border-slate-800">
        SongPad Dashboard &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default LandingPage;
