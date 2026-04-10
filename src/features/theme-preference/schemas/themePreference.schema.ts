import { z } from 'zod';

export const themePreferenceSchema = z.enum(['ember', 'ocean', 'forest', 'ruby', 'aura', 'arctic', 'dusk', 'onyx']);
