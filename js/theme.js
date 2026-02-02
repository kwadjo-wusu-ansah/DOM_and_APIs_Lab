
/*this function normalizes theme selection input*/
export const normalizeThemeSelection = (themeName) => {
  const normalized = String(themeName ?? "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "light mode" || normalized === "lightmode") return "light";
  if (normalized === "dark mode" || normalized === "darkmode") return "dark";
  if (normalized === "system theme" || normalized === "systemtheme")
    return "system";
  return normalized;
};
/*this function normalizes font selection input*/
export const normalizeFontSelection = (fontName) => {
  const normalized = String(fontName ?? "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "inter") return "sans";
  if (normalized === "sans-serif" || normalized === "sansserif") return "sans";
  if (normalized === "monospace") return "mono";
  return normalized;
};

/*this function applies theme to the document root (html)*/
export const applyTheme = (themeName) => {
  const root = document.documentElement;
  const selection = normalizeThemeSelection(themeName);
  const resolved =
    selection === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : selection || "dark";

  root.setAttribute("data-theme", resolved);
  localStorage.setItem("theme", selection || "dark");
};

/*this function applies font to the document root (html)*/
export const applyFont = (fontName) => {
  const root = document.documentElement;
  const resolved = normalizeFontSelection(fontName) || "sans";

  const fontMap = {
    sans: '"Inter-Sans-serif", sans-serif',
    serif: '"Noto-Serif", serif',
    mono: '"SourceCodePro-MonoSpace", monospace',
  };

  const nextFont = fontMap[resolved] || fontMap.sans;
  root.style.setProperty("--font-family-app", nextFont);
  // Keep legacy selectors that still point at the sans-serif variable in sync.
  root.style.setProperty("--text-preset-font-family-sans-serif", nextFont);
};
