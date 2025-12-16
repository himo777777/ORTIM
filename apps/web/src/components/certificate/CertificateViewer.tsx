import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download, Share2, ExternalLink, Award } from 'lucide-react';

interface CertificateData {
  id: string;
  certificateNumber: string;
  recipientName: string;
  personnummer: string;
  courseTitle: string;
  issueDate: Date;
  expiryDate?: Date;
  lipusId?: string;
  score?: number;
  verificationUrl: string;
}

interface CertificateViewerProps {
  certificate: CertificateData;
  className?: string;
}

export function CertificateViewer({
  certificate,
  className,
}: CertificateViewerProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handleDownload = async () => {
    // In production, this would call the API to generate PDF
    // For now, we'll use browser print functionality
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const certificateHtml = certificateRef.current?.outerHTML || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certifikat - ${certificate.certificateNumber}</title>
          <style>
            @page { size: A4 landscape; margin: 0; }
            body { margin: 0; padding: 40px; font-family: system-ui, sans-serif; }
            .certificate {
              border: 3px solid #1a365d;
              border-radius: 8px;
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 32px; font-weight: bold; color: #1a365d; margin-bottom: 10px; }
            .subtitle { font-size: 14px; color: #666; }
            .recipient { text-align: center; margin: 40px 0; }
            .recipient-name { font-size: 28px; font-weight: bold; }
            .course-title { font-size: 18px; color: #333; margin-top: 20px; }
            .details { display: flex; justify-content: space-between; margin-top: 40px; }
            .detail-item { text-align: center; }
            .detail-label { font-size: 12px; color: #666; }
            .detail-value { font-size: 14px; font-weight: 500; }
            .qr-section { text-align: center; margin-top: 30px; }
            .qr-label { font-size: 11px; color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          ${certificateHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certifikat - ${certificate.courseTitle}`,
          text: `${certificate.recipientName} har slutfört ${certificate.courseTitle}`,
          url: certificate.verificationUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(certificate.verificationUrl);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Dela
        </Button>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Ladda ner PDF
        </Button>
      </div>

      {/* Certificate Display */}
      <div
        ref={certificateRef}
        className="certificate bg-white border-4 border-blue-900 rounded-lg p-8 shadow-lg max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="header text-center mb-8">
          <div className="flex justify-center mb-4">
            <Award className="h-16 w-16 text-blue-900" />
          </div>
          <h1 className="title text-4xl font-bold text-blue-900 mb-2">CERTIFIKAT</h1>
          <p className="subtitle text-gray-500">
            Utfärdat av Svenska Ortopedföreningen
          </p>
        </div>

        {/* Divider */}
        <div className="w-32 h-1 bg-blue-900 mx-auto mb-8" />

        {/* Recipient */}
        <div className="recipient text-center my-8">
          <p className="text-gray-600 mb-2">Härmed intygas att</p>
          <h2 className="recipient-name text-3xl font-bold mb-4">
            {certificate.recipientName}
          </h2>
          <p className="text-gray-600 mb-2">har genomfört kursen</p>
          <h3 className="course-title text-xl font-semibold text-gray-800">
            {certificate.courseTitle}
          </h3>
        </div>

        {/* Details Grid */}
        <div className="details grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t">
          <div className="detail-item text-center">
            <p className="detail-label text-xs text-gray-500 uppercase mb-1">
              Certifikatnummer
            </p>
            <p className="detail-value font-mono font-medium">
              {certificate.certificateNumber}
            </p>
          </div>
          <div className="detail-item text-center">
            <p className="detail-label text-xs text-gray-500 uppercase mb-1">
              Utfärdandedatum
            </p>
            <p className="detail-value font-medium">
              {formatDate(certificate.issueDate)}
            </p>
          </div>
          {certificate.expiryDate && (
            <div className="detail-item text-center">
              <p className="detail-label text-xs text-gray-500 uppercase mb-1">
                Giltigt till
              </p>
              <p className="detail-value font-medium">
                {formatDate(certificate.expiryDate)}
              </p>
            </div>
          )}
          {certificate.score && (
            <div className="detail-item text-center">
              <p className="detail-label text-xs text-gray-500 uppercase mb-1">
                Resultat
              </p>
              <p className="detail-value font-medium">{certificate.score}%</p>
            </div>
          )}
        </div>

        {/* LIPUS Badge */}
        {certificate.lipusId && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-600 uppercase font-medium mb-1">
              LIPUS-certifierad
            </p>
            <p className="font-mono text-sm">{certificate.lipusId}</p>
          </div>
        )}

        {/* QR Code */}
        <div className="qr-section mt-8 flex flex-col items-center">
          <QRCodeSVG
            value={certificate.verificationUrl}
            size={100}
            level="H"
            includeMargin
          />
          <p className="qr-label text-xs text-gray-500 mt-2">
            Skanna för att verifiera certifikatet
          </p>
        </div>
      </div>

      {/* Verification Link */}
      <div className="text-center">
        <a
          href={certificate.verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {certificate.verificationUrl}
        </a>
      </div>
    </div>
  );
}
