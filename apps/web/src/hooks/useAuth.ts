import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '@ortac/shared';

export function useInitiateBankID() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.auth.initiateBankId(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function usePollBankID(sessionId: string | null) {
  const { setUser, setTokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['bankid-poll', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No sessionId');
      const response = await api.auth.pollBankId(sessionId);

      if (response.state === 'complete' && response.user && response.token && response.refreshToken) {
        setUser({
          ...response.user,
          role: response.user.role as UserRole,
        });
        setTokens(response.token, response.refreshToken);
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }

      return response;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.state === 'complete' || data?.state === 'failed') {
        return false;
      }
      return 2000;
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      logout();
      queryClient.clear();
      navigate('/login');
    },
  });
}

export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.auth.me(),
    enabled: isAuthenticated && !user,
    staleTime: 5 * 60 * 1000,
  });
}
