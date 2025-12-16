import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { db } from '@/lib/db';

export function useAlgorithms() {
  return useQuery({
    queryKey: ['algorithms'],
    queryFn: async () => {
      const algorithms = await api.algorithms.list();

      // Cache for offline use (without SVG content from list)
      for (const algo of algorithms) {
        const existing = await db.algorithms.get(algo.id);
        if (!existing) {
          await db.algorithms.put({
            id: algo.id,
            code: algo.code,
            title: algo.title,
            description: algo.description,
            svgContent: '',
            version: 1,
            cachedAt: Date.now(),
          });
        }
      }

      return algorithms.map((a) => ({
        ...a,
        relatedChapter: undefined,
      }));
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useAlgorithm(algorithmCode: string) {
  return useQuery({
    queryKey: ['algorithm', algorithmCode],
    queryFn: async () => {
      // Try IndexedDB first
      const cached = await db.algorithms.where('code').equals(algorithmCode).first();
      if (cached && cached.svgContent) {
        return {
          ...cached,
          relatedChapter: undefined,
        };
      }

      // Fetch from API
      const algorithm = await api.algorithms.getByCode(algorithmCode);

      // Cache
      await db.algorithms.put({
        id: algorithm.id,
        code: algorithm.code,
        title: algorithm.title,
        description: algorithm.description,
        svgContent: algorithm.svgContent,
        version: 1,
        cachedAt: Date.now(),
      });

      return {
        ...algorithm,
        relatedChapter: undefined,
        relatedChapterId: undefined,
      };
    },
    staleTime: 60 * 60 * 1000,
  });
}
