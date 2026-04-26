import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Thin wrapper around `console` that:
 *  - silences debug/info logs in production,
 *  - prepends a [tag] prefix so log lines stay greppable,
 *  - keeps a single choke-point for plugging in remote logging later.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly isProd = environment.production;

  debug(tag: string, ...args: unknown[]): void {
    if (this.isProd) return;
    console.debug(`[${tag}]`, ...args);
  }

  info(tag: string, ...args: unknown[]): void {
    if (this.isProd) return;
    console.info(`[${tag}]`, ...args);
  }

  warn(tag: string, ...args: unknown[]): void {
    console.warn(`[${tag}]`, ...args);
  }

  error(tag: string, ...args: unknown[]): void {
    console.error(`[${tag}]`, ...args);
  }
}
