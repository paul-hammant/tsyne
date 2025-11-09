# Jyne Architecture

This document describes the internal architecture of Jyne.

## Overview

Jyne bridges TypeScript/Node.js with Go's Fyne UI toolkit using a child process and JSON-RPC communication over stdio.

## Components

### 1. TypeScript Client (`src/`)

The client library provides the user-facing API and manages communication with the Go bridge.

#### Key Files

- **`index.ts`**: Main entry point, exports declarative API functions
- **`app.ts`**: Application class that manages the overall app lifecycle
- **`window.ts`**: Window class for creating Fyne windows
- **`widgets.ts`**: Widget classes (Button, Label, Entry, VBox, HBox)
- **`bridge.ts`**: BridgeConnection class that manages IPC with Go process
- **`context.ts`**: Context class that tracks state during declarative UI building

#### Context Management

The Context class is crucial for the declarative API. It maintains:

- **Widget ID generation**: Ensures unique IDs for all widgets
- **Window stack**: Tracks which window is currently being built
- **Container stack**: Tracks nested containers (VBox, HBox) to collect children

When you write:

```typescript
vbox(() => {
  button("Click me");
  label("Hello");
});
```

The Context:
1. Pushes a new container onto the stack
2. Executes the builder function (which adds widgets to the container)
3. Pops the container and retrieves the collected widget IDs
4. Sends a `createVBox` message with the child IDs

### 2. Go Bridge (`bridge/`)

The bridge is a standalone Go application that embeds Fyne and communicates with the TypeScript client.

#### Key Components

- **`main.go`**: Entry point, sets up message handling and Fyne app
- **`Bridge` struct**: Manages Fyne objects and message routing

#### Message Handling

The bridge listens for JSON messages on stdin and sends responses/events on stdout.

**Message format**:
```json
{
  "id": "msg_123",
  "type": "createButton",
  "payload": {
    "id": "button_1",
    "text": "Click me",
    "callbackId": "callback_1"
  }
}
```

**Response format**:
```json
{
  "id": "msg_123",
  "success": true,
  "result": {
    "widgetId": "button_1"
  }
}
```

**Event format** (for callbacks):
```json
{
  "type": "callback",
  "widgetId": "button_1",
  "data": {
    "callbackId": "callback_1"
  }
}
```

#### Widget Registry

The bridge maintains maps to track Fyne objects:

- **`windows`**: Maps window IDs to `fyne.Window` instances
- **`widgets`**: Maps widget IDs to `fyne.CanvasObject` instances
- **`callbacks`**: Maps widget IDs to callback IDs

#### Concurrency

- Messages are processed sequentially on the main goroutine
- Fyne UI operations happen on the Fyne main thread
- Response/event writing is protected by a mutex

### 3. Communication Protocol

#### Supported Messages

**Window Management**:
- `createWindow`: Create a new Fyne window
- `setContent`: Set a widget as window content
- `showWindow`: Show a window

**Widget Creation**:
- `createButton`: Create a button widget
- `createLabel`: Create a label widget
- `createEntry`: Create a text entry widget
- `createVBox`: Create a vertical box container
- `createHBox`: Create a horizontal box container

**Widget Operations**:
- `setText`: Update widget text
- `getText`: Get widget text

**Application**:
- `quit`: Quit the application

#### Event Flow

1. User clicks a button in the Fyne UI
2. Fyne triggers the button's `OnTapped` callback
3. Bridge sends a `callback` event to TypeScript
4. TypeScript client looks up the registered event handler
5. Event handler executes in Node.js

## Declarative API Design

The declarative API uses several techniques to achieve elegant syntax:

### 1. Global Context

Functions like `button()` and `vbox()` use a global context that's set when `app()` is called:

```typescript
let globalContext: Context | null = null;

export function app(options: AppOptions, builder: () => void): App {
  const appInstance = new App(options);
  globalContext = (appInstance as any).ctx;
  builder();
  return appInstance;
}

export function button(text: string, onClick?: () => void): Button {
  if (!globalContext) {
    throw new Error('button() must be called within an app context');
  }
  return new Button(globalContext, text, onClick);
}
```

### 2. Container Stack

Containers like `vbox()` and `hbox()` push a new container onto the stack, execute their builder function to collect children, then pop the stack:

```typescript
export class VBox {
  constructor(ctx: Context, builder: () => void) {
    this.id = ctx.generateId('vbox');

    ctx.pushContainer();     // Start collecting children
    builder();               // Execute builder (widgets add themselves)
    const children = ctx.popContainer();  // Get collected children

    ctx.bridge.send('createVBox', { id: this.id, children });
  }
}
```

### 3. Automatic Registration

Widgets automatically add themselves to the current container:

```typescript
export class Button extends Widget {
  constructor(ctx: Context, text: string, onClick?: () => void) {
    // ...create button...
    ctx.addToCurrentContainer(id);  // Auto-register with parent
  }
}
```

This allows the terse syntax:

```typescript
vbox(() => {
  button("One");    // Automatically added to vbox
  button("Two");    // Automatically added to vbox
});
```

## Building and Distribution

### Build Process

1. **Bridge compilation**: `go build` creates the `jyne-bridge` binary
2. **TypeScript compilation**: `tsc` compiles `src/` to `dist/`
3. **Package**: npm packages both the compiled JS and the bridge binary

### NPM Package Structure

```
jyne/
├── dist/           # Compiled JavaScript
├── bin/            # jyne-bridge executable
├── package.json
├── README.md
└── LICENSE
```

## Future Enhancements

Potential improvements:

1. **More Widgets**: Tree, Table, List, Progress Bar, etc.
2. **Layout Options**: Grid, Border, Form layouts
3. **Dialogs**: Alert, Confirm, File picker dialogs
4. **Themes**: Support for custom themes and styling
5. **Canvas**: Direct drawing capabilities
6. **Performance**: Widget pooling, lazy loading
7. **Testing**: Headless mode for automated testing
8. **Hot Reload**: Development mode with auto-restart

## Debugging

### Enable Bridge Logging

The bridge logs to stderr, which is inherited from the parent process. To see bridge logs:

```typescript
// In your app
process.stderr.write('Bridge starting...\n');
```

### Message Tracing

Add logging to `bridge.ts` to trace all messages:

```typescript
async send(type: string, payload: Record<string, any>): Promise<any> {
  console.log('→', type, payload);
  // ...send message...
}
```

### Troubleshooting

**Bridge doesn't start**:
- Check that `bin/jyne-bridge` exists and is executable
- Verify Go is installed and Fyne dependencies are met

**Widgets not appearing**:
- Ensure `setContent` is called before `showWindow`
- Check that widgets are created in the correct container context

**Events not firing**:
- Verify callback IDs are being registered
- Check that event handlers are registered before `run()` is called
