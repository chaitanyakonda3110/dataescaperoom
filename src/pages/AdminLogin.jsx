import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminSignIn } from '../firebase/auth';
import { useToast } from '../context/ToastContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Enter both email and password.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await adminSignIn(email.trim(), password);
      navigate('/admin');
    } catch (err) {
      showToast('Invalid admin credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--center">
      <main className="hero">
        <Link to="/" className="back-link">
          ← BACK TO REGISTRATION
        </Link>
        <form className="glass-card admin-login-card" onSubmit={handleSubmit}>
          <h2 className="registration-card__title">ADMIN LOGIN</h2>

          <label className="field-label" htmlFor="email">
            USERNAME / EMAIL
          </label>
          <input
            id="email"
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />

          <label className="field-label" htmlFor="password">
            PASSWORD
          </label>
          <input
            id="password"
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
            {submitting ? 'SIGNING IN...' : 'LOGIN'}
          </button>
        </form>
      </main>
    </div>
  );
}
