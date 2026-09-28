import type { AccentThemeId } from './ids';
import type { AccentTokens } from './types';

export const accentThemes = {
  ember: { accent: '#c47b59', accentHover: '#d28a66', accentPressed: '#a86145', accentMuted: 'rgba(196, 123, 89, 0.12)', onAccent: '#1a100b', focusRing: '#d28a66', chartPrimary: '#c47b59', chartSecondary: '#d9a65a' },
  ocean: { accent: '#5aa9e6', accentHover: '#73b9ed', accentPressed: '#4389c3', accentMuted: 'rgba(90, 169, 230, 0.12)', onAccent: '#07111b', focusRing: '#73b9ed', chartPrimary: '#5aa9e6', chartSecondary: '#8bb8d9' },
  forest: { accent: '#5faf7a', accentHover: '#72bd8e', accentPressed: '#488c61', accentMuted: 'rgba(95, 175, 122, 0.12)', onAccent: '#08140e', focusRing: '#72bd8e', chartPrimary: '#5faf7a', chartSecondary: '#a8c783' },
  ruby: { accent: '#c95f74', accentHover: '#d7778a', accentPressed: '#a94b61', accentMuted: 'rgba(201, 95, 116, 0.12)', onAccent: '#24090f', focusRing: '#d7778a', chartPrimary: '#c95f74', chartSecondary: '#d9a65a' },
  aura: { accent: '#aa95e8', accentHover: '#baa8f0', accentPressed: '#8d78c9', accentMuted: 'rgba(170, 149, 232, 0.12)', onAccent: '#140d2e', focusRing: '#baa8f0', chartPrimary: '#aa95e8', chartSecondary: '#8bb8d9' },
  arctic: { accent: '#65c7d8', accentHover: '#7bd4e2', accentPressed: '#4da6b7', accentMuted: 'rgba(101, 199, 216, 0.12)', onAccent: '#061519', focusRing: '#7bd4e2', chartPrimary: '#65c7d8', chartSecondary: '#8bb8d9' },
  dusk: { accent: '#c9829a', accentHover: '#d697ad', accentPressed: '#ab667f', accentMuted: 'rgba(201, 130, 154, 0.12)', onAccent: '#2a0e1a', focusRing: '#d697ad', chartPrimary: '#c9829a', chartSecondary: '#d9a65a' },
  onyx: { accent: '#c8ccd1', accentHover: '#e0e3e6', accentPressed: '#aeb4ba', accentMuted: 'rgba(200, 204, 209, 0.10)', onAccent: '#0b0d0f', focusRing: '#e0e3e6', chartPrimary: '#c8ccd1', chartSecondary: '#8f989f' },
} satisfies Record<AccentThemeId, AccentTokens>;
