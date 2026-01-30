export const STORAGE_KEY = "notes";
export const PREFS_KEY = "prefs";
export const DRAFT_KEY = "draft";
export const SEEDED_KEY = "seeded_v1";

export const DEFAULT_PREFS = {
  theme: "dark",
  font: "sans",
};

/*This function safely parses JSON, returning a fallback value if parsing fails */
export function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return fallback;
  }
}

/*This function formats a date in the format "29 Oct 2024" */
export function formatDate(d = new Date()) {
  // "29 Oct 2024"
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(",", "");
}

/*This function generates a unique note ID */
export function generateNoteId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/*This function parses a comma-separated string of tags into an array of trimmed, non-empty strings */
export function parseTags(raw) {
  let cleanRaw = String(raw ?? "").split(",");

  cleanRaw = cleanRaw.map((tag) => tag.trim()).filter(Boolean);

  return cleanRaw;
}

/**/
export function getInputValue(selector) {
  const element = document.querySelector(selector);
  if (!element || !("value" in element)) return "";
  return element.value;
}

export function getFormValues() {
  const title = getInputValue("[data-note-title]").trim();
  const content = getInputValue("[data-note-content]");
  const tags = parseTags(getInputValue("[data-note-tags]"));
  return { title, content, tags };
}

export function tagsKey(tags) {
  return (Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .join("|");
}

export function hasNoteChanges(note, nextValues) {
  if (!note) return false;

  if ((note.title ?? "") !== nextValues.title) return true;

  if ((note.content ?? "") !== nextValues.content) return true;

  return tagsKey(note.tags) !== tagsKey(nextValues.tags);
}

export function normalizeTags(tags) {
  //if not array => make it an array
  let tagsArray = Array.isArray(tags) ? tags : [];

  //trim each tag
  tagsArray = tagsArray.map((tag) => String(tag).trim());

  // remove empty tags
  tagsArray = tagsArray.filter(Boolean);

  return tagsArray;
}

export function diffTags(prevTags, nextTags) {
  const prevTagsNormalized = normalizeTags(prevTags);
  const nextTagsNormalized = normalizeTags(nextTags);

  const prevTagsLowerCase = prevTagsNormalized.map((tag) => tag.toLowerCase());
  const newTagsLowerCase = nextTagsNormalized.map((tag) => tag.toLowerCase());

  const prev = new Set(prevTagsLowerCase);
  const next = new Set(newTagsLowerCase);

  const added = Array.from(next).filter((tag) => !prev.has(tag));
  const removed = Array.from(prev).filter((tag) => !next.has(tag));

  return { added, removed };
}

export const getDocument = (selector, name) => {
  if (selector === "id") return document.getElementById(name);
  if (selector === "class") return document.getElementsByClassName(name);
  if (selector === "tag") return document.getElementsByTagName(name);
  if (selector === "query") return document.querySelector(name);
  if (selector === "queryAll") return document.querySelectorAll(name);

  console.error(`Invalid selector type: ${selector}`);
  return null;
};

export const toastDefinitions = {
  "note-saved": {
    message: "Note saved successfully!",
  },
  "note-archived": {
    message: "Note archived.",
    action: {
      label: "Archived Notes",
      route: "archived-notes",
    },
  },
  "note-deleted": {
    message: "Note permanently deleted.",
  },
  "note-restored": {
    message: "Note restored to active notes.",
    action: {
      label: "All Notes",
      route: "all-notes",
    },
  },
  "settings-updated": {
    message: "Settings updated successfully!",
  },
  "password-changed": { 
    message: "Password changed successfully!" 
  },
  "tag-added": {
    message: "Tag added successfully!",
  },
  "tag-removed": {
    message: "Tag removed successfully!",
  },
};

export const toastCheckmarkSvg = `
  <svg
    class="toast__checkmark-icon"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      fill-rule="evenodd"
      d="m15.993 10.222-4.618 4.618a.746.746 0 0 1-1.061 0l-2.309-2.309a.75.75 0 0 1 1.06-1.061l1.78 1.779 4.087-4.088a.75.75 0 1 1 1.061 1.061ZM12 2.5c-5.238 0-9.5 4.262-9.5 9.5 0 5.239 4.262 9.5 9.5 9.5s9.5-4.261 9.5-9.5c0-5.238-4.262-9.5-9.5-9.5Z"
      clip-rule="evenodd"
    />
  </svg>
`;

export const toastCloseSvg = `
  <svg
    class="toast__close-icon"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="m6 6 12 12M18 6 6 18"
    />
  </svg>
`;

export const getToastContainer = () => {
  let container = document.querySelector("[data-toast-container]");
  if (container) return container;

  container = document.createElement("div");
  container.className = "toast-container";
  container.setAttribute("data-toast-container", "");
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "false");
  document.body.appendChild(container);
  return container;
};

