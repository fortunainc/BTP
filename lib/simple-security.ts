/**
 * Simple Security System for BehindTheProtocol
 * Inspired by Blind's proven anonymity model
 * 
 * CORE PRINCIPLE: Verify, then delete. Keep only what's needed.
 */

import crypto from 'crypto';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * ========================================
 * PART 1: USER MODEL (Minimal)
 * ========================================
 * 
 * What we store:
 * - Anonymous ID (random)
 * - Anonymous Handle (user chosen)
 * - Role Category (CRA, CRC, PI, etc.)
 * - Company Category (CRO, Site, Sponsor, etc.)
 * - Trust Score (for moderation)
 * 
 * What we DON'T store:
 * - Email (deleted after verification)
 * - Real name
 * - Employer name
 * - IP address
 * - Any identifying info
 */

export interface AnonymousUser {
  id: string;                    // Random anonymous ID
  handle: string;                // User-chosen anonymous handle
  roleCategory: RoleCategory;    // Broad role category
  companyCategory: CompanyCategory; // Broad company type
  trustScore: number;            // 0-100 for moderation
  createdAt: number;             // Account creation timestamp
  lastActiveAt: number;          // Last activity (rounded to day)
}

export type RoleCategory = 
  | 'cra'           // Clinical Research Associate
  | 'crc'           // Clinical Research Coordinator
  | 'pi'            // Principal Investigator
  | 'sub-i'         // Sub-Investigator
  | 'regulatory'    // Regulatory Affairs
  | 'data_mgmt'     // Data Management
  | 'quality'       // Quality Assurance
  | 'operations'    // Operations
  | 'other';        // Other

export type CompanyCategory =
  | 'cro'           // Contract Research Organization
  | 'site'          // Clinical Site
  | 'sponsor'       // Pharma/Biotech Sponsor
  | 'academic'      // Academic Institution
  | 'other';        // Other

/**
 * ========================================
 * PART 2: VERIFICATION (Blind-Style)
 * ========================================
 * 
 * Process:
 * 1. User enters work email
 * 2. We send verification code
 * 3. User enters code
 * 4. We extract domain, categorize company
 * 5. User selects role category
 * 6. We DELETE the email immediately
 * 7. Account created with categories only
 */

export class SimpleVerification {
  private verificationCodes: Map<string, { code: string; expires: number }> = new Map();

  /**
   * Step 1: Send verification code to work email
   */
  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    // Check if email looks like a work email (not gmail, yahoo, etc.)
    if (!this.isWorkEmail(email)) {
      return {
        success: false,
        message: 'Please use your work email address. Personal emails are not accepted.'
      };
    }

    // Generate 6-digit code
    const code = this.generateCode();
    
    // Store code with 10-minute expiry
    this.verificationCodes.set(email, {
      code,
      expires: Date.now() + 10 * 60 * 1000
    });

    // Send email (in production, use SendGrid, AWS SES, etc.)
    await this.sendEmail(email, code);

