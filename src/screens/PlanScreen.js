import React, { useEffect } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import db from "../firebase";
import "./PlanScreen.css";
import { loadStripe } from "@stripe/stripe-js";

function PlanScreen() {
  // Pulling the Products/ plans from the database
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const user = useSelector((selectUser) => selectUser.counter.user);

  //   FEtching the products table
  useEffect(() => {
    db.collection("products")
      .where("active", "==", true)
      .get()
      .then((querySnapshot) => {
        //   create empty product object
        const products = {};
        // implement the query to capture documents
        querySnapshot.forEach(async (productDoc) => {
          products[productDoc.id] = productDoc.data();
          const priceSnap = await productDoc.ref.collection("prices").get();

          //   console.log("priceSnap", priceSnap);
          priceSnap.docs.forEach((priceDoc) => {
            products[productDoc.id].prices = {
              priceId: priceDoc.id,
              priceData: priceDoc.data(),
            };
          });
        });
        setProducts(products);
      });
  }, []);

  //   console.log("Products>>", products);

  // Fetching the current user's table
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

  console.log("Current subscription>>>", subscription);

  //   implementing checkout sessions
  const loadCheckout = async (priceId) => {
    const docRef = await db
      .collection("customers")
      .doc(user.uid)
      .collection("checkout_sessions")
      .add({
        //   price, Success URL, Cancel URL
        price: priceId,
        success_url: window.location.origin,
        cancel_url: window.location.origin,
      });
    //   getting the database snapshot
    docRef.onSnapshot(async (snap) => {
      const { error, sessionId } = snap.data();

      if (error) {
        //   Show an error to the customer
        // Inspect your cloud function logs in the firebase console
        alert(`Error: ${error.message}`);
      }

      if (sessionId) {
        // We have a session, let's redirect to checkout
        // Initialize Stripe

        const stripe = await loadStripe(
          "pk_test_51J2ZuuJg8RB2MAY0DPaDf4g02lOSYfpMxLhzFsigsMrh0syuYT3cQAN7uUyGtHpHTJr1nQ8HYC88KTbZlRcIiTnF00fnnAax8q"
        );
        stripe.redirectToCheckout({ sessionId });
      }
    });
  };

  return (
    <div className="planScreen">
      {/* Showing the objects pulled out from database */}
      {subscription && (
        <p>
          Renewal date:{" "}
          {new Date(
            subscription?.current_period_end * 1000
          ).toLocaleDateString()}
        </p>
      )}
      {Object.entries(products).map(([productId, productData]) => {
        // Logic to check if the user's subscription is active
        const isCurrentPlan = productData.name
          ?.toLowerCase()
          .includes(subscription?.role);

        return (
          <div
            key={productId}
            className={`${
              isCurrentPlan && "planScreen__plans--disabled"
            } planScreen__plans`}
          >
            <div className="planScreen__info">
              <h5>{productData.name}</h5>
              <h6>{productData.description}</h6>
            </div>
            <button
              disabled={isCurrentPlan}
              // Do not load checkout if it is the current package you are clicking
              onClick={() => loadCheckout(productData.prices.priceId)}
            >
              {isCurrentPlan ? "Current Plan" : "Subscribe"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default PlanScreen;