export const createToastElement = ({ message, action } = {}) => {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");

  const left = document.createElement("div");
  left.className = "toast__left";
  left.insertAdjacentHTML("beforeend", toastCheckmarkSvg);

  const text = document.createElement("p");
  text.className = "toast__text";
  text.textContent = message;
  left.appendChild(text);

  const right = document.createElement("div");
  right.className = "toast__right";

  if (action?.label && action?.route) {
    const viewLink = document.createElement("a");
    viewLink.className = "toast__view-link";
    viewLink.setAttribute("href", "#");
    viewLink.textContent = action.label;
    viewLink.setAttribute("data-route", action.route);
    viewLink.setAttribute("data-toast-action", "");
    right.appendChild(viewLink);
  }

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "toast__close-link";
  closeButton.setAttribute("aria-label", "Dismiss notification");
  closeButton.setAttribute("data-toast-close", "");
  closeButton.insertAdjacentHTML("beforeend", toastCloseSvg);
  right.appendChild(closeButton);

  toast.append(left, right);
  return toast;
};

let modalResolve = null;
let modalCleanup = null;

export const getModalElements = () => {
  const overlay = document.querySelector("[data-modal-overlay]");
  if (!overlay) return null;

  return {
    overlay,
    modal: overlay.querySelector(".modal"),
    titleEl: overlay.querySelector("[data-modal-title]"),
    descriptionEl: overlay.querySelector("[data-modal-description]"),
    confirmButton: overlay.querySelector("[data-modal-confirm]"),
    cancelButton: overlay.querySelector("[data-modal-cancel]"),
    deleteIcon: overlay.querySelector('[data-modal-icon="delete"]'),
    archiveIcon: overlay.querySelector('[data-modal-icon="archive"]'),
  };
};

export const closeConfirmModal = (result = false) => {
  const nodes = getModalElements();
  if (!nodes?.overlay) return;

  nodes.overlay.hidden = true;
  nodes.overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");

  if (modalCleanup) {
    modalCleanup();
    modalCleanup = null;
  }

  if (modalResolve) {
    modalResolve(result);
    modalResolve = null;
  }
};

export const openConfirmModal = ({
  title = "",
  description = "",
  confirmText = "Confirm",
  variant = "archive",
} = {}) => {
  const nodes = getModalElements();
  if (!nodes?.overlay || !nodes.modal) return Promise.resolve(false);

  if (modalCleanup) modalCleanup();

  nodes.modal.dataset.variant = variant;
  if (nodes.titleEl) nodes.titleEl.textContent = title;
  if (nodes.descriptionEl) nodes.descriptionEl.textContent = description;
  if (nodes.confirmButton) nodes.confirmButton.textContent = confirmText;

  nodes.overlay.hidden = false;
  nodes.overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");

  const onCancel = () => closeConfirmModal(false);
  const onConfirm = () => closeConfirmModal(true);
  const onOverlayClick = (event) => {
    if (event.target === nodes.overlay) closeConfirmModal(false);
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape") closeConfirmModal(false);
  };

  nodes.cancelButton?.addEventListener("click", onCancel);
  nodes.confirmButton?.addEventListener("click", onConfirm);
  nodes.overlay.addEventListener("click", onOverlayClick);
  window.addEventListener("keydown", onKeyDown);

  modalCleanup = () => {
    nodes.cancelButton?.removeEventListener("click", onCancel);
    nodes.confirmButton?.removeEventListener("click", onConfirm);
    nodes.overlay.removeEventListener("click", onOverlayClick);
    window.removeEventListener("keydown", onKeyDown);
  };

  nodes.confirmButton?.focus();

  return new Promise((resolve) => {
    modalResolve = resolve;
  });
};

