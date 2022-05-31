import React, { useEffect, useState } from "react";
import "./Nav.css";
import logo from "./logo.png";
import { useHistory } from "react-router-dom";
import db from "./firebase";
import { useSelector } from "react-redux";

function Nav() {
  const [show, handleShow] = useState(false);
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
      });
  }, [user.uid]);

  return (
    <div className={`nav ${show && "nav__black"}`}>
      <img
        onClick={() =>
          !subscription ? history.push("/profile") : history.push("/")
        }
        className="nav__logo"
        src={logo}
        alt="aflixLogo"
      />

      <img
        onClick={() => history.push("/profile")}
        className="nav__avatar"
        src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
        alt="smiley"
      />
    </div>
  );
}

export default Nav;
