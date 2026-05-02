import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// FAQ collection - markdown files with category/question frontmatter
const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    category: z.string(),
    question: z.string(),
    order: z.number().optional().default(0),
  }),
});

// Installation guides collection
const install = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/install' }),
  schema: z.object({
    name: z.string().optional(),
    order: z.number().optional().default(0),
    showcaseImages: z
      .object({
        desktop: z.string(),
        tv: z.string(),
        mobile: z.array(z.string()),
      })
      .optional(),
  }),
});

// Examples collection - presets for the poster generator
const examples = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/examples' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    query: z.string(),
    order: z.number().optional().default(0),
  }),
});

// Docs collection - general documentation pages
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().optional().default(0),
  }),
});

export const collections = { faq, install, examples, docs };
