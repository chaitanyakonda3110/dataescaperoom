import { useCallback, useEffect, useRef } from 'react';

// How long a team has to come back before a tab/window switch counts as a
// violation. A short grace period avoids disqualifying someone over a
// stray OS notification or an accidental Alt-Tab flicker.
const GRACE_MS = 1000;

// ===== SECURITY NOTE =====
// This is a client-side deterrent, not real security. It stops casual
// cheating (copy-pasting an answer, switching to another tab/window to look
// something up) but anyone who opens browser DevTools can disable
// JavaScript, edit the page, or simply read the lock passwords straight out
// of the `locks` collection in Firestore (that limitation already exists
// independent of this hook — see firestore.rules and README.md). Treat this
// as raising the bar for a supervised campus event, not as tamper-proof
// enforcement.
export function useLockdown({ active, onViolation }) {
  const graceTimer = useRef(null);

  const clearGrace = useCallback(() => {
    if (graceTimer.current) {
      clearTimeout(graceTimer.current);
      graceTimer.current = null;
    }
  }, []);

  const armGrace = useCallback(
    (reason) => {
      if (graceTimer.current) return;
      graceTimer.current = setTimeout(() => {
        graceTimer.current = null;
        onViolation(reason);
      }, GRACE_MS);
    },
    [onViolation]
  );

  useEffect(() => {
    if (!active) {
      clearGrace();
      return undefined;
    }

    // Tab switch (or minimizing / switching virtual desktop).
    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        armGrace('TAB_SWITCH');
      } else {
        clearGrace();
      }
    }

    // Switching to a different application/window (Alt-Tab) — catches
    // cases visibilitychange alone can miss, e.g. an overlapping window
    // that still leaves this tab technically "visible".
    function handleBlur() {
      armGrace('WINDOW_SWITCH');
    }

    function handleFocus() {
      clearGrace();
    }

    function blockClipboard(e) {
      e.preventDefault();
    }

    function blockContextMenu(e) {
      e.preventDefault();
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('paste', blockClipboard);
    document.addEventListener('contextmenu', blockContextMenu);

    return () => {
      clearGrace();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('paste', blockClipboard);
      document.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [active, armGrace, clearGrace]);
}
