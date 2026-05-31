import axios from 'axios';

// WASenderAPI Configuration (cloud API — replaces WAHA)
const WASENDER_BASE_URL = process.env.WASENDER_BASE_URL || 'https://www.wasenderapi.com';
const WASENDER_API_KEY = process.env.WASENDER_API_KEY || '';

// WhatsApp API Error Types
export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

// WhatsApp Message Response
export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
  key?: {
    id: string;
  };
}

// WhatsApp Test Request
export interface WhatsAppTestRequest {
  to: string;
  message: string;
}

// WhatsApp Health Check Response
export interface WhatsAppHealthResponse {
  success: boolean;
  message: string;
  phoneNumberId?: string;
  source: 'wasender' | 'none';
  error?: string;
}

/**
 * Check if WhatsApp is configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!WASENDER_API_KEY;
}

/**
 * Get the current WhatsApp source
 */
export function getWhatsAppSource(): 'wasender' | 'none' {
  return WASENDER_API_KEY ? 'wasender' : 'none';
}

/**
 * Format phone number to E.164 format (+91XXXXXXXXXX)
 */
function formatPhoneE164(phoneNumber: string): string {
  let clean = phoneNumber.replace(/[^\d]/g, '');
  if (!clean.startsWith('91') && clean.length === 10) {
    clean = '91' + clean;
  }
  return `+${clean}`;
}

/**
 * Common headers for WASenderAPI requests
 */
function getHeaders() {
  return {
    'Authorization': `Bearer ${WASENDER_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Send WhatsApp message via WASenderAPI
 */
export async function sendWhatsAppTestMessage(
  request: WhatsAppTestRequest
): Promise<WhatsAppMessageResponse | WhatsAppError> {
  const to = formatPhoneE164(request.to);

  console.log(`WASender: Sending message to ${to}`);

  try {
    const response = await axios.post(
      `${WASENDER_BASE_URL}/api/send-message`,
      {
        to,
        text: request.message,
      },
      {
        headers: getHeaders(),
        timeout: 30000,
      }
    );

    console.log('WASender: Message sent successfully');

    const data = response.data;
    return {
      messaging_product: 'whatsapp',
      contacts: [{ input: request.to, wa_id: to }],
      messages: [{ id: data.key?.id || data.id || `wasender_${Date.now()}` }],
    };
  } catch (error: any) {
    console.error('WASender: Error sending message:', error.message);
    if (error.response?.data) {
      console.error('WASender: Error response:', JSON.stringify(error.response.data));
    }
    throw new Error(`WASender error: ${error.message}`);
  }
}

/**
 * Check WhatsApp API health/status
 */
export async function checkWhatsAppHealth(): Promise<WhatsAppHealthResponse> {
  try {
    const response = await axios.get(
      `${WASENDER_BASE_URL}/api/status`,
      {
        headers: getHeaders(),
        timeout: 5000,
      }
    );

    const status = response.data?.status || 'unknown';
    const isConnected = status === 'connected' || status === 'WORKING';

    return {
      success: isConnected,
      message: isConnected
        ? 'WASenderAPI is connected and working'
        : `WASenderAPI session status: ${status}`,
      source: 'wasender',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Unable to connect to WASenderAPI',
      source: 'wasender',
      error: error.message,
    };
  }
}

/**
 * Send OTP via WhatsApp
 */
export async function sendWhatsAppOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.`;

  try {
    const result = await sendWhatsAppTestMessage({
      to: phoneNumber,
      message,
    });

    if ('messages' in result && result.messages?.[0]?.id) {
      return { success: true, messageId: result.messages[0].id };
    }
    return { success: false, error: 'Failed to send message' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send a document (PDF payslip) via WASenderAPI using the document URL.
 * Uploads the payslip to Supabase first (handled by caller), then sends via documentUrl.
 */
export async function sendWhatsAppPayslipLink(
  phoneNumber: string,
  trainerName: string,
  monthYear: string,
  netPayout: string,
  downloadUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const to = formatPhoneE164(phoneNumber);
  const text = `Hi ${trainerName},\nYour payslip for ${monthYear} is ready.\n\nNet payout: ₹${netPayout}\n\nDownload: ${downloadUrl}\n\nThis link will remain available for your records.`;

  console.log(`WASender: Sending payslip to ${to}: ${downloadUrl}`);

  try {
    const response = await axios.post(
      `${WASENDER_BASE_URL}/api/send-message`,
      {
        to,
        text,
      },
      {
        headers: getHeaders(),
        timeout: 30000,
      }
    );

    console.log('WASender: Payslip sent successfully');

    return {
      success: true,
      messageId: response.data?.key?.id || response.data?.id || `wasender_link_${Date.now()}`,
    };
  } catch (error: any) {
    console.error('WASender: Error sending payslip:', error.message);
    if (error.response?.data) {
      console.error('WASender: Error response body:', JSON.stringify(error.response.data));
    }
    return {
      success: false,
      error: `WASender error: ${error.message}`,
    };
  }
}

/**
 * Format phone number for WhatsApp API (E.164)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  return formatPhoneE164(phoneNumber);
}

/**
 * Upload a media file to WASenderAPI (base64), then send it as a document
 * via a unified send-message call with documentUrl.
 *
 * For payslips the flow is:
 *  1. Upload to Supabase (caller)
 *  2. Call sendWhatsAppPayslipLink with the Supabase URL
 *
 * This function is kept for other document-sending use cases.
 */
export async function sendWhatsAppDocument(
  phoneNumber: string,
  base64Data: string,
  filename: string,
  caption: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const to = formatPhoneE164(phoneNumber);

  console.log(`WASender: Sending document to ${to}, file: ${filename}`);

  try {
    // Step 1: Upload the file via WASenderAPI /api/upload
    const cleanBase64 = base64Data.includes(',')
      ? base64Data.split(',').pop()!
      : base64Data;

    const uploadResponse = await axios.post(
      `${WASENDER_BASE_URL}/api/upload`,
      { base64: cleanBase64 },
      {
        headers: getHeaders(),
        timeout: 60000,
      }
    );

    const fileUrl = uploadResponse.data?.url || uploadResponse.data?.fileUrl;
    if (!fileUrl) {
      throw new Error('Failed to get upload URL from WASenderAPI');
    }

    console.log(`WASender: File uploaded to ${fileUrl}`);

    // Step 2: Send the document via send-message with documentUrl
    const response = await axios.post(
      `${WASENDER_BASE_URL}/api/send-message`,
      {
        to,
        documentUrl: fileUrl,
        fileName: filename,
        text: caption,
      },
      {
        headers: getHeaders(),
        timeout: 30000,
      }
    );

    console.log('WASender: Document sent successfully');

    return {
      success: true,
      messageId: response.data?.key?.id || response.data?.id || `wasender_doc_${Date.now()}`,
    };
  } catch (error: any) {
    console.error('WASender: Error sending document:', error.message);
    if (error.response?.data) {
      console.error('WASender: Error response body:', JSON.stringify(error.response.data));
    }
    if (error.response?.status) {
      console.error('WASender: Error status:', error.response.status);
    }
    return {
      success: false,
      error: `WASender error: ${error.message}`,
    };
  }
}
