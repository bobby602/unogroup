"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    isUpdateAvailable: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Check if app is installed
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore - iOS Safari
      window.navigator.standalone === true;

    setState((prev) => ({ ...prev, isInstalled: isStandalone }));
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    setState((prev) => ({ ...prev, isOnline: navigator.onLine }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState((prev) => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState((prev) => ({ ...prev, isInstallable: false, isInstalled: true }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setState((prev) => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }, []);

  // Install app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setState((prev) => ({ ...prev, isInstallable: false }));
      return true;
    }
    
    return false;
  }, [deferredPrompt]);

  // Update app
  const updateApp = useCallback(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      });
    }
  }, []);

  return {
    ...state,
    installApp,
    updateApp,
  };
}

/**
 * Hook for push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Get existing subscription
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return "unsupported";
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

 const subscribe = useCallback(async (vapidPublicKey: string) => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // ตรวจสอบให้แน่ใจว่ามี 'const sub =' อยู่ข้างหน้า
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // ใส่ 'as any' เพื่อแก้ปัญหา Uint8Array ที่คุณเจอในขั้นตอนก่อนหน้า
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
    });

    setSubscription(sub); // ตอนนี้จะหา 'sub' เจอแล้ว
    return sub;
  }, []);

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
    }
  }, [subscription]);

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    isSupported: "Notification" in window && "PushManager" in window,
  };
}

// Helper function
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
