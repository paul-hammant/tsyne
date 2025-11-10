/**
 * Jyne Browser - Swiby-style browser for loading Jyne pages from web servers
 *
 * Enables dynamic loading of Jyne TypeScript pages from HTTP servers,
 * similar to how Mosaic/Firefox/Chrome load HTML pages.
 *
 * Architecture:
 * - ONE persistent browser window (like real browsers)
 * - Browser chrome (address bar, navigation buttons)
 * - Pages render into content area only
 * - Window size controlled by user, not pages
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { App } from './app';
import { Window } from './window';
import { Entry } from './widgets';

/**
 * Browser context passed to loaded pages
 */
export interface BrowserContext {
  /** Navigate back in history */
  back: () => Promise<void>;

  /** Navigate forward in history */
  forward: () => Promise<void>;

  /** Navigate to a new URL */
  changePage: (url: string) => Promise<void>;

  /** Reload current page */
  reload: () => Promise<void>;

  /** Current URL */
  currentUrl: string;

  /** Browser instance */
  browser: Browser;
}

/**
 * History entry for browser navigation
 */
interface HistoryEntry {
  url: string;
  pageCode: string;
}

/**
 * Browser for loading and displaying Jyne pages from web servers
 *
 * Similar to Swiby's browser concept - loads pages dynamically from servers
 * that can be implemented in any language (Spring, Sinatra, Flask, etc.)
 *
 * Key feature: Uses ONE persistent window, pages render into content area
 */
export class Browser {
  private app: App;
  private window: Window;
  private addressBarEntry: Entry | null = null;
  private history: HistoryEntry[] = [];
  private historyIndex: number = -1;
  private currentUrl: string = '';
  private loading: boolean = false;
  private currentPageBuilder: (() => void) | null = null;

  constructor(options?: { title?: string; width?: number; height?: number }) {
    this.app = new App({ title: options?.title || 'Jyne Browser' });

    // Create ONE persistent browser window
    this.window = this.app.window(
      {
        title: options?.title || 'Jyne Browser',
        width: options?.width || 900,
        height: options?.height || 700
      },
      (win) => {
        this.initializeWindow(win);
      }
    );
  }

  /**
   * Initialize the browser window with chrome and content area
   */
  private initializeWindow(win: Window): void {
    win.setContent(() => {
      this.buildWindowContent();
    });
  }

  /**
   * Build the complete window content: browser chrome + page content
   */
  private buildWindowContent(): void {
    const { vbox, hbox, button, entry, separator, scroll, label } = require('./index');

    vbox(() => {
      // Browser chrome (address bar and navigation buttons)
      hbox(() => {
        button('←', () => {
          this.back().catch(err => console.error('Back failed:', err));
        });

        button('→', () => {
          this.forward().catch(err => console.error('Forward failed:', err));
        });

        button('⟳', () => {
          this.reload().catch(err => console.error('Reload failed:', err));
        });

        this.addressBarEntry = entry(this.currentUrl || 'http://');

        button('Go', async () => {
          if (this.addressBarEntry) {
            const url = await this.addressBarEntry.getText();
            await this.changePage(url);
          }
        });
      });

      separator();

      // Page content area (scrollable)
      scroll(() => {
        vbox(() => {
          if (this.currentPageBuilder) {
            // Render current page content
            this.currentPageBuilder();
          } else {
            // Welcome message when no page loaded
            label('Jyne Browser');
            label('');
            label('Enter a URL in the address bar and click Go to navigate.');
          }
        });
      });
    });
  }

  /**
   * Navigate to a URL and load the Jyne page
   */
  async changePage(url: string): Promise<void> {
    if (this.loading) {
      console.log('Page already loading, ignoring navigation');
      return;
    }

    this.loading = true;
    this.currentUrl = url;

    // Update address bar
    if (this.addressBarEntry) {
      this.addressBarEntry.setText(url);
    }

    try {
      // Fetch page code from server
      const pageCode = await this.fetchPage(url);

      // Add to history (clear forward history if navigating from middle)
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }

      this.history.push({ url, pageCode });
      this.historyIndex = this.history.length - 1;

      // Render the page
      await this.renderPage(pageCode);
    } catch (error) {
      await this.showError(url, error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Navigate back in history
   */
  async back(): Promise<void> {
    if (this.historyIndex <= 0) {
      console.log('No previous page in history');
      return;
    }

    this.historyIndex--;
    const entry = this.history[this.historyIndex];
    this.currentUrl = entry.url;

    // Update address bar
    if (this.addressBarEntry) {
      this.addressBarEntry.setText(this.currentUrl);
    }

    await this.renderPage(entry.pageCode);
  }

  /**
   * Navigate forward in history
   */
  async forward(): Promise<void> {
    if (this.historyIndex >= this.history.length - 1) {
      console.log('No next page in history');
      return;
    }

    this.historyIndex++;
    const entry = this.history[this.historyIndex];
    this.currentUrl = entry.url;

    // Update address bar
    if (this.addressBarEntry) {
      this.addressBarEntry.setText(this.currentUrl);
    }

    await this.renderPage(entry.pageCode);
  }

  /**
   * Reload current page
   */
  async reload(): Promise<void> {
    if (this.currentUrl && this.historyIndex >= 0) {
      const entry = this.history[this.historyIndex];
      await this.renderPage(entry.pageCode);
    }
  }

  /**
   * Fetch page code from a URL
   */
  private async fetchPage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.get(url, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            resolve(this.fetchPage(redirectUrl));
            return;
          }
        }

        // Handle errors
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Render a page from its code into the browser window
   */
  private async renderPage(pageCode: string): Promise<void> {
    // Create browser context for the page
    const browserContext: BrowserContext = {
      back: () => this.back(),
      forward: () => this.forward(),
      changePage: (url: string) => this.changePage(url),
      reload: () => this.reload(),
      currentUrl: this.currentUrl,
      browser: this
    };

    try {
      // Pages are now simple content builders - just execute the code
      // The page code directly builds widgets using jyne API
      const jyne = require('./index');

      // Create a content builder that executes the page code
      this.currentPageBuilder = () => {
        // Execute the page code - it will create widgets directly
        const pageFunction = new Function('browserContext', 'jyne', pageCode);
        pageFunction(browserContext, jyne);
      };

      // Re-render the entire window (chrome + new content)
      this.window.setContent(() => {
        this.buildWindowContent();
      });

      await this.window.show();
    } catch (error) {
      await this.showError(this.currentUrl, error);
    }
  }

  /**
   * Show error page in the content area
   */
  private async showError(url: string, error: any): Promise<void> {
    // Create error content builder
    this.currentPageBuilder = () => {
      const { vbox, label, button } = require('./index');

      vbox(() => {
        label('Error Loading Page');
        label('');
        label(`URL: ${url}`);
        label(`Error: ${error.message || error}`);
        label('');

        if (this.historyIndex > 0) {
          button('Go Back', () => {
            this.back().catch(err => console.error('Back failed:', err));
          });
        }
      });
    };

    // Re-render window with error content
    this.window.setContent(() => {
      this.buildWindowContent();
    });

    await this.window.show();
  }

  /**
   * Start the browser and show the window
   */
  async run(): Promise<void> {
    await this.app.run();
  }

  /**
   * Get the App instance
   */
  getApp(): App {
    return this.app;
  }
}

/**
 * Create a browser and navigate to initial URL
 */
export async function createBrowser(
  initialUrl?: string,
  options?: { title?: string; width?: number; height?: number }
): Promise<Browser> {
  const browser = new Browser(options);

  if (initialUrl) {
    await browser.changePage(initialUrl);
  }

  return browser;
}
