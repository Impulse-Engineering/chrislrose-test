import type { FC } from 'hono/jsx';
import { Nav } from './Nav';
import { Footer } from './Footer';

interface LayoutProps {
  title: string;
  description: string;
  siteUrl: string;
  assetVersion: string;
  ogImage?: string;
  currentPath: string;
  bodyClass?: string;
  headExtra?: any;
  bodyExtra?: any;
  children: any;
}

export const Layout: FC<LayoutProps> = ({
  title,
  description,
  siteUrl,
  assetVersion,
  ogImage = '/og-image.png',
  currentPath,
  bodyClass,
  headExtra,
  bodyExtra,
  children,
}) => {
  const fullTitle = `${title} — Chris Rose`;
  const ogImageUrl = `${siteUrl}${ogImage}`;

  return (
    <html lang="en" class="no-js">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Chris Rose" />
        <meta property="og:url" content={`${siteUrl}${currentPath}`} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {/* Twitter / X Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Styles */}
        <link rel="stylesheet" href={`/styles.css?v=${assetVersion}`} />
        {headExtra}
      </head>
      <body class={bodyClass || ''}>
        <Nav currentPath={currentPath} />
        <main>{children}</main>
        <Footer />
        <script src={`/cursor.js?v=${assetVersion}`} defer></script>
        {bodyExtra}
      </body>
    </html>
  );
};
