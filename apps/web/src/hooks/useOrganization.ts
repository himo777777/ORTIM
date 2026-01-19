import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============================================
// ORGANIZATION PORTAL (for managers)
// ============================================

export function useOrganizationPortal() {
  return useQuery({
    queryKey: ['organization', 'portal', 'dashboard'],
    queryFn: () => api.organizationPortal.getDashboard(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOrganizationEmployees(params?: {
  skip?: number;
  take?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['organization', 'portal', 'employees', params],
    queryFn: () => api.organizationPortal.getEmployees(params),
    staleTime: 30 * 1000,
  });
}

export function useOrganizationEmployee(id: string) {
  return useQuery({
    queryKey: ['organization', 'portal', 'employee', id],
    queryFn: () => api.organizationPortal.getEmployee(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useExportOrganizationData() {
  return useMutation({
    mutationFn: async () => {
      const blob = await api.organizationPortal.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organization-employees-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

// ============================================
// ORGANIZATION ADMIN (for system admins)
// ============================================

export function useAdminOrganizations(params?: {
  skip?: number;
  take?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'organizations', params],
    queryFn: () => api.organization.list(params),
    staleTime: 30 * 1000,
  });
}

export function useAdminOrganization(id: string) {
  return useQuery({
    queryKey: ['admin', 'organization', id],
    queryFn: () => api.organization.get(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      organizationNumber?: string;
      contactEmail: string;
      contactPhone?: string;
      address?: string;
      reportFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      logoUrl?: string;
    }) => api.organization.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: {
        name?: string;
        organizationNumber?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        reportFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
        reportEnabled?: boolean;
        logoUrl?: string;
        isActive?: boolean;
      };
    }) => api.organization.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', variables.id] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.organization.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
  });
}

export function useAddOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, data }: {
      organizationId: string;
      data: {
        userId: string;
        role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
        department?: string;
      };
    }) => api.organization.addMember(organizationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', variables.organizationId] });
    },
  });
}

export function useUpdateOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, userId, data }: {
      organizationId: string;
      userId: string;
      data: {
        role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
        department?: string;
      };
    }) => api.organization.updateMember(organizationId, userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', variables.organizationId] });
    },
  });
}

export function useRemoveOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      api.organization.removeMember(organizationId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', variables.organizationId] });
    },
  });
}

export function useAddReportRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, data }: {
      organizationId: string;
      data: { email: string; name?: string };
    }) => api.organization.addRecipient(organizationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', variables.organizationId] });
    },
  });
}

export function useRemoveReportRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, recipientId }: { organizationId: string; recipientId: string }) =>
      api.organization.removeRecipient(recipientId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', variables.organizationId] });
    },
  });
}
