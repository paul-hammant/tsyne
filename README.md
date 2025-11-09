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

Here's a simple Hello World app:

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

### Widgets

- **`button(text, onClick?)`**: Create a button
  - `text`: Button label
  - `onClick`: Click handler (optional)

- **`label(text)`**: Create a label
  - `text`: Label text

- **`entry(placeholder?)`**: Create a text input
  - `placeholder`: Placeholder text (optional)

### Widget Methods

All widgets support these methods:

- **`setText(text: string)`**: Update widget text
- **`getText(): Promise<string>`**: Get widget text

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

- `hello.ts` - Simple Hello World
- `calculator.ts` - Calculator with number pad
- `counter.ts` - Counter with increment/decrement
- `form.ts` - Form with text inputs

Run an example:

```bash
npm run build
node examples/calculator.js
```

### Test Applications

Check out the `test-apps/` directory for production-quality, fully tested applications:

- **Calculator** (`test-apps/calculator/`) - Full-featured calculator with comprehensive test suite
  - Run: `npm run run:calculator`
  - Test: `npm run test:calculator`
  - See [test-apps/calculator/README.md](test-apps/calculator/README.md) for details

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

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[TESTING.md](TESTING.md)** - Complete guide to JyneTest testing framework
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Internal design and architecture
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide for contributors
- **[test-apps/calculator/README.md](test-apps/calculator/README.md)** - Example testable application

## Acknowledgments

- [Fyne](https://fyne.io/) - The fantastic Go UI toolkit that powers Jyne
- Paul Hammant's [blog posts](https://paulhammant.com) on elegant DSL design
- The Ruby/Groovy communities for inspiring declarative UI patterns
- [Playwright](https://playwright.dev/) - Inspiration for JyneTest's API design
