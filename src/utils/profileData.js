// Central helper: switch profile + reload all profile-scoped UI state.
// Ratings / recently-viewed / downloads / notifications utils read the active
// profile lazily and already listen for "aflixs:profile-switched"; My List
// lives in Redux so it needs an explicit reload, and continue-watching rows
// refresh off the changed event below.

import { switchProfile } from "./profiles";
import { loadListForProfile, setList } from "../features/myListSlice";

export function activateProfile(dispatch, id) {
  const next = switchProfile(id);
  if (dispatch) {
    try {
      dispatch(setList(loadListForProfile()));
    } catch (e) {
      // ignore
    }
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:continue-watching-changed"));
    window.dispatchEvent(new CustomEvent("aflixs:ratings-changed"));
    window.dispatchEvent(new CustomEvent("aflixs:recently-viewed-changed"));
    window.dispatchEvent(new CustomEvent("aflixs:downloads-changed"));
    window.dispatchEvent(new CustomEvent("aflixs:notifications-changed"));
  } catch (e) {
    // ignore
  }
  return next;
}
