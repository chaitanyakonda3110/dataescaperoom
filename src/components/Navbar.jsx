import { Link } from 'react-router-dom';

// ===== LOGO CONFIGURATION =====
// Logo files live at public/assets/ramaiah-logo.png and
// public/assets/analytics-club-logo.png. To swap them, just replace those
// files with the same names — no code change needed. Referenced through
// import.meta.env.BASE_URL (not a hardcoded leading "/") so the path still
// resolves correctly once the app is deployed under a GitHub Pages subpath.
export default function Navbar({ showAdminLink = true }) {
  return (
    <header className="navbar">
      <div className="navbar__logo navbar__logo--left">
        <img
          src={`${import.meta.env.BASE_URL}assets/ramaiah-logo.png`}
          alt="Ramaiah Institute of Management"
          className="navbar__logo-img"
        />
      </div>

      <div className="navbar__logo navbar__logo--right">
        <img
          src={`${import.meta.env.BASE_URL}assets/analytics-club-logo.png`}
          alt="AC Analytics Club"
          className="navbar__logo-img"
        />
        {showAdminLink && (
          <Link to="/admin" className="admin-login-link">
            ADMIN LOGIN
          </Link>
        )}
      </div>
    </header>
  );
}
