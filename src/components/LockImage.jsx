import { useEffect, useState } from 'react';

// ===== LOCK IMAGE CONFIGURATION =====
// Drop an image at public/assets/locks/lock{N}.png to show it at the top
// of that Lock's popup, above both questions — e.g. Lock 3's image goes at
// public/assets/locks/lock3.png. Unlike questions/hints/passwords (set from
// the admin dashboard, live, no rebuild needed), this is a static file —
// adding, replacing, or removing one needs a rebuild + redeploy. If no
// file exists at that path, nothing is shown; no broken-image icon.
//
// Tapping the image opens an in-app zoomed lightbox. This is deliberately
// a custom overlay rather than relying on the browser's native pinch/ctrl-
// scroll zoom, because that native zoom can be awkward or unavailable once
// the page is in Fullscreen API mode (see FullscreenToggle) — this works
// identically either way.
export default function LockImage({ lockIndex }) {
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return undefined;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setZoomed(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomed]);

  if (failed) return null;

  const src = `${import.meta.env.BASE_URL}assets/locks/lock${lockIndex}.png`;

  return (
    <>
      <button
        type="button"
        className="lock-modal__image-trigger"
        onClick={() => setZoomed(true)}
      >
        <img
          src={src}
          alt={`Lock ${lockIndex}`}
          className="lock-modal__image"
          onError={() => setFailed(true)}
        />
        <span className="lock-modal__image-hint">🔍 TAP TO ZOOM</span>
      </button>

      {zoomed && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            className="image-lightbox__close"
            onClick={() => setZoomed(false)}
            aria-label="Close zoomed image"
          >
            ×
          </button>
          <img src={src} alt={`Lock ${lockIndex} zoomed in`} className="image-lightbox__image" />
        </div>
      )}
    </>
  );
}
