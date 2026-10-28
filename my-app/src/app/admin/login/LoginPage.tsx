'use client';

import { useState } from 'react';
import { api, setToken, getToken } from '@/lib/api';
import styles from '../login.module.css';

type Props = {
  onAuthorized: () => void;
};

export default function LoginPage({ onAuthorized }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await api.login(login.trim(), password);
      if (result.data?.token) {
        setToken(result.data.token);
        onAuthorized();
      } else {
        setError('Сервер не вернул токен авторизации');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreSession = async () => {
    if (!getToken()) return;
    try {
      await api.me();
      onAuthorized();
    } catch {
      setError('Сессия истекла, войдите заново');
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Вход в админ-панель</h1>
        <p className={styles.subtitle}>Управление услугами клиники</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            name="login"
            placeholder="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
          <button type="button" className={styles.btnGhost} onClick={restoreSession}>
            Восстановить сессию
          </button>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </main>
  );
}
