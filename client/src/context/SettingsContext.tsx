import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';

export interface SettingsContextType {
  settings: Record<string, string>;
  loading: boolean;
  instituteName: string;
  instituteTagline: string;
  campusAddress: string;
  phone: string;
  email: string;
  currencySymbol: string;
  currencyCode: string;
  updateSettings: (newSettings: Record<string, string>) => Promise<Record<string, string>>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const DEFAULT_SMS_TEMPLATES = {
  SMS_TEMPLATE_WELCOME: "Welcome to {institute_name}! Track {student_name}'s live attendance, RFID check-in times & fee receipts on the Parent Portal PWA: {portal_url} (Save to your phone home screen for 1-tap instant access)",
  SMS_TEMPLATE_PAYMENT: "Dear Parent, received Rs. {amount} for {student_name}. Receipt #{receipt_no}. Outstanding balance: Rs. {balance}. - {institute_name}",
  SMS_TEMPLATE_ATTENDANCE: "Dear Parent, your child {student_name} has been marked {status} for {class_name} today at {time}. - {institute_name}",
  SMS_TEMPLATE_REMINDER: "Reminder: Tuition fee of Rs. {balance} for {student_name} ({class_name} - {month}) remains pending. Kindly settle at the reception counter. - {institute_name}",
  SMS_TEMPLATE_CANCEL: "Important Notice: The {class_name} scheduled for {date} at {time} has been postponed. Next session details will follow. - {institute_name}",
  SMS_TEMPLATE_ANNOUNCE: "Notice from {institute_name}: {message}"
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await apiRequest<Record<string, string>>('/settings');
      setSettings(data || {});
    } catch (err) {
      console.warn('Could not load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Record<string, string>) => {
    const updated = await apiRequest<Record<string, string>>('/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings)
    });
    setSettings(prev => ({ ...prev, ...(updated || newSettings) }));
    return updated || newSettings;
  };

  const instituteName = settings.INSTITUTE_NAME || 'Cambridge Academy';
  const instituteTagline = settings.INSTITUTE_TAGLINE || 'Excellence in Tuition & Mentorship';
  const campusAddress = settings.ADDRESS || 'No. 45, Galle Road, Colombo 03, Sri Lanka';
  const phone = settings.PHONE || '+94 11 234 5678';
  const email = settings.EMAIL || 'info@cambridgeacademy.lk';
  const currencySymbol = settings.CURRENCY_SYMBOL || 'Rs. ';
  const currencyCode = settings.CURRENCY_CODE || 'LKR';

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        instituteName,
        instituteTagline,
        campusAddress,
        phone,
        email,
        currencySymbol,
        currencyCode,
        updateSettings,
        refreshSettings: fetchSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: {},
      loading: false,
      instituteName: 'Cambridge Academy',
      instituteTagline: 'Excellence in Tuition & Mentorship',
      campusAddress: 'No. 45, Galle Road, Colombo 03, Sri Lanka',
      phone: '+94 11 234 5678',
      email: 'info@cambridgeacademy.lk',
      currencySymbol: 'Rs. ',
      currencyCode: 'LKR',
      updateSettings: async () => ({}),
      refreshSettings: async () => {}
    };
  }
  return context;
};
