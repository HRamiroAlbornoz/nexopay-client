import { createBrowserRouter } from 'react-router-dom';
import { Landing, Login, Register, Dashboard, Wallet, Transactions, SharedExpenses, SavingsGoals } from '../pages';
import { PrivateRoute, AppLayout } from '../components';

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/wallet', element: <Wallet /> },
          { path: '/transactions', element: <Transactions /> },
          { path: '/shared-expenses', element: <SharedExpenses /> },
          { path: '/savings-goals', element: <SavingsGoals /> },
        ],
      },
    ],
  },
]);

export default router;
