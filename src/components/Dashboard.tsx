import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

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

interface WhatsAppMessage {
  from: string;
  wa_id: string;
  text: string;
  timestamp: string;
  mediaUrl?: string;
  mimeType?: string;
  mediaType?: string;
  mediaId?: string;
}

export const Dashboard = ({ customerConfig }) => {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedWaNumber, setSelectedWaNumber] = useState<string | null>(null);
  const { toast } = useToast();

  const formatTime = (timestamp: string) => {
    return new Date(+timestamp * 1000).toLocaleString();
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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

  useEffect(() => {
    const fetchWhatsappMessages = async () => {
      try {
        const res = await fetch("https://citizenai-whatsapp.onrender.com/messages");
        const data = await res.json();
        setWhatsappMessages(data);
      } catch (err) {
        console.error("Error fetching WhatsApp messages", err);
      }
    };
    fetchWhatsappMessages();
  }, []);

  const unknownWaNumbers = Array.from(new Set(
    whatsappMessages
      .map((msg) => msg.wa_id)
      .filter((wa_id) => !calls.find((call) => call.phoneNumber.includes(wa_id)))
  ));

  const selectedMessages = whatsappMessages.filter((msg) => msg.wa_id === selectedWaNumber);

  const getMessagesByPhoneNumber = (phoneNumber: string) => {
    return whatsappMessages.filter(msg =>
      phoneNumber.includes(msg.wa_id) || msg.wa_id.includes(phoneNumber)
    );
  };

  return (
    <div className="grid grid-cols-5 grid-rows-2 gap-4 p-4 h-[calc(100vh-100px)]">
      {/* Call History */}
      <Card className="col-span-2 row-span-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle><Phone className="inline-block w-4 h-4 mr-2" /> Call History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1">
          {calls.map((call) => (
            <div
              key={call.id}
              onClick={() => setSelectedCall(call)}
              className={`p-2 border rounded mb-2 cursor-pointer hover:bg-muted/40 ${selectedCall?.id === call.id ? 'bg-muted/50' : ''}`}
            >
              <div className="font-medium flex items-center gap-2">
                {call.direction === 'incoming' ? <PhoneIncoming className="text-green-500 w-4 h-4" /> : <PhoneOutgoing className="text-blue-500 w-4 h-4" />}
                {call.phoneNumber}
              </div>
              <div className="text-sm text-muted-foreground">{formatTime(call.timestamp)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Call Details */}
      <Card className="col-span-3 row-span-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1">
          {selectedCall ? (
            <Accordion type="multiple">
              <AccordionItem value="summary">
                <AccordionTrigger>Summary</AccordionTrigger>
                <AccordionContent>{selectedCall.summary}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="audio">
                <AccordionTrigger>Audio</AccordionTrigger>
                <AccordionContent>
                  {selectedCall.audio_url ? (
                    <audio controls src={selectedCall.audio_url} className="w-full" />
                  ) : (
                    <p className="text-muted-foreground">No audio available</p>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="transcript">
                <AccordionTrigger>Transcript</AccordionTrigger>
                <AccordionContent>
                  <pre className="whitespace-pre-wrap text-sm">{selectedCall.transcript}</pre>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="whatsapp">
                <AccordionTrigger>Related WhatsApp Messages</AccordionTrigger>
                <AccordionContent>
                  {getMessagesByPhoneNumber(selectedCall.phoneNumber).length ? (
                    getMessagesByPhoneNumber(selectedCall.phoneNumber).map((msg, index) => (
                      <div key={index} className="mb-2 p-2 border rounded">
                        <div className="text-sm font-semibold">{msg.from}</div>
                        <div className="text-sm">{msg.text}</div>
                        <div className="text-xs text-gray-500">{formatTime(msg.timestamp)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No WhatsApp messages from this number</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <p className="text-muted-foreground">Select a call to view details</p>
          )}
        </CardContent>
      </Card>

      {/* Incoming WhatsApp */}
      <Card className="col-span-2 row-span-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle><MessageCircle className="inline-block w-4 h-4 mr-2" /> Incoming WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1">
          {unknownWaNumbers.map((wa) => {
            const msg = whatsappMessages.find((m) => m.wa_id === wa);
            return (
              <div
                key={wa}
                onClick={() => setSelectedWaNumber(wa)}
                className={`p-2 border rounded mb-2 cursor-pointer hover:bg-muted/40 ${selectedWaNumber === wa ? 'bg-muted/50' : ''}`}
              >
                <div className="font-medium text-sm">{msg?.from || "Unknown Name"}</div>
                <div className="text-sm text-muted-foreground">{wa}</div>
                <div className="text-xs text-muted-foreground truncate">{msg?.text?.slice(0, 60) || "No preview"}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Message Details */}
      <Card className="col-span-3 row-span-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>Message Details</CardTitle>
        </CardHeader>
       <CardContent className="overflow-y-auto flex-1">
  
{selectedMessages.length ? (
  selectedMessages.map((msg, index) => (
    <div key={index} className="mb-3 p-2 border rounded space-y-1">
      <div className="text-sm font-semibold">{msg.from}:</div>

      {/* Show text if available */}
      {msg.text && (
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {msg.text}
        </div>
      )}

      {/* Show media if applicable */}
      {msg.mediaType && msg.mediaId && (
        <>
          {msg.mediaType === 'image' && (
            <img
              src={`https://citizenai-whatsapp.onrender.com:3001/media/${msg.mediaId}`}
              alt="WhatsApp image"
              className="rounded max-w-full mt-2"
            />
          )}
          {msg.mediaType === 'audio' && (
            <audio
              controls
              src={`https://citizenai-whatsapp.onrender.com:3001/media/${msg.mediaId}`}
              className="w-full mt-2"
            />
          )}
          {msg.mediaType === 'video' && (
            <video
              controls
              src={`https://citizenai-whatsapp.onrender.com:3001/media/${msg.mediaId}`}
              className="w-full mt-2"
            />
          )}
          {msg.mediaType === 'document' && (
            <a
              href={`https://citizenai-whatsapp.onrender.com:3001/media/${msg.mediaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline mt-2 block"
            >
              Download document
            </a>
          )}
        </>
      )}

      <div className="text-xs text-gray-400">{formatTime(msg.timestamp)}</div>
    </div>
  ))
) : (
  <p className="text-muted-foreground">Select a number to view messages</p>
)}

</CardContent>
      </Card>
    </div>
  );
};