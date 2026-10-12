import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Prefix an internal path with the site base (e.g. /website_giofox96/ on GitHub Pages). */
export const url = (path = '') => base + path.replace(/^\//, '');

export const projectUrl = (p: Project) => url(`projects/${p.id}/`);

export const categories = {
  computational: { title: 'Computational design', anchor: 'computational' },
  architecture: { title: 'Architecture', anchor: 'architecture' },
  other: { title: 'Other projects', anchor: 'other' },
} as const;

const rank = { computational: 0, architecture: 1, other: 2 };

/** All projects in reading order: category, then `order`, then newest first. */
export async function allProjects() {
  const list = await getCollection('projects');
  return list.sort(
    (a, b) =>
      rank[a.data.category] - rank[b.data.category] ||
      a.data.order - b.data.order ||
      b.data.year - a.data.year,
  );
}
