import { Context } from './context';

export interface WindowOptions {
  title: string;
}

/**
 * Window represents a Fyne window
 */
export class Window {
  private ctx: Context;
  public id: string;
  private contentId?: string;

  constructor(ctx: Context, options: WindowOptions, builder?: (win: Window) => void) {
    this.ctx = ctx;
    this.id = ctx.generateId('window');

    ctx.bridge.send('createWindow', {
      id: this.id,
      title: options.title
    });

    if (builder) {
      ctx.pushWindow(this.id);
      ctx.pushContainer();

      builder(this);

      const children = ctx.popContainer();
      if (children.length > 0) {
        // Use the first (and should be only) child as content
        this.contentId = children[0];
      }

      ctx.popWindow();
    }
  }

  async show(): Promise<void> {
    if (this.contentId) {
      await this.ctx.bridge.send('setContent', {
        windowId: this.id,
        widgetId: this.contentId
      });
    }

    await this.ctx.bridge.send('showWindow', {
      windowId: this.id
    });
  }

  setContent(builder: () => void): void {
    this.ctx.pushWindow(this.id);
    this.ctx.pushContainer();

    builder();

    const children = this.ctx.popContainer();
    if (children.length > 0) {
      this.contentId = children[0];
    }

    this.ctx.popWindow();
  }

  /**
   * Shows an information dialog with a title and message
   */
  async showInfo(title: string, message: string): Promise<void> {
    await this.ctx.bridge.send('showInfo', {
      windowId: this.id,
      title,
      message
    });
  }

  /**
   * Shows an error dialog with a title and message
   */
  async showError(title: string, message: string): Promise<void> {
    await this.ctx.bridge.send('showError', {
      windowId: this.id,
      title,
      message
    });
  }

  /**
   * Shows a confirmation dialog and returns the user's response
   * @returns Promise<boolean> - true if user confirmed, false if cancelled
   */
  async showConfirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const callbackId = this.ctx.generateId('callback');

      this.ctx.bridge.registerEventHandler(callbackId, (data: any) => {
        resolve(data.confirmed);
      });

      this.ctx.bridge.send('showConfirm', {
        windowId: this.id,
        title,
        message,
        callbackId
      });
    });
  }

  /**
   * Shows a file open dialog and returns the selected file path
   * @returns Promise<string | null> - file path if selected, null if cancelled
   */
  async showFileOpen(): Promise<string | null> {
    return new Promise((resolve) => {
      const callbackId = this.ctx.generateId('callback');

      this.ctx.bridge.registerEventHandler(callbackId, (data: any) => {
        if (data.error || !data.filePath) {
          resolve(null);
        } else {
          resolve(data.filePath);
        }
      });

      this.ctx.bridge.send('showFileOpen', {
        windowId: this.id,
        callbackId
      });
    });
  }

  /**
   * Shows a file save dialog and returns the selected file path
   * @returns Promise<string | null> - file path if selected, null if cancelled
   */
  async showFileSave(filename?: string): Promise<string | null> {
    return new Promise((resolve) => {
      const callbackId = this.ctx.generateId('callback');

      this.ctx.bridge.registerEventHandler(callbackId, (data: any) => {
        if (data.error || !data.filePath) {
          resolve(null);
        } else {
          resolve(data.filePath);
        }
      });

      this.ctx.bridge.send('showFileSave', {
        windowId: this.id,
        callbackId,
        filename: filename || 'untitled.txt'
      });
    });
  }
}
