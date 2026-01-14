import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { routes } from '../src/seo/routes.js';
import { seoData } from '../src/seo/seoData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const DOMAIN = 'https://plotlake.com';

const replaceOrAppend = (html, regex, replacement) => {
  if (regex.test(html)) {
    return html.replace(regex, replacement);
  }
  return html.replace('</head>', `${replacement}\n</head>`);
};

const stripJsonLd = (html) =>
  html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

const escapeHtml = (str) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildJsonLd = (routeObj, data) => {
  const routePath = routeObj.path;
  const url = `${DOMAIN}${routePath === '/' ? '/' : routePath}`;
  const breadcrumbs = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${DOMAIN}/`,
    },
  ];

  const categoryName =
    routePath === '/'
      ? 'GIF Maker'
      : data.categoryLabel ||
      (routeObj.category === 'video-to-gif'
        ? 'Video to GIF Tools'
        : routeObj.category === 'gif-optimization'
          ? 'GIF Optimization'
          : 'Image to GIF Tools');

  breadcrumbs.push({
    '@type': 'ListItem',
    position: 2,
    name: categoryName,
    item: `${DOMAIN}/`,
  });

  if (routePath !== '/') {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 3,
      name: data.h1 || data.title,
      item: url,
    });
  }

  const faqEntities = (data.faq || []).map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  }));

  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: data.h1 || data.title,
    url,
    description: data.description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const faq = faqEntities.length
    ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqEntities,
    }
    : null;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs,
  };

  return [webApp, faq, breadcrumb].filter(Boolean);
};

const buildSEOBlock = (route, data) => {
  const relatedLinks = (data.relatedLinks || []).slice(0, 8);
  const featuresHtml = (data.features || [])
    .map((f) => `<li>${escapeHtml(f)}</li>`)
    .join('\n');
  const faqHtml = (data.faq || [])
    .map(
      (item) =>
        `<div class="seo-faq-item"><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(
          item.a,
        )}</p></div>`,
    )
    .join('\n');
  const paragraphsHtml = (data.intro || [])
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n');
  const linksHtml = relatedLinks
    .map((href) => `<li><a href="${href}">${href.replace('/', '') || 'home'}</a></li>`)
    .join('\n');

  return `
  <section id="seo-content" aria-label="SEO content" class="seo-content" style="position:absolute;left:-9999px;height:1px;width:1px;overflow:hidden;">
    <h1>${escapeHtml(data.h1 || data.title)}</h1>
    ${paragraphsHtml}
    <h2>Key benefits</h2>
    <ul class="seo-features">
      ${featuresHtml}
    </ul>
    <h2>Frequently Asked Questions</h2>
    <div class="seo-faq">
      ${faqHtml}
    </div>
    <h2>Related tools</h2>
    <ul class="seo-links">
      ${linksHtml}
    </ul>
  </section>
  `;
};

const ensureDir = async (dir) => fs.mkdir(dir, { recursive: true });

const writeSitemap = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const entries = routes
    .map(
      (r) => `  <url>
    <loc>${DOMAIN}${r.path === '/' ? '/' : r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${r.path === '/' ? '1.0' : '0.8'}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
  await fs.writeFile(path.join(projectRoot, 'public', 'sitemap.xml'), xml, 'utf8');
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
};

const processRoute = async (route, baseHtml) => {
  const data = seoData[route.path];
  if (!data) {
    console.warn(`No SEO data for ${route.path}, skipping.`);
    return;
  }
  const url = `${DOMAIN}${route.path === '/' ? '/' : route.path}`;
  let html = baseHtml;

  html = replaceOrAppend(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(data.title)}</title>`);
  html = replaceOrAppend(
    html,
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(data.description)}">`,
  );
  html = replaceOrAppend(
    html,
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${url}">`,
  );

  // Open Graph
  html = replaceOrAppend(
    html,
    /<meta property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(data.title)}">`,
  );
  html = replaceOrAppend(
    html,
    /<meta property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(data.description)}">`,
  );
  html = replaceOrAppend(
    html,
    /<meta property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${url}">`,
  );
  html = replaceOrAppend(
    html,
    /<meta property="og:image"[^>]*>/i,
    `<meta property="og:image" content="${data.ogImage}">`,
  );

  // Twitter
  html = replaceOrAppend(
    html,
    /<meta name="twitter:title"[^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(data.title)}">`,
  );
  html = replaceOrAppend(
    html,
    /<meta name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(data.description)}">`,
  );
  html = replaceOrAppend(
    html,
    /<meta name="twitter:image"[^>]*>/i,
    `<meta name="twitter:image" content="${data.ogImage}">`,
  );
  html = replaceOrAppend(
    html,
    /<meta name="twitter:url"[^>]*>/i,
    `<meta name="twitter:url" content="${url}">`,
  );

  // Structured data
  html = stripJsonLd(html);
  const jsonLd = buildJsonLd(route, data)
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n');
  html = html.replace('</head>', `${jsonLd}\n</head>`);

  // Body SEO content
  const seoBlock = buildSEOBlock(route.path, data);
  html = html.replace('<div id="root"></div>', `<div id="root"></div>\n${seoBlock}`);

  if (!html || html.length === 0) {
    throw new Error(`Generated empty HTML for ${route.path}`);
  }

  // Write to appropriate path
  if (route.path === '/') {
    await fs.writeFile(path.join(distDir, 'index.html'), html, 'utf8');
  } else {
    const dir = path.join(distDir, route.path.replace(/^\//, ''));
    await ensureDir(dir);
    await fs.writeFile(path.join(dir, 'index.html'), html, 'utf8');
  }
};

const main = async () => {
  await ensureDir(distDir);
  const baseHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  for (const route of routes) {
    await processRoute(route, baseHtml);
  }
  await writeSitemap();
  console.log('SEO static pages generated for', routes.length, 'routes');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
