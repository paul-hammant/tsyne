import { App, AppOptions } from './app';
import { Context } from './context';
import { Button, Label, Entry, VBox, HBox, Checkbox, Select, Slider, ProgressBar, Scroll, Grid, RadioGroup, Split, Tabs, Toolbar } from './widgets';
import { Window, WindowOptions } from './window';

// Global context for the declarative API
let globalApp: App | null = null;
let globalContext: Context | null = null;

/**
 * Create and run an application with declarative syntax
 */
export function app(options: AppOptions, builder: () => void): App {
  const appInstance = new App(options);
  globalApp = appInstance;
  globalContext = (appInstance as any).ctx;

  builder();

  appInstance.run();

  return appInstance;
}

/**
 * Create a window in the current app context
 */
export function window(options: WindowOptions, builder: (win: Window) => void): Window {
  if (!globalApp) {
    throw new Error('window() must be called within an app() context');
  }
  return globalApp.window(options, builder);
}

/**
 * Create a vertical box container
 */
export function vbox(builder: () => void): VBox {
  if (!globalContext) {
    throw new Error('vbox() must be called within an app context');
  }
  return new VBox(globalContext, builder);
}

/**
 * Create a horizontal box container
 */
export function hbox(builder: () => void): HBox {
  if (!globalContext) {
    throw new Error('hbox() must be called within an app context');
  }
  return new HBox(globalContext, builder);
}

/**
 * Create a button widget
 */
export function button(text: string, onClick?: () => void): Button {
  if (!globalContext) {
    throw new Error('button() must be called within an app context');
  }
  return new Button(globalContext, text, onClick);
}

/**
 * Create a label widget
 */
export function label(text: string): Label {
  if (!globalContext) {
    throw new Error('label() must be called within an app context');
  }
  return new Label(globalContext, text);
}

/**
 * Create an entry (text input) widget
 */
export function entry(placeholder?: string): Entry {
  if (!globalContext) {
    throw new Error('entry() must be called within an app context');
  }
  return new Entry(globalContext, placeholder);
}

/**
 * Create a checkbox widget
 */
export function checkbox(text: string, onChanged?: (checked: boolean) => void): Checkbox {
  if (!globalContext) {
    throw new Error('checkbox() must be called within an app context');
  }
  return new Checkbox(globalContext, text, onChanged);
}

/**
 * Create a select (dropdown) widget
 */
export function select(options: string[], onSelected?: (selected: string) => void): Select {
  if (!globalContext) {
    throw new Error('select() must be called within an app context');
  }
  return new Select(globalContext, options, onSelected);
}

/**
 * Create a slider widget
 */
export function slider(
  min: number,
  max: number,
  initialValue?: number,
  onChanged?: (value: number) => void
): Slider {
  if (!globalContext) {
    throw new Error('slider() must be called within an app context');
  }
  return new Slider(globalContext, min, max, initialValue, onChanged);
}

/**
 * Create a progress bar widget
 */
export function progressbar(initialValue?: number, infinite?: boolean): ProgressBar {
  if (!globalContext) {
    throw new Error('progressbar() must be called within an app context');
  }
  return new ProgressBar(globalContext, initialValue, infinite);
}

/**
 * Create a scroll container
 */
export function scroll(builder: () => void): Scroll {
  if (!globalContext) {
    throw new Error('scroll() must be called within an app context');
  }
  return new Scroll(globalContext, builder);
}

/**
 * Create a grid layout container
 */
export function grid(columns: number, builder: () => void): Grid {
  if (!globalContext) {
    throw new Error('grid() must be called within an app context');
  }
  return new Grid(globalContext, columns, builder);
}

/**
 * Create a radio group widget
 */
export function radiogroup(
  options: string[],
  initialSelected?: string,
  onSelected?: (selected: string) => void
): RadioGroup {
  if (!globalContext) {
    throw new Error('radiogroup() must be called within an app context');
  }
  return new RadioGroup(globalContext, options, initialSelected, onSelected);
}

/**
 * Create a horizontal split container
 */
export function hsplit(
  leadingBuilder: () => void,
  trailingBuilder: () => void,
  offset?: number
): Split {
  if (!globalContext) {
    throw new Error('hsplit() must be called within an app context');
  }
  return new Split(globalContext, 'horizontal', leadingBuilder, trailingBuilder, offset);
}

/**
 * Create a vertical split container
 */
export function vsplit(
  leadingBuilder: () => void,
  trailingBuilder: () => void,
  offset?: number
): Split {
  if (!globalContext) {
    throw new Error('vsplit() must be called within an app context');
  }
  return new Split(globalContext, 'vertical', leadingBuilder, trailingBuilder, offset);
}

/**
 * Create a tabs container
 */
export function tabs(
  tabDefinitions: Array<{title: string, builder: () => void}>,
  location?: 'top' | 'bottom' | 'leading' | 'trailing'
): Tabs {
  if (!globalContext) {
    throw new Error('tabs() must be called within an app context');
  }
  return new Tabs(globalContext, tabDefinitions, location);
}

/**
 * Create a toolbar
 */
export function toolbar(
  toolbarItems: Array<{
    type: 'action' | 'separator' | 'spacer';
    label?: string;
    onAction?: () => void;
  }>
): Toolbar {
  if (!globalContext) {
    throw new Error('toolbar() must be called within an app context');
  }
  return new Toolbar(globalContext, toolbarItems);
}

// Export classes for advanced usage
export { App, Window, Button, Label, Entry, VBox, HBox, Checkbox, Select, Slider, ProgressBar, Scroll, Grid, RadioGroup, Split, Tabs, Toolbar };
export type { AppOptions, WindowOptions };

// Export state management utilities
export {
  ObservableState,
  ComputedState,
  StateStore,
  TwoWayBinding,
  DialogResult,
  ViewModel,
  Model
} from './state';
export type { BindingOptions } from './state';
