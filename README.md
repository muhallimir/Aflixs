# Aflixs - Streaming Portfolio App

A Netflix-style streaming demo built with React. Browse TMDB titles, search, keep a My List watchlist, resume Continue Watching, view rich detail modals with trailers, and manage plan/profile via Firebase.

## Features

- Home rows: Originals, Trending, Top Rated, Action, Comedy, Horror, Romance, Documentaries (TMDB via axios)
- Debounced search: dedicated `/search` results grid with loading skeletons, empty states, error + retry, shareable `?q=` URLs
- My List watchlist: Redux Toolkit slice persisted to `localStorage`, add/remove from Row cards and Banner, My List row on Home, counts + clear on Profile
- Movie detail modal: poster, overview, rating/year/language, trailer playback (movie-trailer + react-youtube), add-to-list, similar titles, Escape/overlay close, scroll lock
- Continue Watching: `localStorage` progress tracking with progress bars, resume timestamps ("3h ago"), resume bumps progress and opens details, remove/clear
- UX polish: skeleton loaders for rows/banner/search, error boundary, 404 NotFound route, footer, skip-to-content link, keyboard accessible cards/buttons/modal, responsive layouts, reduced-motion support
- Auth/profile UX: protected routes, persistent Firebase session handling, profile shows plan + watchlist count + history count + sign-out with error handling, inline form validation on sign-in/register and email passthrough from landing

## Screenshots

Replace the placeholders below with your own captures (suggested size 1280x720):

- `docs/screenshots/home.png` - Home with Banner, Continue Watching, My List, rows
- `docs/screenshots/search.png` - Search results grid + empty state
- `docs/screenshots/modal.png` - Detail modal with trailer + similar titles
- `docs/screenshots/profile.png` - Profile stats, plan, watchlist counts

Example markdown once files exist:

```md
![Home](docs/screenshots/home.png)
![Search](docs/screenshots/search.png)
![Detail modal](docs/screenshots/modal.png)
![Profile](docs/screenshots/profile.png)
```

## Tech stack

- React 17 + react-scripts 4 (Create React App)
- react-router-dom v5 (Switch/Route, protected routes)
- Redux Toolkit + react-redux (user session, My List)
- Firebase 8 (auth, Firestore for products/subscriptions)
- Stripe JS (checkout stub in PlanScreen, optional)
- TMDB via axios (`src/axios.js`, `src/request.js`)
- movie-trailer + react-youtube (trailer playback)
- Material-UI v4 (available; current UI is hand-rolled CSS)
- Zero new runtime dependencies added for these features (hand-rolled debounce, modal, persistence)

## Getting started

Prerequisites: Node 14+ (Node 16 recommended for react-scripts 4), npm or yarn.

```bash
git clone git@github.com:muhallimir/Aflixs.git
cd Aflixs
cp .env.example .env
# fill in REACT_APP_TMDB_API_KEY and Firebase values in .env
npm install --legacy-peer-deps
npm start
```

Open http://localhost:3000. The app works without env keys via built-in demo fallbacks, but search/rows need a valid TMDB key for fresh data.

## Environment variables

See `.env.example` for all keys. Never commit real keys (`.env` is gitignored).

| Variable | Required | Used for |
|---|---|---|
| `REACT_APP_TMDB_API_KEY` | Yes | Rows, search, similar titles (`src/request.js`) |
| `REACT_APP_FIREBASE_API_KEY` etc. | Yes for auth | Sign-in/register, plans (`src/firebase.js`) |
| `REACT_APP_STRIPE_PUBLIC_KEY` | Optional | Checkout redirect in `PlanScreen` |

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server with hot reload |
| `npm run build` | Production bundle to `build/` |
| `npm test` | CRA test runner (watch mode) |

## Project structure

```
src/
  App.js                 # Router, auth session sync, modal host, error boundary
  ProtectedRoute.js      # Auth guard for / /search /profile
  ErrorBoundary.js       # Friendly fallback for render failures
  Nav.js                 # Top nav + search entry
  Banner.js              # Featured title + Play / My List / More Info
  Row.js                 # Horizontal poster row + skeletons + list toggles
  ContinueWatchingRow.js # Progress bars, resume timestamps, remove
  MovieModal.js          # Detail modal + trailer + similar
  Footer.js              # Shared footer
  hooks/useDebounce.js   # Search debounce
  utils/continueWatching.js  # localStorage progress store + change events
  features/userSlice.js  # Firebase user session
  features/myListSlice.js# Watchlist + localStorage persistence
  app/store.js           # Redux store
  screens/
    HomeScreen.js        # Banner + Continue Watching + My List + rows
    SearchScreen.js      # Debounced TMDB search grid
    ProfileScreen.js     # Plan + stats + sign-out + clear data
    PlanScreen.js        # Firestore plans (checkout stub)
    LoginScreen.js       # Landing + email capture
    SignupScreen.js      # Sign-in/register with validation
    NotFoundScreen.js    # 404
```

## Deployment notes

- `npm run build` outputs static files; deploy `build/` to Firebase Hosting (`firebase.json` present), Vercel, or Netlify.
- Set the same `REACT_APP_*` vars in your host dashboard. CRA inlines them at build time, so rebuild after changing values.
- Firebase Hosting quick path: `npm run build && firebase deploy` (requires `firebase-tools` login and correct `.firebaserc` project).
- Client bundle exposes the TMDB/Firebase public keys by design; restrict them with TMDB referrer rules, Firebase authorized domains, and Firestore security rules before sharing publicly.

## Roadmap

- Real Stripe checkout sessions via Cloud Functions (PlanScreen currently stubs redirect)
- Pagination/infinite scroll for search + rows
- Per-profile watchlists in Firestore (currently local per device)
- Playback position sync + skip-intro markers
- Tests for slices, utils, and key screens
- PWA offline caching for posters
