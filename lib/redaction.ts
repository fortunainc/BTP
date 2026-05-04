/**
 * Privacy Redaction System
 * Automatically detects and redacts personally identifiable information
 * and other sensitive data to prevent re-identification.
 */

// Known sponsors to detect
const KNOWN_SPONSORS = [
  /pfizer/i,
  /merck/i,
  /novartis/i,
  /roche/i,
  /johnson & johnson/i,
  /janssen/i,
  /astrazeneca/i,
  /gilead/i,
  /bristol-myers squibb/i,
  /bms/i,
  /sanofi/i,
  /glaxosmithkline/i,
  /gsk/i,
  /eli lilly/i,
  /lilly/i,
  /abbvie/i,
  /amgen/i,
  /moderna/i,
  /regeneron/i,
  /biogen/i,
];

// Known CROs to detect
const KNOWN_CROS = [
  /iqvia/i,
  /parexel/i,
  /syneos/i,
  /covance/i,
  /labcorp/i,
  /icon/i,
  /ppd/i,
  /fortrea/i,
  /clinical research organization/i,
  /cro/i,
];

// Hospital/medical institution patterns
const MEDICAL_INSTITUTIONS = [
  /hospital/i,
  /medical center/i,
  /clinic/i,
  /health system/i,
  /university/i,
  /institute/i,
  /center/i,
];

/**
 * Redact sponsor names from text
 */
export function redactSponsors(text: string): string {
  let redacted = text;
  KNOWN_SPONSORS.forEach((pattern) => {
    redacted = redacted.replace(pattern, '[SPONSOR]');
  });
  return redacted;
}

/**
 * Redact CRO names from text
 */
export function redactCROs(text: string): string {
  let redacted = text;
  KNOWN_CROS.forEach((pattern) => {
    redacted = redacted.replace(pattern, '[CRO]');
  });
  return redacted;
}

/**
 * Redact site names from text
 */
export function redactSites(text: string): string {
  let redacted = text;
  MEDICAL_INSTITUTIONS.forEach((pattern) => {
    redacted = redacted.replace(pattern, '[SITE]');
  });
  
  // Redact specific site name patterns like "XYZ Research Center"
  redacted = redacted.replace(/\b[A-Z][a-z]+ Research [Cc]enter\b/g, '[SITE]');
  redacted = redacted.replace(/\b[A-Z][a-z]+ Clinical [Rr]esearch\b/g, '[SITE]');
  
  return redacted;
}

/**
 * Redact investigator names (Dr. Name pattern)
 */
export function redactInvestigators(text: string): string {
  let redacted = text;
  
  // Dr. Firstname Lastname
  redacted = redacted.replace(/Dr\. [A-Z][a-z]+ [A-Z][a-z]+/g, '[PI]');
  
  // Dr. Lastname
  redacted = redacted.replace(/Dr\. [A-Z][a-z]+/g, '[PI]');
  
  // Principal Investigator: Name
  redacted = redacted.replace(/Principal Investigator: [A-Z][a-z]+/gi, '[PI]');
  redacted = redacted.replace(/PI: [A-Z][a-z]+/g, '[PI]');
  
  return redacted;
}

/**
 * Redact protocol numbers
 */
export function redactProtocols(text: string): string {
  let redacted = text;
  
  // Protocol number patterns like "PROTOCOL-1234", "PROTOCOL 1234", "Study 12345"
  redacted = redacted.replace(/PROTOCOL[-\s]?\d+/gi, '[PROTOCOL]');
  redacted = redacted.replace(/PROJ[-\s]?\d+/gi, '[PROTOCOL]');
  redacted = redacted.replace(/STUDY[-\s]?\d{4,}/gi, '[PROTOCOL]');
  
  return redacted;
}

/**
 * Redact NCT identifiers (clinicaltrials.gov identifiers)
 */
export function redactNCT(text: string): string {
  let redacted = text;
  
  // NCT numbers like NCT12345678
  redacted = redacted.replace(/NCT\d{8}/g, '[NCT]');
  redacted = redacted.replace(/NCT \d{8}/g, '[NCT]');
  
  return redacted;
}

/**
 * Redact email addresses
 */
export function redactEmails(text: string): string {
  let redacted = text;
  
  // Email pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  redacted = redacted.replace(emailRegex, '[EMAIL]');
  
  return redacted;
}

