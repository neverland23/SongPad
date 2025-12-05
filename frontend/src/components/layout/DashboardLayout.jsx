import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './Header';
import TopNav from './TopNav';
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
    <div className="d-flex flex-column" style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      <AppHeader />
      <TopNav />
      <main className="flex-grow-1 bg-slate-900" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
