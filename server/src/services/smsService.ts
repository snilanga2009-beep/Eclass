import db from '../db';

/**
 * Normalizes Sri Lankan mobile numbers into text.lk international format (e.g. 94771234567)
 */
export function normalizeSriLankaPhone(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('94') && digits.length === 11) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '94' + digits.substring(1);
  }
  if (digits.length === 9) {
    return '94' + digits;
  }
  return digits;
}

export interface SendSMSResult {
  success: boolean;
  provider: string;
  recipient: string;
  normalizedPhone: string;
  senderId: string;
  httpStatus?: number;
  response?: any;
  error?: string;
  isMock?: boolean;
}

/**
 * Dispatches an outbound SMS via text.lk API
 */
export async function dispatchRealSMS(
  recipientPhone: string,
  message: string,
  overrideToken?: string,
  overrideSenderId?: string
): Promise<SendSMSResult> {
  const normalized = normalizeSriLankaPhone(recipientPhone);
  const token = overrideToken || db.data.settings.find(s => s.key === 'TEXTLK_API_TOKEN')?.value || '';
  const senderId = overrideSenderId || db.data.settings.find(s => s.key === 'TEXTLK_SENDER_ID')?.value || 'TextLKDemo';
  const endpoint = db.data.settings.find(s => s.key === 'TEXTLK_ENDPOINT')?.value || 'https://app.text.lk/api/v3/sms/send';

  const isDemo = !token || token.includes('demo') || token.length < 15;

  // If user passed a token or token is not demo, attempt live HTTP fetch
  if (!isDemo || overrideToken) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(overrideToken || token).trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          recipient: normalized,
          sender_id: senderId,
          type: 'plain',
          message
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          provider: 'text.lk',
          recipient: recipientPhone,
          normalizedPhone: normalized,
          senderId,
          httpStatus: res.status,
          response: data,
          error: data?.message || data?.error || `text.lk returned HTTP status ${res.status}`
        };
      }

      return {
        success: true,
        provider: 'text.lk',
        recipient: recipientPhone,
        normalizedPhone: normalized,
        senderId,
        httpStatus: res.status,
        response: data
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'text.lk',
        recipient: recipientPhone,
        normalizedPhone: normalized,
        senderId,
        error: err.message || 'Failed to connect to text.lk API server'
      };
    }
  }

  // If still demo token, provide informative diagnostic output
  return {
    success: false,
    provider: 'text.lk',
    recipient: recipientPhone,
    normalizedPhone: normalized,
    senderId,
    httpStatus: 401,
    isMock: true,
    error: 'Demo text.lk API key active. To receive actual SMS on your physical mobile phone, please enter your live text.lk API token in the SMS Test Tool or System Settings.'
  };
}
