export type SettingType = "switch" | "select" | "button" | "input";

export interface SettingOption {
  label: string;
  value: string;
}

export interface SettingItem {
  buttonText?: string; // For button type
  defaultValue?: string | boolean | number;
  description?: string;
  id: string;
  options?: SettingOption[]; // For select type
  title: string;
  type: SettingType;
}

export interface SettingCategory {
  id: string;
  items: SettingItem[];
  title: string;
}
