import { MetadataRoute } from 'next'
import { getAllGarments, hydrateGarmentsFromCA } from '@/lib/garments'
import { sampleExhibitions } from '@/data/exhibitions'
import { educationalContent } from '@/data/educationalContent'

// Regenerated hourly. A purely static sitemap is built without CA_BASE_URL and
// would silently omit every CollectiveAccess garment, listing only the bundled
// fallback data.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://uvafashionarchive.com'

  await hydrateGarmentsFromCA().catch(() => {})

  const garments = getAllGarments()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/collection`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/timeline`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/favorites`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/exhibitions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Garment pages
  const garmentPages: MetadataRoute.Sitemap = garments.map((garment) => ({
    url: `${baseUrl}/garments/${garment.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Exhibition pages
  const exhibitionPages: MetadataRoute.Sitemap = sampleExhibitions.map((exhibition) => ({
    url: `${baseUrl}/exhibitions/${exhibition.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Learn index + individual learn articles
  const learnIndex: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/learn`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/statistics`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ]
  const learnArticlePages: MetadataRoute.Sitemap = educationalContent.map((c) => ({
    url: `${baseUrl}/learn/${c.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...garmentPages, ...exhibitionPages, ...learnIndex, ...learnArticlePages]
}

