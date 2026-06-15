import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

export default function AppLayout() {
  return (
    <div className="app-root soft-finance-bg">
      <Navbar />
      <div className="layout">
        <LeftPanel />
        <main className="main-area dashboard-stack">
          <Outlet />
        </main>
        <RightPanel />
      </div>
    </div>
  );
}
