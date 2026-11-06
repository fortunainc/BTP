import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/investors', '/situations', '/join/experience', '/join/progress', '/join/return', '/sign-in', '/sign-up', '/onboarding', '/you', '/activity'] }, sitemap: SITE_URL + '/sitemap.xml' };
}
