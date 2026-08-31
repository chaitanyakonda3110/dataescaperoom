import { useState } from 'react';

// ===== LOCK IMAGE CONFIGURATION =====
// Drop an image at public/assets/locks/lock{N}.png to show it at the top
// of that Lock's popup, above both questions — e.g. Lock 3's image goes at
// public/assets/locks/lock3.png. Unlike questions/hints/passwords (set from
// the admin dashboard, live, no rebuild needed), this is a static file —
// adding, replacing, or removing one needs a rebuild + redeploy. If no
// file exists at that path, nothing is shown; no broken-image icon.
export default function LockImage({ lockIndex }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const src = `${import.meta.env.BASE_URL}assets/locks/lock${lockIndex}.png`;

  return (
    <img
      src={src}
      alt={`Lock ${lockIndex}`}
      className="lock-modal__image"
      onError={() => setFailed(true)}
    />
  );
}
