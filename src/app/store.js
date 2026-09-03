// import { configureStore } from '@reduxjs/toolkit';
// import counterReducer from '../features/counter/counterSlice';

// export const store = configureStore({
//   reducer: {
//     counter: counterReducer,
//   },
// });
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/userSlice";
import myListReducer from "../features/myListSlice";

export const store = configureStore({
  reducer: {
    counter: userReducer,
    myList: myListReducer,
  },
});
