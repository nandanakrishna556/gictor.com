export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Mandarin',
  'Japanese',
  'Korean',
  'Arabic',
  'Portuguese',
  'Italian',
  'Russian',
] as const;

export type Language = typeof LANGUAGES[number];