    return {
      success: true,
      message: 'Verification code sent to your email.'
    };
  }

  /**
   * Step 2: Verify the code and create account
   */
  async verifyAndCreateAccount(
    email: string,
    code: string,
    handle: string,
    roleCategory: RoleCategory
  ): Promise<{ success: boolean; user?: AnonymousUser; error?: string }> {
    // Check code
    const stored = this.verificationCodes.get(email);
    
    if (!stored || stored.code !== code || Date.now() > stored.expires) {
      return { success: false, error: 'Invalid or expired verification code.' };
    }

    // Get company category from email domain
    const companyCategory = this.categorizeCompanyFromEmail(email);

    // Create anonymous user
    const user: AnonymousUser = {
      id: this.generateAnonymousId(),
      handle,
      roleCategory,
      companyCategory,
      trustScore: 50, // Start at 50
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    };

    // CRITICAL: Delete email and verification code
    this.verificationCodes.delete(email);
    
    // Log that email was deleted (for audit)
    console.log(`[VERIFICATION] Email deleted after verification for user ${user.id}`);

    return { success: true, user };
  }

  /**
   * Check if email is a work email
   */
  private isWorkEmail(email: string): boolean {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return !!domain && !personalDomains.includes(domain);
  }

  /**
   * Categorize company from email domain
   */
  private categorizeCompanyFromEmail(email: string): CompanyCategory {
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Known CRO domains
    const croDomains = [
      'iqvia.com', 'covance.com', 'ppd.com', 'parexel.com', 
      'iconplc.com', 'syneoshealth.com', 'medidata.com',
      'clinipace.com', 'wcct.com', 'kkr.com'
    ];
    
    // Known sponsor domains
    const sponsorDomains = [
      'pfizer.com', 'roche.com', 'novartis.com', 'merck.com',
      'astrazeneca.com', 'bms.com', 'jnj.com', 'abbvie.com',
      'gilead.com', 'amgen.com', 'regeneron.com', 'lilly.com',
      'moderna.com', 'biontech.com', 'johnsonandjohnson.com'
    ];

    // Known academic domains
    const academicDomains = [
      'harvard.edu', 'stanford.edu', 'johns Hopkins.edu', 
      'ucla.edu', 'ucsf.edu', 'duke.edu', 'yale.edu',
      '.edu' // Catch-all for educational
    ];

    if (croDomains.some(d => domain.includes(d))) return 'cro';
    if (sponsorDomains.some(d => domain.includes(d))) return 'sponsor';
    if (academicDomains.some(d => domain.includes(d))) return 'academic';
    
    // Default to site if it looks like a healthcare organization
    if (domain.includes('health') || domain.includes('hospital') || domain.includes('clinic')) {
      return 'site';
    }

    return 'other';
  }

  /**
   * Generate 6-digit verification code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate anonymous ID
   */
  private generateAnonymousId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Send verification email (placeholder)
   */
  private async sendEmail(email: string, code: string): Promise<void> {
    // In production: SendGrid, AWS SES, Resend, etc.
    console.log(`[EMAIL] Sending verification code ${code} to ${email}`);
    
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'verify@behindtheprotocol.com',
    //   to: email,
    //   subject: 'Your BehindTheProtocol Verification Code',
    //   html: `
    //     <h1>Verify Your Email</h1>
    //     <p>Your verification code is: <strong>${code}</strong></p>
    //     <p>This code expires in 10 minutes.</p>
    //   `
    // });
  }
}

/**
 * ========================================
 * PART 3: METADATA STRIPPING
 * ========================================
 * 
 * Strip all identifying metadata from content
 */

export class MetadataStripper {
  /**
   * Strip metadata from content before storage
   */
  strip(content: string): SanitizedContent {
    return {
      text: this.removeIdentifiers(content),
      timestamp: this.roundTimestamp(Date.now()),
      // NO other metadata stored
    };
  }

  /**
   * Remove potential identifiers from text
   */
  private removeIdentifiers(text: string): string {
    const patterns = [
      // SSN
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED]' },
      // Phone
      { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[REDACTED]' },
      // Email
      { pattern: /\b[\w.-]+@[\w.-]+\.\w+\b/g, replacement: '[REDACTED]' },
      // NCT numbers
      { pattern: /\bNCT\d{8}\b/gi, replacement: '[TRIAL-ID]' },
      // IP addresses
      { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[REDACTED]' },
    ];

    let sanitized = text;
    for (const { pattern, replacement } of patterns) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    return sanitized;
  }

  /**
   * Round timestamp to nearest hour
   */
  private roundTimestamp(timestamp: number): number {
    const HOUR = 60 * 60 * 1000;
    return Math.floor(timestamp / HOUR) * HOUR;
  }
}

/**
 * ========================================
 * PART 4: AI CONTENT SCANNING
 * ========================================
 * 
 * Scan content for identifying information
 * Warn users before they post
 */

export class ContentScanner {
  /**
   * Scan content for potential identifying information
   */
  async scan(content: string): Promise<ContentScanResult> {
    const warnings: ContentWarning[] = [];

    // Rule-based checks
    const rules = this.getRules();
    for (const rule of rules) {
      const matches = content.match(rule.pattern);
      if (matches) {
        warnings.push({
          type: rule.type,
          severity: rule.severity,
          message: rule.message,
          suggestion: rule.suggestion
        });
      }
    }

    // AI-powered check for subtle identifiers
    const aiWarnings = await this.aiScan(content);
    warnings.push(...aiWarnings);

    return {
      isSafe: warnings.filter(w => w.severity === 'high').length === 0,
      warnings,
      sanitizedContent: this.suggestSanitization(content, warnings)
    };
  }

