import { useEffect } from 'react';
import { SeoConfig } from '../seo';

function upsertMetaByName(name: string, content: string) {
  let element = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let element = document.head.querySelector(
    `meta[property="${property}"]`,
  ) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

export function useSeoMetadata(config: SeoConfig) {
  const keywords = config.keywords.join(', ');
  const schemaJson = JSON.stringify(config.schema);

  useEffect(() => {
    // Dynamic head tags
    document.title = config.title;
    document.documentElement.lang = 'en';

    upsertMetaByName('description', config.description);
    upsertMetaByName('keywords', keywords);
    upsertMetaByName('robots', config.robots);
    upsertMetaByName('googlebot', config.robots);
    upsertMetaByName('author', 'Somyajeet');
    upsertMetaByName('application-name', 'AlgoViz');
    upsertMetaByName('apple-mobile-web-app-title', 'AlgoViz');
    upsertMetaByName('apple-mobile-web-app-capable', 'yes');
    upsertMetaByName('apple-mobile-web-app-status-bar-style', 'black-translucent');
    upsertMetaByName('theme-color', '#f97316');
    upsertMetaByName('referrer', 'strict-origin-when-cross-origin');

    upsertMetaByProperty('og:title', config.title);
    upsertMetaByProperty('og:description', config.description);
    upsertMetaByProperty('og:type', config.type);
    upsertMetaByProperty('og:url', config.canonicalUrl);
    upsertMetaByProperty('og:image', config.imageUrl);
    upsertMetaByProperty('og:site_name', 'AlgoViz');
    upsertMetaByProperty('og:locale', 'en_US');

    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', config.title);
    upsertMetaByName('twitter:description', config.description);
    upsertMetaByName('twitter:image', config.imageUrl);
    upsertMetaByName('twitter:site', '@algoviz');
    upsertMetaByName('twitter:creator', '@somyajeet');

    upsertLink('canonical', config.canonicalUrl);
    upsertLink('manifest', '/site.webmanifest');

    const existingSchema = document.head.querySelector('script[data-seo="structured-data"]');

    if (existingSchema) {
      existingSchema.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'structured-data');
    script.textContent = schemaJson;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [
    config.title,
    config.description,
    config.canonicalUrl,
    config.imageUrl,
    config.robots,
    config.type,
    keywords,
    schemaJson,
  ]);
}
