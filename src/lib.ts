import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Prefix an internal path with the site base (e.g. /website_giofox96/ on GitHub Pages). */
export const url = (path = '') => base + path.replace(/^\//, '');

export const projectUrl = (p: Project) => url(`projects/${p.id}/`);

/** "With A, B and C": the other people on a team project, or '' when the work is solo. */
export function collaborators(team: string[], self: string) {
  const norm = (n: string) => n.trim().replace(/\s+/g, ' ').toLowerCase();
  const others = team.filter((n) => norm(n) !== norm(self));
  if (!others.length) return '';
  const list = others.length === 1 ? others[0] : `${others.slice(0, -1).join(', ')} and ${others.at(-1)}`;
  return `With ${list}`;
}

export const categories = {
  computational: { title: 'Computational design', anchor: 'computational' },
  architecture: { title: 'Architecture', anchor: 'architecture' },
  other: { title: 'Other projects', anchor: 'other' },
} as const;

const rank = { computational: 0, architecture: 1, other: 2 };

/** All projects in the order the home page shows them: by category, highlighted and featured first, then `order`; the index by year. */
export async function allProjects() {
  const list = await getCollection('projects');
  const tier = (p: Project) => (p.data.highlight ? 0 : p.data.featured ? 1 : 2);
  return list.sort(
    (a, b) =>
      rank[a.data.category] - rank[b.data.category] ||
      tier(a) - tier(b) ||
      (tier(a) === 2 ? b.data.year - a.data.year : 0) ||
      a.data.order - b.data.order ||
      b.data.year - a.data.year,
  );
}
