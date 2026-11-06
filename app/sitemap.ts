import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { PUBLIC_PATHS } from '@/lib/acquisition';
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map(path => ({ url: SITE_URL + path }));
}
