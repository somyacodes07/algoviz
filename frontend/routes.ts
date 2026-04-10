export type AppPage = 'home' | 'docs' | 'editor';
export type AppLanguage = 'javascript' | 'c++';

export const ROUTES = {
  home: '/',
  docs: '/docs/',
  visualizerJavascript: '/visualizer/javascript/',
  visualizerCpp: '/visualizer/cpp/',
} as const;

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function getPathForState(page: AppPage, language: AppLanguage = 'javascript'): string {
  if (page === 'docs') return ROUTES.docs;
  if (page === 'editor') {
    return language === 'c++' ? ROUTES.visualizerCpp : ROUTES.visualizerJavascript;
  }
  return ROUTES.home;
}

export function getStateFromPath(pathname: string): {
  page: AppPage;
  language: AppLanguage;
} {
  const normalized = normalizePath(pathname);

  if (normalized === '/docs') {
    return { page: 'docs', language: 'javascript' };
  }

  if (normalized === '/visualizer/cpp') {
    return { page: 'editor', language: 'c++' };
  }

  if (normalized === '/visualizer/javascript' || normalized === '/visualizer') {
    return { page: 'editor', language: 'javascript' };
  }

  return { page: 'home', language: 'javascript' };
}
