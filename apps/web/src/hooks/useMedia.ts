import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================
// MEDIA LIBRARY
// ============================================

export function useMediaLibrary(params?: {
  skip?: number;
  take?: number;
  search?: string;
  type?: 'IMAGE' | 'VIDEO' | 'PDF';
}) {
  return useQuery({
    queryKey: ['media', 'library', params],
    queryFn: () => api.media.list(params),
    staleTime: 30 * 1000,
  });
}

export function useMediaAsset(id: string) {
  return useQuery({
    queryKey: ['media', 'asset', id],
    queryFn: () => api.media.get(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useMediaSearch(query: string, type?: 'IMAGE' | 'VIDEO' | 'PDF') {
  return useQuery({
    queryKey: ['media', 'search', query, type],
    queryFn: () => api.media.search(query, type),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useMediaUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, metadata }: {
      file: File;
      metadata?: { alt?: string; caption?: string; tags?: string[] };
    }) => api.media.upload(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'library'] });
    },
  });
}

export function useEmbedVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { url: string; alt?: string; caption?: string; tags?: string[] }) =>
      api.media.embed(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'library'] });
    },
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: { alt?: string; caption?: string; tags?: string[] };
    }) => api.media.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media', 'library'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'asset', variables.id] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.media.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'library'] });
    },
  });
}
