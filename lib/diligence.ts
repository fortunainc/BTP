/** Data room sections, in the order investors expect them. */
export const DILIGENCE_CATEGORIES = [
  'Company and legal',
  'Financials',
  'Product and technology',
  'Traction',
  'Market',
] as const;
export const MAX_DOC_BYTES = 4 * 1024 * 1024;
export const ALLOWED_DOC_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
