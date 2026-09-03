import React, { useEffect, useState } from "react";
import "./Nav.css";
import logo from "./logo.png";
import { useHistory } from "react-router-dom";
import db from "./firebase";
import { useSelector } from "react-redux";

function Nav() {
  const [show, handleShow] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const history = useHistory();

  const [subscription, setSubscription] = useState(null);
  const user = useSelector((selectUser) => selectUser.counter.user);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        handleShow(true);
      } else handleShow(false);
    });
    return () => {
      // window.removeEventListener("scroll");
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
        // Subscription lookup is optional; ignore offline/missing Firestore data.
      });
  }, [user?.uid]);

  const submitSearch = (e) => {
    if (e) e.preventDefault();
    const q = searchInput.trim();
    history.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <div className={`nav ${show && "nav__black"}`}>
      <img
        onClick={() => history.push("/")}
        className="nav__logo"
        src={logo}
        alt="Aflixs home"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") history.push("/");
        }}
      />

      <form
        className="nav__search"
        role="search"
        aria-label="Site search"
        onSubmit={submitSearch}
      >
        <input
          className="nav__searchInput"
          type="search"
          value={searchInput}
          placeholder="Search titles..."
          aria-label="Search movies and TV shows"
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button
          type="button"
          className="nav__searchButton"
          aria-label="Go to search"
          onClick={() => history.push("/search")}
        >
          Search
        </button>
      </form>

      {subscription?.role && (
        <span className="nav__plan" title="Current plan">
          {subscription.role}
        </span>
      )}
      <img
        onClick={() => history.push("/profile")}
        className="nav__avatar"
        src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
        alt="Your profile"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") history.push("/profile");
        }}
      />
    </div>
  );
}

export default Nav;
