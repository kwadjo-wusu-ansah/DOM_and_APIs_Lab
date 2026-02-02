import * as storage from "./storage.js";
import {
  createNote,
  deleteNote,
  normalizeNote,
  toggleArchive,
  updateNote,
} from "./noteManager.js";
import { navigateTo, renderAllNotes, renderPage, showToast } from "./ui.js";
import {
  diffTags,
  getDocument,
  getCheckedValue,
  getFormValues,
  hasNoteChanges,
  normalizeTags,
  setCheckedValue,
  openConfirmModal,
  isTagRoute,
  isSearchRoute,
} from "./utils.js";
import {
  applyFont,
  applyTheme,
  normalizeFontSelection,
  normalizeThemeSelection,
} from "./theme.js";

/* this function intializes setting panels behavior */
const initSettingsPanels = (defaultPanelId = "color-theme") => {
  const panels = Array.from(getDocument("queryAll", "[data-settings-panel]"));
  const links = Array.from(getDocument("queryAll", "[data-settings-link]"));
  if (!panels.length || !links.length) return false;

  const panelIds = new Set(panels.map((panel) => panel.id).filter(Boolean));
  const headerTitle = getDocument("query", ".settings-header__title");
  const baseHeaderTitle = headerTitle?.textContent?.trim() || "Settings";

  const setActivePanel = (panelId) => {
    const resolved = panelIds.has(panelId) ? panelId : defaultPanelId;

    panels.forEach((panel) => {
      const isActive = panel.id === resolved;
      panel.hidden = !isActive;
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    links.forEach((link) => {
      const targetId = link.getAttribute("href")?.replace("#", "");
      const item = link.closest(".settings-menu__item");
      if (item) item.classList.toggle("is-active", targetId === resolved);
    });

    if (headerTitle) {
      headerTitle.textContent = baseHeaderTitle;
    }
    return resolved;
  };
  setActivePanel(defaultPanelId);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-settings-link]");
    if (!link) return;

    event.preventDefault();
    const targetId = link.getAttribute("href")?.replace("#", "");
    if (!targetId) return;
    setActivePanel(targetId);
  });

  return true;
};

// this function initializes single page application behavior
const initSpa = (state) => {
  document.addEventListener("click", (event) => {
    const routeEl = event.target.closest("[data-route]");
    if (!routeEl) return;

    event.preventDefault();
    const pageKey = routeEl.getAttribute("data-route");
    if (!pageKey) return;

    navigateTo(pageKey, state);
  });

  const notesNav = getDocument("query", ".sidebar-all-notes__nav");
  if (notesNav) {
    notesNav.addEventListener("click", (event) => {
      const noteItem = event.target.closest("[data-note-id]");
      if (!noteItem) return;

      event.preventDefault();
      const noteId = noteItem.getAttribute("data-note-id");
      if (!noteId) return;

      const targetPage =
        state?.currentPage === "archived-notes" ||
        isTagRoute(state?.currentPage) ||
        isSearchRoute(state?.currentPage)
          ? state.currentPage
          : "all-notes";

      navigateTo(targetPage, state, { noteId });
    });
  }

  const searchInput = getDocument("query", ".page-header__search");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const value = event.target.value ?? "";
      const normalized = normalizeSearchQuery(value);
      if (!normalized) {
        navigateTo("all-notes", state);
        return;
      }
      navigateTo("search", state, { query: normalized });
    });
  }

  renderPage(state?.currentPage || "all-notes", state);
};

// this function initializes the settings page
const initSettingsPage = (prefs) => {
  initSettingsPanels();
  const themeValue = normalizeThemeSelection(prefs.theme);
  const fontValue = normalizeFontSelection(prefs.font);
  setCheckedValue("color-theme", themeValue);
  setCheckedValue("font-theme", fontValue);

  const syncOptionGroup = (groupEl) => {
    if (!groupEl) return;
    const checked = groupEl.querySelector('input[type="radio"]:checked');
    const options = groupEl.querySelectorAll("[data-option]");
    options.forEach((option) => {
      const input = option.querySelector('input[type="radio"]');
      option.classList.toggle(
        "is-selected",
        Boolean(input && checked === input),
      );
    });
  };

  const syncAllOptionGroups = () => {
    getDocument("queryAll", "[data-option-group]").forEach((group) =>
      syncOptionGroup(group),
    );
  };

  syncAllOptionGroups();

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.matches(".settings-option__input")) return;
    syncOptionGroup(target.closest("[data-option-group]"));
  });

  document.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;

    if (actionEl.dataset.action === "apply-theme") {
      const selection = getCheckedValue("color-theme");
      if (!selection) return;
      const current = storage.loadPreferences();
      const next = { ...current, theme: selection };
      storage.savePreferences(next);
      applyTheme(selection);
      return;
    }

    if (actionEl.dataset.action === "apply-font") {
      const selection = getCheckedValue("font-theme");
      if (!selection) return;
      const current = storage.loadPreferences();
      const next = { ...current, font: selection };
      storage.savePreferences(next);
      applyFont(selection);
    }
  });
};

