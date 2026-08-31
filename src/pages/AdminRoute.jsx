import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import { isFirebaseConfigured } from '../firebase/config';

// A single /admin route that shows the login form until an admin is
// authenticated, then swaps to the dashboard. Keeps the dashboard
// completely inaccessible to anyone who hasn't signed in.
export default function AdminRoute() {
  if (!isFirebaseConfigured) {
    return (
      <div className="page page--center">
        <div className="glass-card firebase-warning">
          <h2>FIREBASE NOT CONFIGURED</h2>
          <p>
            Add your Firebase credentials to <code>src/firebase/config.js</code> before using
            the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  const { adminUser, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking admin session..." />;
  }

  return adminUser ? <AdminDashboard /> : <AdminLogin />;
}
