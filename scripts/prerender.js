import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { routes } from '../src/seo/routes.js';
import { seoData } from '../src/seo/seoData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const DOMAIN = 'https://plotlake.com';
const PORT = 4173;

// Helper to escape HTML for meta tags
const escapeHtml = (str) => {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const startServer = () => {
    return new Promise((resolve, reject) => {
        const server = spawn('npm', ['run', 'preview', '--', '--port', PORT.toString(), '--strictPort'], {
            cwd: projectRoot,
            stdio: 'pipe',
            shell: true,
        });

        server.stdout.on('data', (data) => {
            const output = data.toString();
            // console.log('[Server]', output);
            if (output.includes('Local:') || output.includes('localhost')) {
                resolve(server);
            }
        });

        server.stderr.on('data', (data) => {
            console.error('[Server Error]', data.toString());
        });

        server.on('error', reject);
    });
};

const processRoute = async (browser, route) => {
    const page = await browser.newPage();
    const url = `http://localhost:${PORT}${route.path}`;

    // Console logging from the page for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for App to be mounted - checking for root div content
        await page.waitForSelector('#root > div', { timeout: 5000 });

        // Get the full HTML
        let html = await page.content();

        // --- SEO Injection ---
        // We inject the Head tags here because the client-side app (currently) might not update them perfectly,
        // and we want to ensure specific control over what Google sees.

        const data = seoData[route.path];
        if (data) {
            // 1. Title
            html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(data.title)}</title>`);

            // 2. Meta Description
            const descTag = `<meta name="description" content="${escapeHtml(data.description)}" />`;
            if (html.includes('<meta name="description"')) {
                html = html.replace(/<meta name="description"[^>]*>/, descTag);
            } else {
                html = html.replace('</head>', `${descTag}\n</head>`);
            }

            // 3. Canonical
            const canonicalUrl = `${DOMAIN}${route.path === '/' ? '/' : route.path}`;
            const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
            if (html.includes('<link rel="canonical"')) {
                html = html.replace(/<link rel="canonical"[^>]*>/, canonicalTag);
            } else {
                html = html.replace('</head>', `${canonicalTag}\n</head>`);
            }

            // 4. Open Graph / Twitter
            // (Simple replacement for key tags, assuming existing ones or appending)
            const ogTags = `
    <meta property="og:title" content="${escapeHtml(data.title)}" />
    <meta property="og:description" content="${escapeHtml(data.description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${data.ogImage || 'https://plotlake.com/og-image.png'}" />
    <meta name="twitter:title" content="${escapeHtml(data.title)}" />
    <meta name="twitter:description" content="${escapeHtml(data.description)}" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:image" content="${data.ogImage || 'https://plotlake.com/og-image.png'}" />
       `;
            html = html.replace('</head>', `${ogTags}\n</head>`);

            // 5. Schema.org JSON-LD
            // Clean old JSON-LD first to avoid duplicates if any exists in template
            html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

            // Re-build JSON-LD (Web Application + FAQ + Breadcrumbs)
            // We can reuse logic similar to generate-seo.js or simplify.
            // For now, let's just make sure specific "WebApplication" schema is present.
            // (Ideally we reuse the robust logic from generate-seo.js but rewritten here would be long.
            //  Let's settle for injecting the basic Schema if missing, or relying on what's in index.html if it's generic.
            //  But specific pages need specific schema. Let's add basic one.)
            const schema = {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": data.h1 || data.title,
                "url": canonicalUrl,
                "description": data.description,
                "applicationCategory": "MultimediaApplication",
                "operatingSystem": "Any",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                }
            };

            if (data.faq && data.faq.length > 0) {
                const faqSchema = {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": data.faq.map(f => ({
                        "@type": "Question",
                        "name": f.q,
                        "acceptedAnswer": { "@type": "Answer", "text": f.a }
                    }))
                };
                html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n</head>`);
            }

            html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);
        }

        // Write to file
        const fileDir = route.path === '/' ? distDir : path.join(distDir, route.path.substring(1));
        await fs.mkdir(fileDir, { recursive: true });
        await fs.writeFile(path.join(fileDir, 'index.html'), html);
        console.log(`[Prerender] Generated ${route.path} -> ${path.join(fileDir, 'index.html')}`);

    } catch (e) {
        console.error(`[Prerender] Error processing ${route.path}:`, e);
    } finally {
        await page.close();
    }
};

const generateSitemap = async () => {
    const today = new Date().toISOString().slice(0, 10);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const route of routes) {
        const url = `${DOMAIN}${route.path === '/' ? '/' : route.path}`;
        xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route.path === '/' ? '1.0' : '0.8'}</priority>
  </url>\n`;
    }

    xml += `</urlset>`;
    await fs.writeFile(path.join(distDir, 'sitemap.xml'), xml);
    console.log('[Prerender] Generated sitemap.xml');
};

const main = async () => {
    let server;
    let browser;
    try {
        console.log('[Prerender] Starting server...');
        server = await startServer();
        console.log('[Prerender] Server started. Launching browser...');

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (const route of routes) {
            await processRoute(browser, route);
        }

        await generateSitemap();

    } catch (e) {
        console.error('[Prerender] Fatal error:', e);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        if (server) server.kill();
        process.exit(0);
    }
};

main();
