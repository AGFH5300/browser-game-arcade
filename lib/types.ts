export type Game = {
  id: string; title: string; slug: string; description: string; shortDescription: string;
  thumbnail: string | null; categories: string[]; collections: string[]; tags: string[]; developer: string;
  engine: 'html5' | 'iframe' | 'flash'; gameUrl: string; sourceUrl: string;
  license: string; licenseNotes: string; mobile: boolean; controls: string; instructions: string;
  featured: boolean; published: boolean; displayOrder: number; createdAt: string; updatedAt: string;
  publishedAt: string | null; playCount: number; likes: number;
};

export const collections = ['classics', 'html5_puzzles'] as const;
export type GameCollection = typeof collections[number];
