export type SettingsType = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsAlerts: boolean;
  appUpdates: boolean;
  reminders: boolean;
}

export type SettingItem = {
  key: keyof SettingsType;
  label: string;
};