// =========================================================
// ===== LOCK CONFIGURATION TEMPLATE =====
// =========================================================
//
// This is a TEMPLATE, not the real file the app imports. It exists only so
// the shape is documented and version-controlled. The real answers live in
// src/config/locks.js, which is gitignored on purpose — see README.md
// section 4 for why, and for exactly how to set it up:
//   - Local development: copy this file to locks.js and fill in real values.
//   - GitHub Actions deploy: reconstructed automatically at build time from
//     the LOCKS_CONFIG_JSON repository secret — nothing to do by hand.
//
// IMPORTANT SECURITY NOTE:
// Whatever values end up in the real locks.js are bundled into the
// JavaScript that ships to every participant's browser. They are NOT
// encrypted or hashed. A participant who opens browser dev tools (or views
// the built JS bundle) could technically find these values. This is
// acceptable for a live, time-boxed campus event, but do NOT reuse these
// passwords anywhere sensitive, and do not treat this as a
// cryptographically secure system.

export const LOCKS = {
  lock1: {
    hint1: 'CHANGE_ME',
    hint2: 'CHANGE_ME',
    password: 'CHANGE_ME',
  },
  lock2: {
    hint1: 'CHANGE_ME',
    hint2: 'CHANGE_ME',
    password: 'CHANGE_ME',
  },
  lock3: {
    hint1: 'CHANGE_ME',
    hint2: 'CHANGE_ME',
    password: 'CHANGE_ME',
  },
  lock4: {
    hint1: 'CHANGE_ME',
    hint2: 'CHANGE_ME',
    password: 'CHANGE_ME',
  },
  lock5: {
    hint1: 'CHANGE_ME',
    hint2: 'CHANGE_ME',
    password: 'CHANGE_ME',
  },
};
