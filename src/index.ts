import { App, AppOptions } from './app';
import { Context } from './context';
import { Button, Label, Entry, VBox, HBox } from './widgets';
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

// Export classes for advanced usage
export { App, Window, Button, Label, Entry, VBox, HBox };
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
