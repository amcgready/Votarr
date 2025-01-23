// src/hooks/useOfflineSettings.ts
import { useState, useEffect } from 'react';
import { UserSettings } from '@/services/userService';
import { idbService } from '@/services/idbService';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from '@/components/ui/use-toast';

export function useOfflineSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        const cachedSettings = await idbService.getSettings(user.id);
        if (cachedSettings) {
          setSettings(cachedSettings);
        }
      } catch (error) {
        console.error('Failed to load cached settings:', error);
      }
    };

    loadSettings();
  }, [user?.id]);

  useEffect(() => {
    const syncSettings = async () => {
      if (isOnline && !isSyncing) {
        setIsSyncing(true);
        try {
          await idbService.processSyncQueue();
          // Clean up old data while we're at it
          await idbService.clearOldData();
        } catch (error) {
          console.error('Failed to sync settings:', error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    syncSettings();
  }, [isOnline, isSyncing]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user?.id || !settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      // Save to IndexedDB immediately
      await idbService.saveSettings(user.id, updatedSettings);

      // If online, try to sync immediately
      if (isOnline) {
        await idbService.addToSyncQueue(
          '/api/users/settings',
          'update',
          newSettings
        );
        await idbService.processSyncQueue();
      } else {
        toast({
          title: "Offline Mode",
          description: "Changes will be synced when you're back online.",
        });
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Changes will be synced later.",
        variant: "destructive",
      });
    }
  };

  return {
    settings,
    updateSettings,
    isOnline,
    isSyncing,
  };
}
