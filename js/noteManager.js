import { formatDate, generateNoteId } from "./utils.js";

/* This function normalize incoming notes (from data.json or older saved formats) into one format*/
export const normalizeNote = (raw) => {
  const title = raw?.title ?? "";
  const content = raw?.content ?? "";
  const tags = Array.isArray(raw?.tags) ? raw.tags : [];

  // support both naming styles
  const archived = raw?.archived ?? raw?.isArchived ?? false;

  // prefer real dates but keep your UI-friendly format for now
  const lastEditedRaw = raw?.lastEdited ?? raw?.updatedAt ?? null;

  return {
    id: raw?.id ?? generateNoteId(),
    title,
    content,
    tags,
    archived,
    created: raw?.created ?? formatDate(),
    lastEdited: lastEditedRaw
      ? formatDate(new Date(lastEditedRaw))
      : formatDate(),
  };
};

export class Note {
  #id;

  constructor(title, content, tags = [], archived = false) {
    this.#id = generateNoteId();
    this.title = title?.trim() ?? "";
    this.content = content ?? "";
    this.tags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : [];
    this.archived = Boolean(archived);
    this.created = formatDate();
    this.lastEdited = formatDate();
  }

  getId() {
    return this.#id;
  }

  archive() {
    this.archived = true;
    this.lastEdited = formatDate();
  }

  unarchive() {
    this.archived = false;
    this.lastEdited = formatDate();
  }

  toggleArchive() {
    this.archived = !this.archived;
    this.lastEdited = formatDate();
  }

  addTag(tag) {
    const clean = String(tag ?? "").trim();
    if (!clean) return;

    // this is to prevent duplicates (case-insensitive)
    const exists = this.tags.some(
      (t) => t.toLowerCase() === clean.toLowerCase(),
    );
    if (!exists) this.tags.push(clean);

    this.lastEdited = formatDate();
  }

  update(updates = {}) {
    if (typeof updates.title === "string") this.title = updates.title.trim();
    if (typeof updates.content === "string") this.content = updates.content;
    if (Array.isArray(updates.tags)) {
      this.tags = updates.tags.map((t) => String(t).trim()).filter(Boolean);
    }
    if (typeof updates.archived === "boolean") this.archived = updates.archived;
    this.lastEdited = formatDate();
  }

  // Convert to plain object for localStorage
  toJSON() {
    return {
      id: this.#id,
      title: this.title,
      content: this.content,
      tags: this.tags,
      archived: this.archived,
      created: this.created,
      lastEdited: this.lastEdited,
    };
  }
}

// ---------- CRUD functions that work on an array you pass in ----------
// This keeps noteManager independent of storage.js (clean architecture)

export const createNote = (title, content, tags = []) => {
  const note = new Note(title, content, tags);
  return note.toJSON();
};

export const deleteNote = (notes, id) => {

  return notes.filter((note) => note.id !== id);
};

export const updateNote = (notes, id, updates) => {
  const updated = notes.map((note) => {
    if (note.id !== id) return note;

    const merged = { ...note, ...updates };

    merged.lastEdited = formatDate();

    return merged;
  });

  return updated;
};

export const toggleArchive = (notes, id) => {

  return notes.map((note) => {

    if (note.id !== id) return note;

    return { ...note, archived: !note.archived, lastEdited: formatDate() };
  });
};

export const searchNotes = (notes, query) => {
  const queryString = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!queryString) return notes;

  return notes.filter((note) => {
    const inTitle = (note.title ?? "").toLowerCase().includes(queryString);
    const inContent = (note.content ?? "").toLowerCase().includes(queryString);
    const inTags = Array.isArray(note.tags)
      ? note.tags.join(" ").toLowerCase().includes(queryString)
      : false;
    return inTitle || inContent || inTags;
  });
};

export const filterByTag = (notes, tag) => {
  const tagString = String(tag ?? "")
    .trim()
    .toLowerCase();
  if (!tagString) return notes;

  return notes.filter((note) =>
    Array.isArray(note.tags)
      ? note.tags.some((x) => String(x).toLowerCase() === tagString)
      : false,
  );
};

export const getAllTags = (notes) => {
  const set = new Set();
  notes.forEach((note) => (note.tags ?? []).forEach((t) => set.add(String(t))));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};