  /**
   * AI-powered scanning for subtle identifiers
   */
  private async aiScan(content: string): Promise<ContentWarning[]> {
    try {
      const prompt = `Analyze this text for information that could identify the author in a clinical trial context.

Look for:
- Specific site names or locations
- Drug/compound names combined with other details
- Protocol numbers or study codes
- Specific enrollment numbers
- Unique circumstances
- Company-specific terminology

Text: "${content}"

Respond in JSON:
{
  "warnings": [
    {
      "type": "string",
      "severity": "high" | "medium" | "low",
      "message": "string",
      "suggestion": "string"
    }
  ]
}

If safe, return: {"warnings": []}`;

      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"warnings": []}');
      return result.warnings || [];
    } catch (error) {
      console.error('AI scan failed:', error);
      return [];
    }
  }

  /**
   * Get rule-based warning rules
   */
  private getRules(): WarningRule[] {
    return [
      {
        type: 'trial_id',
        pattern: /\bNCT\d{8}\b/gi,
        severity: 'high',
        message: 'Clinical trial identifier detected',
        suggestion: 'Replace with general description like "a phase 3 trial"'
      },
      {
        type: 'protocol',
        pattern: /\bprotocol\s*[A-Z]{2,4}[-_]?\d{3,}/gi,
        severity: 'high',
        message: 'Protocol number detected',
        suggestion: 'Remove protocol numbers entirely'
      },
      {
        type: 'drug_name',
        pattern: /\b(pembrolizumab|nivolumab|atezolizumab|ipilimumab|trastuzumab)\b/gi,
        severity: 'medium',
        message: 'Specific drug name detected',
        suggestion: 'Consider using "the study drug" or "the treatment"'
      },
      {
        type: 'site_location',
        pattern: /\b(site|location|center):\s*[A-Z][a-z]+/gi,
        severity: 'high',
        message: 'Site name or location detected',
        suggestion: 'Use "my site" or "a major research center"'
      },
      {
        type: 'employer',
        pattern: /\b(Pfizer|Roche|Novartis|Merck|AstraZeneca|BMS|J&J|AbbVie|IQVIA|Parexel|ICON|Syneos)\b/g,
        severity: 'high',
        message: 'Company name detected',
        suggestion: 'Use "my CRO", "the sponsor", or "my company"'
      },
      {
        type: 'email',
        pattern: /\b[\w.-]+@[\w.-]+\.\w+\b/g,
        severity: 'high',
        message: 'Email address detected',
        suggestion: 'Remove all email addresses'
      },
      {
        type: 'phone',
        pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        severity: 'high',
        message: 'Phone number detected',
        suggestion: 'Remove all phone numbers'
      }
    ];
  }

  /**
   * Suggest sanitized version
   */
  private suggestSanitization(content: string, warnings: ContentWarning[]): string {
    let sanitized = content;
    
    // Apply automatic redactions for high-severity issues
    for (const warning of warnings.filter(w => w.severity === 'high')) {
      // This is a simplified version - in production, be more careful
      sanitized = sanitized.replace(/\bNCT\d{8}\b/gi, '[TRIAL-ID]');
      sanitized = sanitized.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL]');
      sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
    }
    
    return sanitized;
  }
}

/**
 * ========================================
 * PART 5: AGGREGATION THRESHOLDS
 * ========================================
 * 
 * Signal aggregation - only show patterns when 10+ reports
 */

export class AggregationThreshold {
  private static MINIMUM_THRESHOLD = 10;

  /**
   * Check if a signal pattern can be shown (needs 10+ reports)
   */
  static canShowPattern(reportCount: number): boolean {
    return reportCount >= this.MINIMUM_THRESHOLD;
  }

