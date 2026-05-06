/**
 * Input Sanitization Service using DOMPurify
 */

import DOMPurify from 'dompurify';

export class InputSanitization {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHTML(dirty: string): string {
    if (typeof window !== 'undefined') {
      // Client-side sanitization
      return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote'],
        ALLOWED_ATTR: ['href'],
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover'],
      });
    }
    
    // Server-side sanitization (basic string cleaning)
    return this.serverSideSanitize(dirty);
  }

  /**
   * Sanitize plain text input
   */
  static sanitizeText(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove potentially dangerous characters
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Sanitize user-generated content (threads, replies, etc.)
   */
  static sanitizeContent(content: string): string {
    if (!content) return '';
    
    const sanitized = this.sanitizeHTML(content);
    return sanitized;
  }

  /**
   * Sanitize handle (username)
   */
  static sanitizeHandle(handle: string): string {
    if (!handle) return '';
    
    return handle
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
      .substring(0, 30); // Max 30 characters
  }

  /**
   * Sanitize email
   */
  static sanitizeEmail(email: string): string {
    if (!email) return '';
    
    return email
      .toLowerCase()
      .trim()
      .substring(0, 255); // Max 255 characters
  }

  /**
   * Validate and sanitize string length
   */
  static validateLength(input: string, minLength: number, maxLength: number): { valid: boolean; sanitized: string; error?: string } {
    if (!input) {
      return { valid: false, sanitized: '', error: 'Input is required' };
    }
    
    const sanitized = this.sanitizeText(input);
    
    if (sanitized.length < minLength) {
      return { valid: false, sanitized, error: `Input must be at least ${minLength} characters` };
    }
    
    if (sanitized.length > maxLength) {
      return { 
        valid: false, 
        sanitized: sanitized.substring(0, maxLength), 
        error: `Input must be less than ${maxLength} characters` 
      };
    }
    
    return { valid: true, sanitized };
  }

  /**
   * Server-side basic sanitization (when DOMPurify not available)
   */
  private static serverSideSanitize(dirty: string): string {
    if (!dirty) return '';
    
    return dirty
      // Remove script tags and content
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi, '')
      // Remove object and embed tags
      .replace(/<(object|embed)\b[^>]*>([\s\S]*?)<\/\1>/gi, '')
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|\w+)/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove data: protocol
      .replace(/data:/gi, '')
      // Remove potentially dangerous HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Trim
      .trim();
  }

  /**
   * Validate URL (for links in content)
   */
  static isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Sanitize URL parameters
   */
  static sanitizeURLParam(param: string): string {
    return encodeURIComponent(param);
  }
}