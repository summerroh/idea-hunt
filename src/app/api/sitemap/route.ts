import { NextResponse } from "next/server";

const WEBSITE_URL = "https://www.findsaasidea.com";

// Add static pages and their priorities
const STATIC_PAGES = [
  { path: "", priority: 1.0, changefreq: "daily" }, // Home page
  { path: "search", priority: 0.9, changefreq: "daily" }, // Search page
  { path: "about", priority: 0.7, changefreq: "weekly" }, // About page
  { path: "contact", priority: 0.6, changefreq: "monthly" }, // Contact page
];

function generateSiteMap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${STATIC_PAGES.map(
        (page) => `
      <url>
        <loc>${WEBSITE_URL}${page.path ? `/${page.path}` : ""}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
      </url>`
      ).join("")}
    </urlset>`;
}

export async function GET() {
  const sitemap = generateSiteMap();

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
