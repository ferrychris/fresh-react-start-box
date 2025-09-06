// Lightweight fallback implementation of useThemeClasses
// Ensures components like IndexRacer can import a stable theme helper
// If you later add a real theming system (e.g., shadcn, tailwind variants, context),
// you can replace this with the actual implementation while keeping the API.

export type ThemeClasses = {
  bg: { primary: string };
  text: { primary: string; secondary: string; tertiary: string };
  button: { secondary: string };
};

export function useThemeClasses(): ThemeClasses {
  return {
    bg: { primary: 'bg-slate-950' },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-400',
      tertiary: 'text-slate-500',
    },
    button: { secondary: 'bg-slate-800 text-white hover:bg-slate-700' },
  };
}
