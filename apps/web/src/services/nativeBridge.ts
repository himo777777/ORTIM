/**
 * Native Bridge Service
 *
 * Provides a unified API for native mobile functionality via Capacitor.
 * Falls back gracefully to web APIs when running in a browser.
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { App, URLOpenListenerEvent } from '@capacitor/app';

export type PushNotificationHandler = (notification: PushNotificationSchema) => void;
export type PushActionHandler = (action: ActionPerformed) => void;
export type DeepLinkHandler = (url: string) => void;

class NativeBridge {
  private isNative: boolean;
  private pushToken: string | null = null;
  private notificationHandlers: PushNotificationHandler[] = [];
  private actionHandlers: PushActionHandler[] = [];
  private deepLinkHandlers: DeepLinkHandler[] = [];

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }

  /**
   * Get the current platform
   */
  getPlatform(): 'ios' | 'android' | 'web' {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  }

  /**
   * Initialize all native services
   */
  async initialize(): Promise<void> {
    if (!this.isNative) {
      console.log('[NativeBridge] Running in web mode');
      return;
    }

    console.log('[NativeBridge] Initializing native services...');

    try {
      // Initialize deep linking
      await this.setupDeepLinks();

      // Initialize keyboard handling
      await this.setupKeyboard();

      // Hide splash screen after app is ready
      setTimeout(() => {
        this.hideSplashScreen();
      }, 500);

      console.log('[NativeBridge] Native services initialized');
    } catch (error) {
      console.error('[NativeBridge] Initialization error:', error);
    }
  }

  // ============================================
  // SPLASH SCREEN
  // ============================================

  async hideSplashScreen(): Promise<void> {
    if (!this.isNative) return;

    try {
      await SplashScreen.hide({
        fadeOutDuration: 300,
      });
    } catch (error) {
      console.error('[NativeBridge] Error hiding splash screen:', error);
    }
  }

  async showSplashScreen(): Promise<void> {
    if (!this.isNative) return;

    try {
      await SplashScreen.show({
        autoHide: false,
      });
    } catch (error) {
      console.error('[NativeBridge] Error showing splash screen:', error);
    }
  }

  // ============================================
  // STATUS BAR
  // ============================================

  async setStatusBarStyle(style: 'light' | 'dark'): Promise<void> {
    if (!this.isNative) return;

    try {
      await StatusBar.setStyle({
        style: style === 'light' ? Style.Light : Style.Dark,
      });
    } catch (error) {
      console.error('[NativeBridge] Error setting status bar style:', error);
    }
  }

  async setStatusBarColor(color: string): Promise<void> {
    if (!this.isNative || Capacitor.getPlatform() !== 'android') return;

    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('[NativeBridge] Error setting status bar color:', error);
    }
  }

  async hideStatusBar(): Promise<void> {
    if (!this.isNative) return;

    try {
      await StatusBar.hide();
    } catch (error) {
      console.error('[NativeBridge] Error hiding status bar:', error);
    }
  }

  async showStatusBar(): Promise<void> {
    if (!this.isNative) return;

    try {
      await StatusBar.show();
    } catch (error) {
      console.error('[NativeBridge] Error showing status bar:', error);
    }
  }

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================

  async initializePushNotifications(): Promise<string | null> {
    if (!this.isNative) {
      console.log('[NativeBridge] Push notifications not available in web mode');
      return null;
    }

    try {
      // Request permission
      const permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        const result = await PushNotifications.requestPermissions();
        if (result.receive !== 'granted') {
          console.log('[NativeBridge] Push notification permission denied');
          return null;
        }
      } else if (permStatus.receive !== 'granted') {
        console.log('[NativeBridge] Push notification permission not granted');
        return null;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('[NativeBridge] Push registration success:', token.value);
        this.pushToken = token.value;
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error: unknown) => {
        console.error('[NativeBridge] Push registration error:', error);
      });

      // Listen for push notifications received
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[NativeBridge] Push received:', notification);
        this.notificationHandlers.forEach(handler => handler(notification));
      });

      // Listen for notification actions
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('[NativeBridge] Push action performed:', action);
        this.actionHandlers.forEach(handler => handler(action));
      });

      return this.pushToken;
    } catch (error) {
      console.error('[NativeBridge] Push notification initialization error:', error);
      return null;
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  onPushNotification(handler: PushNotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
    };
  }

  onPushAction(handler: PushActionHandler): () => void {
    this.actionHandlers.push(handler);
    return () => {
      this.actionHandlers = this.actionHandlers.filter(h => h !== handler);
    };
  }

  // ============================================
  // HAPTICS
  // ============================================

  async hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (!this.isNative) return;

    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }[style];

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('[NativeBridge] Haptic impact error:', error);
    }
  }

  async hapticNotification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    if (!this.isNative) return;

    try {
      const notificationType = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      }[type];

      await Haptics.notification({ type: notificationType });
    } catch (error) {
      console.error('[NativeBridge] Haptic notification error:', error);
    }
  }

  async hapticVibrate(): Promise<void> {
    if (!this.isNative) {
      // Fallback for web
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      return;
    }

    try {
      await Haptics.vibrate();
    } catch (error) {
      console.error('[NativeBridge] Haptic vibrate error:', error);
    }
  }

  async hapticSelectionStart(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.error('[NativeBridge] Haptic selection start error:', error);
    }
  }

  async hapticSelectionChanged(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.error('[NativeBridge] Haptic selection changed error:', error);
    }
  }

  async hapticSelectionEnd(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.error('[NativeBridge] Haptic selection end error:', error);
    }
  }

  // ============================================
  // KEYBOARD
  // ============================================

  private async setupKeyboard(): Promise<void> {
    if (!this.isNative) return;

    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
      document.body.classList.remove('keyboard-open');
    });
  }

  async hideKeyboard(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Keyboard.hide();
    } catch (error) {
      console.error('[NativeBridge] Hide keyboard error:', error);
    }
  }

  // ============================================
  // DEEP LINKS
  // ============================================

  private async setupDeepLinks(): Promise<void> {
    if (!this.isNative) return;

    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('[NativeBridge] Deep link opened:', event.url);
      this.deepLinkHandlers.forEach(handler => handler(event.url));
    });
  }

  onDeepLink(handler: DeepLinkHandler): () => void {
    this.deepLinkHandlers.push(handler);
    return () => {
      this.deepLinkHandlers = this.deepLinkHandlers.filter(h => h !== handler);
    };
  }

  // ============================================
  // APP LIFECYCLE
  // ============================================

  async exitApp(): Promise<void> {
    if (!this.isNative) return;

    try {
      await App.exitApp();
    } catch (error) {
      console.error('[NativeBridge] Exit app error:', error);
    }
  }

  onAppStateChange(handler: (isActive: boolean) => void): () => void {
    if (!this.isNative) {
      // Fallback for web using visibility API
      const visibilityHandler = () => {
        handler(document.visibilityState === 'visible');
      };
      document.addEventListener('visibilitychange', visibilityHandler);
      return () => document.removeEventListener('visibilitychange', visibilityHandler);
    }

    let listenerHandle: { remove: () => void } | null = null;

    App.addListener('appStateChange', (state) => {
      handler(state.isActive);
    }).then(handle => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }

  onBackButton(handler: () => void): () => void {
    if (!this.isNative) return () => {};

    let listenerHandle: { remove: () => void } | null = null;

    App.addListener('backButton', () => {
      handler();
    }).then(handle => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }
}

// Singleton instance
export const nativeBridge = new NativeBridge();
