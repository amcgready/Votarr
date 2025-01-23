// src/components/auth/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useOfflineSettings } from '@/hooks/useOfflineSettings';
import { userService } from '@/services/userService';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// Icons
import { Wifi, WifiOff, Loader2, LogOut, Server, Settings, User } from 'lucide-react';

interface PlexServer {
  id: string;
  name: string;
  address: string;
  port: number;
  version: string;
  connected: boolean;
}

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    settings, 
    updateSettings, 
    isOnline, 
    isSyncing 
  } = useOfflineSettings();
  
  const [isLoading, setIsLoading] = useState(true);
  const [plexServers, setPlexServers] = useState<PlexServer[]>([]);
  const [activeServer, setActiveServer] = useState<string>('');

  useEffect(() => {
    const initializeProfile = async () => {
      setIsLoading(true);
      try {
        const servers = await userService.getPlexServers();
        setPlexServers(servers);
        if (servers.length > 0) {
          setActiveServer(servers[0].id);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (settings) {
      initializeProfile();
    }
  }, [settings]);

  const handleServerChange = async (serverId: string) => {
    try {
      await userService.setActiveServer(serverId);
      setActiveServer(serverId);
    } catch (error) {
      console.error('Failed to change server:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {!isOnline && (
          <Alert className="mb-4 border-yellow-600 bg-yellow-950">
            <WifiOff className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              You're currently offline. Changes will be saved and synced when you're back online.
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={user?.avatarUrl || "/api/placeholder/100/100"}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl text-white">
                      {user?.username}
                    </CardTitle>
                    <Badge variant={isOnline ? "default" : "secondary"}>
                      <span className="flex items-center gap-1">
                        {isOnline ? (
                          <>
                            <Wifi className="h-3 w-3" />
                            Online
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3" />
                            Offline
                          </>
                        )}
                      </span>
                    </Badge>
                    {isSyncing && (
                      <Badge variant="outline">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Syncing...
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{user?.email}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="servers">
                  <Server className="h-4 w-4 mr-2" />
                  Plex Servers
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <Settings className="h-4 w-4 mr-2" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Profile Information</h3>
                    <p className="text-sm text-gray-400">
                      Manage your Plex account information and preferences
                    </p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Username</Label>
                      <p className="text-sm text-gray-400">{user?.username}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="servers" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Connected Servers</h3>
                    <p className="text-sm text-gray-400">
                      Manage your connected Plex Media Servers
                    </p>
                  </div>
                  <Separator />
                  {plexServers.map(server => (
                    <Card key={server.id} className="bg-gray-850">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{server.name}</h4>
                            <p className="text-sm text-gray-400">
                              {server.address}:{server.port}
                            </p>
                            <p className="text-sm text-gray-400">
                              Version: {server.version}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={server.connected ? "success" : "destructive"}>
                              {server.connected ? 'Connected' : 'Disconnected'}
                            </Badge>
                            <Switch
                              checked={activeServer === server.id}
                              onCheckedChange={() => handleServerChange(server.id)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">App Preferences</h3>
                    <p className="text-sm text-gray-400">
                      Customize your application experience
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select
                        value={settings?.theme || 'dark'}
                        onValueChange={(value: 'light' | 'dark' | 'system') => 
                          updateSettings({ theme: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Offline Mode</Label>
                        <p className="text-sm text-gray-400">
                          Enable offline functionality
                        </p>
                      </div>
                      <Switch
                        checked={settings?.offlineMode || false}
                        onCheckedChange={(checked) => 
                          updateSettings({ offlineMode: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notifications</Label>
                        <p className="text-sm text-gray-400">
                          Receive session and vote notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings?.notifications || false}
                        onCheckedChange={(checked) => 
                          updateSettings({ notifications: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
