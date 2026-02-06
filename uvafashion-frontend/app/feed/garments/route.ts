import { NextResponse } from 'next/server';
import { getAllGarments } from '@/lib/garments';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://uvafashionarchive.com';
  const garments = getAllGarments();
  
  // Sort by most recent (if there's a date field) or by ID
  const sortedGarments = [...garments].sort((a, b) => {
    const dateA = a.yearApprox || parseInt(a.date || a.decade?.replace('s', '') || '0');
    const dateB = b.yearApprox || parseInt(b.date || b.decade?.replace('s', '') || '0');
    return dateB - dateA; // Most recent first
  });

  // Get the 20 most recent garments
  const recentGarments = sortedGarments.slice(0, 20);

  // Escape ]]> inside CDATA so the XML stays valid
  function escapeCdata(text: string): string {
    return text.replace(/\]\]>/g, ']]]]><![CDATA[>');
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>UVA Fashion Archive - New Garments</title>
    <link>${baseUrl}</link>
    <description>Latest additions to the UVA Historic Fashion Archive collection</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed/garments" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/favicon.ico</url>
      <title>UVA Fashion Archive</title>
      <link>${baseUrl}</link>
    </image>
    ${recentGarments.map(garment => {
      const rawTitle = garment.editorial_title || garment.label || garment.name || 'Untitled Garment';
      const rawDescription = garment.aesthetic_description || garment.description || garment.tagline || '';
      const title = escapeCdata(rawTitle);
      const description = escapeCdata(rawDescription.substring(0, 500) + (rawDescription.length > 500 ? '...' : ''));
      const slug = garment.slug || garment.id;
      const imageUrl = garment.images && garment.images.length > 0 
        ? garment.images[0].startsWith('http') 
          ? garment.images[0] 
          : `${baseUrl}${garment.images[0]}`
        : '';
      const pubDate = garment.date || garment.decade || new Date().toISOString();
      const link = `${baseUrl}/garments/${slug}`;
      const category = (garment.work_type || 'Garment').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const era = garment.era ? garment.era.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
      
      return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${description}]]></description>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg"/>` : ''}
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      <category>${category}</category>
      ${era ? `<category>${era}</category>` : ''}
    </item>`;
    }).join('')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
