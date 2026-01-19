import { useParams, useNavigate } from 'react-router-dom';
import { useCertificates, useCertificate, useDownloadCertificate, useCertificateExpirationStatus, useRecertify } from '@/hooks/useCertificate';
import { CertificateViewer, CertificateCard } from '@/components/certificate';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Award, AlertTriangle, Download, Loader2, RefreshCcw, Clock, CheckCircle } from 'lucide-react';

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
  const { data: expirationStatus } = useCertificateExpirationStatus(certificateId);
  const downloadPdf = useDownloadCertificate();
  const recertify = useRecertify();

  const handleDownload = () => {
    downloadPdf.mutate(certificateId);
  };

  const handleRecertify = () => {
    recertify.mutate(certificateId, {
      onSuccess: (data) => {
        if (data.eligible && data.certificate) {
          // Navigate to the new certificate
          navigate(`/certificates/${data.certificate.id}`);
        }
      },
    });
  };

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
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/certificates')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Alla certifikat
        </Button>

        <div className="flex items-center gap-2">
          {expirationStatus?.canRecertify && (
            <Button
              variant="outline"
              onClick={handleRecertify}
              disabled={recertify.isPending}
            >
              {recertify.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Förnya certifikat
            </Button>
          )}

          <Button
            onClick={handleDownload}
            disabled={downloadPdf.isPending}
          >
            {downloadPdf.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Ladda ner PDF
          </Button>
        </div>
      </div>

      {/* Expiration status alert */}
      {expirationStatus && (
        <>
          {expirationStatus.status === 'expired' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Certifikatet har gått ut</AlertTitle>
              <AlertDescription>
                Detta certifikat gick ut för {Math.abs(expirationStatus.daysUntilExpiry)} dagar sedan.
                Du kan förnya certifikatet genom att klicka på "Förnya certifikat".
              </AlertDescription>
            </Alert>
          )}

          {expirationStatus.status === 'expiring_soon' && (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-400">Certifikatet går snart ut</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Detta certifikat går ut om {expirationStatus.daysUntilExpiry} dagar.
                {expirationStatus.canRecertify && ' Du kan förnya det nu.'}
              </AlertDescription>
            </Alert>
          )}

          {expirationStatus.status === 'valid' && expirationStatus.daysUntilExpiry > 90 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Giltigt i {expirationStatus.daysUntilExpiry} dagar</span>
              {expirationStatus.isRecertification && (
                <Badge variant="outline" className="ml-2">
                  Förnyat {expirationStatus.recertificationCount}x
                </Badge>
              )}
            </div>
          )}
        </>
      )}

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