export const createSvgElement = (tag, attributes = {}) => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attributes).forEach((key) => {
    el.setAttribute(key, attributes[key]);
  });
  return el;
};

export const createIcon = (svgAttributes, pathAttributes) => {
  const svg = createSvgElement("svg", svgAttributes);
  pathAttributes.forEach((attrs) => {
    const path = createSvgElement("path", attrs);
    svg.appendChild(path);
  });
  return svg;
};

export const createTagIcon = () =>
  createIcon(
    {
      class: "note-content__item-icon-stroke",
      width: "20",
      height: "20",
      fill: "none",
      viewBox: "0 0 24 24",
    },
    [
      {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": "1.8",
        d: "M3.016 5.966c.003-1.411 1.07-2.677 2.456-2.916.284-.05 3.616-.042 4.995-.041 1.364 0 2.527.491 3.49 1.452 2.045 2.042 4.088 4.085 6.128 6.13 1.208 1.21 1.224 3.066.022 4.28a805.496 805.496 0 0 1-5.229 5.228c-1.212 1.201-3.069 1.186-4.279-.022-2.064-2.058-4.127-4.115-6.182-6.182-.795-.8-1.264-1.766-1.368-2.895-.084-.903-.035-4.26-.033-5.034Z",
        "clip-rule": "evenodd",
      },
      {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": "1.8",
        d: "M9.907 8.315a1.607 1.607 0 0 1-1.61 1.583c-.872-.002-1.599-.73-1.594-1.596a1.604 1.604 0 0 1 1.633-1.607c.864.003 1.575.736 1.571 1.62Z",
        "clip-rule": "evenodd",
      },
    ],
  );

export const createDateIcon = () =>
  createIcon(
    {
      class: "note-content__item-icon-fill",
      width: "24",
      height: "24",
      fill: "none",
      viewBox: "0 0 24 24",
    },
    [
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M12.2505 3.75C7.69378 3.75 4.00049 7.44329 4.00049 12C4.00049 16.5558 7.69384 20.25 12.2505 20.25C16.8072 20.25 20.5005 16.5558 20.5005 12C20.5005 7.44329 16.8072 3.75 12.2505 3.75ZM2.50049 12C2.50049 6.61487 6.86536 2.25 12.2505 2.25C17.6356 2.25 22.0005 6.61487 22.0005 12C22.0005 17.3841 17.6357 21.75 12.2505 21.75C6.8653 21.75 2.50049 17.3841 2.50049 12Z",
      },
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M11.9224 7.82666C12.3366 7.82666 12.6724 8.16245 12.6724 8.57666V12.2493L15.4819 13.9283C15.8375 14.1408 15.9535 14.6013 15.741 14.9569C15.5285 15.3124 15.068 15.4284 14.7124 15.2159L11.5376 13.3186C11.3111 13.1832 11.1724 12.9388 11.1724 12.6748V8.57666C11.1724 8.16245 11.5082 7.82666 11.9224 7.82666Z",
      },
    ],
  );

