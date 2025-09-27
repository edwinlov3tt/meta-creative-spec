export interface SanitizedDomain {
  domain: string;
  originalUrl: string;
  isValid: boolean;
  error?: string;
}

export class DomainSanitizer {
  static sanitizeDomain(input: string): SanitizedDomain {
    if (!input || typeof input !== 'string') {
      return {
        domain: '',
        originalUrl: input || '',
        isValid: false,
        error: 'Please enter a valid domain or URL'
      };
    }

    const trimmedInput = input.trim();

    if (trimmedInput.length === 0) {
      return {
        domain: '',
        originalUrl: trimmedInput,
        isValid: false,
        error: 'Please enter a valid domain or URL'
      };
    }

    try {
      let processedUrl = trimmedInput;

      if (!processedUrl.match(/^https?:\/\//i)) {
        processedUrl = `https://${processedUrl}`;
      }

      const urlObj = new URL(processedUrl);
      let domain = urlObj.hostname.toLowerCase();

      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }

      if (!this.isValidDomainFormat(domain)) {
        return {
          domain: '',
          originalUrl: trimmedInput,
          isValid: false,
          error: 'Please enter a valid domain name'
        };
      }

      return {
        domain,
        originalUrl: trimmedInput,
        isValid: true
      };
    } catch (error) {
      return {
        domain: '',
        originalUrl: trimmedInput,
        isValid: false,
        error: 'Please enter a valid domain or URL format'
      };
    }
  }

  private static isValidDomainFormat(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

    return domainRegex.test(domain) &&
           domain.length >= 4 &&
           domain.length <= 253 &&
           !domain.includes('..');
  }

  static constructFullUrl(domain: string): string {
    return `https://${domain}`;
  }
}
