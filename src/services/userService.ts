// src/services/userService.ts
import { toast } from '@/components/ui/use-toast';

export interface UserSettings {
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultVotingTime: number;
  emailNotifications: boolean;
}

export interface PlexServer {
  id: string;
  name: string;
  status: 'online' | 'offline';
  url: string;
  lastSeen?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  settings: UserSettings;
  plexServers: PlexServer[];
}

class UserService {
  private baseUrl = '/api/users';

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }
    return response.json();
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('plexToken')}`,
        },
      });
      return this.handleResponse<UserProfile>(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user profile",
        variant: "destructive",
      });
      throw error;
    }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('plexToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      return this.handleResponse<UserSettings>(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
      throw error;
    }
  }

  async getPlexServers(): Promise<PlexServer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/plex-servers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('plexToken')}`,
        },
      });
      return this.handleResponse<PlexServer[]>(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch Plex servers",
        variant: "destructive",
      });
      throw error;
    }
  }

  async updateNotificationPreferences(preferences: {
    notifications: boolean;
    emailNotifications: boolean;
  }): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('plexToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      await this.handleResponse(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
      throw error;
    }
  }
}

export const userService = new UserService();
