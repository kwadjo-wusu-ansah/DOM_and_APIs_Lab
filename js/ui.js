import { getAllTags, searchNotes } from "./noteManager.js";
import {
  buildAllNotesContent,
  buildCreateNoteContent,
  chevronSvg,
  createSidebarTagIcon,
  createToastElement,
  getActiveNote,
  getDocument,
  getNotesForRoute,
  getTagFromRoute,
  getToastContainer,
  isSearchRoute,
  isTagRoute,
  normalizeSearchQuery,

  pages,
  renderCreatePlaceholderNote,
  renderEmptyStateNote,
  renderRightMenu,
  resolveActiveNoteId,
  resolvePageKey,
  setHeaderTitle,
  setSearchInputValue,
  setSidebarInfo,
  toastDefinitions,
} from "./utils.js";

/*this function shows a toast notification */
export const showToast = (type, options = {}) => {
  const definition = toastDefinitions[type] || {};
  const message = options.message || definition.message || String(type);
  const action =
    options.action === undefined ? definition.action : options.action;
  const duration =
    typeof options.duration === "number" ? options.duration : 4000;

  const container = getToastContainer();
  if (!container) return null;

  const toast = createToastElement({ message, action });
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  let timeoutId = null;

  const dismiss = () => {
    if (!toast.isConnected) return;
    toast.classList.remove("is-visible");
    toast.classList.add("is-exiting");
    if (timeoutId) window.clearTimeout(timeoutId);

    const removeToast = () => {
      if (toast.isConnected) toast.remove();
    };
    toast.addEventListener("transitionend", removeToast, { once: true });
    window.setTimeout(removeToast, 220);
  };


  if (duration > 0) {
    timeoutId = window.setTimeout(dismiss, duration);
  }

  const closeButton = toast.querySelector("[data-toast-close]");
  if (closeButton) {
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      dismiss();
    });
  }

  const actionLink = toast.querySelector("[data-toast-action]");
  if (actionLink) {
    actionLink.addEventListener("click", () => {
      dismiss();
    });
  }

  return toast;
};

/*this function renders a single note in the sidebar navigation */
export const renderNote = (note, { isActive = false } = {}) => {
  const navDiv = getDocument("class", "sidebar-all-notes__nav")?.[0];
  if (!navDiv) {
    console.error("Notes nav container not found: .sidebar-all-notes__nav");
    return;
  }

  const tagsHTML = Array.isArray(note.tags)
    ? note.tags
        .map(
          (tag) => `
        <div class="sidebar-all-notes__tags">
          <p class="sidebar-all-notes__tags-text">${tag}</p>
        </div>`,
        )
        .join("")
    : "";

  // Use data-note-id so event delegation can find the note later
  const noteTemplate = `
    <li class="sidebar-all-notes__item${
      isActive ? " is-active" : ""
    }" data-note-id="${note.id}">
      <a href="#" class="sidebar-all-notes__link">
        <p class="sidebar-all-notes__item-title">${note.title}</p>

        <div class="sidebar-all-notes__note-item-tags">
          ${tagsHTML}
        </div>

        <p class="sidebar-all-notes__note-item-date">${note.lastEdited}</p>
      </a>
    </li>
    <hr class="sidebar-all-notes__nav-divider" />
  `;

  navDiv.insertAdjacentHTML("beforeend", noteTemplate);
};

/*this function renders all notes in the sidebar navigation */
export const renderAllNotes = (
  notes,
  {
    activeNoteId = null,
    showTopDivider = false,
    includeCreatePlaceholder = false,
    emptyState = null,
  } = {},
) => {
  const navDiv = getDocument("class", "sidebar-all-notes__nav")?.[0];
  if (!navDiv) {
    console.error("Notes nav container not found: .sidebar-all-notes__nav");
    return;
  }

  // Clear first to avoid duplicates
  navDiv.innerHTML = "";

  if (showTopDivider && notes.length) {
    navDiv.insertAdjacentHTML(
      "beforeend",
      '<hr class="sidebar-all-notes__nav-divider" />',
    );
  }

  if (!notes.length && emptyState && !includeCreatePlaceholder) {
    renderEmptyStateNote(emptyState, { navDiv });
    return;
  }

  if (includeCreatePlaceholder) {
    renderCreatePlaceholderNote("Untitled Note", { navDiv });
  }

  for (const note of notes) {
    renderNote(note, { isActive: note.id === activeNoteId });
  }
};


//this function sets active navigation item based on route
export function setActiveNavByRoute(route) {
  const resolvedRoute = route === "create-note" ? "all-notes" : route;
  const items = getDocument("queryAll", ".sidebar-navigation__item");

  items.forEach((li) => {
    const link = li.querySelector("[data-route]");
    const liRoute = link?.dataset?.route;

    li.classList.toggle("is-active", liRoute === resolvedRoute);
  });
}

// this function shows validation error for a form field
export const showValidationError = (field, message) => {
  // Basic pattern: assume you have an error element like:
  // <p class="form-error" data-field="title"></p>
  const el = getDocument("query", `[data-error-for="${field}"]`);

  if (!el) return;

  el.classList.add("text-box--error");
  el.textContent = message;
  el.classList.toggle("is-visible", Boolean(message));
};

