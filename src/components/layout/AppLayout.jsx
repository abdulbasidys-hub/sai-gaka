// src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{
        flex: 1,
        paddingTop: 'var(--nav-height)',
        paddingBottom: 'calc(var(--bottom-nav-height) + 16px)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
