
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  verificationCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, verificationCode }: VerificationEmailRequest = await req.json();

    console.log(`Sending verification email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Citizen AI <onboarding@resend.dev>",
      to: [email],
      subject: "Your Citizen AI Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; font-size: 2.5rem; margin-bottom: 10px;">CITIZEN AI</h1>
            <p style="color: #64748b; font-size: 1.1rem;">ACCESS VERIFICATION</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #1e293b 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 20px 0; font-size: 1.5rem;">Your Verification Code</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 2.5rem; font-weight: bold; letter-spacing: 0.3em; font-family: monospace;">${verificationCode}</span>
            </div>
            <p style="margin: 0; opacity: 0.9;">Enter this code to complete your verification</p>
          </div>
          
          <div style="text-align: center; color: #64748b; font-size: 0.9rem;">
            <p>This code will expire in 10 minutes for your security.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 0.8rem;">
              © 2024 Citizen AI - Secure AI Access Portal
            </p>
          </div>
        </div>
      `,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
