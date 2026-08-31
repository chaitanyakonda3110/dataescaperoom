# DATA ESCAPE ROOM

**Analytics Club — Ramaiah Institute of Management**
_CAN YOU ESCAPE IN TIME?_

A React + Vite + Firebase web app for running a live, multi-team "data escape room" event: teams register, get a Team ID, and unlock 5 Locks against a shared countdown timer that an admin controls in real time. Each Lock holds two questions (shown as an image) and a combined password, with two optional hints that cost time when used.

---

## 1. Complete file structure

```
data-escape-room/
├── .github/workflows/deploy.yml   # GitHub Pages CI/CD
├── public/
│   └── assets/                    # logo images, favicon, and locks/ for question images
├── src/
│   ├── components/
│   │   ├── Timer.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── LockTile.jsx
│   │   ├── LockModal.jsx
│   │   ├── LockImage.jsx
│   │   ├── TeamRegistration.jsx
│   │   ├── RegistrationSuccess.jsx
│   │   ├── CongratulationsScreen.jsx
│   │   ├── DisqualifiedScreen.jsx
│   │   ├── AdminTeamTable.jsx
│   │   ├── AdminTimerControl.jsx
│   │   ├── AdminLeaderboard.jsx
│   │   ├── AdminStats.jsx
│   │   ├── TeamDetailModal.jsx
│   │   ├── ResultsModal.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── LoadingScreen.jsx
│   │   ├── FullscreenToggle.jsx
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── TeamDashboard.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── AdminRoute.jsx         # gate: shows Login or Dashboard
│   ├── firebase/
│   │   ├── config.js              # <-- EDIT: Firebase credentials
│   │   ├── auth.js
│   │   └── firestore.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── hooks/
│   │   └── useLockdown.js         # tab/window-switch + clipboard enforcement
│   ├── config/
│   │   ├── eventConfig.js         # event name/date/timer/hint-penalty defaults
│   │   ├── locks.js               # <-- EDIT: the 5 Locks' hints + passwords (gitignored, not pushed)
│   │   └── locks.example.js       # committed template — copy to locks.js locally
│   ├── utils/
│   │   ├── teamId.js
│   │   ├── format.js
│   │   ├── timerMath.js
│   │   ├── teamProgress.js
│   │   ├── teamStatus.js
│   │   ├── leaderboard.js
│   │   └── csv.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── package.json
├── vite.config.js
└── README.md
```

All source code is already written and functional — this is not a mockup. You only need to fill in three things to run a real event: Firebase config, the 5 Locks' hints/passwords/images, and logos.

---

## 2. How the app works

- **`/`** — Registration screen. A team registers with a team name + 3 members and gets a unique **Team ID**. If a team ID is already stored in the browser (`localStorage`, used only as a convenience pointer, not as the database), returning visitors skip straight to "Welcome back."
- **`/team/:teamId`** — Team dashboard: synced countdown timer, progress bar, and 5 Lock tiles. All state lives in Firestore, so a refresh never loses progress.
  - Tapping an unsolved Lock opens a popup showing that Lock's question image (if one exists), a single answer field, an **UNLOCK** button, and two **Hint** buttons. Using a hint permanently reveals that hint's text and deducts minutes from **that team's own time only** — see the timer note below. The popup also shows a compact live countdown next to the "LOCK N" title, since it covers the dashboard's own timer while open.
  - Locks can only be opened/submitted while the admin has the shared timer actively `RUNNING` and this team's own effective time hasn't run out — locked before it starts, while paused, and once their time is up.
  - A team's status (shown in the admin team table and leaderboard) is one of `ACTIVE`, `COMPLETED`, `TIME UP` (their own effective time ran out without finishing), or `DISQUALIFIED` — computed the same way in both places from a single shared function, so they can never disagree.
  - Solving all 5 Locks replaces the dashboard with a congratulations screen instead of the ticking timer.
  - While the timer is running, switching to another tab or window auto-disqualifies the team after a short grace period — see section 10 below.
