// Local development / self-hosted entrypoint.
// On Netlify, the API runs from netlify/server/index.ts and the frontend is served from dist/.
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

dotenv.config();

const { app } = await import('./server/app');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : null;
const PORT = cliPort || Number(process.env.PORT) || 3000;

// SEO routes for Googlebot & search engine indexing
app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: https://sellerprohq.com/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sellerprohq.com/</loc>
    <lastmod>2026-11-11</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://sellerprohq.com/?tab=calculator</loc>
    <lastmod>2026-11-11</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://sellerprohq.com/?tab=scanner</loc>
    <lastmod>2026-11-11</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://sellerprohq.com/?tab=news</loc>
    <lastmod>2026-11-11</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://sellerprohq.com/?tab=inventory</loc>
    <lastmod>2026-11-11</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://sellerprohq.com/?tab=pricing</loc>
    <lastmod>2026-11-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`);
});

// Download production Netlify bundle (pre-built dist ready to drag & drop)
app.get('/api/download-netlify-bundle', (_req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'sellerpro-netlify-deploy.zip');
  try {
    if (!fs.existsSync(filePath)) {
      execSync(`python3 -c '
import os, zipfile
dist_dir = "dist"
output_zip = "public/sellerpro-netlify-deploy.zip"
with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            if file.endswith(".zip"): continue
            full_path = os.path.join(root, file)
            arc_name = os.path.relpath(full_path, dist_dir)
            zf.write(full_path, arc_name)
'`);
    }
  } catch (genErr) {
    console.error('Error generating bundle on the fly:', genErr);
  }

  res.download(filePath, 'sellerpro-netlify-deploy.zip', (err) => {
    if (err) {
      console.error('Download netlify bundle error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error downloading Netlify bundle');
      }
    }
  });
});

// Download full project source code
app.get('/api/download-source-zip', (_req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'sellerpro-source-code.zip');
  try {
    if (!fs.existsSync(filePath)) {
      execSync(`python3 -c '
import os, zipfile
exclude_dirs = {"node_modules", "dist", ".git", ".next"}
output_zip = "public/sellerpro-source-code.zip"
with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file.endswith(".zip"): continue
            full_path = os.path.join(root, file)
            arc_name = os.path.relpath(full_path, ".")
            zf.write(full_path, arc_name)
'`);
    }
  } catch (genErr) {
    console.error('Error generating source zip on the fly:', genErr);
  }

  res.download(filePath, 'sellerpro-source-code.zip', (err) => {
    if (err) {
      console.error('Download source zip error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error downloading source code zip');
      }
    }
  });
});

// Dev & Production middleware routing
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SellerPro full-stack server running at http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} already occupied, waiting or retrying...`);
    } else {
      console.error('[Server] Fatal server error:', err);
    }
  });
}

startServer();

