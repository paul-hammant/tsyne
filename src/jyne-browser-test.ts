import { Browser } from './browser';
import { TestContext } from './test';
import http from 'http';
import { AddressInfo } from 'net';

export interface BrowserTestOptions {
  headed?: boolean;
  timeout?: number;
  port?: number;
}

export interface TestPage {
  path: string;
  code: string;
}

/**
 * JyneBrowserTest provides a testing framework for Jyne Browser pages
 *
 * Similar to JyneTest but for testing browser pages loaded from HTTP server
 */
export class JyneBrowserTest {
  private browser: Browser | null = null;
  private testContext: TestContext | null = null;
  private server: http.Server | null = null;
  private serverPort: number = 0;
  private pages: Map<string, string> = new Map();
  private options: BrowserTestOptions;

  constructor(options: BrowserTestOptions = {}) {
    this.options = {
      headed: options.headed ?? false,
      timeout: options.timeout ?? 30000,
      port: options.port ?? 0  // 0 = random available port
    };
  }

  /**
   * Add test pages to be served by the test server
   */
  addPages(pages: TestPage[]): void {
    for (const page of pages) {
      this.pages.set(page.path, page.code);
    }
  }

  /**
   * Start the test HTTP server
   */
  private async startServer(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const url = req.url || '/';
        const pageCode = this.pages.get(url);

        if (pageCode) {
          res.writeHead(200, { 'Content-Type': 'text/typescript' });
          res.end(pageCode);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/typescript' });
          res.end(`
const { vbox, label } = jyne;
vbox(() => {
  label('404 - Page Not Found');
  label('URL: ' + browserContext.currentUrl);
});
          `);
        }
      });

      this.server.listen(this.options.port, () => {
        const address = this.server!.address() as AddressInfo;
        this.serverPort = address.port;
        resolve(this.serverPort);
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Create a browser in test mode and start test server
   */
  async createBrowser(initialUrl?: string): Promise<Browser> {
    // Start test server
    await this.startServer();

    // Create browser instance (headless if not headed mode)
    const testMode = !this.options.headed;

    // For now, create browser normally - we'd need to pass testMode to Browser constructor
    this.browser = new Browser({
      title: 'Jyne Browser Test',
      width: 800,
      height: 600
    });

    // Get test context from browser's app
    const app = this.browser.getApp();
    this.testContext = new TestContext(app.getBridge());

    // Navigate to initial URL if provided
    if (initialUrl) {
      const fullUrl = this.getTestUrl(initialUrl);
      await this.browser.changePage(fullUrl);

      // Wait for page to load
      await this.waitForPageLoad();
    }

    return this.browser;
  }

  /**
   * Get full URL for a test page path
   */
  getTestUrl(path: string): string {
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    return `http://localhost:${this.serverPort}${path}`;
  }

  /**
   * Navigate to a test page
   */
  async navigate(path: string): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not created. Call createBrowser() first.');
    }

    const url = this.getTestUrl(path);
    await this.browser.changePage(url);
    await this.waitForPageLoad();
  }

  /**
   * Navigate back
   */
  async back(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not created. Call createBrowser() first.');
    }
    await this.browser.back();
    await this.waitForPageLoad();
  }

  /**
   * Navigate forward
   */
  async forward(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not created. Call createBrowser() first.');
    }
    await this.browser.forward();
    await this.waitForPageLoad();
  }

  /**
   * Reload current page
   */
  async reload(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not created. Call createBrowser() first.');
    }
    await this.browser.reload();
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to finish loading
   */
  private async waitForPageLoad(timeoutMs?: number): Promise<void> {
    const timeout = timeoutMs ?? this.options.timeout ?? 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Check if browser is still loading
      // For now, just wait a short time for page to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // In a real implementation, we'd check browser.loading state
      // but that's not exposed currently
      break;
    }
  }

  /**
   * Get the test context for interacting with widgets
   */
  getContext(): TestContext {
    if (!this.testContext) {
      throw new Error('Browser not created. Call createBrowser() first.');
    }
    return this.testContext;
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    if (!this.browser) {
      throw new Error('Browser not created. Call createBrowser() first.');
    }
    return (this.browser as any).currentUrl;
  }

  /**
   * Assert current URL matches expected
   */
  assertUrl(expected: string): void {
    const current = this.getCurrentUrl();
    const expectedFull = this.getTestUrl(expected);

    if (current !== expectedFull) {
      throw new Error(`URL assertion failed: expected ${expectedFull}, got ${current}`);
    }
  }

  /**
   * Clean up: stop server and quit browser
   */
  async cleanup(): Promise<void> {
    // Close server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }

    // Quit browser
    if (this.browser) {
      const app = this.browser.getApp();
      app.getBridge().quit();
      await new Promise(resolve => setTimeout(resolve, 100));
      this.browser = null;
    }
  }
}

/**
 * Helper function to create a browser test
 */
export async function browserTest(
  name: string,
  pages: TestPage[],
  testFn: (browserTest: JyneBrowserTest) => Promise<void>,
  options: BrowserTestOptions = {}
): Promise<void> {
  const jyneBrowserTest = new JyneBrowserTest(options);
  jyneBrowserTest.addPages(pages);

  console.log(`Running browser test: ${name}`);

  try {
    await testFn(jyneBrowserTest);
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    await jyneBrowserTest.cleanup();
  }
}

/**
 * Helper to describe a browser test suite
 */
export function describeBrowser(name: string, suiteFn: () => void): void {
  console.log(`\n${name}`);
  suiteFn();
}
