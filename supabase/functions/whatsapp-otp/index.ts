import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory OTP store (consider using Redis or Supabase for production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean phone number
function cleanPhoneNumber(phone: string): string {
  // Remove all non-digits except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with country code
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
    
    if (!WHATSAPP_API_KEY) {
      console.error('Missing WHATSAPP_API_KEY');
      return new Response(
        JSON.stringify({ error: 'WhatsApp API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, phoneNumber, otp: inputOtp } = await req.json();
    console.log('WhatsApp OTP Request:', { action, phoneNumber });

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanedPhone = cleanPhoneNumber(phoneNumber);
    // Remove the + for WhatsApp API
    const whatsappPhone = cleanedPhone.replace('+', '');

    if (action === 'send') {
      // Generate OTP
      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
      
      // Store OTP
      otpStore.set(cleanedPhone, { otp, expiresAt });
      
      console.log(`Generated OTP ${otp} for ${cleanedPhone}`);

      // Send OTP via WhatsApp Business API (Cloud API)
      // The phone number ID should be extracted from the API key or configured separately
      // For now, we'll use the standard Graph API endpoint
      const whatsappUrl = 'https://graph.facebook.com/v21.0/me/messages';
      
      const messagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: whatsappPhone,
        type: 'template',
        template: {
          name: 'otp_verification',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: otp }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                { type: 'text', text: otp }
              ]
            }
          ]
        }
      };

      // Try sending with template first, fallback to text message
      let response = await fetch(whatsappUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      let result = await response.json();
      console.log('WhatsApp Template Response:', result);

      // If template fails, try simple text message
      if (!response.ok || result.error) {
        console.log('Template failed, trying text message...');
        
        const textPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: whatsappPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: `Your HiFi-Mart verification code is: ${otp}\n\nThis code expires in 5 minutes. Do not share this code with anyone.`
          }
        };

        response = await fetch(whatsappUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(textPayload),
        });

        result = await response.json();
        console.log('WhatsApp Text Response:', result);
      }

      if (!response.ok) {
        console.error('WhatsApp API Error:', result);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send OTP via WhatsApp',
            details: result.error?.message || 'Unknown error'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully via WhatsApp',
          messageId: result.messages?.[0]?.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      if (!inputOtp) {
        return new Response(
          JSON.stringify({ error: 'OTP is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const storedData = otpStore.get(cleanedPhone);
      
      if (!storedData) {
        console.log(`No OTP found for ${cleanedPhone}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No OTP found. Please request a new one.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (Date.now() > storedData.expiresAt) {
        otpStore.delete(cleanedPhone);
        console.log(`OTP expired for ${cleanedPhone}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OTP has expired. Please request a new one.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (storedData.otp === inputOtp) {
        otpStore.delete(cleanedPhone);
        console.log(`OTP verified successfully for ${cleanedPhone}`);
        
        // Generate a simple auth token (in production, use proper JWT)
        const authToken = crypto.randomUUID();
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'OTP verified successfully',
            authToken,
            phoneNumber: cleanedPhone
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`Invalid OTP for ${cleanedPhone}: expected ${storedData.otp}, got ${inputOtp}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid OTP. Please try again.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send" or "verify"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Error in whatsapp-otp function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