- **`/admin`** — Shows an admin login form until a Firebase-authenticated admin signs in, then swaps to the full Admin Control Center, top to bottom:
  1. Stats (teams registered/active/completed, timer state)
  2. Timer Control — set duration, **START**/**PAUSE**/**RESET**, and **FINISH GAME** (ends the event immediately for every team, no matter how much time is left — see below)
  3. A big live countdown — the same display teams see, so you can glance at it or put it on a projector
  4. **LEADERBOARD** — ranked standings, a **VIEW RESULTS** button (opens the podium view any time), and **DOWNLOAD CSV**
  5. The live team table (click a row for detail: Disqualify/Reinstate/Delete/Reset)

  You get a toast the moment any team completes all 5 Locks.

### FINISH GAME — ending the event early

Clicking **FINISH GAME** (with confirmation, since it affects every team at once and can't be undone) instantly sets every team's remaining time to zero, exactly as if the clock had actually run out. Every Lock closes immediately across all teams, and the "TIME'S UP" results popup appears on the admin dashboard, same as a natural expiry.

This also happens **automatically**, with no admin click needed: if every registered team reaches a terminal state — `TIME UP`, `DISQUALIFIED`, or `COMPLETED` — while the event is still running, there's no one left who could possibly submit another Lock, so the admin dashboard ends the event itself and the results popup appears on its own. It re-arms the next time the timer is reset for a fresh round.

### The leaderboard — how ties get broken

Ranking is: more Locks solved ranks higher; disqualified teams always rank last regardless of progress. When two or more teams are tied on Locks solved, whichever team reached that count **first** (the earliest timestamp among their solved Locks) ranks above the others — the "fastest response wins a tie" rule. That timestamp is recorded server-side the moment a Lock is correctly solved (`lockXSolvedAt`), and the Firestore rules only allow it to be set once, to the server's own request time — never a value a participant supplies — so a team can't fake having solved something earlier than they actually did.

The tiebreak itself always compares full millisecond-precision timestamps — over a long event, two teams landing in the exact same minute is entirely possible, so the on-screen **REACHED AT** column shows down to the second, not just hour:minute. This is purely a display fix (the ranking was never actually only minute-precision under the hood) — it just makes a close ranking visibly trustworthy instead of looking like an arbitrary coin flip. The CSV export already had full timestamp precision (ISO format with milliseconds) from the start.

**DOWNLOAD CSV** exports the full ranked results (rank, Team ID, team name, all 3 member names, Locks solved, when they reached that count, status) as a spreadsheet — useful for a permanent record independent of Firebase.

### When the timer runs out (naturally or via FINISH GAME)

The moment the shared timer crosses into `TIME_UP`, a **"TIME'S UP"** popup appears automatically on the admin dashboard once (not on every refresh afterward) with a **TIME'S UP — VIEW RESULTS** button. Clicking it reveals the final standings as a podium: 1st/2nd/3rd shown as **team names only** (no member names), arranged the way race podiums are (2nd left, 1st center, 3rd right), with confetti and 4th place onward listed below in order. You can reopen this same podium view anytime afterward from the Leaderboard's **VIEW RESULTS** button — it isn't a one-time popup you can lose.

### The timer model — one shared clock, per-team hint deductions

There is still only **one** event timer (`gameState/main`), started/paused/reset by the admin for the whole event at once. What's isolated per team is how much of that shared countdown they've personally burned through: every hint a team uses subtracts minutes from **their own effective time only** (`team.hintPenaltySeconds`), never from what other teams see. A team's displayed time = the shared timer minus their own hint penalty. Pausing, resetting, or setting the duration still affects everyone at once, as the single source of truth for the event.

---

## 3. Exact Firebase setup steps

1. Go to <https://console.firebase.google.com> and create a new project.
2. **Add a Web app**: Project settings → General → "Your apps" → the `</>` icon. Copy the `firebaseConfig` object it shows you.
3. Open [`src/firebase/config.js`](src/firebase/config.js) and paste your values over every `CHANGE_ME`.
4. **Enable Authentication**: Build → Authentication → Sign-in method → enable **Email/Password**.
5. **Enable Firestore**: Build → Firestore Database → Create database → start in **production mode** (the rules below secure it). Firestore here only stores team registrations, team progress, and the shared timer — not Lock content (see section 4).
6. **Deploy the security rules** in [`firestore.rules`](firestore.rules):
   - Easiest: Firestore Database → Rules tab → paste the contents of `firestore.rules` → Publish.
   - Or with the Firebase CLI: `npm i -g firebase-tools`, then `firebase login`, `firebase use --add` (pick your project), then `firebase deploy --only firestore:rules`.
   - **Whenever you pull an update to this project that touches `firestore.rules`, you must republish it** — Firestore keeps using whatever rules were last published until you do, regardless of what's in the local file.
7. **Create your admin account**: Authentication → Users → Add user → enter the email/password you'll use to log into `/admin`. (There's no self-serve admin signup in the app on purpose — only accounts you create in the Firebase console can log in.)

