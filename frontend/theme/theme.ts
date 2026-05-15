export type ThemeColor = 'saffron' | 'blue';
export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  accentBg: string; // solid background
  accentSoftBg: string; // low opacity background
  accentText: string; // text color
  accentBorder: string; // border color
  accentFill: string; // SVG solid fill/stroke
  accentFillSoft: string; // SVG soft area fill
  panelClass: string; // standard neo-brutalist panel
  subPanelClass: string; // slightly darker neo-brutalist panel
  badgeClass: string; // small tag/badge
}

export function getThemeConfig(themeColor: ThemeColor): ThemeConfig {
  const isSaffron = themeColor === 'saffron';

  return {
    accentBg: isSaffron ? 'bg-saffron-500' : 'bg-blue-500',
    accentSoftBg: isSaffron
      ? 'bg-saffron-100 dark:bg-saffron-900/25'
      : 'bg-blue-100 dark:bg-blue-900/25',
    accentText: isSaffron
      ? 'text-saffron-700 dark:text-saffron-400'
      : 'text-blue-700 dark:text-blue-400',
    accentBorder: isSaffron
      ? 'border-saffron-300 dark:border-saffron-700/60'
      : 'border-blue-300 dark:border-blue-700/60',
    accentFill: isSaffron ? '#f97316' : '#3b82f6',
    accentFillSoft: isSaffron ? 'rgba(249, 115, 22, 0.18)' : 'rgba(59, 130, 246, 0.18)',
    panelClass:
      'border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] shadow-[2px_2px_0_#0f172a] dark:shadow-[3px_3px_0_var(--dark-shadow)]',
    subPanelClass:
      'border-[2px] border-slate-900 dark:border-[var(--dark-border-dim)] bg-slate-100 dark:bg-[var(--dark-base)]',
    badgeClass: `inline-flex items-center gap-1 border-[2px] px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
      isSaffron
        ? 'bg-saffron-100/50 dark:bg-saffron-900/25 text-saffron-700 dark:text-saffron-400 border-saffron-300 dark:border-saffron-700/60'
        : 'bg-blue-100/50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700/60'
    }`,
  };
}
