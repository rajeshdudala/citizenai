// src/hooks/use-dashboard-data.ts
import { useEffect, useState } from 'react';

interface DashboardData {
  totalCalls: number;
  totalCallDuration: number; // seconds
  avgCallDuration: number;   // seconds
  totalMessages: number;
}

interface CustomerConfig {
  elevenlabs_api_key?: string;
}

export const useDashboardData = (customerConfig?: CustomerConfig) => {
  const [data, setData] = useState<DashboardData>({
    totalCalls: 0,
    totalCallDuration: 0,
    avgCallDuration: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!customerConfig?.elevenlabs_api_key) {
        console.warn("No ElevenLabs API key provided");
        return;
      }

      try {
        // --- Fetch Calls ---
        const listRes = await fetch("https://api.elevenlabs.io/v1/convai/conversations?limit=50", {
          headers: {
            'xi-api-key': customerConfig.elevenlabs_api_key,
            'Content-Type': 'application/json',
          },
        });

        if (!listRes.ok) throw new Error(`Conversation list error: ${listRes.status}`);
        const listData = await listRes.json();

        let totalDuration = 0;
        const callDetails = await Promise.all(
          listData.conversations.map(async (conv) => {
            const detailRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`, {
              headers: { 'xi-api-key': customerConfig.elevenlabs_api_key },
            });
            if (!detailRes.ok) return null;
            const detailData = await detailRes.json();
            const duration = detailData.metadata?.duration_secs || 0;
            totalDuration += duration;
            return duration;
          })
        );

        const validCalls = callDetails.filter(Boolean);

        // --- Fetch WhatsApp Messages ---
        const msgRes = await fetch("https://citizenai-whatsapp.onrender.com/messages");
        const msgData = await msgRes.json();

        setData({
          totalCalls: validCalls.length,
          totalCallDuration: totalDuration,
          avgCallDuration: validCalls.length > 0 ? totalDuration / validCalls.length : 0,
          totalMessages: msgData.length || 0,
        });
      } catch (error) {
        console.error("Dashboard analytics fetch failed:", error);
      }
    };

    fetchData();
  }, [customerConfig?.elevenlabs_api_key]);

  return data;
};