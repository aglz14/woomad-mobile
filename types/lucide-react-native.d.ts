declare module 'lucide-react-native' {
  import React from 'react';

  interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    [key: string]: any;
  }

  // Define all the icons used in the project
  export const MapPin: React.FC<IconProps>;
  export const Search: React.FC<IconProps>;
  export const CircleAlert: React.FC<IconProps>;
  export const ArrowLeft: React.FC<IconProps>;
  export const Plus: React.FC<IconProps>;
  export const CreditCard: React.FC<IconProps>;
  export const Trash2: React.FC<IconProps>;
  export const Bell: React.FC<IconProps>;
  export const Heart: React.FC<IconProps>;
  export const Settings: React.FC<IconProps>;
  export const ChevronRight: React.FC<IconProps>;
  export const Tag: React.FC<IconProps>;
  export const Store: React.FC<IconProps>;
  export const Calendar: React.FC<IconProps>;
  export const Building2: React.FC<IconProps>;
  export const User: React.FC<IconProps>;
  export const Chrome: React.FC<IconProps>;
  export const Globe: React.FC<IconProps>;
  export const ShoppingBag: React.FC<IconProps>;
  export const UserCircle: React.FC<IconProps>;
  export const Info: React.FC<IconProps>;
  export const Phone: React.FC<IconProps>;
  export const Navigation2: React.FC<IconProps>;
  export const Clock: React.FC<IconProps>;
}
