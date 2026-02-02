// storage.js
import {
  DEFAULT_PREFS,
  DRAFT_KEY,
  PREFS_KEY,
  SEEDED_KEY,
  STORAGE_KEY,
  safeParse,
} from "./utils.js";



/*this function saves notes to localStorage */
export const saveNotes = (notes) => {
  try {
    const json = JSON.stringify(Array.isArray(notes) ? notes : []);
    localStorage.setItem(STORAGE_KEY, json);
    return { ok: true };
  } catch (err) {
    console.error("Failed to save notes:", err);

    const quotaLikely =
      err?.name === "QuotaExceededError" ||
      err?.name === "NS_ERROR_DOM_QUOTA_REACHED";

    return {
      ok: false,
      error: quotaLikely
        ? "Storage is full. Delete some notes to free space."
        : "Could not save notes.",
    };
  }
};

/*this function loads notes from localStorage */
export const loadNotes = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
};

// this function seeds notes from data.json only once
export const seedNotesOnce = (dataJson) => {
  try {

    const alreadySeeded = localStorage.getItem(SEEDED_KEY) === "true";

    if (alreadySeeded) return { ok: true, seeded: false };

  
    const existing = loadNotes();

    if (existing.length > 0) {

      localStorage.setItem(SEEDED_KEY, "true");

      return { ok: true, seeded: false };
    }

    const seed = Array.isArray(dataJson?.notes) ? dataJson.notes : [];

    const result = saveNotes(seed);

    if (!result.ok) return { ok: false, error: result.error };


    localStorage.setItem(SEEDED_KEY, "true");
    return { ok: true, seeded: true };
  } catch (err) {
    console.error("Failed to seed notes:", err);
    return { ok: false, error: "Could not seed starter notes." };
  }
};

/*this function saves preferences to localStorage */
export const savePreferences = (prefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs ?? {}));
    return { ok: true };
  } catch (err) {
    console.error("Failed to save preferences:", err);
    return { ok: false, error: "Could not save preferences." };
  }
};

/*this function loads preferences from localStorage */
export const loadPreferences = () => {
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return DEFAULT_PREFS;

  const saved = safeParse(raw, {});
  return { ...DEFAULT_PREFS, ...saved };
};

/*this function saves draft to session storage*/
export const saveDraft = (draft) => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft ?? {}));
  } catch (err) {
    console.error("Failed to save draft:", err);
  }
};

/*this function loads draft from session storage*/
export const loadDraft = () => {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  return safeParse(raw, null);
};


/*this function clears draft from session storage*/
export const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.error("Failed to clear draft:", err);
  }
};