export const createSidebarTagIcon = () =>
  createIcon(
    {
      class: "sidebar-navigation__item-icon-stroke",
      width: "20",
      height: "20",
      fill: "none",
      viewBox: "0 0 24 24",
    },
    [
      {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": "1.8",
        d: "M3.016 5.966c.003-1.411 1.07-2.677 2.456-2.916.284-.05 3.616-.042 4.995-.041 1.364 0 2.527.491 3.49 1.452 2.045 2.042 4.088 4.085 6.128 6.13 1.208 1.21 1.224 3.066.022 4.28a805.496 805.496 0 0 1-5.229 5.228c-1.212 1.201-3.069 1.186-4.279-.022-2.064-2.058-4.127-4.115-6.182-6.182-.795-.8-1.264-1.766-1.368-2.895-.084-.903-.035-4.26-.033-5.034Z",
        "clip-rule": "evenodd",
      },
      {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": "1.8",
        d: "M9.907 8.315a1.607 1.607 0 0 1-1.61 1.583c-.872-.002-1.599-.73-1.594-1.596a1.604 1.604 0 0 1 1.633-1.607c.864.003 1.575.736 1.571 1.62Z",
        "clip-rule": "evenodd",
      },
    ],
  );

export const chevronSvg = `
  <svg
    class="sidebar-navigation__item-icon-fill sidebar-navigation__item-chevron"
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      fill-rule="evenodd"
      d="M9.47 7.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06L12.94 12 9.47 8.53a.75.75 0 0 1 0-1.06Z"
      clip-rule="evenodd"
    />
  </svg>
`;

export const isTagRoute = (route) =>
  typeof route === "string" && route.startsWith("tag-");
export const isSearchRoute = (route) => route === "search";

export const getTagFromRoute = (route) => {
  if (!isTagRoute(route)) return "";
  try {
    return decodeURIComponent(route.slice(4));
  } catch (err) {
    return route.slice(4);
  }
};

export const filterNotesByTag = (notes, tag) => {
  const t = String(tag ?? "")
    .trim()
    .toLowerCase();
  if (!t) return notes;

  return notes.filter((note) =>
    Array.isArray(note?.tags)
      ? note.tags.some((x) => String(x).toLowerCase() === t)
      : false,
  );
};

export const normalizeSearchQuery = (query) => String(query ?? "").trim();

export const setSearchInputValue = (value) => {
  const input = document.querySelector(".page-header__search");
  if (!input) return;
  input.value = value ?? "";
};

export const noteContentTemplate = ({ isCreateMode = false } = {}) => `
  <div class="note-content__header-container">
    <input
      class="note-content__title"
      type="text"
      placeholder="Enter a title..."
      data-note-title
    />
  </div>

  <div class="note-content__detail-container">
    <div class="note-content__tag-container">
      <div class="note-content__tag-flex-container" data-tag-flex></div>
      <span id="note-content__tag-input">
        <input
          class="note-content__tag-input"
          type="text"
          placeholder="Add tags separated by commas (e.g. Work, Planning)"
          data-note-tags
        />
      </span>
    </div>

    <div class="note-content__date-container">
      <div class="note-content__date-flex-container" data-date-flex></div>
      <span
        data-last-edited-value
        class="${isCreateMode ? "note-content__last-edited-input" : ""}"
      ></span>
    </div>
  </div>

  <hr class="note-content__divider" />

  <div class="note-content__content-container">
    <textarea
      name="note-content"
      id="note-content__text-area"
      class="note-content__text-area"
      placeholder="Start typing your note here..."
      data-note-content
    ></textarea>
  </div>
  <hr class="note-content__divider note-content__divider--bottom" />
`;

export const createTextSpan = (text, className) => {
  const span = document.createElement("span");
  if (className) span.className = className;
  span.textContent = text;
  return span;
};

export const createButtonsSection = () => {
  const section = document.createElement("div");
  section.className = "buttons-section";

  const saveButton = document.createElement("button");
  saveButton.className = "buttons-section__btn buttons-section__btn--primary";
  saveButton.type = "button";
  saveButton.textContent = "Save Note";

  const cancelButton = document.createElement("button");
  cancelButton.className =
    "buttons-section__btn buttons-section__btn--secondary";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";

  section.appendChild(saveButton);
  section.appendChild(cancelButton);

  return section;
};

