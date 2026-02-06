import { NextResponse } from 'next/server';
import { educationalContent } from '@/data/educationalContent';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://uvafashionarchive.com';

  function escapeCdata(text: string): string {
    return text.replace(/\]\]>/g, ']]]]><![CDATA[>');
  }
  function escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>UVA Fashion Archive - Learn</title>
    <link>${baseUrl}/learn</link>
    <description>Educational articles on fashion history, materials, and techniques from the UVA Historic Fashion Archive</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed/learn" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/favicon.ico</url>
      <title>UVA Fashion Archive</title>
      <link>${baseUrl}</link>
    </image>
    ${educationalContent.map((article) => {
      const link = `${baseUrl}/learn/${article.id}`;
      const rawTitle = article.subtitle ? `${article.title} - ${article.subtitle}` : article.title;
      const title = escapeCdata(rawTitle);
      const firstParagraph = article.content.split(/\n\n/)[0] || article.content;
      const plain = firstParagraph.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^- /gm, '').trim();
      const description = escapeCdata(plain.substring(0, 500) + (plain.length > 500 ? '...' : ''));
      const category = escapeXml(article.category);

      return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <category>${category}</category>
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
