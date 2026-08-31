import { useEffect, useState } from 'react';

// A manual, always-available fullscreen toggle for the whole app — separate
// from (and independent of) the anti-cheat lockdown logic on the team
// dashboard. Rendered once at the App level so it shows up on every page,
// including the admin screens that don't share the participant Navbar.
export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && !!document.fullscreenElement
  );

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <button
      type="button"
      className="fullscreen-toggle"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      ⛶
    </button>
  );
}
