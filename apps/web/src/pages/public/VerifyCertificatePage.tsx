import { useParams } from 'react-router-dom';

export default function VerifyCertificatePage() {
  const { code } = useParams();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border rounded-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-4">Verifiera Certifikat</h1>
        <p className="text-muted-foreground text-center">
          Verifierar certifikat: {code}
        </p>
      </div>
    </div>
  );
}
