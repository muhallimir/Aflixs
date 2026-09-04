import "./App.css";
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SearchScreen from "./screens/SearchScreen";
import BrowseScreen from "./screens/BrowseScreen";
import SettingsScreen from "./screens/SettingsScreen";
import BillingScreen from "./screens/BillingScreen";
import NotFoundScreen from "./screens/NotFoundScreen";
import MovieModal from "./MovieModal";
import ErrorBoundary from "./ErrorBoundary";
import ProtectedRoute from "./ProtectedRoute";
import { auth } from "./firebase";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "./features/userSlice";
import axios from "./axios";
import { TMDB_API_KEY } from "./request";
import { recordView } from "./utils/recentlyViewed";
import { getGuestSession, clearGuestSession } from "./utils/mockCatalog";
import ShortcutsDialog from "./ShortcutsDialog";
import ComparePanel from "./ComparePanel";
import Spinner from "react-spinkit";
import logo from "./logo.png";
import styled from "styled-components";
import { useAuthState } from "react-firebase-hooks/auth";

function App() {
  const user = useSelector((selectUser) => selectUser.counter.user);
  const dispatch = useDispatch();
  const [, loading] = useAuthState(auth);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const openTitleRef = useRef(null);

  // Global shortcuts: "/" focuses search, "?" opens shortcut help.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        try {
          const el =
            document.getElementById("aflixs-global-search") ||
            document.querySelector(".searchScreen__input");
          if (el) el.focus();
        } catch (err) {
          // ignore
        }
      } else if (e.key === "?" && !typing) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Deep link: /?title={type}-{id} auto-opens the detail modal on load.
  useEffect(() => {
    let cancelled = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("title");
      if (!ref) return;
      const match = /^(movie|tv)-(\d+)$/.exec(ref);
      if (!match) return;
      const [, type, id] = match;
      axios
        .get(`/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`)
        .then((res) => {
          if (cancelled || !res.data) return;
          setSelectedTitle({ ...res.data, media_type: type });
        })
        .catch(() => {
          // Invalid/expired link: leave modal closed.
        });
    } catch (e) {
      // ignore malformed URLs
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Open-title requests from outside the modal tree (e.g. notifications).
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      if (detail.id == null) return;
      if (detail.title || detail.name || detail.poster_path || detail.backdrop_path) {
        openTitleRef.current(detail);
        return;
      }
      const type = detail.media_type === "tv" ? "tv" : "movie";
      axios
        .get(`/${type}/${detail.id}?api_key=${TMDB_API_KEY}&language=en-US`)
        .then((res) => {
          if (res.data) openTitleRef.current({ ...res.data, media_type: type });
        })
        .catch(() => {
          // ignore fetch errors
        });
    };
    window.addEventListener("aflixs:open-title", handler);
    return () => window.removeEventListener("aflixs:open-title", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync so the open title is shareable; clear on close.
  const openTitle = (movie) => {
    setSelectedTitle(movie);
    try {
      if (movie && movie.id != null) recordView(movie);
    } catch (e) {
      // ignore storage errors
    }
    try {
      if (movie && movie.id != null) {
        const type = movie.media_type === "tv" ? "tv" : "movie";
        const url = new URL(window.location.href);
        url.searchParams.set("title", `${type}-${movie.id}`);
        window.history.replaceState(null, "", url.toString());
      }
    } catch (e) {
      // ignore
    }
  };
  const closeTitle = () => {
    setSelectedTitle(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("title");
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      // ignore
    }
  };
  openTitleRef.current = openTitle;

  const storeRef = useRef(null);
  useEffect(() => {
    // Lazy import to avoid a circular import with the Redux store.
    import("./app/store").then((mod) => {
      storeRef.current = mod.store;
    }).catch(() => {
      // ignore
    });
  }, []);

  useEffect(() => {
    // Restore a guest session from a prior visit so returning visitors land
    // straight in the app without having to sign in.
    try {
      const guest = getGuestSession();
      if (guest) dispatch(login(guest));
    } catch (e) {
      // ignore
    }
    // Persistent session handling: Firebase restores the session on reload
    // and notifies here. `useAuthState` above covers the initial loading
    // state, this listener keeps Redux in sync afterwards. Real auth wins
    // over a cached guest.
    const unsubscribe = auth.onAuthStateChanged((userAuth) => {
      if (userAuth) {
        // the user just logged in / the user was logged in
        console.log("THE USER IS >>> ", userAuth);
        dispatch(
          login({
            uid: userAuth.uid,
            email: userAuth.email,
            displayName: userAuth.displayName || userAuth.email,
            isGuest: false,
          })
        );
        // Switching from a guest session to a real account: drop the guest
        // marker so the UI no longer promotes "Create account".
        try {
          clearGuestSession();
        } catch (e) {
          // ignore
        }
      } else {
        // Keep a guest session in place once it exists; only log out fully
        // when the visitor is currently a real user (e.g. after sign-out).
        const current = storeRef.current?.getState().counter.user;
        if (current && !current.isGuest) {
          dispatch(logout());
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (loading) {
    return (
      <Apploading>
        <ApploadingContent>
          <img src={logo} alt="" />
          <Spinner name="pacman" color="red" fadeIn="none" />
        </ApploadingContent>
      </Apploading>
    );
  }

  return (
    <div className="App">
      <Router>
        <a className="skipLink" href="#main-content">
          Skip to content
        </a>
        <ErrorBoundary>
        <Route path="/">
          {!user ? (
            <LoginScreen />
          ) : (
            <main id="main-content">
            <Switch>
              <ProtectedRoute path="/profile">
                <ProfileScreen />
              </ProtectedRoute>
              <ProtectedRoute path="/search">
                <SearchScreen onSelectTitle={openTitle} />
              </ProtectedRoute>
              <ProtectedRoute path="/browse">
                <BrowseScreen onSelectTitle={openTitle} />
              </ProtectedRoute>
              <ProtectedRoute path="/settings">
                <SettingsScreen />
              </ProtectedRoute>
              <ProtectedRoute path="/billing">
                <BillingScreen />
              </ProtectedRoute>
              <ProtectedRoute exact path="/">
                <HomeScreen onSelectTitle={openTitle} />
              </ProtectedRoute>
              <Route path="*">
                {user ? <NotFoundScreen /> : <LoginScreen />}
              </Route>
            </Switch>
            </main>
          )}
        </Route>
        {user && selectedTitle && (
          <MovieModal
            movie={selectedTitle}
            onClose={closeTitle}
            onSelectTitle={openTitle}
            onCompare={(title) => {
              if (!compareA || (compareA && compareB)) {
                setCompareA(title);
                setCompareB(null);
              } else if (!compareB) {
                setCompareB(title);
              }
            }}
          />
        )}
        {user && shortcutsOpen && (
          <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />
        )}
        {user && compareA && compareB && (
          <ComparePanel
            a={compareA}
            b={compareB}
            onClose={() => {
              setCompareA(null);
              setCompareB(null);
            }}
            onPick={(picked) => {
              setCompareA(null);
              setCompareB(null);
              if (picked) openTitle(picked);
            }}
          />
        )}
        </ErrorBoundary>
      </Router>
    </div>
  );
}
export default App;

const Apploading = styled.div`
  display: grid;
  place-items: center;
  height: 100vh;
  width: 100%;
`;

const ApploadingContent = styled.div`
  text-align: center;
  padding-bottom: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  > img {
    object-fit: contain;
    height: 200px;
    padding: 20px;
    margin-bottom: 20px;
  }
`;
