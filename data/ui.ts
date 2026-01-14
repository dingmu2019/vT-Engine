import { UIComponent } from '../types';

export const TIMEZONES = [
  { label: 'UTC', offset: 0 },
  { label: 'UTC+8 (CN)', offset: 8 },
  { label: 'UTC-5 (NY)', offset: -5 },
  { label: 'UTC+1 (LON)', offset: 1 },
];

export const AVAILABLE_UI_COMPONENTS: UIComponent[] = [
  { id: '1', name: 'MultiCurrencyInput', checked: false },
  { id: '2', name: 'DataTable (Server-side)', checked: false },
  { id: '3', name: 'DateRangePicker', checked: false },
  { id: '4', name: 'StatusBadge', checked: false },
  { id: '5', name: 'AsyncSelect', checked: false },
  { id: '6', name: 'FileUpload', checked: false },
  { id: '7', name: 'RichTextEditor', checked: false },
];
