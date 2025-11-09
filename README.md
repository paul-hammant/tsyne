# Jyne

**Elegant TypeScript wrapper for Fyne - Build beautiful cross-platform desktop UIs with Node.js**

Jyne brings the power of [Fyne](https://fyne.io/), a modern Go UI toolkit, to the TypeScript/Node.js ecosystem with an elegant, declarative API inspired by Ruby's Shoes DSL and QML.

## Why Jyne?

- **Elegant Syntax**: Declarative, terse UI markup with closures (inspired by Ruby/Groovy DSL patterns)
- **Cross-Platform**: Build native apps for macOS, Windows, and Linux from a single codebase
- **Type-Safe**: Full TypeScript support with complete type definitions
- **Easy Integration**: Simple npm package that's quick to add to any Node.js project
- **Powerful**: Full access to Fyne's rich widget library and layout system
- **Testable**: Built-in testing framework (JyneTest) with Playwright-like API for headed/headless testing

## Installation

```bash
npm install jyne
```

**Prerequisites**:
- Node.js 16+
- Go 1.21+ (for building the bridge)

## Quick Start

### TypeScript

```typescript
import { app, window, vbox, button, label } from 'jyne';

app({ title: "Hello Jyne" }, () => {
  window({ title: "Hello World" }, () => {
    vbox(() => {
      label("Welcome to Jyne!");
      button("Click Me", () => {
        console.log("Button clicked!");
      });
    });
  });
});
```

### JavaScript (CommonJS)

```javascript
const { app, window, vbox, button, label } = require('jyne');

app({ title: "Hello Jyne" }, () => {
  window({ title: "Hello World" }, () => {
    vbox(() => {
      label("Welcome to Jyne!");
      button("Click Me", () => {
        console.log("Button clicked!");
      });
    });
  });
});
```

### JavaScript (ES Modules)

```javascript
import { app, window, vbox, button, label } from 'jyne';

app({ title: "Hello Jyne" }, () => {
  window({ title: "Hello World" }, () => {
    vbox(() => {
      label("Welcome to Jyne!");
      button("Click Me", () => {
        console.log("Button clicked!");
      });
    });
  });
});
```

Jyne works seamlessly with both TypeScript and JavaScript!

## Elegant Syntax

Jyne's API is designed to be elegant and terse, following the pattern described in [this blog post](https://paulhammant.com/2024/02/14/that-ruby-and-groovy-language-feature) about Ruby/Groovy DSLs. The syntax feels declarative while retaining full imperative power:

### Calculator Example

```typescript
import { app, window, vbox, hbox, button, label } from 'jyne';

let display: any;
let currentValue = "0";

function updateDisplay(value: string) {
  currentValue = value;
  display.setText(value);
}

function handleNumber(num: string) {
  const newValue = currentValue === "0" ? num : currentValue + num;
  updateDisplay(newValue);
}

app({ title: "Calculator" }, () => {
  window({ title: "Calculator" }, () => {
    vbox(() => {
      display = label("0");

      hbox(() => {
        button("7", () => handleNumber("7"));
        button("8", () => handleNumber("8"));
        button("9", () => handleNumber("9"));
      });

      hbox(() => {
        button("4", () => handleNumber("4"));
        button("5", () => handleNumber("5"));
        button("6", () => handleNumber("6"));
      });

      hbox(() => {
        button("1", () => handleNumber("1"));
        button("2", () => handleNumber("2"));
        button("3", () => handleNumber("3"));
      });
    });
  });
});
```

### Counter Example

```typescript
import { app, window, vbox, hbox, button, label } from 'jyne';

let countLabel: any;
let count = 0;

function updateCounter() {
  countLabel.setText(`Count: ${count}`);
}

app({ title: "Counter" }, () => {
  window({ title: "Simple Counter" }, () => {
    vbox(() => {
      countLabel = label("Count: 0");

      hbox(() => {
        button("-", () => { count--; updateCounter(); });
        button("Reset", () => { count = 0; updateCounter(); });
        button("+", () => { count++; updateCounter(); });
      });
    });
  });
});
```

## Testing with JyneTest

Jyne includes **JyneTest**, a Playwright-like testing framework for testing your UI applications in headed or headless mode.

### Quick Test Example

```typescript
import { JyneTest } from 'jyne/test';

async function testCalculator() {
  // Create test instance (headless by default)
  const jyneTest = new JyneTest({ headed: false });

  // Build your app
  const testApp = jyneTest.createApp((app) => {
    // ... build calculator UI ...
  });

  // Get test context
  const ctx = jyneTest.getContext();
  await testApp.run();

  // Interact with the UI
  await ctx.getByExactText("5").click();
  await ctx.getByExactText("+").click();
  await ctx.getByExactText("3").click();
  await ctx.getByExactText("=").click();

  // Make assertions
  const display = ctx.getByType("label");
  await ctx.expect(display).toHaveText("8");

  // Clean up
  await jyneTest.cleanup();
}
```

### Test Modes

**Headless (default)** - Fast, no UI, perfect for CI/CD:
```typescript
const jyneTest = new JyneTest({ headed: false });
```

**Headed** - Shows UI during testing, great for debugging:
```typescript
const jyneTest = new JyneTest({ headed: true });
```

### Locators and Assertions

```typescript
// Find widgets by text
ctx.getByExactText("Submit")
ctx.getByText("Counter:") // partial match

// Find by type
ctx.getByType("button")
ctx.getByType("label")
ctx.getByType("entry")

// Actions
await locator.click()
await locator.type("text")
await locator.getText()

// Assertions
await ctx.expect(locator).toHaveText("exact text")
await ctx.expect(locator).toContainText("partial")
await ctx.expect(locator).toBeVisible()
await ctx.expect(locator).toExist()
```

### Running Tests

```bash
# Run tests in headless mode
npm test

# Run with visible UI
npm run test:calculator:headed
```

**See [TESTING.md](TESTING.md) for complete documentation and the [calculator test app](test-apps/calculator/) for a comprehensive example.**

## API Reference

### Application

- **`app(options, builder)`**: Create and run an application
  - `options.title`: Application title (optional)
  - `builder`: Function that defines the app structure

### Windows

- **`window(options, builder)`**: Create a window
  - `options.title`: Window title
  - `builder`: Function that defines the window content

### Layouts

- **`vbox(builder)`**: Vertical box layout
- **`hbox(builder)`**: Horizontal box layout
- **`grid(columns, builder)`**: Grid layout with specified number of columns
  - `columns`: Number of columns in the grid
  - `builder`: Function that defines grid children
- **`scroll(builder)`**: Scrollable container for long content
  - `builder`: Function that defines scrollable content (must have exactly one child)
- **`hsplit(leadingBuilder, trailingBuilder, offset?)`**: Horizontal split container with resizable divider
  - `leadingBuilder`: Function that defines left panel content (must have exactly one child)
  - `trailingBuilder`: Function that defines right panel content (must have exactly one child)
  - `offset`: Initial divider position from 0.0 to 1.0 (optional, default 0.5)
- **`vsplit(leadingBuilder, trailingBuilder, offset?)`**: Vertical split container with resizable divider
  - `leadingBuilder`: Function that defines top panel content (must have exactly one child)
  - `trailingBuilder`: Function that defines bottom panel content (must have exactly one child)
  - `offset`: Initial divider position from 0.0 to 1.0 (optional, default 0.5)
- **`tabs(tabDefinitions, location?)`**: Tabbed container for organizing content
  - `tabDefinitions`: Array of {title: string, builder: () => void} objects
  - `location`: Tab bar position - 'top', 'bottom', 'leading', or 'trailing' (optional, default 'top')

### Widgets

#### Basic Widgets

- **`button(text, onClick?)`**: Create a button
  - `text`: Button label
  - `onClick`: Click handler (optional)

- **`label(text)`**: Create a label
  - `text`: Label text

- **`entry(placeholder?)`**: Create a text input
  - `placeholder`: Placeholder text (optional)

#### Input Widgets

- **`checkbox(text, onChanged?)`**: Create a checkbox
  - `text`: Checkbox label
  - `onChanged`: Callback when checked state changes (optional)
  - Methods: `setChecked(checked: boolean)`, `getChecked(): Promise<boolean>`

- **`select(options, onSelected?)`**: Create a dropdown select
  - `options`: Array of string options
  - `onSelected`: Callback when selection changes (optional)
  - Methods: `setSelected(value: string)`, `getSelected(): Promise<string>`

- **`slider(min, max, initialValue?, onChanged?)`**: Create a slider
  - `min`: Minimum value
  - `max`: Maximum value
  - `initialValue`: Starting value (optional)
  - `onChanged`: Callback when value changes (optional)
  - Methods: `setValue(value: number)`, `getValue(): Promise<number>`

- **`radiogroup(options, initialSelected?, onSelected?)`**: Create a radio button group
  - `options`: Array of string options
  - `initialSelected`: Initially selected option (optional)
  - `onSelected`: Callback when selection changes (optional)
  - Methods: `setSelected(value: string)`, `getSelected(): Promise<string>`

#### Display Widgets

- **`progressbar(initialValue?, infinite?)`**: Create a progress bar
  - `initialValue`: Starting progress value 0.0 to 1.0 (optional)
  - `infinite`: Set to true for indeterminate progress (optional)
  - Methods: `setProgress(value: number)`, `getProgress(): Promise<number>`

### Dialogs

Jyne provides common dialog methods on the Window class for user interactions:

#### Information and Error Dialogs

- **`window.showInfo(title, message)`**: Show an information dialog
  - `title`: Dialog title
  - `message`: Information message to display
  - Returns: `Promise<void>`

- **`window.showError(title, message)`**: Show an error dialog
  - `title`: Dialog title
  - `message`: Error message to display
  - Returns: `Promise<void>`

#### Confirmation Dialog

- **`window.showConfirm(title, message)`**: Show a confirmation dialog
  - `title`: Dialog title
  - `message`: Confirmation message
  - Returns: `Promise<boolean>` - true if confirmed, false if cancelled

#### File Dialogs

- **`window.showFileOpen()`**: Show a file open dialog
  - Returns: `Promise<string | null>` - selected file path or null if cancelled

- **`window.showFileSave(filename?)`**: Show a file save dialog
  - `filename`: Default filename (optional, defaults to 'untitled.txt')
  - Returns: `Promise<string | null>` - selected file path or null if cancelled

#### Dialog Examples

```typescript
// Information dialog
await win.showInfo('Success', 'File saved successfully!');

// Error dialog
await win.showError('Error', 'Failed to connect to server');

// Confirmation dialog
const confirmed = await win.showConfirm(
  'Delete File',
  'Are you sure you want to delete this file?'
);
if (confirmed) {
  // Delete the file
}

// File open dialog
const filePath = await win.showFileOpen();
if (filePath) {
  console.log('Selected file:', filePath);
}

// File save dialog
const savePath = await win.showFileSave('document.txt');
if (savePath) {
  console.log('Save to:', savePath);
}
```

### Widget Methods

Common methods supported by most widgets:

- **`setText(text: string)`**: Update widget text (Button, Label, Entry)
- **`getText(): Promise<string>`**: Get widget text (Button, Label, Entry)

Widget-specific methods:

- **Checkbox**: `setChecked(checked: boolean)`, `getChecked(): Promise<boolean>`
- **Select**: `setSelected(value: string)`, `getSelected(): Promise<string>`
- **Slider**: `setValue(value: number)`, `getValue(): Promise<number>`
- **RadioGroup**: `setSelected(value: string)`, `getSelected(): Promise<string>`
- **ProgressBar**: `setProgress(value: number)`, `getProgress(): Promise<number>`

## State Management and Architectural Patterns

Jyne provides powerful state management utilities and supports multiple architectural patterns (MVC, MVVM, MVP) for building scalable applications.

### State Passing and Two-Way Communication

Jyne supports:
- **Passing state into components**: Initialize widgets with data from your application
- **Retrieving state back**: Get data from dialogs and forms (dialog pattern)
- **Two-way data binding**: Keep state synchronized with UI automatically
- **Observable state**: React to state changes automatically

### Quick State Management Examples

#### Observable State

```typescript
import { ObservableState } from 'jyne';

const count = new ObservableState(0);
let countLabel: any;

// Subscribe to state changes
count.subscribe((newValue) => {
  countLabel?.setText(`Count: ${newValue}`);
});

app({ title: "State Demo" }, () => {
  window({ title: "Observable State" }, () => {
    vbox(() => {
      countLabel = label("Count: 0");
      button("Increment", () => count.set(count.get() + 1));
    });
  });
});
```

#### State Store (Centralized State)

```typescript
import { StateStore } from 'jyne';

interface AppState {
  user: string;
  count: number;
}

const store = new StateStore<AppState>({
  user: 'Guest',
  count: 0
});

// Subscribe to all state changes
store.subscribe(state => {
  console.log('State changed:', state);
  updateUI(state);
});

// Update state
store.set('user', 'John');
store.update(s => ({ ...s, count: s.count + 1 }));
```

#### Dialog State Passing

```typescript
// Pass state into a dialog and get results back
const dialog = new ProfileDialog(currentProfile);
const result = await dialog.show();

if (result.confirmed) {
  store.update(state => ({
    ...state,
    profile: result.data
  }));
}
```

### Architectural Patterns

Jyne supports standard UI architectural patterns:

| Pattern | Best For | Example |
|---------|----------|---------|
| **MVC** | Traditional desktop apps, Swing-like architecture | [mvc-counter.ts](examples/mvc-counter.ts) |
| **MVVM** | Data-heavy apps with automatic UI sync | [mvvm-todo.ts](examples/mvvm-todo.ts) |
| **MVP** | Maximum testability, swappable views | [mvp-login.ts](examples/mvp-login.ts) |
| **Data Binding** | Form inputs, real-time sync | [data-binding.ts](examples/data-binding.ts) |

#### MVC Example

```typescript
// Model - Business logic
class CounterModel extends Model {
  private count = 0;
  increment() { this.count++; this.notifyChanged(); }
  getCount() { return this.count; }
}

// View - UI presentation
class CounterView {
  createUI(onIncrement: () => void) {
    vbox(() => {
      this.label = label('Count: 0');
      button('Increment', onIncrement);
    });
  }
}

// Controller - Connects Model and View
class CounterController {
  constructor(private model: CounterModel, private view: CounterView) {
    this.model.subscribe(() => this.updateView());
  }
  handleIncrement() { this.model.increment(); }
}
```

#### MVVM Example

```typescript
// ViewModel with observable properties
class TodoViewModel extends ViewModel {
  todos = new ObservableState<TodoItem[]>([]);
  newTodoText = new ObservableState('');

  addTodo() {
    this.model.addTodo(this.newTodoText.get());
    this.newTodoText.set('');
    this.updateFromModel();
  }
}

// View binds to ViewModel
class TodoView {
  constructor(private viewModel: TodoViewModel) {
    // Automatic UI updates when state changes
    this.viewModel.todos.subscribe(() => this.updateUI());
  }
}
```

**See [PATTERNS.md](PATTERNS.md) for complete documentation on all architectural patterns, data binding, and state management.**

### State Management Examples

Check out these comprehensive examples:

- **[data-binding.ts](examples/data-binding.ts)** - Two-way data binding with observable state
- **[mvc-counter.ts](examples/mvc-counter.ts)** - Classic MVC pattern (like Swing)
- **[mvvm-todo.ts](examples/mvvm-todo.ts)** - MVVM pattern with data binding
- **[mvp-login.ts](examples/mvp-login.ts)** - MVP pattern with passive views
- **[dialog-state.ts](examples/dialog-state.ts)** - Dialog state passing pattern

Run the examples:

```bash
npm run build
node examples/data-binding.js
node examples/mvc-counter.js
node examples/mvvm-todo.js
```

## Architecture

Jyne uses a unique architecture to bridge TypeScript and Go:

```
┌─────────────────────┐
│   Your TypeScript   │
│   Application       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Jyne Client       │
│   (TypeScript)      │
└──────────┬──────────┘
           │ JSON-RPC via stdio
           ▼
┌─────────────────────┐
│   Jyne Bridge       │
│   (Go + Fyne)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Native UI         │
│   (macOS/Win/Linux) │
└─────────────────────┘
```

1. **Jyne Client** (TypeScript): Provides the declarative API and spawns the bridge process
2. **Jyne Bridge** (Go): Manages Fyne widgets and communicates via JSON messages over stdio
3. **Message Protocol**: Bidirectional JSON-RPC for commands and events

## Examples

### Basic Examples

Check out the `examples/` directory:

**Getting Started:**
- `hello.ts` - Simple Hello World
- `counter.ts` - Counter with increment/decrement
- `calculator.ts` - Calculator with number pad
- `form.ts` - Form with text inputs

**Widget Examples:**
- `checkbox.ts` - Checkbox with state tracking and callbacks
- `select.ts` - Dropdown select with multiple options
- `slider.ts` - Slider controls for volume, brightness, etc.
- `radiogroup.ts` - Radio button groups for mutually exclusive choices
- `progressbar.ts` - Progress indicators for downloads and loading
- `scroll.ts` - Scrollable container for long content
- `grid.ts` - Grid layout calculator example
- `split.ts` - Resizable horizontal and vertical split containers
- `tabs.ts` - Tabbed interface for organizing content

**Dialog Examples:**
- `dialogs-info.ts` - Information and error dialogs
- `dialogs-confirm.ts` - Confirmation dialogs for critical actions
- `dialogs-file.ts` - File open and save dialogs

**Pattern Examples:**
- `data-binding.ts` - Two-way data binding with observable state
- `mvc-counter.ts` - Classic MVC pattern (like Swing)
- `mvvm-todo.ts` - MVVM pattern with data binding
- `mvp-login.ts` - MVP pattern with passive views
- `dialog-state.ts` - Dialog state passing pattern

Run an example:

```bash
npm run build
node examples/calculator.js
node examples/checkbox.js
node examples/select.js
node examples/slider.js
node examples/radiogroup.js
node examples/progressbar.js
node examples/scroll.js
node examples/grid.js
node examples/split.js
node examples/tabs.js
node examples/dialogs-info.js
node examples/dialogs-confirm.js
node examples/dialogs-file.js
```

### Test Applications - Two Architectural Patterns

We provide **two calculator implementations** demonstrating different approaches:

#### 1. Simple Calculator - Monolithic Pattern

**Best for:** Learning, prototypes, demos < 200 lines

```
test-apps/calculator-simple/
├── calculator.ts (150 lines - all in one file)
├── calculator.test.ts (JyneTest only)
└── README.md
```

**Features:**
- All code in one place
- Simple and straightforward
- Quick to prototype
- JyneTest integration tests only

**Trade-offs:**
- Cannot unit test logic separately
- Slower test feedback (~3s)
- Hard to maintain at scale

```bash
npm run run:calculator-simple
npm run test:calculator-simple
```

#### 2. Advanced Calculator - Decomposed Pattern

**Best for:** Production apps, teams, complex logic, TDD

```
test-apps/calculator-advanced/
├── calculator-logic.ts (Pure business logic)
├── calculator-logic.test.ts (34 Jest unit tests)
├── calculator-ui.ts (UI presentation)
├── calculator.test.ts (11 JyneTest integration tests)
└── README.md + TESTING-STRATEGY.md
```

**Features:**
- Separated business logic and UI
- Fast Jest unit tests (~100ms for 34 tests)
- TDD-friendly development
- Reusable logic (CLI, web, API)
- Comprehensive test coverage (45 tests total)

**Trade-offs:**
- More files and boilerplate
- Higher learning curve

```bash
npm run run:calculator          # Run the app
npm run test:calculator         # Integration tests
npm run test:calculator:logic   # Unit tests (fast!)
npm test                        # All tests
```

**See [test-apps/README.md](test-apps/README.md) for detailed comparison and decision guide.**

## Architecture Patterns

### Monolithic (Simple) vs Decomposed (Advanced)

Jyne supports two architectural patterns for building applications:

| Pattern | When to Use | Testing Approach |
|---------|-------------|------------------|
| **Monolithic** | Demos, prototypes, < 200 lines | JyneTest integration tests only |
| **Decomposed** | Production, teams, complex logic | Jest unit tests + JyneTest integration |

**Monolithic Example:**
```typescript
// All in one file
let count = 0;
let display: any;

function increment() {
  count++;
  display.setText(`Count: ${count}`);  // UI coupled with logic
}

app(() => {
  display = label("Count: 0");
  button("+", increment);
});
```

**Decomposed Example:**
```typescript
// calculator-logic.ts (testable with Jest!)
export class CalculatorLogic {
  private count = 0;

  increment(): number {
    return ++this.count;
  }

  getDisplay(): string {
    return `Count: ${this.count}`;
  }
}

// calculator-ui.ts
import { CalculatorLogic } from './calculator-logic';

export class CalculatorUI {
  private logic = new CalculatorLogic();
  private display: any;

  build() {
    this.display = label(this.logic.getDisplay());
    button("+", () => {
      this.logic.increment();
      this.display.setText(this.logic.getDisplay());
    });
  }
}

// calculator-logic.test.ts (Jest - fast!)
test('increment', () => {
  const calc = new CalculatorLogic();
  expect(calc.increment()).toBe(1);
  expect(calc.getDisplay()).toBe("Count: 1");
});
```

**Benefits of Decomposed Pattern:**
- ✅ Fast unit tests (100ms vs 3s)
- ✅ TDD-friendly
- ✅ Reusable logic
- ✅ Easy to maintain

**See [test-apps/README.md](test-apps/README.md) for complete comparison and migration guide.**

## Design Philosophy

Jyne follows these design principles:

1. **Declarative where possible**: UI structure is defined using nested function calls
2. **Imperative when needed**: Full JavaScript for event handlers and state management
3. **Terse and elegant**: Minimal boilerplate, maximum expressiveness
4. **Type-safe**: Complete TypeScript definitions for IDE support
5. **Easy to use**: Simple npm install, straightforward API

Inspired by:
- [Ruby Shoes DSL](https://paulhammant.com/2024/02/14/that-ruby-and-groovy-language-feature)
- [QML with inline JavaScript](https://doc.qt.io/qt-6/qml-tutorial.html)
- [Pseudo-declarative Swing testing](https://github.com/paul-hammant/swing_component_testing)

## Building from Source

```bash
# Install dependencies
npm install

# Build the Go bridge
npm run build:bridge

# Build the TypeScript library
npm run build

# Run an example
node examples/hello.js
```

## Requirements

- **Node.js**: 16.0.0 or higher
- **Go**: 1.21 or higher (for building the bridge)
- **Platform-specific dependencies**:
  - macOS: Xcode command line tools
  - Linux: X11 development libraries
  - Windows: MinGW-w64 (for CGO)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Documentation

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[README.md](README.md)** - You are here! Main documentation
- **[PROS_AND_CONS.md](PROS_AND_CONS.md)** - Jyne vs Electron/Tauri comparison and decision guide
- **[LLM.md](LLM.md)** - Quick reference guide for LLMs

### State Management and Patterns
- **[PATTERNS.md](PATTERNS.md)** - Complete guide to architectural patterns (MVC, MVVM, MVP), state management, and data binding
- **[examples/data-binding.ts](examples/data-binding.ts)** - Observable state and computed state examples
- **[examples/mvc-counter.ts](examples/mvc-counter.ts)** - MVC pattern implementation
- **[examples/mvvm-todo.ts](examples/mvvm-todo.ts)** - MVVM pattern with ViewModels
- **[examples/mvp-login.ts](examples/mvp-login.ts)** - MVP pattern with passive views
- **[examples/dialog-state.ts](examples/dialog-state.ts)** - Dialog state passing pattern

### Testing
- **[TESTING.md](TESTING.md)** - Complete guide to JyneTest testing framework
- **[test-apps/README.md](test-apps/README.md)** - Two architectural patterns comparison
- **[calculator-simple/README.md](test-apps/calculator-simple/README.md)** - Monolithic pattern
- **[calculator-advanced/README.md](test-apps/calculator-advanced/README.md)** - Decomposed pattern
- **[calculator-advanced/TESTING-STRATEGY.md](test-apps/calculator-advanced/TESTING-STRATEGY.md)** - Two-tier testing

### Development
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Internal design and architecture
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide for contributors
- **[PUBLISHING.md](PUBLISHING.md)** - Publishing to npm with bundled binaries
- **[ROADMAP.md](ROADMAP.md)** - Feature roadmap and TODO list

## Acknowledgments

- [Fyne](https://fyne.io/) - The fantastic Go UI toolkit that powers Jyne
- Paul Hammant's [blog posts](https://paulhammant.com) on elegant DSL design
- The Ruby/Groovy communities for inspiring declarative UI patterns
- [Playwright](https://playwright.dev/) - Inspiration for JyneTest's API design