  /**
   * Aggregate reports into patterns
   */
  static aggregateReports(reports: SignalReport[]): AggregatedPattern[] {
    const patterns: Map<string, AggregatedPattern> = new Map();

    for (const report of reports) {
      const key = this.generatePatternKey(report);
      
      if (!patterns.has(key)) {
        patterns.set(key, {
          id: this.generateId(),
          category: report.category,
          description: report.description,
          reportCount: 0,
          affectedRoles: new Set(),
          affectedCompanyTypes: new Set(),
          firstReported: report.timestamp,
          lastReported: report.timestamp,
          isVisible: false
        });
      }

      const pattern = patterns.get(key)!;
      pattern.reportCount++;
      pattern.affectedRoles.add(report.reporterRole);
      pattern.affectedCompanyTypes.add(report.reporterCompanyType);
      pattern.lastReported = report.timestamp;
      pattern.isVisible = this.canShowPattern(pattern.reportCount);
    }

    return Array.from(patterns.values());
  }

  /**
   * Generate pattern key for grouping
   */
  private static generatePatternKey(report: SignalReport): string {
    // Group by category and normalized description
    const normalized = report.description.toLowerCase()
      .replace(/\b[a-z]{2,4}\d{3,}\b/g, '[PROTOCOL]') // Normalize protocol numbers
      .replace(/\bNCT\d{8}\b/gi, '[NCT]'); // Normalize NCT numbers
    
    return `${report.category}:${normalized.substring(0, 50)}`;
  }

  /**
   * Generate pattern ID
   */
  private static generateId(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}

/**
 * ========================================
 * PART 6: STRICT MODERATION RULES
 * ========================================
 */

export class ModerationRules {
  /**
   * Check content against moderation rules
   */
  static checkContent(content: string): ModerationResult {
    const violations: ModerationViolation[] = [];

    // Check for prohibited content
    const rules = this.getRules();
    
    for (const rule of rules) {
      if (rule.pattern.test(content)) {
        violations.push({
          rule: rule.name,
          severity: rule.severity,
          action: rule.action
        });
      }
    }

    return {
      isApproved: violations.length === 0,
      violations,
      requiresReview: violations.some(v => v.severity === 'medium')
    };
  }

  /**
   * Get moderation rules
   */
  private static getRules(): ModerationRule[] {
    return [
      {
        name: 'no_real_names',
        pattern: /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g,
        severity: 'medium',
        action: 'request_edit'
      },
      {
        name: 'no_patient_info',
        pattern: /\b(patient|subject)\s+(id|number|name|dob|ssn)\b/gi,
        severity: 'high',
        action: 'auto_reject'
      },
      {
        name: 'no_internal_urls',
        pattern: /https?:\/\/[^\s]+\.(internal|intranet|local)\b/gi,
        severity: 'high',
        action: 'auto_reject'
      },
      {
        name: 'no_threats',
        pattern: /\b(kill|harm|hurt|attack|threaten)\b/gi,
        severity: 'high',
        action: 'auto_reject_and_report'
      }
    ];
  }
}

// ========================================
// TYPES
// ========================================

interface SanitizedContent {
  text: string;
  timestamp: number;
}

interface ContentScanResult {
  isSafe: boolean;
  warnings: ContentWarning[];
  sanitizedContent: string;
}

interface ContentWarning {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}

interface WarningRule {
  type: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}

interface SignalReport {
  id: string;
  category: string;
  description: string;
  reporterRole: RoleCategory;
  reporterCompanyType: CompanyCategory;
  timestamp: number;
}

interface AggregatedPattern {
  id: string;
  category: string;
  description: string;
  reportCount: number;
  affectedRoles: Set<RoleCategory>;
  affectedCompanyTypes: Set<CompanyCategory>;
  firstReported: number;
  lastReported: number;
  isVisible: boolean; // Only true if reportCount >= 10
}

interface ModerationResult {
  isApproved: boolean;
  violations: ModerationViolation[];
  requiresReview: boolean;
}

interface ModerationViolation {
  rule: string;
  severity: 'low' | 'medium' | 'high';
  action: 'request_edit' | 'auto_reject' | 'auto_reject_and_report';
}

interface ModerationRule {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high';
  action: 'request_edit' | 'auto_reject' | 'auto_reject_and_report';
}

// ========================================
// EXPORTS
// ========================================

export const verification = new SimpleVerification();
export const metadataStripper = new MetadataStripper();
export const contentScanner = new ContentScanner();