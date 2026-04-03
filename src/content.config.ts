import { defineCollection, z } from 'astro:content';

const install = defineCollection({
  schema: z.object({}),
});

export const collections = { install };
