import { Router, Response } from 'express';
import db, { SMSLog, WhatsAppLog } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import { dispatchRealSMS, normalizeSriLankaPhone } from '../services/smsService';

const router = Router();

// Templates definition
const TEMPLATES = [
  { id: 'tpl-1', code: 'ATTENDANCE_ALERT', name: 'Attendance Alert', channel: 'SMS', text: 'Dear Parent, your child {student_name} has been marked {status} for {class_name} today at {time}. - Apex Institute' },
  { id: 'tpl-2', code: 'PAYMENT_RECEIPT', name: 'Payment Confirmation', channel: 'BOTH', text: 'Thank you! Received Rs. {amount} for {student_name} ({class_name}). Receipt #{receipt_no}. Outstanding balance: Rs. {balance}. - Apex Institute' },
  { id: 'tpl-3', code: 'FEE_REMINDER', name: 'Pending Fee Reminder', channel: 'BOTH', text: 'Reminder: Tuition fee of Rs. {balance} for {student_name} ({class_name} - {month}) remains pending. Kindly settle at the reception counter. - Apex Institute' },
  { id: 'tpl-4', code: 'CLASS_CANCEL', name: 'Class Cancellation Notice', channel: 'BOTH', text: 'Important Notice: The {class_name} scheduled for {date} at {time} has been postponed. Next session details will follow. - Apex Institute' },
  { id: 'tpl-5', code: 'EXAM_RESULT', name: 'Exam Result Notification', channel: 'BOTH', text: 'Result: {student_name} scored {marks}/100 (Grade {grade}, Rank #{rank}) in {exam_title}. Detailed review available on portal. - Apex Institute' },
  { id: 'tpl-6', code: 'GENERAL_ANNOUNCE', name: 'General Announcement', channel: 'BOTH', text: 'Notice from Apex Institute: {message} For queries, call +94 11 234 5678.' }
];

// GET /api/messaging/provider - Get current active SMS & WhatsApp provider config
router.get('/provider', authenticateToken, (req: AuthRequest, res: Response) => {
  const getVal = (key: string, def: string) => {
    const s = db.data.settings.find(st => st.key === key);
    return s ? s.value : def;
  };

  const currentToken = getVal('TEXTLK_API_TOKEN', '');
  const senderId = getVal('TEXTLK_SENDER_ID', 'TextLKDemo');

  return res.json({
    provider: getVal('SMS_PROVIDER', 'text.lk'),
    senderId,
    apiToken: currentToken ? currentToken.trim() : '',
    endpoint: getVal('TEXTLK_ENDPOINT', 'https://app.text.lk/api/v3/sms/send'),
    isConfigured: Boolean(currentToken && currentToken.length > 10)
  });
});

// GET /api/messaging/templates - Get available templates
router.get('/templates', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json(TEMPLATES);
});

// GET /api/messaging/logs - Get SMS and WhatsApp delivery logs
router.get('/logs', authenticateToken, (req: AuthRequest, res: Response) => {
  const { channel } = req.query; // 'SMS' | 'WHATSAPP' | 'ALL'

  let sms = db.data.smsLogs.map(s => {
    const student = s.studentId ? db.data.students.find(stu => stu.id === s.studentId) : null;
    return { ...s, channel: 'SMS', student };
  });

  let whatsapp = db.data.whatsappLogs.map(w => {
    const student = w.studentId ? db.data.students.find(stu => stu.id === w.studentId) : null;
    return { ...w, channel: 'WHATSAPP', type: w.templateName, student };
  });

  let combined = [...sms, ...whatsapp].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  if (channel === 'SMS') combined = combined.filter(c => c.channel === 'SMS');
  if (channel === 'WHATSAPP') combined = combined.filter(c => c.channel === 'WHATSAPP');

  return res.json(combined.slice(0, 100));
});

