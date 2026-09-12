export const themes = {
  "ember": {
    "background": "#0d0d0d",
    "surface": "#141414",
    "border": "#262626",
    "text": "#f5f5f5",
    "muted": "#9ca3af",
    "accent": "#b86a4e",
    "onAccent": "#ffffff"
  },
  "ocean": {
    "background": "#0a111a",
    "surface": "#141414",
    "border": "#262626",
    "text": "#f5f5f5",
    "muted": "#9ca3af",
    "accent": "#3b82f6",
    "onAccent": "#ffffff"
  },
  "forest": {
    "background": "#0c1410",
    "surface": "#141414",
    "border": "#262626",
    "text": "#f5f5f5",
    "muted": "#9ca3af",
    "accent": "#22c55e",
    "onAccent": "#052e16"
  },
  "ruby": {
    "background": "#150d11",
    "surface": "#141414",
    "border": "#262626",
    "text": "#f5f5f5",
    "muted": "#9ca3af",
    "accent": "#ef4444",
    "onAccent": "#ffffff"
  },
  "aura": {
    "background": "#0b0a12",
    "surface": "#110f1c",
    "border": "#252136",
    "text": "#f5f5f5",
    "muted": "#9ca3af",
    "accent": "#a78bfa",
    "onAccent": "#1a0f3a"
  },
  "arctic": {
    "background": "#08101a",
    "surface": "#0d1824",
    "border": "#1c2f40",
    "text": "#f5f5f5",
    "muted": "#9ca3af",
    "accent": "#67e8f9",
    "onAccent": "#012a32"
  },
  "dusk": {
    "background": "#120d0f",
    "surface": "#1a1114",
    "border": "#2e1d22",
    "text": "#f5f5f5",
    "muted": "#9ca3af",
    "accent": "#f472b6",
    "onAccent": "#3a0020"
  },
  "onyx": {
    "background": "#080808",
    "surface": "#111111",
    "border": "#242424",
    "text": "#f5f5f5",
    "muted": "#9ca3af",
    "accent": "#d4d4d4",
    "onAccent": "#080808"
  }
} as const;
export type ThemeName = keyof typeof themes;
