import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
            <circle cx="20" cy="8" r="5" fill="#52B788"/>
            <rect x="15" y="14" width="10" height="10" rx="2" transform="rotate(45 20 19)" fill="#2D6A4F"/>
            <path d="M10 30 Q20 22 30 30" stroke="#52B788" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>
          CESIZen
        </Link>

        <div className={styles.links}>
          <Link to="/" className={pathname === '/' ? styles.active : ''}>Accueil</Link>
          <Link to="/informations" className={pathname === '/informations' ? styles.active : ''}>Informations</Link>
          {user && <Link to="/tracker" className={pathname === '/tracker' ? styles.active : ''}>Mon Tracker</Link>}
          {isAdmin && <Link to="/admin" className={pathname === '/admin' ? styles.active : ''}>Administration</Link>}
        </div>

        <div className={styles.navRight}>
          {user ? (
            <>
              <Link to="/profile" className={styles.avatar} title="Mon profil">
                {user.userInfo?.firstName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>Déconnexion</button>
            </>
          ) : (
            <Link to="/login" className={styles.loginBtn}>Connexion</Link>
          )}
        </div>
      </nav>

      <main style={{ paddingTop: '64px', minHeight: '100vh' }}>
        {children}
      </main>
    </>
  );
}
