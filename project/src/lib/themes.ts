import { Theme } from './supabase';

export type ThemeConfig = {
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  gradient: string;
  text: string;
  ring: string;
};

export const themes: Record<Theme, ThemeConfig> = {
  blue: {
    name: 'Ocean Blue',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryLight: 'bg-blue-50',
    gradient: 'from-blue-50 to-cyan-50',
    text: 'text-blue-600',
    ring: 'ring-blue-500',
  },
  purple: {
    name: 'Royal Purple',
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    primaryLight: 'bg-purple-50',
    gradient: 'from-purple-50 to-pink-50',
    text: 'text-purple-600',
    ring: 'ring-purple-500',
  },
  green: {
    name: 'Forest Green',
    primary: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    primaryLight: 'bg-green-50',
    gradient: 'from-green-50 to-emerald-50',
    text: 'text-green-600',
    ring: 'ring-green-500',
  },
  orange: {
    name: 'Sunset Orange',
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    primaryLight: 'bg-orange-50',
    gradient: 'from-orange-50 to-amber-50',
    text: 'text-orange-600',
    ring: 'ring-orange-500',
  },
  pink: {
    name: 'Cherry Blossom',
    primary: 'bg-pink-600',
    primaryHover: 'hover:bg-pink-700',
    primaryLight: 'bg-pink-50',
    gradient: 'from-pink-50 to-rose-50',
    text: 'text-pink-600',
    ring: 'ring-pink-500',
  },
  red: {
    name: 'Ruby Red',
    primary: 'bg-red-600',
    primaryHover: 'hover:bg-red-700',
    primaryLight: 'bg-red-50',
    gradient: 'from-red-50 to-orange-50',
    text: 'text-red-600',
    ring: 'ring-red-500',
  },
  teal: {
    name: 'Tropical Teal',
    primary: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    primaryLight: 'bg-teal-50',
    gradient: 'from-teal-50 to-cyan-50',
    text: 'text-teal-600',
    ring: 'ring-teal-500',
  },
  gray: {
    name: 'Slate Gray',
    primary: 'bg-gray-700',
    primaryHover: 'hover:bg-gray-800',
    primaryLight: 'bg-gray-50',
    gradient: 'from-gray-50 to-slate-50',
    text: 'text-gray-700',
    ring: 'ring-gray-500',
  },
};

export const getTheme = (themeName: Theme): ThemeConfig => {
  return themes[themeName] || themes.blue;
};