// this function updates the tag list in the sidebar
export const updateTagList = (tags) => {
  const tagListEl = getDocument("query", ".sidebar-navigation__tags-list");
  if (!tagListEl) {
    // If you haven't made this container yet, we avoid crashing.
    console.warn(
      "Tag list container not found. Add .tags-sidebar__list to your HTML for tag filters.",
    );
    return;
  }

  const unique = Array.from(
    new Set((tags ?? []).map((t) => String(t).trim()).filter(Boolean)),
  );

  const tagIcon = createSidebarTagIcon();

  tagListEl.innerHTML = unique
    .map(
      (tag) => `
      <li class="sidebar-navigation__item">
        <a href="#" class="sidebar-navigation_link-tag" data-route="tag-${tag}">
            ${tagIcon.outerHTML}
            <p class="sidebar-navigation__item-title">${tag}</p>
            ${chevronSvg}
        </a>
      </li>
      
      `,
    )
    .join("");
};



// this function toggles archived notes view
export const toggleArchiveView = (notes) => {
  const archivedNotes = notes.filter((note) => note.archived);
  renderAllNotes(archivedNotes);
};


// this function renders the page based on the current route
export const renderPage = (pageKey, state) => {
  const resolvedKey = resolvePageKey(pageKey);
  const page = pages[resolvedKey] || pages["all-notes"];
  if (state) state.currentPage = resolvedKey;

  const searchQuery = isSearchRoute(resolvedKey)
    ? normalizeSearchQuery(state?.searchQuery ?? "")
    : "";
  if (state) {
    state.searchQuery = isSearchRoute(resolvedKey) ? searchQuery : "";
  }

  const notesForRoute = getNotesForRoute(state, resolvedKey, {
    query: searchQuery,
    searchFn: searchNotes,
  });
  const isCreateMode = page?.mode === "create";
  const isArchivedMode = page?.mode === "archived";
  const isSearchMode = page?.mode === "search";
  const hasNotes = notesForRoute.length > 0;
  const nextActiveId = isCreateMode
    ? (state?.activeNoteId ?? null)
    : resolveActiveNoteId(notesForRoute, state);
  if (!isCreateMode && state) state.activeNoteId = nextActiveId;

  const container = getDocument("query", ".note-content");
  if (!container) {
    console.error("Note content container not found: .note-content");
    return;
  }

  container.classList.toggle("note-content--create", isCreateMode);
  document.body.classList.toggle("is-create", isCreateMode);
  document.body.classList.toggle("is-archived", isArchivedMode);
  document.body.classList.toggle("is-empty", !hasNotes && !isCreateMode);

  if (isTagRoute(resolvedKey)) {
    setHeaderTitle({
      mutedPrefix: "Notes Tagged:",
      highlight: getTagFromRoute(resolvedKey),
    });
    setSidebarInfo({ mode: "tag", tag: getTagFromRoute(resolvedKey) });
  } else if (isSearchMode) {
    setHeaderTitle({
      mutedPrefix: "Showing results for:",
      highlight: searchQuery,
    });
    setSidebarInfo({ mode: "search", query: searchQuery });
  } else if (page?.mode === "archived") {
    setHeaderTitle({ title: page.title });
    setSidebarInfo({ mode: "archived" });
  } else {
    setHeaderTitle({ title: page?.title });
    setSidebarInfo();
  }

  updateTagList(getAllTags(state?.notes || []));
  setActiveNavByRoute(resolvedKey);
  const pageSearchInput = getDocument("query", ".page-header__search");
  if (!isSearchMode) {
    setSearchInputValue("");
  } else if (document.activeElement !== pageSearchInput) {
    setSearchInputValue(searchQuery);
  }
  const activeNote = !isCreateMode ? getActiveNote(state, notesForRoute) : null;
  const rightMenuMode = isCreateMode
    ? "create"
    : !hasNotes
      ? "empty"
      : isArchivedMode || activeNote?.archived
        ? "archived"
        : "default";

  renderRightMenu(rightMenuMode);
  const emptyStateVariant =
    !hasNotes && !isCreateMode
      ? isArchivedMode
        ? "archived"
        : isSearchMode
          ? "search"
          : resolvedKey === "all-notes"
            ? "all"
            : null
      : null;

  renderAllNotes(notesForRoute, {
    activeNoteId: isCreateMode ? null : nextActiveId,
    showTopDivider: page?.mode === "archived",
    includeCreatePlaceholder: isCreateMode,
    emptyState: emptyStateVariant,
  });

  container.innerHTML = "";

  if (page?.mode === "create") {
    buildCreateNoteContent(container);
    return;
  }

  if (!activeNote) return;

  buildAllNotesContent(container, activeNote);
};

// this function navigates to a different page/route
export const navigateTo = (pageKey, state, options = {}) => {
  const nextPage = resolvePageKey(pageKey);
  if (state) state.currentPage = nextPage;
  if (options.noteId && state) state.activeNoteId = options.noteId;
  if (options.query !== undefined && state) {
    state.searchQuery = normalizeSearchQuery(options.query);
  } else if (nextPage !== "search" && state) {
    state.searchQuery = "";
  }
  renderPage(nextPage, state);
};