---

## 4. Exact steps to set up the 5 Locks (questions, hints, passwords)

**Hints and passwords** live in one file — `src/config/locks.js` — it is the **only** file in the project that contains them. That file is **gitignored on purpose** and never gets pushed to GitHub, since a public repo would otherwise expose every answer to anyone who browses it. [`src/config/locks.example.js`](src/config/locks.example.js) is the committed template documenting the shape:

```js
export const LOCKS = {
  lock1: {
    hint1: 'CHANGE_ME',
    hint2: 'CHANGE_ME',
    password: 'CHANGE_ME',
  },
  // ...lock2 through lock5, same shape
};
```

**For local development**: copy the template and fill in real values —
```bash
cp src/config/locks.example.js src/config/locks.js
```
then edit `hint1`/`hint2`/`password` for each of the 5 Locks in your local `locks.js`. It stays on your machine only. Nothing else needs to change — this isn't stored in Firestore at all, so there's no admin panel step and nothing that can get out of sync or cleared by a refresh.

**For the GitHub Actions auto-deploy**: since `locks.js` never reaches the repository, the CI build reconstructs it at build time from a repository secret. One-time setup:

1. On your machine, generate the exact JSON the workflow expects from your real `locks.js`:
   ```bash
   node -e "import('./src/config/locks.js').then(m => console.log(JSON.stringify(m.LOCKS)))"
   ```
2. On GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**
3. Name: `LOCKS_CONFIG_JSON`. Value: paste the JSON output from step 1 exactly as printed (one line).
4. Save. Every future push to `main` will now have the workflow write that JSON into `src/config/locks.js` right before building — see the "Write real Lock answers from repo secret" step in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). If the secret isn't set, that step fails loudly instead of silently deploying a broken/placeholder build.

Changing an answer later: update your local `locks.js`, redeploy locally if you use that path, **and** update the `LOCKS_CONFIG_JSON` secret to match (repeat steps 1–4) so the next automated deploy doesn't revert to the old value.

**Question images** are separate, static image files — drop one at:

```
public/assets/locks/lock{N}.png
```

For example, Lock 3's image goes at `public/assets/locks/lock3.png`. It's shown at the top of that Lock's popup, above the answer field. If no file exists at that path, nothing is shown — no broken-image icon. Like the hints/password above, this needs a rebuild + redeploy to update on the live site (a local `npm run dev` picks up a new/changed file immediately).

Tapping the image opens it in a zoomed-in overlay (`🔍 TAP TO ZOOM`) — useful for dense charts/screenshots. This is a custom in-app lightbox, not the browser's native pinch/ctrl-scroll zoom, specifically so it works identically whether or not the participant is using the Fullscreen toggle.

---

## 5. The college and Analytics Club logos

Already wired up — `public/assets/ramaiah-logo.png` renders top-left, `public/assets/analytics-club-logo.png` renders top-right, via [`src/components/Navbar.jsx`](src/components/Navbar.jsx). Both are transparent-background PNGs.

To swap either one, just replace the file at that same path with the same filename — no code change needed. Like the Lock images (section 4), these are static files, so a swap needs a rebuild + redeploy (section 8) to show up on the live site; a local `npm run dev` picks up the new file immediately.

(Optional) Replace `public/assets/favicon.svg` with your own icon the same way.

---

## 6. How to create the Admin account

Covered in step 7 of section 3 above: Firebase Console → Authentication → Users → **Add user**. Use that email/password on the `ADMIN LOGIN` screen at `/#/admin`. You can add multiple admin accounts the same way (e.g. one per event volunteer).

---

## 7. How to test the application locally

```bash
npm install
npm run dev
```

