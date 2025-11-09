import { BridgeConnection } from './bridge';
import { Context } from './context';
import { Window, WindowOptions } from './window';

export interface AppOptions {
  title?: string;
}

/**
 * App is the main application class
 */
export class App {
  private ctx: Context;
  private windows: Window[] = [];
  private bridge: BridgeConnection;

  constructor(options?: AppOptions, testMode: boolean = false) {
    this.bridge = new BridgeConnection(testMode);
    this.ctx = new Context(this.bridge);
  }

  getContext(): Context {
    return this.ctx;
  }

  getBridge(): BridgeConnection {
    return this.bridge;
  }

  window(options: WindowOptions, builder: (win: Window) => void): Window {
    const win = new Window(this.ctx, options, builder);
    this.windows.push(win);
    return win;
  }

  async run(): Promise<void> {
    // Show all windows
    for (const win of this.windows) {
      await win.show();
    }
  }

  quit(): void {
    this.ctx.bridge.quit();
  }
}
