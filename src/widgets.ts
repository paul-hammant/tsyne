import { Context } from './context';

/**
 * Base class for all widgets
 */
export abstract class Widget {
  protected ctx: Context;
  public id: string;

  constructor(ctx: Context, id: string) {
    this.ctx = ctx;
    this.id = id;
  }

  async setText(text: string): Promise<void> {
    await this.ctx.bridge.send('setText', {
      widgetId: this.id,
      text
    });
  }

  async getText(): Promise<string> {
    const result = await this.ctx.bridge.send('getText', {
      widgetId: this.id
    });
    return result.text;
  }
}

/**
 * Button widget
 */
export class Button extends Widget {
  constructor(ctx: Context, text: string, onClick?: () => void) {
    const id = ctx.generateId('button');
    super(ctx, id);

    const payload: any = { id, text };

    if (onClick) {
      const callbackId = ctx.generateId('callback');
      payload.callbackId = callbackId;
      ctx.bridge.registerEventHandler(callbackId, onClick);
    }

    ctx.bridge.send('createButton', payload);
    ctx.addToCurrentContainer(id);
  }
}

/**
 * Label widget
 */
export class Label extends Widget {
  constructor(ctx: Context, text: string) {
    const id = ctx.generateId('label');
    super(ctx, id);

    ctx.bridge.send('createLabel', { id, text });
    ctx.addToCurrentContainer(id);
  }
}

/**
 * Entry (text input) widget
 */
export class Entry extends Widget {
  constructor(ctx: Context, placeholder?: string) {
    const id = ctx.generateId('entry');
    super(ctx, id);

    ctx.bridge.send('createEntry', { id, placeholder: placeholder || '' });
    ctx.addToCurrentContainer(id);
  }
}

/**
 * VBox container (vertical box layout)
 */
export class VBox {
  private ctx: Context;
  public id: string;

  constructor(ctx: Context, builder: () => void) {
    this.ctx = ctx;
    this.id = ctx.generateId('vbox');

    // Push a new container context
    ctx.pushContainer();

    // Execute the builder function to collect children
    builder();

    // Pop the container and get the children
    const children = ctx.popContainer();

    // Create the VBox with the children
    ctx.bridge.send('createVBox', { id: this.id, children });
    ctx.addToCurrentContainer(this.id);
  }
}

/**
 * HBox container (horizontal box layout)
 */
export class HBox {
  private ctx: Context;
  public id: string;

  constructor(ctx: Context, builder: () => void) {
    this.ctx = ctx;
    this.id = ctx.generateId('hbox');

    // Push a new container context
    ctx.pushContainer();

    // Execute the builder function to collect children
    builder();

    // Pop the container and get the children
    const children = ctx.popContainer();

    // Create the HBox with the children
    ctx.bridge.send('createHBox', { id: this.id, children });
    ctx.addToCurrentContainer(this.id);
  }
}
