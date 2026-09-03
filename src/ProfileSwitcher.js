import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getProfiles,
  getActiveProfileId,
  createProfile,
  deleteProfile,
  onProfilesChanged,
  MAX_PROFILES,
} from "./utils/profiles";
import { activateProfile } from "./utils/profileData";
import "./ProfileSwitcher.css";

function ProfileSwitcher({ compact }) {
  const dispatch = useDispatch();
  const [profiles, setProfiles] = useState(() => {
    try {
      return getProfiles();
    } catch (e) {
      return [];
    }
  });
  const [activeId, setActiveId] = useState(() => {
    try {
      return getActiveProfileId();
    } catch (e) {
      return "";
    }
  });
  const [newName, setNewName] = useState("");

  const refresh = useCallback(() => {
    try {
      setProfiles(getProfiles());
      setActiveId(getActiveProfileId());
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();
    let off = () => {};
    try {
      off = onProfilesChanged(refresh);
    } catch (e) {
      // ignore
    }
    return off;
  }, [refresh]);

  const handleSwitch = (id) => {
    try {
      activateProfile(dispatch, id);
    } catch (e) {
      // ignore
    }
    refresh();
  };

  const handleAdd = (e) => {
    if (e) e.preventDefault();
    const name = newName.trim().slice(0, 16);
    if (!name || profiles.length >= MAX_PROFILES) return;
    try {
      const next = createProfile(name);
      setProfiles(next);
      setNewName("");
    } catch (err) {
      // ignore
    }
  };

  const handleDelete = (id) => {
    if (profiles.length <= 1) return;
    try {
      const next = deleteProfile(id);
      setProfiles(next);
      activateProfile(dispatch, getActiveProfileId());
    } catch (e) {
      // ignore
    }
    refresh();
  };

  return (
    <div className={`profileSwitcher ${compact ? "compact" : ""}`}>
      <div className="profileSwitcher__row" role="group" aria-label="Switch profile">
        {profiles.map((p) => (
          <button
            key={p.id}
            className={`profileSwitcher__avatar ${p.id === activeId ? "active" : ""}`}
            style={{ background: p.color }}
            onClick={() => handleSwitch(p.id)}
            aria-pressed={p.id === activeId}
            aria-label={`Switch to ${p.name}`}
            title={p.name}
          >
            {p.name.slice(0, 1).toUpperCase()}
            {profiles.length > 1 && p.id === activeId && (
              <span className="profileSwitcher__check" aria-hidden="true">✓</span>
            )}
          </button>
        ))}
      </div>
      <div className="profileSwitcher__names">
        {profiles.map((p) => (
          <span key={p.id} className={p.id === activeId ? "active" : ""}>
            {p.name}
          </span>
        ))}
      </div>
      {profiles.length > 1 && (
        <div className="profileSwitcher__manage">
          {profiles
            .filter((p) => p.id !== activeId)
            .map((p) => (
              <button key={p.id} onClick={() => handleDelete(p.id)} aria-label={`Remove ${p.name}`}>
                Remove {p.name}
              </button>
            ))}
        </div>
      )}
      {profiles.length < MAX_PROFILES && (
        <form className="profileSwitcher__add" onSubmit={handleAdd}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Add profile (${profiles.length}/${MAX_PROFILES})`}
            aria-label="New profile name"
            maxLength={16}
          />
          <button type="submit" disabled={!newName.trim()}>
            Add
          </button>
        </form>
      )}
    </div>
  );
}

export default ProfileSwitcher;