// this is the main initialization function
const init = async () => {
  const prefs = storage.loadPreferences();
  applyTheme(prefs.theme);
  applyFont(prefs.font);

  if (getDocument("query", ".settings-page")) {
    initSettingsPage(prefs);
    return;
  }
  if (!getDocument("query", ".layout")) {
    return;
  }

  try {
    const res = await fetch("./data.json");
    const data = await res.json();
    storage.seedNotesOnce(data);
  } catch (err) {
    console.error("Failed to load starter data:", err);
  }

  const notes = storage.loadNotes().map((note) => normalizeNote(note));
  renderAllNotes(notes, { activeNoteId: notes[0]?.id || null });

  const state = {
    notes,
    activeNoteId: notes[0]?.id || null,
    currentPage: "all-notes",
  };

  initSpa(state);

  document.addEventListener("click", (event) => {
    const saveButton = event.target.closest(".buttons-section__btn--primary");
    const cancelButton = event.target.closest(
      ".buttons-section__btn--secondary",
    );

    if (!saveButton && !cancelButton) return;

    event.preventDefault();

    if (saveButton) {
      const values = getFormValues();

      if (state.currentPage === "create-note") {
        if (!values.title && !values.content && values.tags.length === 0)
          return;

        const newNote = createNote(values.title, values.content, values.tags);
        state.notes = [newNote, ...state.notes];
        state.activeNoteId = newNote.id;

        const result = storage.saveNotes(state.notes);
        if (!result.ok) {
          console.error(result.error || "Could not save note.");
          return;
        }

        renderAllNotes(state.notes, { activeNoteId: state.activeNoteId });
        navigateTo("all-notes", state, { noteId: newNote.id });
        showToast("note-saved");
        if (normalizeTags(values.tags).length) {
          showToast("tag-added");
        }
        return;
      }

      if (state.currentPage === "all-notes" || state.currentPage === "search") {
        const activeNote = state.notes.find(
          (note) => note.id === state.activeNoteId,
        );
        if (!activeNote) return;

        if (!hasNoteChanges(activeNote, values)) {
          renderPage(state.currentPage, state);
          return;
        }

        const { added, removed } = diffTags(activeNote.tags, values.tags);

        state.notes = updateNote(state.notes, activeNote.id, {
          title: values.title,
          content: values.content,
          tags: values.tags,
        });

        const result = storage.saveNotes(state.notes);
        if (!result.ok) {
          console.error(result.error || "Could not update note.");
          return;
        }

        renderPage(state.currentPage, state);
        showToast("note-saved");
        if (added.length) showToast("tag-added");
        if (removed.length) showToast("tag-removed");
      }
    }

    if (cancelButton) {
      if (state.currentPage === "create-note") {
        navigateTo("all-notes", state, { noteId: state.activeNoteId });
        return;
      }

      if (state.currentPage === "all-notes" || state.currentPage === "search") {
        renderPage(state.currentPage, state);
      }
    }
  });

  document.addEventListener("click", async (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;

    event.preventDefault();

    const action = actionEl.dataset.action;
    const activeNote = state.notes.find(
      (note) => note.id === state.activeNoteId,
    );
    if (!activeNote) return;

    if (action === "archive") {
      const confirmed = await openConfirmModal({
        variant: "archive",
        title: "Archive Note",
        description:
          "Are you sure you want to archive this note? You can find it in the Archived Notes section and restore it anytime.",
        confirmText: "Archive Note",
      });
      if (!confirmed) return;

      state.notes = toggleArchive(state.notes, activeNote.id);
      const result = storage.saveNotes(state.notes);
      if (!result.ok) {
        console.error(result.error || "Could not archive note.");
        return;
      }

      renderPage(state.currentPage, state);
      showToast("note-archived");
      return;
    }

    if (action === "restore") {
      state.notes = toggleArchive(state.notes, activeNote.id);
      const result = storage.saveNotes(state.notes);
      if (!result.ok) {
        console.error(result.error || "Could not restore note.");
        return;
      }

      renderPage(state.currentPage, state);
      showToast("note-restored");
      return;
    }

    if (action === "delete") {
      const confirmed = await openConfirmModal({
        variant: "delete",
        title: "Delete Note",
        description:
          "Are you sure you want to permanently delete this note? This action cannot be undone.",
        confirmText: "Delete Note",
      });
      if (!confirmed) return;

      state.notes = deleteNote(state.notes, activeNote.id);
      if (state.activeNoteId === activeNote.id) {
        state.activeNoteId = null;
      }

      const result = storage.saveNotes(state.notes);
      if (!result.ok) {
        console.error(result.error || "Could not delete note.");
        return;
      }

      renderPage(state.currentPage, state);
      showToast("note-deleted");
    }
  });
};

init();
