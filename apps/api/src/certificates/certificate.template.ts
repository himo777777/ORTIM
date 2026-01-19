/**
 * HTML template for generating PDF certificates
 * Uses inline styles for Puppeteer compatibility
 */

interface CertificateData {
  certificateNumber: string;
  recipientName: string;
  courseName: string;
  courseCode: string;
  issuedAt: Date;
  validUntil: Date;
  examScore: number | null;
  examPassed: boolean;
  lipusNumber: string | null;
  verificationCode: string;
  verificationUrl: string;
  signerName?: string;
  signerTitle?: string;
  logoUrl?: string;
  signatureImageUrl?: string;
}

export function generateCertificateHtml(data: CertificateData): string {
  const issueDate = data.issuedAt.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validUntilDate = data.validUntil.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate QR code as an embedded SVG using a simple pattern
  // The actual QR code will be generated server-side using the qrcode library
  const qrCodePlaceholder = `VERIFY:${data.verificationCode}`;

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certifikat - ${data.certificateNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Open Sans', sans-serif;
      background: white;
      color: #1a1a1a;
    }

    .certificate {
      width: 297mm;
      height: 210mm;
      padding: 15mm 20mm;
      position: relative;
      background: linear-gradient(135deg, #fefefe 0%, #f8f9fa 100%);
      border: 3px solid #c9a227;
      box-shadow: inset 0 0 0 1px #e0e0e0;
    }

    .border-decoration {
      position: absolute;
      top: 8mm;
      left: 8mm;
      right: 8mm;
      bottom: 8mm;
      border: 1px solid #c9a227;
      pointer-events: none;
    }

    .corner {
      position: absolute;
      width: 20mm;
      height: 20mm;
      border: 2px solid #c9a227;
    }

    .corner-tl { top: 5mm; left: 5mm; border-right: none; border-bottom: none; }
    .corner-tr { top: 5mm; right: 5mm; border-left: none; border-bottom: none; }
    .corner-bl { bottom: 5mm; left: 5mm; border-right: none; border-top: none; }
    .corner-br { bottom: 5mm; right: 5mm; border-left: none; border-top: none; }

    .header {
      text-align: center;
      margin-bottom: 10mm;
    }

    .logo {
      height: 18mm;
      margin-bottom: 5mm;
    }

    .organization {
      font-size: 14pt;
      color: #555;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 3mm;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 36pt;
      font-weight: 600;
      color: #1a1a1a;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }

    .subtitle {
      font-size: 12pt;
      color: #666;
      letter-spacing: 1px;
    }

    .content {
      text-align: center;
      margin: 10mm 0;
    }

    .confirms-text {
      font-size: 11pt;
      color: #555;
      margin-bottom: 5mm;
    }

    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-size: 28pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8mm;
      padding: 3mm 0;
      border-bottom: 1px solid #c9a227;
      display: inline-block;
      min-width: 150mm;
    }

    .course-text {
      font-size: 11pt;
      color: #555;
      margin-bottom: 3mm;
    }

    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 18pt;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 5mm;
    }

    .course-code {
      font-size: 10pt;
      color: #888;
      margin-bottom: 8mm;
    }

    .details {
      display: flex;
      justify-content: center;
      gap: 20mm;
      margin: 8mm 0;
      font-size: 10pt;
    }

    .detail-item {
      text-align: center;
    }

    .detail-label {
      color: #888;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 1px;
      margin-bottom: 1mm;
    }

    .detail-value {
      color: #1a1a1a;
      font-weight: 600;
    }

    .footer {
      position: absolute;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .signature-section {
      text-align: center;
    }

    .signature-line {
      width: 50mm;
      border-top: 1px solid #1a1a1a;
      margin-bottom: 2mm;
    }

    .signer-name {
      font-size: 10pt;
      font-weight: 600;
    }

    .signer-title {
      font-size: 9pt;
      color: #666;
    }

    .qr-section {
      text-align: center;
    }

    .qr-code {
      width: 25mm;
      height: 25mm;
      margin-bottom: 2mm;
    }

    .verification-text {
      font-size: 7pt;
      color: #888;
    }

    .certificate-number {
      font-size: 8pt;
      color: #888;
      margin-top: 1mm;
    }

    .lipus {
      position: absolute;
      bottom: 20mm;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
    }

    .lipus-badge {
      background: #f0f0f0;
      padding: 2mm 5mm;
      border-radius: 2mm;
      font-size: 8pt;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <!-- Decorative border -->
    <div class="border-decoration"></div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <!-- Header -->
    <div class="header">
      ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" class="logo">` : ''}
      <div class="organization">Svensk Ortopedisk Traumaförening</div>
      <h1 class="title">Certifikat</h1>
      <div class="subtitle">Certificate of Completion</div>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="confirms-text">Detta certifikat bekräftar att</p>
      <h2 class="recipient-name">${data.recipientName}</h2>
      <p class="course-text">har framgångsrikt genomfört kursen</p>
      <h3 class="course-name">${data.courseName}</h3>
      <p class="course-code">${data.courseCode}</p>

      <div class="details">
        <div class="detail-item">
          <div class="detail-label">Utfärdat</div>
          <div class="detail-value">${issueDate}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Giltigt till</div>
          <div class="detail-value">${validUntilDate}</div>
        </div>
        ${data.examScore !== null ? `
        <div class="detail-item">
          <div class="detail-label">Resultat</div>
          <div class="detail-value">${Math.round(data.examScore)}%</div>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- LIPUS badge if applicable -->
    ${data.lipusNumber ? `
    <div class="lipus">
      <div class="lipus-badge">LIPUS-nummer: ${data.lipusNumber}</div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <!-- Signature -->
      <div class="signature-section">
        ${data.signatureImageUrl ? `<img src="${data.signatureImageUrl}" alt="Signature" style="height: 15mm; margin-bottom: 2mm;">` : ''}
        <div class="signature-line"></div>
        <div class="signer-name">${data.signerName || 'Kursledare'}</div>
        <div class="signer-title">${data.signerTitle || 'Svensk Ortopedisk Traumaförening'}</div>
      </div>

      <!-- QR Code -->
      <div class="qr-section">
        <div class="qr-code" id="qr-code"></div>
        <div class="verification-text">Verifiera certifikatet</div>
        <div class="verification-text">${data.verificationUrl}</div>
        <div class="certificate-number">${data.certificateNumber}</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
