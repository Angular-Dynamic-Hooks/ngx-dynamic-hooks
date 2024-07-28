import { isPlatformBrowser } from '@angular/common';
import { isDevMode, Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { ParseOptions } from '../settings/options';

/**
 * A utility service to print logs and warnings
 */
@Injectable({
  providedIn: 'root'
})
export class Logger {

  constructor(@Inject(PLATFORM_ID) private platformId: string) {
  }

  log(content: any[], options: ParseOptions): void {
    this.handleLog(content, options, 'log');
  }

  warn(content: any[], options: ParseOptions): void {
    this.handleLog(content, options, 'warn');
  }

  error(content: any[], options: ParseOptions): void {
    this.handleLog(content, options, 'error');
  }

  private handleLog(content: any[], options: ParseOptions, method: string) {
    if (
      options.logOptions?.dev && this.isDevMode() && isPlatformBrowser(this.platformId) ||
      options.logOptions?.prod && !this.isDevMode() && isPlatformBrowser(this.platformId) ||
      options.logOptions?.ssr && !isPlatformBrowser(this.platformId)
    ) { 
      (console as any)[method](...content);
    }
  }

  /**
   * Use local method that is easier to mock in tests
   */
  private isDevMode(): boolean {
    return isDevMode();
  } 
}
