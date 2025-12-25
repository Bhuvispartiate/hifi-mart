import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory OTP storage (for demo purposes - in production use a database)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 91 and has 12 digits, it's already with country code
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.substring(2); // Return just the 10-digit number for Fast2SMS
  }
  
  // If it's a 10-digit number, return as is
  if (cleaned.length === 10) {
    return cleaned;
  }
  
  // If starts with +91, remove it
  if (phone.startsWith('+91')) {
    return cleaned.substring(2);
  }
  
  return cleaned;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAST2SMS_API_KEY = Deno.env.get('FAST2SMS_API_KEY');
    
    if (!FAST2SMS_API_KEY) {
      console.error('Missing FAST2SMS_API_KEY');
      return new Response(
        JSON.stringify({ error: 'SMS API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, phoneNumber, otp: inputOtp } = await req.json();
    
    console.log(`SMS OTP request: action=${action}, phone=${phoneNumber}`);

    if (action === 'send') {
      const cleanedPhone = cleanPhoneNumber(phoneNumber);
      
      if (cleanedPhone.length !== 10) {
        console.error(`Invalid phone number length: ${cleanedPhone.length}`);
        return new Response(
          JSON.stringify({ error: 'Invalid phone number. Please enter a 10-digit mobile number.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
      
      // Store OTP
      otpStore.set(cleanedPhone, { otp, expiresAt });
      console.log(`Generated OTP ${otp} for ${cleanedPhone}`);

      // Send OTP via Fast2SMS
      const fast2smsUrl = 'https://www.fast2sms.com/dev/bulkV2';
      
      const params = new URLSearchParams({
        authorization: FAST2SMS_API_KEY,
        route: 'otp',
        variables_values: otp,
        flash: '0',
        numbers: cleanedPhone,
      });

      console.log('Sending SMS via Fast2SMS...');
      
      const response = await fetch(fast2smsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const responseText = await response.text();
      console.log(`Fast2SMS response status: ${response.status}`);
      console.log(`Fast2SMS response: ${responseText}`);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse Fast2SMS response');
        responseData = { return: false, message: responseText };
      }

      if (responseData.return === true || responseData.return === 'true') {
        console.log('SMS sent successfully');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'OTP sent successfully',
            request_id: responseData.request_id 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error(`Fast2SMS error: ${responseData.message}`);
        return new Response(
          JSON.stringify({ 
            error: responseData.message || 'Failed to send SMS',
            details: responseData
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (action === 'verify') {
      const cleanedPhone = cleanPhoneNumber(phoneNumber);
      const storedData = otpStore.get(cleanedPhone);
      
      console.log(`Verifying OTP for ${cleanedPhone}`);
      
      if (!storedData) {
        console.error('No OTP found for this number');
        return new Response(
          JSON.stringify({ error: 'No OTP found. Please request a new OTP.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (Date.now() > storedData.expiresAt) {
        otpStore.delete(cleanedPhone);
        console.error('OTP expired');
        return new Response(
          JSON.stringify({ error: 'OTP expired. Please request a new OTP.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (storedData.otp !== inputOtp) {
        console.error('Invalid OTP');
        return new Response(
          JSON.stringify({ error: 'Invalid OTP. Please try again.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // OTP verified successfully
      otpStore.delete(cleanedPhone);
      console.log('OTP verified successfully');
      
      // Generate a simple auth token (in production, use proper JWT)
      const authToken = btoa(`${cleanedPhone}:${Date.now()}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP verified successfully',
          token: authToken,
          phone: cleanedPhone
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send" or "verify".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('SMS OTP error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
