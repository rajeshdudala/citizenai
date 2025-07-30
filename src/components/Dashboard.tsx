import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Play, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Call {
  id: string;
  direction: 'incoming' | 'outgoing';
  phoneNumber: string;
  timestamp: string;
  summary?: string;
  transcript?: string;
  actions?: string[];
  audio_url?: string;
}

export const Dashboard = ({ customerConfig }) => {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const { toast } = useToast();

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

 useEffect(() => {
  const fetchCallHistory = async () => {
    if (!customerConfig?.elevenlabs_api_key) return;

    try {
      const listRes = await fetch("https://api.elevenlabs.io/v1/convai/conversations?limit=10", {
        headers: {
          'xi-api-key': customerConfig.elevenlabs_api_key,
          'Content-Type': 'application/json',
        },
      });

      if (!listRes.ok) throw new Error(`Conversation list error: ${listRes.status}`);
      const listData = await listRes.json();

      const details = await Promise.all(
        listData.conversations.map(async (conv) => {
          const detailRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`, {
            headers: {
              'xi-api-key': customerConfig.elevenlabs_api_key,
            },
          });

          if (!detailRes.ok) return null;
          const detailData = await detailRes.json();

          // Fetch audio URL if available
          let audio_url = '';
          if (detailData.has_audio) {
            const audioRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}/audio`, {
              headers: {
                'xi-api-key': customerConfig.elevenlabs_api_key,
              },
            });
            if (audioRes.ok) {
              const blob = await audioRes.blob();
              audio_url = URL.createObjectURL(blob);
            }
          }

          return {
            id: conv.conversation_id,
            direction: detailData.metadata?.phone_call?.direction || 'incoming',
            phoneNumber: detailData.metadata?.phone_call?.external_number || 'Unknown',
            timestamp: new Date(detailData.metadata?.start_time_unix_secs * 1000).toISOString(),
            summary: detailData.analysis?.transcript_summary || 'No summary available.',
            transcript: detailData.transcript?.map(t => `${t.role}: ${t.message}`).join('\n') || 'Transcript not available.',
            actions: detailData.transcript?.filter(t => t.tool_calls?.length).map(() => 'Triggered Tool') || [],
            audio_url,
          };
        })
      );

      setCalls(details.filter(Boolean));
    } catch (error) {
      console.error("Failed to fetch call history:", error);
      toast({
        title: "Error Fetching Calls",
        description: "Could not retrieve call logs from ElevenLabs.",
        variant: "destructive"
      });
    }
  };

  fetchCallHistory();
}, [customerConfig]);


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
            {calls.map((call) => (
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedCall.phoneNumber}</h3>
                  <p className="text-muted-foreground capitalize">
                    {selectedCall.direction} • {formatTime(selectedCall.timestamp)}
                  </p>
                </div>
              </div>

              {selectedCall.audio_url ? (
  <div className="bg-muted/30 rounded-lg p-4">
    <audio controls className="w-full">
      <source src={selectedCall.audio_url} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  </div>
) : (
  <div className="bg-muted/30 rounded-lg p-4 text-muted-foreground text-sm">
    No audio available for this call.
  </div>
)}


              <div>
                <h4 className="font-semibold mb-2">AI Summary</h4>
                <p className="text-muted-foreground">{selectedCall.summary}</p>
              </div>

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

              <div>
                <h4 className="font-semibold mb-2">Full Transcript</h4>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-line">{selectedCall.transcript}</p>
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
