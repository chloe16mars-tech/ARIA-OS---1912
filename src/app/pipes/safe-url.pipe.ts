import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Marks a URL as safe for use in `iframe[src]`. Only http(s) URLs pass —
 * `javascript:`, `data:`, `file:` and other dangerous schemes are rejected
 * even though we call bypassSecurityTrustResourceUrl.
 */
@Pipe({
  name: 'safeUrl',
  standalone: true,
})
export class SafeUrlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(url: string): SafeResourceUrl | null {
    if (!url) return null;
    try {
      const parsed = new URL(url, 'https://invalid.local');
      if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
    } catch {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