This starts a local dev server (Vite will print a `localhost` URL). With Firebase configured (section 3) and at least Lock 1's hint1/hint2/password filled in (section 4), you can:

- Register a test team from `/`.
- Open the Team ID's dashboard in one tab, and `/#/admin` in another.
- In the admin tab, set a short timer (e.g. 1–2 minutes) and click **START**.
- On the team tab, open Lock 1, try a wrong answer (expect **INVALID PASSWORD**), then the right one (expect it to unlock and the progress bar to advance).
- Click a Hint button on an unsolved Lock, confirm the deduction, and check that team's remaining time actually drops by the hint penalty (default 5 minutes) while other teams' time is unaffected.
- Refresh either tab to confirm state persists.
- Try registering the same team name twice — the second attempt should be rejected.
- Switch to another browser tab while the timer is running and confirm the team gets auto-disqualified after ~1 second, then use **Reinstate Team** in the admin's team detail view to undo it.
- Click **FINISH GAME** and confirm every team locks out immediately and the results popup appears.

---

## 8. How to deploy to GitHub Pages

1. In [`vite.config.js`](vite.config.js), set `REPO_NAME` to your actual GitHub repository name (e.g. if your repo is `github.com/you/data-escape-room`, `REPO_NAME` should be `'data-escape-room'`).
2. Push this project to a GitHub repository on the `main` branch.
3. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The included workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys automatically on every push to `main`. You can also trigger it manually from the **Actions** tab ("Run workflow").
5. Once it finishes, your app is live at `https://<your-username>.github.io/<REPO_NAME>/`.

**Manual alternative** (no GitHub Actions): `npm run deploy` uses the `gh-pages` package to push the `dist/` build to a `gh-pages` branch. Make sure GitHub Pages is set to serve from that branch if you use this route instead.

---

## 9. Verification checklist

- [x] No Lock hint or password value exists anywhere outside `src/config/locks.js`. Question images are static files in `public/assets/locks/`. Neither is stored in Firestore.
- [x] Timer state (`status`, `remainingSeconds`, `startedAt`) lives in Firestore (`gameState/main`) and is recomputed from a server-anchored timestamp on every load — a refresh or late join always shows the correct time for the whole event.
- [x] Each team's effective remaining time is the shared timer minus their own `hintPenaltySeconds`, computed the same way on every screen (team dashboard, admin table, admin team detail).
- [x] Team progress (`teamId`, member names, `lockXSolved`, `lockXHint1Used`/`lockXHint2Used`, `hintPenaltySeconds`, `lastUpdated`) lives in Firestore (`teams/{teamId}`) and is restored on refresh via `onSnapshot`.
- [x] The admin dashboard subscribes to all teams and to `gameState/main` with `onSnapshot`, so progress and timer changes appear live with no polling.
- [x] Every team's registration, dashboard, and progress work independently and concurrently — there is no shared client-side state between teams.
- [x] Registration checks `teamNameLower` for an existing match before creating a team; duplicate names are rejected client-side and the Firestore create rule further requires a fresh document.
- [x] Locks 1–5 are independent boolean fields (`lock1Solved` … `lock5Solved`), each unlocked and persisted separately.
- [x] Once a Lock's flag is `true`, its tile becomes non-interactive in the UI, and the Firestore rules only allow that specific field to flip `false → true`, never back. The same applies to each of the 10 hint-used flags.
- [x] `hintPenaltySeconds` can only increase, never decrease, enforced both by the app (it only ever calls `increment()`) and by the Firestore rules.
- [x] When a team's own derived remaining time hits 0, every Lock tile is disabled and shows "TIME'S UP" — this is computed live on the client from the synced timer minus their hint penalty, not something a participant can bypass by not refreshing, and it's independently re-checked in the Firestore rules.
- [x] Each solved Lock records a server timestamp (`lockXSolvedAt`), settable only once and only to the server's own request time — a participant cannot backdate it to win a leaderboard tiebreak.
- [x] The leaderboard ranks by Locks solved, then by earliest `lockXSolvedAt` among ties, then disqualified teams last regardless of progress — recomputed live from the same `onSnapshot` team data the rest of the admin dashboard uses.
- [x] **FINISH GAME** flows through the same `TIME_UP` logic a natural expiry uses — no separate code path to keep in sync.