export const getSidebarInfoElement = () => {
  const sidebar = document.querySelector(".sidebar-all-notes");
  if (!sidebar) return null;

  let info = sidebar.querySelector("[data-sidebar-info]");
  if (!info) {
    info = document.createElement("p");
    info.setAttribute("data-sidebar-info", "");
    info.className = "sidebar-all-notes__helper-text";
    const nav = sidebar.querySelector(".sidebar-all-notes__nav");
    if (nav) {
      sidebar.insertBefore(info, nav);
    } else {
      sidebar.appendChild(info);
    }
  }
  return info;
};

export const setSidebarInfo = ({ mode, tag, query } = {}) => {
  const info = getSidebarInfoElement();
  if (!info) return;

  if (!mode) {
    info.hidden = true;
    info.textContent = "";
    return;
  }

  info.hidden = false;
  info.replaceChildren();

  if (mode === "archived") {
    info.className = "sidebar-all-notes__helper-text";
    info.textContent =
      "All your archived notes are stored here. You can restore or delete them anytime.";
    return;
  }

  if (mode === "tag") {
    info.className =
      "sidebar-all-notes__helper-text sidebar-all-notes__helper-text--tag";
    info.append('All notes with the "');
    const highlight = document.createElement("span");
    highlight.className = "sidebar-all-notes__helper-highlight";
    highlight.textContent = tag || "";
    info.append(highlight);
    info.append('" tag are shown here.');
    return;
  }

  if (mode === "search") {
    info.className = "sidebar-all-notes__helper-text";
    info.append('All notes matching "');
    const highlight = document.createElement("span");
    highlight.className = "sidebar-all-notes__helper-highlight";
    highlight.textContent = query || "";
    info.append(highlight);
    info.append('" are displayed below.');
  }
};

export const archiveActionMarkup = `
  <li class="sidebar-right-menu__item">
    <a href="#" class="sidebar-right-menu_link" data-action="archive">
      <svg
        class="sidebar-right-menu__item-icon-stroke"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M21 7.782v8.435C21 19.165 18.919 21 15.974 21H8.026C5.081 21 3 19.165 3 16.216V7.782C3 4.834 5.081 3 8.026 3h7.948C18.919 3 21 4.843 21 7.782Z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="m15 14-3.002 3L9 14M11.998 17v-7M20.934 7H3.059"
        />
      </svg>
      <p class="sidebar-right-menu__item-title">Archive Note</p>
    </a>
  </li>
`;

export const restoreActionMarkup = `
  <li class="sidebar-right-menu__item">
    <a href="#" class="sidebar-right-menu_link" data-action="restore">
      <svg
        class="sidebar-right-menu__item-icon-fill"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          fill-rule="evenodd"
          d="M3.708 7.404a.75.75 0 0 1 .983.398l1.316 3.114L9.1 9.608a.75.75 0 0 1 .584 1.382L5.9 12.59a.75.75 0 0 1-.983-.4L3.309 8.387a.75.75 0 0 1 .4-.982Z"
          clip-rule="evenodd"
        />
        <path
          fill-rule="evenodd"
          d="M12.915 5.664c-3.447 0-6.249 2.746-6.335 6.16a.75.75 0 0 1-1.5-.038c.108-4.228 3.575-7.622 7.835-7.622a7.838 7.838 0 0 1 7.835 7.835 7.833 7.833 0 0 1-7.835 7.835 7.843 7.843 0 0 1-6.457-3.384.75.75 0 1 1 1.232-.856 6.343 6.343 0 0 0 5.225 2.74 6.333 6.333 0 0 0 6.335-6.335 6.339 6.339 0 0 0-6.335-6.335Z"
          clip-rule="evenodd"
        />
      </svg>
      <p class="sidebar-right-menu__item-title">Restore Note</p>
    </a>
  </li>
`;

