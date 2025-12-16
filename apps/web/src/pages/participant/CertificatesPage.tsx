import { useParams, useNavigate } from 'react-router-dom';
import { useCertificates, useCertificate } from '@/hooks/useCertificate';
import { CertificateViewer, CertificateCard } from '@/components/certificate';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award, AlertTriangle } from 'lucide-react';

export default function CertificatesPage() {
  const { certificateId } = useParams<{ certificateId: string }>();

  // If viewing a specific certificate
  if (certificateId) {
    return <CertificateDetail certificateId={certificateId} />;
  }

  // List view
  return <CertificatesList />;
}

function CertificatesList() {
  const { data: certificates, isLoading, error } = useCertificates();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Kunde inte ladda certifikat</h1>
        <p className="text-muted-foreground">
          Något gick fel. Försök igen senare.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Award className="h-8 w-8 text-primary" />
          Mina Certifikat
        </h1>
        <p className="text-muted-foreground mt-1">
          Dina utfärdade certifikat och intyg
        </p>
      </div>

      {/* Certificates List */}
      {certificates && certificates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <CertificateCard
              key={cert.id}
              id={cert.id}
              certificateNumber={cert.certificateNumber}
              courseTitle={cert.courseName}
              issueDate={new Date(cert.issuedAt)}
              expiryDate={cert.validUntil ? new Date(cert.validUntil) : undefined}
              isValid={new Date(cert.validUntil) > new Date()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border rounded-xl">
          <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Inga certifikat ännu</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            När du har slutfört kursen och klarat slutexamen kommer ditt certifikat att visas här.
          </p>
        </div>
      )}
    </div>
  );
}

function CertificateDetail({ certificateId }: { certificateId: string }) {
  const navigate = useNavigate();
  const { data: certificate, isLoading, error } = useCertificate(certificateId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Certifikatet hittades inte</h1>
        <p className="text-muted-foreground mb-6">
          Det begärda certifikatet kunde inte hittas.
        </p>
        <Button onClick={() => navigate('/certificates')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till certifikat
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/certificates')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Alla certifikat
      </Button>

      <CertificateViewer
        certificate={{
          id: certificate.id,
          certificateNumber: certificate.certificateNumber,
          recipientName: 'Kursdeltagare', // API returns user separately
          personnummer: '', // Not included in certificate response
          courseTitle: certificate.courseName,
          issueDate: new Date(certificate.issuedAt),
          expiryDate: certificate.validUntil ? new Date(certificate.validUntil) : undefined,
          lipusId: undefined, // API doesn't include this field
          score: certificate.examScore,
          verificationUrl: certificate.verificationUrl,
        }}
      />
    </div>
  );
}
