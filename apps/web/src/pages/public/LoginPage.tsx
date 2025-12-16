import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Smartphone, AlertCircle, RefreshCw } from 'lucide-react';
import { BANKID_POLL_INTERVAL_MS, BANKID_TIMEOUT_MS } from '@b-ortim/shared';

type LoginState = 'idle' | 'initiating' | 'scanning' | 'success' | 'error';

export default function LoginPage() {
  const [state, setState] = useState<LoginState>('idle');
  const [qrData, setQrData] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const initiateLogin = async () => {
    try {
      setState('initiating');
      setError(null);

      const response = await fetch('/api/auth/bankid/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Kunde inte starta BankID');
      }

      const data = await response.json();
      setQrData(data.qrData);
      setSessionId(data.sessionId);
      setState('scanning');
    } catch {
      setState('error');
      setError('Kunde inte starta BankID. Försök igen.');
    }
  };

  // Poll for completion
  useEffect(() => {
    if (state !== 'scanning' || !sessionId) return;

    let isActive = true;
    const startTime = Date.now();

    const poll = async () => {
      if (!isActive) return;

      // Check for timeout
      if (Date.now() - startTime > BANKID_TIMEOUT_MS) {
        setState('error');
        setError('Tidsgräns överskriden. Försök igen.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/bankid/poll/${sessionId}`);
        const data = await response.json();

        if (!isActive) return;

        if (data.state === 'complete') {
          setState('success');
          login(data.token, data.refreshToken, data.user);
          navigate('/', { replace: true });
        } else if (data.state === 'failed') {
          setState('error');
          setError('BankID-autentisering misslyckades. Försök igen.');
        } else {
          // Continue polling
          setTimeout(poll, BANKID_POLL_INTERVAL_MS);
        }
      } catch {
        // Network error, continue polling
        if (isActive) {
          setTimeout(poll, BANKID_POLL_INTERVAL_MS);
        }
      }
    };

    poll();

    return () => {
      isActive = false;
    };
  }, [state, sessionId, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl">
              B
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">B-ORTIM</h1>
          <p className="text-muted-foreground mt-2">
            Basic Orthopaedic Resuscitation and Trauma Initial Management
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card border rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-center mb-6">Logga in</h2>

          {state === 'idle' && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground text-sm">
                Använd Mobilt BankID för att logga in säkert.
              </p>
              <Button onClick={initiateLogin} size="lg" className="w-full">
                <Smartphone className="mr-2 h-5 w-5" />
                Logga in med BankID
              </Button>
            </div>
          )}

          {state === 'initiating' && (
            <div className="flex flex-col items-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">Startar BankID...</p>
            </div>
          )}

          {state === 'scanning' && qrData && (
            <div className="flex flex-col items-center space-y-6">
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG value={qrData} size={200} level="M" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-foreground font-medium">
                  Skanna QR-koden med BankID-appen
                </p>
                <p className="text-xs text-muted-foreground">
                  Öppna BankID på din telefon och skanna koden
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <LoadingSpinner size="sm" />
                <span className="text-sm">Väntar på BankID...</span>
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-foreground font-medium">Inloggning lyckades!</p>
              <p className="text-muted-foreground text-sm">Omdirigerar...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-center text-destructive font-medium">{error}</p>
              <Button onClick={initiateLogin} variant="outline" className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Försök igen
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Genom att logga in godkänner du våra användarvillkor och integritetspolicy.
        </p>
      </div>
    </div>
  );
}
