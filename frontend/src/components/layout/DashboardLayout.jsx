import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './Header';
import Sidebar from './Sidebar';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchCurrentUser, selectCurrentUser } from '../../features/auth/authSlice';

function DashboardLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (!user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, user]);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-grow-1 bg-slate-900 d-flex flex-column">
        <AppHeader />
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
