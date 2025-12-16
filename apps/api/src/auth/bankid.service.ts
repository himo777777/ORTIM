import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface BankIdSession {
  id: string;
  state: 'pending' | 'complete' | 'failed';
  qrData: string;
  autoStartToken?: string;
  personnummer?: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

// In-memory session store (should be Redis in production)
const sessions = new Map<string, BankIdSession>();

@Injectable()
export class BankIdService {
  private readonly logger = new Logger(BankIdService.name);
  private readonly isMockMode: boolean;

  constructor(private configService: ConfigService) {
    this.isMockMode = configService.get<string>('ENABLE_MOCK_BANKID') === 'true';
    if (this.isMockMode) {
      this.logger.warn('BankID mock mode is enabled');
    }
  }

  async initiateAuth(): Promise<{ sessionId: string; qrData: string; autoStartToken?: string }> {
    const sessionId = uuidv4();

    if (this.isMockMode) {
      // Mock mode for development
      const session: BankIdSession = {
        id: sessionId,
        state: 'pending',
        qrData: `bankid://mock?session=${sessionId}`,
        autoStartToken: `mock-token-${sessionId}`,
        createdAt: new Date(),
      };

      sessions.set(sessionId, session);

      // Auto-complete after 3 seconds in mock mode
      setTimeout(() => {
        const s = sessions.get(sessionId);
        if (s && s.state === 'pending') {
          s.state = 'complete';
          s.personnummer = '199001011234'; // Mock personnummer
          s.firstName = 'Test';
          s.lastName = 'Användare';
        }
      }, 3000);

      return {
        sessionId,
        qrData: session.qrData,
        autoStartToken: session.autoStartToken,
      };
    }

    // Real Criipto integration would go here
    // For now, throw an error if not in mock mode and Criipto is not configured
    const criiptoDomain = this.configService.get<string>('CRIIPTO_DOMAIN');
    if (!criiptoDomain) {
      throw new Error('Criipto is not configured. Enable ENABLE_MOCK_BANKID for development.');
    }

    // TODO: Implement real Criipto OIDC flow
    // 1. Create authorization request
    // 2. Generate QR code from autostart URL
    // 3. Return session ID and QR data

    throw new Error('Real BankID integration not implemented yet');
  }

  async pollStatus(sessionId: string): Promise<{
    state: 'pending' | 'complete' | 'failed';
    personnummer?: string;
    firstName?: string;
    lastName?: string;
  }> {
    const session = sessions.get(sessionId);

    if (!session) {
      return { state: 'failed' };
    }

    // Check for timeout (2 minutes)
    const timeoutMs = 2 * 60 * 1000;
    if (Date.now() - session.createdAt.getTime() > timeoutMs) {
      session.state = 'failed';
    }

    if (session.state === 'complete') {
      // Clean up session after successful auth
      sessions.delete(sessionId);

      return {
        state: 'complete',
        personnummer: session.personnummer,
        firstName: session.firstName,
        lastName: session.lastName,
      };
    }

    if (session.state === 'failed') {
      sessions.delete(sessionId);
    }

    return { state: session.state };
  }

  async cancelAuth(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.state = 'failed';
      sessions.delete(sessionId);
    }
  }
}
