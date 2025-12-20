import { useEffect, useCallback, useState } from 'react';
import { nativeBridge } from '@/services/nativeBridge';

/**
 * Hook for accessing native mobile functionality
 */
export function useNative() {
  const [isNative] = useState(() => nativeBridge.isNativePlatform());
  const [platform] = useState(() => nativeBridge.getPlatform());
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Initialize native bridge on mount
  useEffect(() => {
    nativeBridge.initialize();
  }, []);

  // Haptic feedback functions
  const hapticImpact = useCallback(
    (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      nativeBridge.hapticImpact(style);
    },
    []
  );

  const hapticSuccess = useCallback(() => {
    nativeBridge.hapticNotification('success');
  }, []);

  const hapticWarning = useCallback(() => {
    nativeBridge.hapticNotification('warning');
  }, []);

  const hapticError = useCallback(() => {
    nativeBridge.hapticNotification('error');
  }, []);

  const hapticVibrate = useCallback(() => {
    nativeBridge.hapticVibrate();
  }, []);

  // Push notification functions
  const initializePush = useCallback(async () => {
    const token = await nativeBridge.initializePushNotifications();
    setPushToken(token);
    return token;
  }, []);

  // Status bar functions
  const setStatusBarStyle = useCallback((style: 'light' | 'dark') => {
    nativeBridge.setStatusBarStyle(style);
  }, []);

  const setStatusBarColor = useCallback((color: string) => {
    nativeBridge.setStatusBarColor(color);
  }, []);

  // Keyboard functions
  const hideKeyboard = useCallback(() => {
    nativeBridge.hideKeyboard();
  }, []);

  return {
    // State
    isNative,
    platform,
    pushToken,

    // Haptics
    hapticImpact,
    hapticSuccess,
    hapticWarning,
    hapticError,
    hapticVibrate,

    // Push notifications
    initializePush,

    // Status bar
    setStatusBarStyle,
    setStatusBarColor,

    // Keyboard
    hideKeyboard,

    // App lifecycle
    onAppStateChange: nativeBridge.onAppStateChange.bind(nativeBridge),
    onBackButton: nativeBridge.onBackButton.bind(nativeBridge),
    onDeepLink: nativeBridge.onDeepLink.bind(nativeBridge),
    exitApp: nativeBridge.exitApp.bind(nativeBridge),
  };
}

/**
 * Hook for native haptic feedback on UI interactions
 */
export function useHapticFeedback() {
  const { hapticImpact, hapticSuccess, hapticError, isNative } = useNative();

  const onPress = useCallback(() => {
    if (isNative) hapticImpact('light');
  }, [isNative, hapticImpact]);

  const onLongPress = useCallback(() => {
    if (isNative) hapticImpact('medium');
  }, [isNative, hapticImpact]);

  const onSuccess = useCallback(() => {
    if (isNative) hapticSuccess();
  }, [isNative, hapticSuccess]);

  const onError = useCallback(() => {
    if (isNative) hapticError();
  }, [isNative, hapticError]);

  return {
    onPress,
    onLongPress,
    onSuccess,
    onError,
  };
}

/**
 * Hook for handling native back button (Android)
 */
export function useNativeBackButton(handler: () => boolean) {
  const { onBackButton, isNative } = useNative();

  useEffect(() => {
    if (!isNative) return;

    const unsubscribe = onBackButton(() => {
      const handled = handler();
      if (!handled) {
        // Default behavior - let the system handle it
      }
    });

    return unsubscribe;
  }, [isNative, onBackButton, handler]);
}

/**
 * Hook for handling deep links
 */
export function useDeepLinks(handler: (url: string) => void) {
  const { onDeepLink, isNative } = useNative();

  useEffect(() => {
    if (!isNative) return;

    const unsubscribe = onDeepLink(handler);
    return unsubscribe;
  }, [isNative, onDeepLink, handler]);
}

/**
 * Hook for handling app state changes (foreground/background)
 */
export function useAppState(handler: (isActive: boolean) => void) {
  const { onAppStateChange } = useNative();

  useEffect(() => {
    const unsubscribe = onAppStateChange(handler);
    return unsubscribe;
  }, [onAppStateChange, handler]);
}
