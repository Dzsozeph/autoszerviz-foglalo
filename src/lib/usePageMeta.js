import { useEffect } from 'react';
import { SITE_URL } from '@/lib/cegadat';

const DEFAULT_IMAGE =
  'https://media.base44.com/images/public/6af4670961f92c12d456e3c5/0eab8ef47_generated_image.png';

const setMeta = (attr, key, content) => {
  let element = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const setCanonical = (href) => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

// Oldalankénti magyar cím, meta leírás és Open Graph adatok
export default function usePageMeta({
  title,
  description,
  path = '/',
  noindex = false,
  image = DEFAULT_IMAGE,
}) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    if (title) document.title = title;
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    if (title) {
      setMeta('property', 'og:title', title);
      setMeta('name', 'twitter:title', title);
    }
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'Profi Autószerviz');
    setMeta('property', 'og:locale', 'hu_HU');
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setCanonical(url);
  }, [title, description, path, noindex, image]);
}