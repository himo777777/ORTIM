import { useQuery, useMutation } from '@tanstack/react-query';
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
    mutationFn: async (_certificateId: string) => {
      // PDF download would be handled by window.open to the PDF URL
      return { success: true };
    },
  });
}
