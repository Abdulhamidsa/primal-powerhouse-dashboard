declare module 'lucide-react' {
  import { ComponentType, SVGAttributes } from 'react';

  interface LucideIconProps extends SVGAttributes<SVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
    strokeWidth?: number | string;
    color?: string;
  }

  // Define all the icon components you're using
  export const Utensils: ComponentType<LucideIconProps>;
  export const Flame: ComponentType<LucideIconProps>;
  export const BarChart: ComponentType<LucideIconProps>;
  export const BarChart2: ComponentType<LucideIconProps>;
  export const Sunrise: ComponentType<LucideIconProps>;
  export const Sun: ComponentType<LucideIconProps>;
  export const Moon: ComponentType<LucideIconProps>;
  export const Apple: ComponentType<LucideIconProps>;
  export const Clock: ComponentType<LucideIconProps>;
  export const Users: ComponentType<LucideIconProps>;
  // Add any other icons you're using in your project
}
