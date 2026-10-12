import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One folder per project: src/content/projects/<slug>/index.md plus its images.
const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      year: z.number(),
      category: z.enum(['computational', 'architecture', 'other']),
      // Featured projects get a large card; the rest go in the compact index.
      featured: z.boolean().default(false),
      order: z.number().default(99),
      type: z.string(),
      context: z.string().optional(),
      location: z.string().optional(),
      summary: z.string(),
      tags: z.array(z.string()).default([]),
      // Group work: everyone on the team, plus the course and its faculty.
      team: z.array(z.string()).default([]),
      course: z.string().optional(),
      faculty: z.string().optional(),
      link: z.url().optional(),
      cover: image(),
      coverAlt: z.string(),
      workflowTitle: z.string().default('Parametric workflow'),
      workflow: z
        .array(z.object({ label: z.string(), text: z.string().optional(), image: image().optional() }))
        .default([]),
      gallery: z
        .array(
          z.object({
            image: image(),
            alt: z.string(),
            caption: z.string().optional(),
            half: z.boolean().default(false),
            diagram: z.boolean().default(false),
          }),
        )
        .default([]),
    }),
});

export const collections = { projects };
