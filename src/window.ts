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
}