/**
 * Redact phone numbers
 */
export function redactPhones(text: string): string {
  let redacted = text;
  
  // US phone numbers: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  const phoneRegex = /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  redacted = redacted.replace(phoneRegex, '[PHONE]');
  
  // International format
  const internationalPhoneRegex = /\+\d{1,3}[-.\s]?\(?\d{2,3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
  redacted = redacted.replace(internationalPhoneRegex, '[PHONE]');
  
  return redacted;
}

/**
 * Redact URLs
 */
export function redactURLs(text: string): string {
  let redacted = text;
  
  // HTTP/HTTPS URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  redacted = redacted.replace(urlRegex, '[URL]');
  
  // www. URLs
  const wwwRegex = /www\.[^\s]+/g;
  redacted = redacted.replace(wwwRegex, '[URL]');
  
  return redacted;
}

/**
 * Apply all redactions to text
 * This is the main function to call for content redaction
 */
export function redactContent(text: string): string {
  let redacted = text;
  
  // Apply all redaction functions in order
  redacted = redactEmails(redacted);
  redacted = redactPhones(redacted);
  redacted = redactURLs(redacted);
  redacted = redactSponsors(redacted);
  redacted = redactCROs(redacted);
  redacted = redactSites(redacted);
  redacted = redactInvestigators(redacted);
  redacted = redactProtocols(redacted);
  redacted = redactNCT(redacted);
  
  return redacted;
}

/**
 * Enhanced redaction for confessions (stricter)
 */
export function redactConfession(text: string): string {
  let redacted = text;
  
  // Apply standard redactions
  redacted = redactContent(redacted);
  
  // Additional redactions specific to confessions
  // Redact city names (common US cities)
  const cities = [
    /New York/i, /Los Angeles/i, /Chicago/i, /Houston/i, /Phoenix/i,
    /Philadelphia/i, /San Antonio/i, /San Diego/i, /Dallas/i, /San Jose/i,
  ];
  cities.forEach((pattern) => {
    redacted = redacted.replace(pattern, '[LOCATION]');
  });
  
  // Redact company names (Capitalized words)
  // Look for patterns like "at [Company]" or "with [Company]"
  redacted = redacted.replace(/at [A-Z][a-z]+/g, 'at [COMPANY]');
  redacted = redacted.replace(/with [A-Z][a-z]+/g, 'with [COMPANY]');
  
  return redacted;
}

/**
 * Validate that content doesn't contain file attachments or prohibited content
 */
export function validateContent(content: string, attachments?: any[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for file attachments
  if (attachments && attachments.length > 0) {
    errors.push('File attachments are not allowed');
  }
  
  // Check for potential file upload indicators
  const uploadIndicators = [
    /uploaded a file/i,
    /attached document/i,
    /see attachment/i,
    /file:\/\//i,
    /data:application/i,
  ];
  
  uploadIndicators.forEach((pattern) => {
    if (pattern.test(content)) {
      errors.push('File attachments are not allowed');
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get a summary of redactions made (for debugging/logging, not showing to users)
 */
export function getRedactionSummary(originalText: string, redactedText: string): {
  sponsorsRedacted: number;
  croRedacted: number;
  sitesRedacted: number;
  investigatorsRedacted: number;
  protocolsRedacted: number;
  nctRedacted: number;
  emailsRedacted: number;
  phonesRedacted: number;
  urlsRedacted: number;
} {
  return {
    sponsorsRedacted: (originalText.match(/\[SPONSOR\]/g) || []).length,
    croRedacted: (redactedText.match(/\[CRO\]/g) || []).length,
    sitesRedacted: (redactedText.match(/\[SITE\]/g) || []).length,
    investigatorsRedacted: (redactedText.match(/\[PI\]/g) || []).length,
    protocolsRedacted: (redactedText.match(/\[PROTOCOL\]/g) || []).length,
    nctRedacted: (redactedText.match(/\[NCT\]/g) || []).length,
    emailsRedacted: (redactedText.match(/\[EMAIL\]/g) || []).length,
    phonesRedacted: (redactedText.match(/\[PHONE\]/g) || []).length,
    urlsRedacted: (redactedText.match(/\[URL\]/g) || []).length,
  };
}