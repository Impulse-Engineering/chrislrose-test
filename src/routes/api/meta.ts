import { Hono } from 'hono';
import type { Env } from '../../types';

export const metaRoutes = new Hono<{ Bindings: Env }>();

function extractYouTubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    return u.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

function extractMeta(html: string, property: string): string {
  // Match og: and standard meta tags
  const ogPattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(ogPattern);
  if (match) return match[1];

  // Try reversed attribute order: content before property
  const reversedPattern = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
    'i'
  );
  const reversed = html.match(reversedPattern);
  return reversed ? reversed[1] : '';
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : '';
}

// GET /api/meta?url=... — fetches page metadata (title, description, image, favicon, domain)
metaRoutes.get('/', async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.json({ error: 'url parameter is required' }, 400);
  }

  let domain = '';
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return c.json({ error: 'Invalid URL' }, 400);
  }

  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  // YouTube: use oEmbed for reliable metadata
  const ytId = (domain === 'youtube.com' || domain === 'youtu.be')
    ? extractYouTubeId(url)
    : '';

  if (ytId) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json() as { title?: string; author_name?: string };
        return c.json({
          title: data.title || '',
          description: data.author_name ? `By ${data.author_name}` : '',
          image: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
          favicon,
          domain,
        });
      }
    } catch {
      // Fall through to generic fetch
    }
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MetaFetcher/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return c.json({ title: '', description: '', image: '', favicon, domain });
    }

    const html = await res.text();

    const title = extractMeta(html, 'og:title') || extractTitle(html);
    const description = extractMeta(html, 'og:description') || extractMeta(html, 'description');
    const image = extractMeta(html, 'og:image');

    return c.json({ title, description, image, favicon, domain });
  } catch {
    return c.json({ title: '', description: '', image: '', favicon, domain });
  }
});
