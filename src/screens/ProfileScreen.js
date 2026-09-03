import React, { useEffect, useState } from "react";
import "./ProfileScreen.css";
import Nav from "../Nav";
import Footer from "../Footer";
import PlanScreen from "./PlanScreen";
import ProfileSwitcher from "../ProfileSwitcher";

import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { clearList, selectMyListCount } from "../features/myListSlice";
import { getContinueWatching, clearContinueWatching } from "../utils/continueWatching";
import { getPrefs, setPrefs, onPrefsChanged } from "../utils/prefs";

import db, { auth } from "../firebase";

function ProfileScreen() {
  const [subscription, setSubscription] = useState(null);
  const [signOutError, setSignOutError] = useState("");
  const user = useSelector((selectUser) => selectUser.counter.user);
  const myListCount = useSelector(selectMyListCount);
  const dispatch = useDispatch();
  const [continueCount, setContinueCount] = useState(0);
  const [kidsMode, setKidsMode] = useState(() => {
    try {
      return getPrefs().kidsMode;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    let off = () => {};
    try {
      off = onPrefsChanged((p) => setKidsMode(Boolean(p.kidsMode)));
    } catch (e) {
      // ignore
    }
    return off;
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
        <div className="profileScreen__info">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
            alt="Profile avatar"
          />
          <div className="profileScreen__details">
            <h2>{user?.email || "Signed in"}</h2>
            <ProfileSwitcher />
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
                Sign Out
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
