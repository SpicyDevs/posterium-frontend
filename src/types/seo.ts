export type SchemaObject = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface PageSEOMetadata {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogImageAlt: string;
  robots: string;
  keywords?: string;
  datePublished?: string;
  dateModified?: string;
  og?: Partial<OGMeta>;
  twitter?: Partial<TwitterMeta>;
  breadcrumbs?: BreadcrumbItem[];
  jsonLd: SchemaObject[];
  speakable?: SpeakableSpec;
}

export interface WebApplicationSchemaMeta {
  name?: string;
  description: string;
  url: string;
  applicationCategory?: string;
  applicationSubCategory?: string;
  operatingSystem?: string;
  featureList?: string[];
  screenshot?: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
    bestRating?: number;
    worstRating?: number;
  };
}

export interface HowToSchemaMeta {
  name: string;
  description: string;
  url: string;
  steps: string[];
  images?: string[];
}

export interface CollectionBreadcrumbMeta {
  title: string;
  slug?: string;
  sectionName: string;
  sectionPath: string;
}

export interface SpeakableSpec {
  cssSelector: string[];
}

export interface ArticleContentEntry {
  id?: string;
  slug?: string;
  body?: string;
  rendered?: {
    html?: string;
  };
  data?: {
    title?: string;
    name?: string;
    question?: string;
    description?: string;
    category?: string;
    updatedDate?: string | Date;
    publishDate?: string | Date;
    pubDate?: string | Date;
  };
}

import type { OGMeta, TwitterMeta } from '@/constants/site';
