/**
 * Simplified Anonymity System for BehindTheProtocol
 * Modeled after Blind's proven approach
 */

export interface AnonymityWarning {
  type: 'identity' | 'metadata' | 'phishing';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export class AnonymitySystem {
  /**
   * Identity Warnings - Alert users before they share identifying information
   */
  static checkForIdentityLeak(content: string): AnonymityWarning[] {
    const warnings: AnonymityWarning[] = [];

    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailPattern.test(content)) {
      warnings.push({
        type: 'identity',
        severity: 'high',
        message: 'You appear to be sharing an email address. This could identify you or others.'
      });
    }

    // Phone number pattern
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    if (phonePattern.test(content)) {
      warnings.push({
        type: 'identity',
        severity: 'high',
        message: 'You appear to be sharing a phone number. This could identify you or others.'
      });
    }

    // SSN pattern (last 4 digits)
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
    if (ssnPattern.test(content)) {
      warnings.push({
        type: 'identity',
        severity: 'high',
        message: 'You appear to be sharing a Social Security Number. This is NEVER safe to share.'
      });
    }

    // NCT ID pattern (clinical trial identifiers)
    const nctPattern = /\bNCT\d{8}\b/gi;
    if (nctPattern.test(content)) {
      warnings.push({
        type: 'identity',
        severity: 'medium',
        message: 'You appear to be sharing an NCT ID. This could identify specific trials.'
      });
    }

    // Company name detection (common pharma/cro names)
    const companyNames = [
      'Pfizer', 'Roche', 'Novartis', 'Merck', 'Johnson & Johnson', 'J&J',
      'IQVIA', 'Covance', 'Parexel', 'PPD', 'Syneos', 'LabCorp',
      'Quintiles', 'ICON', 'PRA', 'Inventiv', 'AstraZeneca'
    ];
    const lowerContent = content.toLowerCase();
    const detectedCompany = companyNames.find(name => 
      lowerContent.includes(name.toLowerCase())
    );
    
    if (detectedCompany) {
      warnings.push({
        type: 'identity',
        severity: 'medium',
        message: `You appear to be mentioning "${detectedCompany}". Consider using broader terms like "sponsor" or "CRO".`
      });
    }

    return warnings;
  }

  /**
   * Anonymity Education - Provide context to help users understand the risks
   */
  static getAnonymityTips(): string[] {
    return [
      'Never share your name, email, phone number, or workplace directly',
      'Use role-based descriptions (e.g., "CRA at large pharma" instead of "John at Pfizer")',
      'Avoid mentioning specific trial details that could identify your employer',
      'Remember: Even small details can be combined to reveal your identity',
      'If unsure, err on the side of caution and use broader language'
    ];
  }

  /**
   * Format warning message for display
   */
  static formatWarnings(warnings: AnonymityWarning[]): string {
    if (warnings.length === 0) {
      return '';
    }

    const highSeverity = warnings.filter(w => w.severity === 'high');
    const mediumSeverity = warnings.filter(w => w.severity === 'medium');
    const lowSeverity = warnings.filter(w => w.severity === 'low');

    let message = '';
    
    if (highSeverity.length > 0) {
      message += '⚠️ HIGH RISK: ' + highSeverity.map(w => w.message).join(' ') + '\n\n';
    }
    
    if (mediumSeverity.length > 0) {
      message += '⚡ MEDIUM RISK: ' + mediumSeverity.map(w => w.message).join(' ') + '\n\n';
    }
    
    if (lowSeverity.length > 0) {
      message += '💡 SUGGESTION: ' + lowSeverity.map(w => w.message).join(' ') + '\n\n';
    }

    return message;
  }
}