---

## 10. Security limitations you should know before the event

This is intentionally a **lightweight, no-backend-server** prototype. Please read this before relying on it for anything high-stakes:

1. **Lock hints and passwords are client-side.** `src/config/locks.js` ships inside the JavaScript bundle sent to every browser. A participant who opens browser DevTools (or downloads the built JS file) could technically find the values, including both hints for a Lock, without ever using a hint or making a guess. This is explicitly called out in that file too. Don't reuse these passwords elsewhere, and treat this as "good enough for a supervised campus event," not as cryptographic security. (`locks.js` itself is gitignored and never enters the public repo's history — see section 4 — so this exposure is limited to the deployed JS bundle, not additionally to anyone browsing GitHub.)
2. **No participant authentication.** Teams are identified only by their Team ID, not by a login. Firestore rules restrict participant writes to *only* flipping their own Lock/hint flags from `false → true` and increasing `hintPenaltySeconds` (never registration data, never other fields, never reversing progress), but they cannot verify that the request is really coming from that team's members rather than someone who guessed/shared a Team ID. In practice this means: don't publicly post Team IDs, and treat them like a lightweight access token for the event's duration.
3. **Client-anchored timer.** The countdown is derived from a Firestore server timestamp captured when the admin presses Start/Resume, so it survives refreshes and is consistent across devices — but it is still evaluated by each participant's own device clock relative to that anchor. For a single classroom/hall event this is reliable; it is not built to defend against a participant deliberately tampering with their own system clock.
4. **Admin access is only as strong as your Firebase Auth accounts.** Use a strong password for each admin account you create, and remove accounts you no longer need from the Firebase console after the event.
5. **This app does not rate-limit answer guesses.** Nothing stops a team from submitting many guesses quickly. If you want to slow down brute-forcing, that would require server-side logic (e.g. Cloud Functions), which is out of scope for this prototype by design.
6. **The exact hint-penalty amount isn't independently re-verified by the Firestore rules.** The rules confirm `hintPenaltySeconds` can only ever increase (never be clawed back), but they don't re-derive the exact "+5 minutes per hint" from scratch — that math lives in the app's `useHint()` call. A participant tampering with the Firestore API directly (bypassing the UI) could in theory record a smaller-than-intended penalty for a hint. This only benefits that one team's own effective time, and requires bypassing the UI entirely — flagged here for completeness, not because it's an easy or likely path for a typical participant.
7. **The anti-cheat "lockdown" (`src/hooks/useLockdown.js`) is a deterrent, not real security.** While a team's timer is `RUNNING`, the app blocks copy/cut/paste and right-click, and auto-disqualifies a team that switches to another browser tab or another application/window (detected via the page's `visibilitychange` event and the window's `blur` event, so both "changed tab" and "switched window" are covered) after a very short grace period. Please understand what this does and doesn't do before relying on it:
   - It's all client-side JavaScript running in the participant's own browser. Anyone who opens DevTools can read the Lock passwords directly out of the shipped bundle (limitation #1 above), disable JavaScript, or otherwise defeat every check here. It stops casual cheating, not a determined technical participant.
   - **False positives are possible.** An OS notification stealing focus, a phone call, or briefly clicking outside the browser window could trigger an auto-disqualification for an honest team. There's only a 1-second grace period before it fires, so this is a real risk — keep an eye on the admin dashboard while the timer runs.
   - **This is exactly why the Reinstate Team button exists.** If a team gets auto-disqualified unfairly, an admin can reverse it in one click from that team's detail view during the event — treat this as your safety valve.
8. **Disqualification (like completion) only stops that team's own display, not the shared event timer.** There is one countdown for the whole event, controlled by the admin. When a team is disqualified or finishes, their dashboard freezes at their current time and shows a dedicated screen — but the real, shared `gameState` timer keeps running normally for every other team still playing. Nothing about one team's outcome ever pauses or resets the event for anyone else (except **FINISH GAME**, which is explicitly an admin action to end things for everyone at once).

---

## Tech stack

React 18 · Vite · React Router (HashRouter, GitHub Pages-friendly) · Firebase Authentication · Firebase Firestore · plain CSS (no framework) themed to the event poster's dark neon-purple/magenta identity.
