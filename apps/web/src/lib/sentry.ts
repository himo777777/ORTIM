import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn || import.meta.env.DEV) {
    console.log('Sentry disabled (no DSN or dev mode)');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session replay for errors
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of errors

    // Filter out sensitive data
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        return null;
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      return event;
    },

    // Ignore common non-errors
    ignoreErrors: [
      // Network errors
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'ChunkLoadError',
      // Browser extensions
      'top.GLOBALS',
      // User actions
      'ResizeObserver loop',
      'Non-Error promise rejection',
    ],

    // Additional context
    initialScope: {
      tags: {
        app: 'ortac-web',
      },
    },
  });
}

// Error boundary wrapper
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Capture exceptions manually
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Set user context
export function setUser(user: { id: string; email?: string; role?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      // Don't send PII like names
    });
  } else {
    Sentry.setUser(null);
  }
}

// Add breadcrumb for debugging
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}
