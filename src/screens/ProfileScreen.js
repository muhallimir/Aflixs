import React, { useEffect, useState } from "react";
import "./ProfileScreen.css";
import Nav from "../Nav";
import Footer from "../Footer";
import PlanScreen from "./PlanScreen";
import ProfileSwitcher from "../ProfileSwitcher";
import StatsDashboard from "../StatsDashboard";

import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { clearList, selectMyListCount } from "../features/myListSlice";
import { getContinueWatching, clearContinueWatching } from "../utils/continueWatching";
import { getPrefs, setPrefs, onPrefsChanged } from "../utils/prefs";
import { getBilling, onBillingChanged } from "../utils/billing";
import { setPageMeta } from "../utils/seo";
import { clearGuestSession, isGuestUser } from "../utils/mockCatalog";
import { useHistory } from "react-router-dom";

import db, { auth } from "../firebase";

function ProfileScreen() {
  const [subscription, setSubscription] = useState(null);
  const [signOutError, setSignOutError] = useState("");
  const user = useSelector((selectUser) => selectUser.counter.user);
  const myListCount = useSelector(selectMyListCount);
  const dispatch = useDispatch();
  const history = useHistory();
  const [continueCount, setContinueCount] = useState(0);  const [kidsMode, setKidsMode] = useState(() => {
    try {
      return getPrefs().kidsMode;
    } catch (e) {
      return false;
    }
  });
  const [localPlan, setLocalPlan] = useState(() => {
    try {
      return getBilling();
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    let off = () => {};
    try {
      off = onPrefsChanged((p) => setKidsMode(Boolean(p.kidsMode)));
    } catch (e) {
      // ignore
    }
    let offBilling = () => {};
    try {
      offBilling = onBillingChanged(setLocalPlan);
    } catch (e) {
      // ignore
    }
    return () => {
      off();
      offBilling();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    db.collection("customers")
      .doc(user.uid)
      .collection("subscriptions")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach(async (subscription) => {
          setSubscription({
            role: subscription.data().role,
            // subscription start period
            current_period_start:
              subscription.data().current_period_start.seconds,
            // subscription end period
            current_period_end: subscription.data().current_period_end.seconds,
          });
        });
      })
      .catch(() => {
        // Plan lookup is optional; profile still renders without it.
      });
  }, [user?.uid]);

  useEffect(() => {
    setPageMeta({ title: "Profile", description: "Manage your Aflixs profile, watchlist, and stats.", path: "/profile" });
  }, []);

  useEffect(() => {
    try {
      setContinueCount(getContinueWatching().length);
    } catch (e) {
      setContinueCount(0);
    }
    const refresh = () => {
      try {
        setContinueCount(getContinueWatching().length);
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("aflixs:continue-watching-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("aflixs:continue-watching-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const handleSignOut = async () => {
    setSignOutError("");
    if (isGuestUser(user)) {
      // End the guest session and return to the marketing/login screen.
      try {
        clearGuestSession();
      } catch (e) {
        // ignore
      }
      dispatch({ type: "counter/logout" });
      history.push("/");
      return;
    }
    try {
      await auth.signOut();
    } catch (err) {
      setSignOutError("Could not sign out. Please try again.");
    }
  };

  const handleClearList = () => {
    dispatch(clearList());
  };

  const handleClearHistory = () => {
    clearContinueWatching();
    setContinueCount(0);
  };

  return (
    <div className="profileScreen">
      <Nav />
      <div className="profileScreen__body">
        <h1>Edit Profile</h1>
        {isGuestUser(user) && (
          <div className="profileScreen__guestBanner" role="status">
            <div>
              <strong>You are browsing as a guest.</strong> Your watchlist,
              ratings and continue-watching are saved on this device only.
            </div>
            <Link to="/" className="profileScreen__guestUpgrade">
              Create a free account
            </Link>
          </div>
        )}
        <div className="profileScreen__info">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
            alt="Profile avatar"
          />
          <div className="profileScreen__details">
            <h2>
              {user?.email || "Signed in"}
              {isGuestUser(user) && (
                <span className="profileScreen__guestTag">Guest</span>
              )}
            </h2>
            <ProfileSwitcher />
            <StatsDashboard />
            {user?.uid && (
              <p className="profileScreen__uid">Member ID: {user.uid.slice(0, 8)}...</p>
            )}

            <div className="profileScreen__stats" aria-label="Your library stats">
              <Link to="/" className="profileScreen__stat">
                <strong>{myListCount}</strong>
                <span>My List titles</span>
              </Link>
              <div className="profileScreen__stat">
                <strong>{continueCount}</strong>
                <span>Continue watching</span>
              </div>
              <div className="profileScreen__stat">
                <strong>{subscription ? subscription.role : "Free"}</strong>
                <span>Current plan</span>
              </div>
              {localPlan && (
                <Link to="/billing" className="profileScreen__stat">
                  <strong style={{ textTransform: "capitalize" }}>{localPlan.planId}</strong>
                  <span>Billing: {localPlan.status}</span>
                </Link>
              )}
            </div>

            <div className="profileScreen__plans">
              <h3>
                Current Plan:{" "}
                {subscription
                  ? `${subscription.role}`
                  : "Choose a plan below to start watching."}
              </h3>
              <PlanScreen />

              <div className="profileScreen__dataRow">
                <button
                  className="profileScreen__secondary"
                  aria-pressed={kidsMode}
                  onClick={() => {
                    try {
                      setPrefs({ kidsMode: !kidsMode });
                    } catch (e) {
                      // ignore
                    }
                  }}
                >
                  Kids Mode: {kidsMode ? "On" : "Off"}
                </button>
                <button
                  className="profileScreen__secondary"
                  onClick={handleClearList}
                  disabled={myListCount === 0}
                >
                  Clear My List ({myListCount})
                </button>
                <button
                  className="profileScreen__secondary"
                  onClick={handleClearHistory}
                  disabled={continueCount === 0}
                >
                  Clear history ({continueCount})
                </button>
              </div>

              <button
                className="profileScreen__SignOut"
                onClick={handleSignOut}
              >
                {isGuestUser(user) ? "Exit guest mode" : "Sign Out"}
              </button>
              {signOutError && (
                <p className="profileScreen__error" role="alert">
                  {signOutError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ProfileScreen;
