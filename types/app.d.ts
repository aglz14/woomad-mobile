// Type declarations for the mall detail page
declare module 'lucide-react-native' {
  import React from 'react';

  interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    [key: string]: any;
  }

  export const Store: React.FC<IconProps>;
  export const MapPin: React.FC<IconProps>;
  export const Filter: React.FC<IconProps>;
  export const ArrowLeft: React.FC<IconProps>;
  export const Phone: React.FC<IconProps>;
  export const Navigation2: React.FC<IconProps>;
  export const Clock: React.FC<IconProps>;
  export const Info: React.FC<IconProps>;
}
