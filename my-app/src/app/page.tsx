'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, clearToken, getToken } from '@/lib/api';
import DashboardPage from './dashboard/DashboardPage';
import LoginPage from './login/LoginPage';

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      const timer = setTimeout(() => setChecking(false), 0);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    api
      .me()
      .then(() => {
        if (!cancelled) setIsAuth(true);
      })
      .catch(() => {
        if (!cancelled) clearToken();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(() => setIsAuth(false), []);

  if (checking) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Проверка сессии...
      </main>
    );
  }

  return isAuth ? (
    <DashboardPage onLogout={handleLogout} />
  ) : (
    <LoginPage onAuthorized={() => setIsAuth(true)} />
  );
}
