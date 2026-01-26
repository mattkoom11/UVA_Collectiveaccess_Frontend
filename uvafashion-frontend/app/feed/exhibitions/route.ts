import { NextResponse } from 'next/server';
import { sampleExhibitions } from '@/data/exhibitions';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://uvafashionarchive.com';
  
  // Sort exhibitions by start date (most recent first)
  const sortedExhibitions = [...sampleExhibitions].sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateB - dateA;
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>UVA Fashion Archive - Exhibitions</title>
    <link>${baseUrl}/exhibitions</link>
    <description>Virtual exhibitions and curated collections from the UVA Historic Fashion Archive</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed/exhibitions" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/favicon.ico</url>
      <title>UVA Fashion Archive</title>
      <link>${baseUrl}</link>
    </image>
    ${sortedExhibitions.map(exhibition => {
      const link = `${baseUrl}/exhibitions/${exhibition.id}`;
      const pubDate = exhibition.startDate || new Date().toISOString();
      const imageUrl = exhibition.imageUrl 
        ? exhibition.imageUrl.startsWith('http') 
          ? exhibition.imageUrl 
          : `${baseUrl}${exhibition.imageUrl}`
        : '';
      
      return `
    <item>
      <title><![CDATA[${exhibition.title}${exhibition.subtitle ? ` - ${exhibition.subtitle}` : ''}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${exhibition.description}${exhibition.narrative ? ` ${exhibition.narrative}` : ''}]]></description>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg"/>` : ''}
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      ${exhibition.curator ? `<author>${exhibition.curator}</author>` : ''}
      ${exhibition.theme ? `<category>${exhibition.theme}</category>` : ''}
      ${exhibition.tags ? exhibition.tags.map(tag => `<category>${tag}</category>`).join('') : ''}
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
