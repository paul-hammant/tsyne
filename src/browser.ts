/**
 * Jyne Browser - Swiby-style browser for loading Jyne pages from web servers
 *
 * Enables dynamic loading of Jyne TypeScript pages from HTTP servers,
 * similar to how Mosaic/Firefox/Chrome load HTML pages.
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { App } from './app';
import { Window } from './window';
import { Context } from './context';

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
 */
export class Browser {
  private app: App;
  private window: Window | null = null;
  private history: HistoryEntry[] = [];
  private historyIndex: number = -1;
  private currentUrl: string = '';
  private loading: boolean = false;

  constructor(options?: { title?: string; width?: number; height?: number }) {
    this.app = new App({ title: options?.title || 'Jyne Browser' });

    // Create browser window
    this.window = this.app.window(
      {
        title: options?.title || 'Jyne Browser',
        width: options?.width || 800,
        height: options?.height || 600
      },
      (win) => {
        // Initial empty state
        win.setContent(() => {
          const { label } = require('./index');
          label('Browser starting...');
        });
      }
    );
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
    await this.renderPage(entry.pageCode);
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
   * Render a page from its code
   */
  private async renderPage(pageCode: string): Promise<void> {
    if (!this.window) return;

    // Create browser context for the page
    const browserContext: BrowserContext = {
      back: () => this.back(),
      forward: () => this.forward(),
      changePage: (url: string) => this.changePage(url),
      currentUrl: this.currentUrl,
      browser: this
    };

    // Execute the page code with browser context
    try {
      // The page code should be a function that receives browserContext
      // and uses the Jyne API to build the page
      const pageFunction = new Function('browserContext', 'jyne', pageCode);

      // Re-render the window with the page content
      this.window = this.app.window(
        {
          title: `Jyne Browser - ${this.currentUrl}`,
          width: 800,
          height: 600
        },
        (win) => {
          // Page function builds the UI using Jyne API
          const jyne = require('./index');
          pageFunction(browserContext, jyne);
        }
      );

      await this.window.show();
    } catch (error) {
      await this.showError(this.currentUrl, error);
    }
  }

  /**
   * Show error page
   */
  private async showError(url: string, error: any): Promise<void> {
    if (!this.window) return;

    this.window = this.app.window(
      {
        title: 'Jyne Browser - Error',
        width: 800,
        height: 600
      },
      (win) => {
        win.setContent(() => {
          const { vbox, label, button } = require('./index');

          vbox(() => {
            label('Error Loading Page');
            label('');
            label(`URL: ${url}`);
            label(`Error: ${error.message || error}`);
            label('');

            if (this.historyIndex > 0) {
              button('Go Back', () => this.back());
            }
          });
        });
      }
    );

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
