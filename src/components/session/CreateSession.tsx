// src/components/session/CreateSession.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Steps, Step } from '@/components/ui/steps';
import { ServerIcon, Users, Timer, Settings } from 'lucide-react';

interface CreateSessionProps {
  onSessionCreated?: (sessionId: string) => void;
}

const CreateSession: React.FC<CreateSessionProps> = ({ onSessionCreated }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string>('');
  
  // Plex connection state
  const [plexServer, setPlexServer] = useState<string>('');
  const [availableServers, setAvailableServers] = useState<Array<{id: string, name: string}>>([]);
  
  // Session settings state
  const [sessionSettings, setSessionSettings] = useState({
    name: '',
    maxParticipants: 8,
    votingTime: 60,
    votingStyle: 'ranked',
    allowLateJoin: true,
    requireConsensus: false
  });

  const handlePlexAuth = async () => {
    try {
      // This would integrate with your Plex authentication service
      const response = await fetch('/api/auth/plex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to authenticate with Plex');
      
      const data = await response.json();
      setAvailableServers(data.servers);
      setCurrentStep(1);
    } catch (err) {
      setError('Failed to connect to Plex. Please try again.');
    }
  };

  const handleCreateSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plexServer,
          ...sessionSettings
        })
      });

      if (!response.ok) throw new Error('Failed to create session');

      const { sessionId } = await response.json();
      if (onSessionCreated) {
        onSessionCreated(sessionId);
      }
      navigate(`/session/${sessionId}`);
    } catch (err) {
      setError('Failed to create session. Please try again.');
    }
  };

  const steps = [
    {
      title: 'Connect Plex',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <ServerIcon className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-lg font-medium">Connect your Plex Media Server</h3>
            <p className="text-gray-400 mt-2">
              We'll need access to your Plex server to show available content for voting
            </p>
          </div>
          <Button 
            onClick={handlePlexAuth} 
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Connect to Plex
          </Button>
        </div>
      )
    },
    {
      title: 'Select Server',
      content: (
        <div className="space-y-6">
          <Label>Choose Plex Server</Label>
          <RadioGroup
            value={plexServer}
            onValueChange={setPlexServer}
          >
            {availableServers.map(server => (
              <div key={server.id} className="flex items-center space-x-2">
                <RadioGroupItem value={server.id} id={server.id} />
                <Label htmlFor={server.id}>{server.name}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    },
    {
      title: 'Configure Session',
      content: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="sessionName">Session Name</Label>
            <Input
              id="sessionName"
              value={sessionSettings.name}
              onChange={(e) => setSessionSettings(prev => ({
                ...prev,
                name: e.target.value
              }))}
              placeholder="Movie Night!"
              className="bg-gray-700 border-gray-600"
            />
          </div>

          <div>
            <Label>Maximum Participants</Label>
            <Slider
              value={[sessionSettings.maxParticipants]}
              onValueChange={([value]) => setSessionSettings(prev => ({
                ...prev,
                maxParticipants: value
              }))}
              max={20}
              min={2}
              step={1}
              className="mt-2"
            />
            <p className="text-sm text-gray-400 mt-1">
              {sessionSettings.maxParticipants} participants
            </p>
          </div>

          <div>
            <Label>Voting Time (seconds)</Label>
            <Slider
              value={[sessionSettings.votingTime]}
              onValueChange={([value]) => setSessionSettings(prev => ({
                ...prev,
                votingTime: value
              }))}
              max={300}
              min={30}
              step={30}
              className="mt-2"
            />
            <p className="text-sm text-gray-400 mt-1">
              {sessionSettings.votingTime} seconds per round
            </p>
          </div>

          <div>
            <Label>Voting Style</Label>
            <RadioGroup
              value={sessionSettings.votingStyle}
              onValueChange={(value) => setSessionSettings(prev => ({
                ...prev,
                votingStyle: value
              }))}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ranked" id="ranked" />
                <Label htmlFor="ranked">Ranked Choice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single Vote</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Late Join</Label>
              <p className="text-sm text-gray-400">
                Let others join after voting starts
              </p>
            </div>
            <Switch
              checked={sessionSettings.allowLateJoin}
              onCheckedChange={(checked) => setSessionSettings(prev => ({
                ...prev,
                allowLateJoin: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Consensus</Label>
              <p className="text-sm text-gray-400">
                All participants must agree on final selection
              </p>
            </div>
            <Switch
              checked={sessionSettings.requireConsensus}
              onCheckedChange={(checked) => setSessionSettings(prev => ({
                ...prev,
                requireConsensus: checked
              }))}
            />
          </div>
        </div>
      )
    }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return !!plexServer;
      case 2:
        return !!sessionSettings.name;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Create New Session</CardTitle>
            <CardDescription>Set up your group watching session</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-8">
              <Steps
                currentStep={currentStep}
                steps={steps.map(step => step.title)}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {steps[currentStep].content}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => currentStep > 0 && setCurrentStep(curr => curr - 1)}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button
              onClick={() => {
                if (currentStep === steps.length - 1) {
                  handleCreateSession();
                } else {
                  setCurrentStep(curr => curr + 1);
                }
              }}
              disabled={!canProceed()}
            >
              {currentStep === steps.length - 1 ? 'Create Session' : 'Next'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CreateSession;
