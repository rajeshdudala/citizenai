import { useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Play, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Call {
  id: string;
  direction: 'incoming' | 'outgoing';
  phoneNumber: string;
  timestamp: string;
  summary?: string;
  transcript?: string;
  actions?: string[];
}

const mockCalls: Call[] = [
  {
    id: '1',
    direction: 'incoming',
    phoneNumber: '+1 (555) 123-4567',
    timestamp: '2024-01-27 14:30:00',
    summary: 'Customer interested in scheduling a consultation for next week.',
    transcript: 'Hi, I saw your ad online and I\'m interested in your services. Could we schedule a consultation for next week?',
    actions: ['Sent WhatsApp', 'Booked Appointment']
  },
  {
    id: '2',
    direction: 'outgoing',
    phoneNumber: '+1 (555) 987-6543',
    timestamp: '2024-01-27 13:15:00',
    summary: 'Follow-up call regarding appointment confirmation.',
    transcript: 'Hello, this is a follow-up regarding your appointment scheduled for tomorrow at 2 PM.',
    actions: ['Confirmed Appointment']
  },
  {
    id: '3',
    direction: 'incoming',
    phoneNumber: '+1 (555) 555-1234',
    timestamp: '2024-01-27 11:45:00',
    summary: 'General inquiry about pricing and services.',
    transcript: 'I\'m calling to ask about your pricing for the basic package.',
    actions: ['Sent Email']
  }
];

export const Dashboard = () => {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Pane - Call List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockCalls.map((call) => (
              <div
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedCall?.id === call.id ? 'bg-muted border-primary' : 'bg-background'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {call.direction === 'incoming' ? (
                      <PhoneIncoming className="w-4 h-4 text-green-500" />
                    ) : (
                      <PhoneOutgoing className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="font-medium">{call.phoneNumber}</span>
                  </div>
                  <span className="text-sm text-muted-foreground capitalize">
                    {call.direction}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTime(call.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right Pane - Call Details */}
      <Card>
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCall ? (
            <div className="space-y-6">
              {/* Call Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedCall.phoneNumber}</h3>
                  <p className="text-muted-foreground capitalize">
                    {selectedCall.direction} • {formatTime(selectedCall.timestamp)}
                  </p>
                </div>
              </div>

              {/* Audio Player */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline">
                    <Play className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-2 w-1/3"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">2:34</span>
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <h4 className="font-semibold mb-2">AI Summary</h4>
                <p className="text-muted-foreground">{selectedCall.summary}</p>
              </div>

              {/* Actions */}
              {selectedCall.actions && selectedCall.actions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Actions Performed</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCall.actions.map((action, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        ✅ {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript */}
              <div>
                <h4 className="font-semibold mb-2">Full Transcript</h4>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm">{selectedCall.transcript}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a call from the list to view details</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};