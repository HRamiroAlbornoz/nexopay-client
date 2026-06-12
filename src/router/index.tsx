import { createBrowserRouter } from 'react-router-dom';
import Landing from '../pages/Landing/Landing';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import Wallet from '../pages/Wallet/Wallet';
import Transactions from '../pages/Transactions/Transactions';
import SharedExpenses from '../pages/SharedExpenses/SharedExpenses';
import SavingsGoals from '../pages/SavingsGoals/SavingsGoals';
import PrivateRoute from '../components/PrivateRoute/PrivateRoute';
import AppLayout from '../components/layout/AppLayout';

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
