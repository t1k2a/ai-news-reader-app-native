import { Helmet } from 'react-helmet-async';

interface NewsArticleProps {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  publisher?: string;
  url?: string;
}

interface WebsiteProps {
  name: string;
  url: string;
  description: string;
  language?: string;
  logoUrl?: string;
}

export function NewsArticleJsonLd({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author = 'GlotNexus',
  publisher = 'GlotNexus',
  url = window.location.href
}: NewsArticleProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    image: image || '/og-image.png',
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: publisher,
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}

export function WebsiteJsonLd({
  name,
  url,
  description,
  language = 'ja',
  logoUrl = '/logo.png'
}: WebsiteProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    inLanguage: language,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl
      }
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string, url: string }> }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