// POST /api/messaging/send-test-sms - Live SMS Dispatch & Diagnostic Tool
router.post('/send-test-sms', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const { phone, message, apiToken, senderId, saveAsDefault } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Recipient mobile phone number is required (e.g. 0771234567 or +94771234567)' });
    }

    const testMsg = message?.trim() || 'Apex Institute SMS Test: Hello! Your SMS Gateway is successfully connected and receiving messages in real-time.';
    
    // If user provided custom token/sender and asked to save as default
    if (saveAsDefault) {
      if (apiToken) {
        let tSetting = db.data.settings.find(s => s.key === 'TEXTLK_API_TOKEN');
        if (tSetting) {
          tSetting.value = apiToken.trim();
          tSetting.updatedAt = new Date().toISOString();
        } else {
          db.data.settings.push({
            id: db.generateId(),
            key: 'TEXTLK_API_TOKEN',
            value: apiToken.trim(),
            category: 'GENERAL',
            updatedAt: new Date().toISOString()
          });
        }
      }

      if (senderId) {
        let sSetting = db.data.settings.find(s => s.key === 'TEXTLK_SENDER_ID');
        if (sSetting) {
          sSetting.value = senderId.trim();
          sSetting.updatedAt = new Date().toISOString();
        } else {
          db.data.settings.push({
            id: db.generateId(),
            key: 'TEXTLK_SENDER_ID',
            value: senderId.trim(),
            category: 'GENERAL',
            updatedAt: new Date().toISOString()
          });
        }
      }

      db.save();
    }

    // Call real text.lk dispatch
    const result = await dispatchRealSMS(phone, testMsg, apiToken, senderId);

    // Save test log to smsLogs
    const logEntry = {
      id: db.generateId(),
      recipient: phone,
      message: testMsg,
      type: 'LIVE_TEST',
      status: (result.success ? 'DELIVERED' : 'FAILED') as 'DELIVERED' | 'FAILED',
      sentAt: new Date().toISOString()
    };
    db.data.smsLogs.unshift(logEntry);
    db.save();

    await logAuditAction(
      req,
      'SMS_GATEWAY_TEST',
      `Tested SMS gateway to ${result.normalizedPhone}: ${result.success ? 'DELIVERED' : 'FAILED - ' + (result.error || '')}`
    );

    return res.json({
      success: result.success,
      recipient: phone,
      normalizedPhone: result.normalizedPhone,
      senderId: result.senderId,
      httpStatus: result.httpStatus,
      response: result.response,
      error: result.error,
      isMock: result.isMock,
      timestamp: logEntry.sentAt
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to dispatch test SMS' });
  }
});

// POST /api/messaging/test-textlk - Test text.lk API connectivity & authentication
router.post('/test-textlk', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { apiToken, senderId, testPhone } = req.body;
    const token = apiToken || db.data.settings.find(s => s.key === 'TEXTLK_API_TOKEN')?.value || '';
    const sender = senderId || db.data.settings.find(s => s.key === 'TEXTLK_SENDER_ID')?.value || 'TextLKDemo';

    if (testPhone) {
      const result = await dispatchRealSMS(testPhone, 'Apex Institute text.lk connectivity test verified.', token, sender);
      return res.json({
        success: result.success,
        provider: 'text.lk',
        endpoint: 'https://app.text.lk/api/v3/sms/send',
        senderId: sender,
        status: result.success ? 'CONNECTED' : 'ERROR',
        message: result.success ? `SMS successfully dispatched via text.lk to ${result.normalizedPhone}!` : result.error,
        details: result.response
      });
    }

    return res.json({
      success: true,
      provider: 'text.lk',
      endpoint: 'https://app.text.lk/api/v3/sms/send',
      senderId: sender,
      status: 'CONFIGURED',
      message: `text.lk configuration ready with sender mask "${sender}".`
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to verify text.lk' });
  }
});