export const deleteActionMarkup = `
  <li class="sidebar-right-menu__item">
    <a href="#" class="sidebar-right-menu_link" data-action="delete">
      <svg
        class="sidebar-right-menu__item-icon-stroke"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="25"
        fill="none"
        viewBox="0 0 24 25"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="m14.852 3.879.818 1.785h2.64c.811 0 1.47.658 1.47 1.47V8.22c0 .555-.45 1.005-1.006 1.005H5.005C4.45 9.226 4 8.776 4 8.221V7.133c0-.811.658-1.47 1.47-1.47h2.639l.818-1.784c.246-.536.78-.879 1.37-.879h3.185c.59 0 1.125.343 1.37.879ZM18.24 9.3v8.686c0 1.665-1.333 3.014-2.977 3.014H8.517c-1.644 0-2.977-1.349-2.977-3.014V9.301M10.2 12.816v4.509m3.38-4.509v4.509"
        />
      </svg>
      <p class="sidebar-right-menu__item-title">Delete Note</p>
    </a>
  </li>
`;

export const renderRightMenu = (mode = "default") => {
  const nav = document.querySelector(".sidebar-right-menu__nav");
  if (!nav) return;

  if (mode === "create") {
    nav.innerHTML = "";
    return;
  }

  if (mode === "empty") {
    nav.innerHTML = "";
    return;
  }

  if (mode === "archived") {
    nav.innerHTML = `${restoreActionMarkup}${deleteActionMarkup}`;
    return;
  }

  nav.innerHTML = `${archiveActionMarkup}${deleteActionMarkup}`;
};

export const renderCreatePlaceholderNote = (
  title = "Untitled Note",
  { navDiv } = {},
) => {
  const container =
    navDiv || getDocument("class", "sidebar-all-notes__nav")?.[0];
  if (!container) {
    console.error("Notes nav container not found: .sidebar-all-notes__nav");
    return;
  }

  const noteTemplate = `
    <li class="sidebar-all-notes__item is-active sidebar-all-notes__item--placeholder">
      <div class="sidebar-all-notes__link sidebar-all-notes__link--static">
        <p class="sidebar-all-notes__item-title">${title}</p>
      </div>
    </li>
    <hr class="sidebar-all-notes__nav-divider" />
  `;

  container.insertAdjacentHTML("beforeend", noteTemplate);
};

export const renderEmptyStateNote = (variant, { navDiv } = {}) => {
  const container =
    navDiv || getDocument("class", "sidebar-all-notes__nav")?.[0];
  if (!container) {
    console.error("Notes nav container not found: .sidebar-all-notes__nav");
    return;
  }

  if (variant === "search") {
    const markup = `
      <li class="sidebar-all-notes__empty-card sidebar-all-notes__empty-card--search">
        <p class="sidebar-all-notes__empty-text">
          No notes match your search. Try a different keyword or
          <a href="#" class="sidebar-all-notes__empty-link" data-route="create-note">create a new note</a>.
        </p>
      </li>
    `;
    container.insertAdjacentHTML("beforeend", markup);
    return;
  }

  if (variant === "archived") {
    const markup = `
      <li class="sidebar-all-notes__empty-card sidebar-all-notes__empty-card--archived">
        <p class="sidebar-all-notes__empty-text">
          No notes have been archived yet. Move notes here for safekeeping, or
          <a href="#" class="sidebar-all-notes__empty-link" data-route="create-note">create a new note</a>.
        </p>
      </li>
    `;
    container.insertAdjacentHTML("beforeend", markup);
    return;
  }

  const markup = `
    <li class="sidebar-all-notes__empty-card sidebar-all-notes__empty-card--all">
      <p class="sidebar-all-notes__empty-text">
        You don't have any notes yet. Start a new note to capture your thoughts and ideas.
      </p>
    </li>
  `;

  container.insertAdjacentHTML("beforeend", markup);
};

