import React, { useEffect, useState } from "react";
import "./ProfileScreen.css";
import Nav from "../Nav";
import PlanScreen from "./PlanScreen";

import { useSelector } from "react-redux";

import db, { auth } from "../firebase";

function ProfileScreen() {
  const [subscription, setSubscription] = useState(null);
  const user = useSelector((selectUser) => selectUser.counter.user);

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
    <div className="profileScreen">
      <Nav />
      <div className="profileScreen__body">
        <h1>Edit Profile</h1>
        <div className="profileScreen__info">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
            alt=""
          />
          <div className="profileScreen__details">
            <h2>{user.email}</h2>

            <div className="profileScreen__plans">
              <h3>
                Current Plan:{" "}
                {subscription
                  ? `${subscription.role}`
                  : "Choose a plan below to start watching."}
              </h3>
              <PlanScreen />

              <button
                className="profileScreen__SignOut"
                onClick={() => auth.signOut()}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;