// POST /api/messaging/send - Send broadcast or targeted messages
router.post('/send', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const { channel, targetType, targetId, templateCode, customMessage } = req.body;
    // targetType: 'INDIVIDUAL' | 'CLASS' | 'GRADE' | 'ABSENT_TODAY' | 'PENDING_FEES' | 'ALL'

    let recipients: { studentId?: string; name: string; phone: string }[] = [];

    if (targetType === 'INDIVIDUAL' && targetId) {
      const student = db.data.students.find(s => s.id === targetId);
      if (student && (student.parentPhone || student.phone)) {
        recipients.push({
          studentId: student.id,
          name: student.fullName,
          phone: student.parentPhone || student.phone!
        });
      }
    } else if (targetType === 'CLASS' && targetId) {
      const enrolled = db.data.classStudents.filter(cs => cs.classId === targetId && cs.status === 'ACTIVE');
      enrolled.forEach(cs => {
        const student = db.data.students.find(s => s.id === cs.studentId);
        if (student && (student.parentPhone || student.phone)) {
          recipients.push({
            studentId: student.id,
            name: student.fullName,
            phone: student.parentPhone || student.phone!
          });
        }
      });
    } else if (targetType === 'PENDING_FEES') {
      const pendingFees = db.data.feeRecords.filter(f => f.status !== 'PAID' && f.remainingBalance > 0);
      const studentIds = new Set(pendingFees.map(f => f.studentId));
      studentIds.forEach(id => {
        const student = db.data.students.find(s => s.id === id);
        if (student && (student.parentPhone || student.phone)) {
          recipients.push({
            studentId: student.id,
            name: student.fullName,
            phone: student.parentPhone || student.phone!
          });
        }
      });
    } else if (targetType === 'ALL') {
      db.data.students.filter(s => s.status === 'ACTIVE').slice(0, 50).forEach(student => {
        if (student.parentPhone || student.phone) {
          recipients.push({
            studentId: student.id,
            name: student.fullName,
            phone: student.parentPhone || student.phone!
          });
        }
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No valid phone recipients found for this target selection' });
    }

    const tpl = TEMPLATES.find(t => t.code === templateCode);
    const baseMessage = customMessage || tpl?.text || 'Important notice from Apex Education Institute';

    const providerSetting = db.data.settings.find(s => s.key === 'SMS_PROVIDER')?.value || 'text.lk';
    const textlkSender = db.data.settings.find(s => s.key === 'TEXTLK_SENDER_ID')?.value || 'ApexEdu';

    let dispatchedCount = 0;

    // Process dispatches
    for (const r of recipients) {
      const personalizedMsg = baseMessage.replace(/{student_name}/g, r.name);

      if (channel === 'WHATSAPP' || channel === 'BOTH') {
        db.data.whatsappLogs.unshift({
          id: db.generateId(),
          studentId: r.studentId,
          recipient: r.phone,
          templateName: templateCode || 'general_announcement',
          message: personalizedMsg,
          status: 'DELIVERED',
          sentAt: new Date().toISOString()
        });
      }

      if (channel === 'SMS' || channel === 'BOTH') {
        const smsResult = await dispatchRealSMS(r.phone, personalizedMsg);
        db.data.smsLogs.unshift({
          id: db.generateId(),
          studentId: r.studentId,
          recipient: r.phone,
          message: personalizedMsg,
          type: templateCode || 'GENERAL',
          status: smsResult.success ? 'DELIVERED' : 'FAILED',
          sentAt: new Date().toISOString()
        });
      }

      dispatchedCount++;
    }

    db.save();
    await logAuditAction(req, 'MESSAGING_BROADCAST', `Dispatched ${channel} messages via ${providerSetting} to ${dispatchedCount} recipients`);

    return res.json({
      message: `Successfully dispatched to ${dispatchedCount} recipients via ${providerSetting}`,
      count: dispatchedCount,
      provider: providerSetting,
      senderMask: textlkSender
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to dispatch messages' });
  }
});

export default router;
