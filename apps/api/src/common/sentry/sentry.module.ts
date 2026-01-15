import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// NOTE: Install @sentry/node before using: npm install @sentry/node
// This module is prepared for when the package is installed

@Global()
@Module({})
export class SentryModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get('SENTRY_DSN');
    const environment = this.configService.get('SENTRY_ENVIRONMENT') || 'production';
    const nodeEnv = this.configService.get('NODE_ENV');

    if (!dsn || nodeEnv === 'development') {
      console.log('Sentry disabled (no DSN or dev mode)');
      return;
    }

    try {
      // Dynamic import to avoid errors if package not installed
      import('@sentry/node').then((Sentry) => {
        Sentry.init({
          dsn,
          environment,
          tracesSampleRate: 0.1,

          // Filter sensitive data
          beforeSend(event) {
            // Remove authorization headers
            if (event.request?.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }
            return event;
          },

          // Ignore common errors
          ignoreErrors: [
            'ECONNRESET',
            'EPIPE',
            'ENOTFOUND',
          ],
        });

        console.log(`✓ Sentry initialized (${environment})`);
      }).catch(() => {
        console.log('Sentry package not installed - skipping initialization');
      });
    } catch {
      console.log('Sentry package not installed - skipping initialization');
    }
  }
}

// Helper functions for manual error capture
export async function captureException(error: Error, context?: Record<string, unknown>) {
  try {
    const Sentry = await import('@sentry/node');
    Sentry.captureException(error, { extra: context });
  } catch {
    // Sentry not installed, just log
    console.error('Error:', error, context);
  }
}

export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  try {
    const Sentry = await import('@sentry/node');
    Sentry.captureMessage(message, level);
  } catch {
    // Sentry not installed, just log
    console.log(`[${level}] ${message}`);
  }
}

export async function setUser(user: { id: string; email?: string } | null) {
  try {
    const Sentry = await import('@sentry/node');
    Sentry.setUser(user);
  } catch {
    // Sentry not installed
  }
}
