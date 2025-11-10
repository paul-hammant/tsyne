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

/**
 * Checkbox widget
 */
export class Checkbox extends Widget {
  constructor(ctx: Context, text: string, onChanged?: (checked: boolean) => void) {
    const id = ctx.generateId('checkbox');
    super(ctx, id);

    const payload: any = { id, text };

    if (onChanged) {
      const callbackId = ctx.generateId('callback');
      payload.callbackId = callbackId;
      ctx.bridge.registerEventHandler(callbackId, (data: any) => {
        onChanged(data.checked);
      });
    }

    ctx.bridge.send('createCheckbox', payload);
    ctx.addToCurrentContainer(id);
  }

  async setChecked(checked: boolean): Promise<void> {
    await this.ctx.bridge.send('setChecked', {
      widgetId: this.id,
      checked
    });
  }

  async getChecked(): Promise<boolean> {
    const result = await this.ctx.bridge.send('getChecked', {
      widgetId: this.id
    });
    return result.checked;
  }
}

/**
 * Select (dropdown) widget
 */
export class Select extends Widget {
  constructor(ctx: Context, options: string[], onSelected?: (selected: string) => void) {
    const id = ctx.generateId('select');
    super(ctx, id);

    const payload: any = { id, options };

    if (onSelected) {
      const callbackId = ctx.generateId('callback');
      payload.callbackId = callbackId;
      ctx.bridge.registerEventHandler(callbackId, (data: any) => {
        onSelected(data.selected);
      });
    }

    ctx.bridge.send('createSelect', payload);
    ctx.addToCurrentContainer(id);
  }

  async setSelected(selected: string): Promise<void> {
    await this.ctx.bridge.send('setSelected', {
      widgetId: this.id,
      selected
    });
  }

  async getSelected(): Promise<string> {
    const result = await this.ctx.bridge.send('getSelected', {
      widgetId: this.id
    });
    return result.selected;
  }
}

/**
 * Slider widget
 */
export class Slider extends Widget {
  constructor(
    ctx: Context,
    min: number,
    max: number,
    initialValue?: number,
    onChanged?: (value: number) => void
  ) {
    const id = ctx.generateId('slider');
    super(ctx, id);

    const payload: any = { id, min, max };

    if (initialValue !== undefined) {
      payload.value = initialValue;
    }

    if (onChanged) {
      const callbackId = ctx.generateId('callback');
      payload.callbackId = callbackId;
      ctx.bridge.registerEventHandler(callbackId, (data: any) => {
        onChanged(data.value);
      });
    }

    ctx.bridge.send('createSlider', payload);
    ctx.addToCurrentContainer(id);
  }

  async setValue(value: number): Promise<void> {
    await this.ctx.bridge.send('setValue', {
      widgetId: this.id,
      value
    });
  }

  async getValue(): Promise<number> {
    const result = await this.ctx.bridge.send('getValue', {
      widgetId: this.id
    });
    return result.value;
  }
}

/**
 * ProgressBar widget
 */
export class ProgressBar extends Widget {
  constructor(ctx: Context, initialValue?: number, infinite?: boolean) {
    const id = ctx.generateId('progressbar');
    super(ctx, id);

    const payload: any = { id, infinite: infinite || false };

    if (!infinite && initialValue !== undefined) {
      payload.value = initialValue;
    }

    ctx.bridge.send('createProgressBar', payload);
    ctx.addToCurrentContainer(id);
  }

  async setProgress(value: number): Promise<void> {
    await this.ctx.bridge.send('setProgress', {
      widgetId: this.id,
      value
    });
  }

  async getProgress(): Promise<number> {
    const result = await this.ctx.bridge.send('getProgress', {
      widgetId: this.id
    });
    return result.value;
  }
}

/**
 * Scroll container
 */
export class Scroll {
  private ctx: Context;
  public id: string;

  constructor(ctx: Context, builder: () => void) {
    this.ctx = ctx;
    this.id = ctx.generateId('scroll');

    // Push a new container context
    ctx.pushContainer();

    // Execute the builder function to collect content
    builder();

    // Pop the container and get the single child (content)
    const children = ctx.popContainer();

    if (children.length !== 1) {
      throw new Error('Scroll container must have exactly one child');
    }

    const contentId = children[0];

    // Create the Scroll with the content
    ctx.bridge.send('createScroll', { id: this.id, contentId });
    ctx.addToCurrentContainer(this.id);
  }
}

/**
 * Grid layout container
 */
export class Grid {
  private ctx: Context;
  public id: string;