export const buildAllNotesContent = (container, note) => {
  const tags = Array.isArray(note?.tags) ? note.tags.filter(Boolean) : [];

  // 1) Render template
  container.innerHTML = noteContentTemplate({ isCreateMode: false });

  // 2) Insert icons/labels
  container
    .querySelector("[data-tag-flex]")
    .append(createTagIcon(), createTextSpan("Tags"));

  container
    .querySelector("[data-date-flex]")
    .append(createDateIcon(), createTextSpan("Last edited"));

  // 3) Populate values
  container.querySelector("[data-note-title]").value = note?.title ?? "";
  container.querySelector("[data-note-tags]").value = tags.join(", ");
  container.querySelector("[data-note-content]").value = note?.content ?? "";

  // 4) Last edited
  container.querySelector("[data-last-edited-value]").textContent =
    note?.lastEdited || "Not yet saved";

  // 5) Buttons
  container.appendChild(createButtonsSection());
};

export const buildCreateNoteContent = (container) => {
  // 1) Render template
  container.innerHTML = noteContentTemplate({ isCreateMode: true });

  // 2) Insert icons/labels
  container
    .querySelector("[data-tag-flex]")
    .append(createTagIcon(), createTextSpan("Tags"));

  container
    .querySelector("[data-date-flex]")
    .append(
      createDateIcon(),
      createTextSpan("Last edited", "note-content__last-edited"),
    );

  // 3) Defaults
  container.querySelector("[data-last-edited-value]").textContent =
    "Not yet saved";

  // 4) Buttons
  container.appendChild(createButtonsSection());
};

export const getActiveNote = (state, notesOverride = null) => {
  const notes = Array.isArray(notesOverride)
    ? notesOverride
    : Array.isArray(state?.notes)
      ? state.notes
      : [];
  if (!notes.length) return null;

  if (state?.activeNoteId) {
    const match = notes.find((note) => note.id === state.activeNoteId);
    if (match) return match;
  }

  return notes[0];
};

export const pages = {
  "all-notes": { title: "All Notes", mode: "all" },
  "archived-notes": { title: "Archived Notes", mode: "archived" },
  "create-note": { title: "All Notes", mode: "create" },
  search: { title: "Search", mode: "search" },
};

export const resolvePageKey = (pageKey) =>
  pages[pageKey] || isTagRoute(pageKey) ? pageKey : "all-notes";

export const setHeaderTitle = ({
  title = "",
  mutedPrefix = "",
  highlight = "",
} = {}) => {
  const headerTitle = document.querySelector(".page-header__title");
  if (!headerTitle) return;

  headerTitle.replaceChildren();

  if (mutedPrefix) {
    const muted = document.createElement("span");
    muted.className = "page-header__title-muted";
    muted.textContent = mutedPrefix;
    const highlightEl = document.createElement("span");
    highlightEl.className = "page-header__title-highlight";
    highlightEl.textContent = ` ${highlight || ""}`;
    headerTitle.append(muted, highlightEl);
    return;
  }

  headerTitle.textContent = title || "";
};

export const getNotesForRoute = (state, route, { query, searchFn } = {}) => {
  const notes = Array.isArray(state?.notes) ? state.notes : [];
  if (route === "archived-notes") {
    return notes.filter((note) => note.archived);
  }
  if (route === "all-notes") {
    return notes.filter((note) => !note.archived);
  }
  if (isTagRoute(route)) {
    return filterNotesByTag(notes, getTagFromRoute(route));
  }
  if (isSearchRoute(route)) {
    return typeof searchFn === "function" ? searchFn(notes, query) : notes;
  }
  return notes;
};

export const resolveActiveNoteId = (notes, state) => {
  if (!notes.length) return null;
  const current = state?.activeNoteId;
  if (current && notes.some((note) => note.id === current)) return current;
  return notes[0].id;
};

export const getCheckedValue = (name) => {
  const input = document.querySelector(`input[name="${name}"]:checked`);
  return input?.value ?? null;
};

export const setCheckedValue = (name, value) => {
  if (!value) return;
  const input = document.querySelector(
    `input[name="${name}"][value="${value}"]`,
  );
  if (input) input.checked = true;
};
