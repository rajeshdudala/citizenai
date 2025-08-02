// integrations/client.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://riypzobebledoxczvzen.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeXB6b2JlYmxlZG94Y3p2emVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY4ODk5NCwiZXhwIjoyMDY2MjY0OTk0fQ.Z0BdWPAbCWuOo4Jm-evGAHJ0UqGE-GYhCsZ2k55tksk"; // shortened here for readability

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);