  constructor(ctx: Context, columns: number, builder: () => void) {
    this.ctx = ctx;
    this.id = ctx.generateId('grid');

    // Push a new container context
    ctx.pushContainer();

    // Execute the builder function to collect children
    builder();

    // Pop the container and get the children
    const children = ctx.popContainer();

    // Create the Grid with the children
    ctx.bridge.send('createGrid', { id: this.id, columns, children });
    ctx.addToCurrentContainer(this.id);
  }
}

/**
 * RadioGroup widget
 */
export class RadioGroup extends Widget {
  constructor(ctx: Context, options: string[], initialSelected?: string, onSelected?: (selected: string) => void) {
    const id = ctx.generateId('radiogroup');
    super(ctx, id);

    const payload: any = { id, options };

    if (initialSelected !== undefined) {
      payload.selected = initialSelected;
    }

    if (onSelected) {
      const callbackId = ctx.generateId('callback');
      payload.callbackId = callbackId;
      ctx.bridge.registerEventHandler(callbackId, (data: any) => {
        onSelected(data.selected);
      });
    }

    ctx.bridge.send('createRadioGroup', payload);
    ctx.addToCurrentContainer(id);
  }

  async setSelected(selected: string): Promise<void> {
    await this.ctx.bridge.send('setRadioSelected', {
      widgetId: this.id,
      selected
    });
  }

  async getSelected(): Promise<string> {
    const result = await this.ctx.bridge.send('getRadioSelected', {
      widgetId: this.id
    });
    return result.selected;
  }
}

/**
 * Split container (horizontal or vertical)
 */
export class Split {
  private ctx: Context;
  public id: string;

  constructor(ctx: Context, orientation: 'horizontal' | 'vertical', leadingBuilder: () => void, trailingBuilder: () => void, offset?: number) {
    this.ctx = ctx;
    this.id = ctx.generateId('split');

    // Build leading content
    ctx.pushContainer();
    leadingBuilder();
    const leadingChildren = ctx.popContainer();
    if (leadingChildren.length !== 1) {
      throw new Error('Split leading section must have exactly one child');
    }
    const leadingId = leadingChildren[0];

    // Build trailing content
    ctx.pushContainer();
    trailingBuilder();
    const trailingChildren = ctx.popContainer();
    if (trailingChildren.length !== 1) {
      throw new Error('Split trailing section must have exactly one child');
    }
    const trailingId = trailingChildren[0];

    // Create the split container
    const payload: any = {
      id: this.id,
      orientation,
      leadingId,
      trailingId
    };

    if (offset !== undefined) {
      payload.offset = offset;
    }

    ctx.bridge.send('createSplit', payload);
    ctx.addToCurrentContainer(this.id);
  }
}

/**
 * Tabs container (AppTabs)
 */
export class Tabs {
  private ctx: Context;
  public id: string;

  constructor(ctx: Context, tabDefinitions: Array<{title: string, builder: () => void}>, location?: 'top' | 'bottom' | 'leading' | 'trailing') {
    this.ctx = ctx;
    this.id = ctx.generateId('tabs');

    // Build each tab's content
    const tabs: Array<{title: string, contentId: string}> = [];

    for (const tabDef of tabDefinitions) {
      ctx.pushContainer();
      tabDef.builder();
      const children = ctx.popContainer();

      if (children.length !== 1) {
        throw new Error(`Tab "${tabDef.title}" must have exactly one child widget`);
      }

      tabs.push({
        title: tabDef.title,
        contentId: children[0]
      });
    }

    // Create the tabs container
    const payload: any = {
      id: this.id,
      tabs
    };

    if (location) {
      payload.location = location;
    }

    ctx.bridge.send('createTabs', payload);
    ctx.addToCurrentContainer(this.id);
  }
}

/**
 * Toolbar widget
 */
export class Toolbar {
  private ctx: Context;
  public id: string;

  constructor(ctx: Context, toolbarItems: Array<{
    type: 'action' | 'separator' | 'spacer';
    label?: string;
    onAction?: () => void;
  }>) {
    this.ctx = ctx;
    this.id = ctx.generateId('toolbar');

    const items = toolbarItems.map(item => {
      if (item.type === 'separator') {
        return { type: 'separator' };
      }

      if (item.type === 'spacer') {
        return { type: 'spacer' };
      }

      // Action item
      const callbackId = ctx.generateId('callback');
      if (item.onAction) {
        ctx.bridge.registerEventHandler(callbackId, () => {
          item.onAction!();
        });
      }

      return {
        type: 'action',
        label: item.label || 'Action',
        callbackId
      };
    });

    ctx.bridge.send('createToolbar', {
      id: this.id,
      items
    });

    ctx.addToCurrentContainer(this.id);
  }
}
