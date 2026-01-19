import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCertificates() {
  return useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const certs = await api.certificates.list();
      return certs.map((c) => ({
        ...c,
        courseTitle: c.courseName,
        issueDate: c.issuedAt,
        expiryDate: c.validUntil,
        isValid: c.examPassed,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCertificate(certificateId: string) {
  return useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => api.certificates.getById(certificateId),
    staleTime: 60 * 60 * 1000,
  });
}

export function useVerifyCertificate(certificateNumber: string) {
  return useQuery({
    queryKey: ['certificate', 'verify', certificateNumber],
    queryFn: () => api.certificates.verify(certificateNumber),
    enabled: !!certificateNumber,
  });
}

export function useDownloadCertificate() {
  return useMutation({
    mutationFn: async (certificateId: string) => {
      const blob = await api.certificates.downloadPdf(certificateId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certifikat-${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
  });
}

export function useCheckAndGenerateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseCode: string) => api.certificates.checkAndGenerate(courseCode),
    onSuccess: (data) => {
      // Invalidate certificates list if a new certificate was generated
      if (data.certificate && !data.alreadyHasCertificate) {
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
      }
      // Also invalidate instructor training status
      queryClient.invalidateQueries({ queryKey: ['instructor', 'my-training'] });
    },
  });
}

export function useCertificateExpirationStatus(certificateId: string) {
  return useQuery({
    queryKey: ['certificate', certificateId, 'status'],
    queryFn: () => api.certificates.getExpirationStatus(certificateId),
    enabled: !!certificateId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecertify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificateId: string) => api.certificates.recertify(certificateId),
    onSuccess: () => {
      // Invalidate certificates list to show new certificate
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      // Invalidate instructor training status
      queryClient.invalidateQueries({ queryKey: ['instructor', 'my-training'] });
    },
  });
}
