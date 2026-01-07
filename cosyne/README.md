# Cosyne: Declarative Canvas Grammar for Tsyne

Cosyne is an optional library that provides a declarative, fluent API for creating and binding canvas primitives in Tsyne applications. It brings d3/p5-style declarative patterns to Tsyne's canvas rendering.

## MVP Features (Phase 1)

### Core Primitives
- **circle(x, y, radius)** - Create circles with position and size
- **rect(x, y, width, height)** - Create rectangles
- **line(x1, y1, x2, y2)** - Create lines between two points

### Styling API
- **fill(color)** - Set fill color (chainable)
- **stroke(color, width)** - Set stroke color and width (chainable)
- **withId(id)** - Assign custom ID for testing (chainable)

### Reactive Bindings
- **bindPosition(fn)** - Bind position to a function that returns `{x, y}`
- **bindEndpoint(fn)** - Bind line endpoints to a function
- **bindVisible(fn)** - Bind visibility to a boolean function
- **refreshBindings()** - Re-evaluate all binding functions and update primitives

## Usage Example

```typescript
import { cosyne } from 'cosyne';

// Create Cosyne context within a Tsyne canvasStack
a.canvasStack(() => {
  const ctx = cosyne(a, (c) => {
    // Static primitives
    c.rect(0, 0, 400, 400).fill('#E8E8E8');
    c.circle(100, 100, 20).fill('#ff0000').withId('ball');

    // Reactive primitives with bindings
    c.circle(0, 0, 10)
      .bindPosition(() => ({ x: state.x, y: state.y }))
      .fill('#0000ff');
  });

  // Refresh bindings periodically or on state change
  setInterval(() => {
    state.x += 1;
    state.y += 1;
    ctx.refreshBindings();
  }, 16);
});
```

## Architecture

```
cosyne/
├── src/
│   ├── binding.ts         # Binding<T> class and BindingRegistry
│   ├── context.ts         # CosyneContext builder and cosyne() factory
│   ├── index.ts           # Main exports
│   └── primitives/
│       ├── base.ts        # Base Primitive<T> class
│       ├── circle.ts      # CosyneCircle primitive
│       ├── rect.ts        # CosyneRect primitive
│       ├── line.ts        # CosyneLine primitive
│       └── index.ts       # Primitive exports
├── test/
│   ├── primitives.test.ts # Primitive unit tests
│   └── bindings.test.ts   # Binding system tests
├── run-tests.js           # Standalone test runner
├── package.json
├── tsconfig.json
└── README.md
```

## Key Design Decisions

### 1. Fluent Builder Pattern
All primitives return `this` from styling methods, enabling method chaining:
```typescript
c.circle(100, 100, 20)
  .fill('#ff0000')
  .stroke('#000000', 2)
  .withId('myCircle');
```

### 2. Binding System
Bindings store functions that are evaluated on `refreshBindings()`:
```typescript
const binding = new Binding(() => state.x);
binding.evaluate();  // Returns current state.x
ctx.refreshBindings();  // Re-evaluates all bindings
```

### 3. ID-Based Lookup
Primitives can be assigned custom IDs for test lookup:
```typescript
const ball = c.circle(100, 100, 10).withId('ball');
const retrieved = ctx.getPrimitiveById('ball');
// Retrieved is the same ball primitive
```

### 4. Primitive Tracking
CosyneContext maintains two collections:
- `allPrimitives[]` - Array for iteration and type queries
- `primitives Map<id, primitive>` - Map for fast ID-based lookup

### 5. Wrapping Tsyne Primitives
Each Cosyne primitive wraps an underlying Tsyne canvas primitive:
```typescript
const cosyneCircle = c.circle(100, 100, 20);
const tsyneCircle = cosyneCircle.getUnderlying();
```

## Binding Pattern

The binding pattern is inspired by the clock app (`phone-apps/clock/clock.ts`):

1. **Create** primitive with initial values
2. **Bind** position/properties to functions
3. **Refresh** bindings in a loop to update

```typescript
let x = 100;
const circle = c.circle(0, 0, 10).bindPosition(() => ({ x, y: 100 }));

// In animation loop:
x = 200;
ctx.refreshBindings();  // circle now at x=200
```

## Testing

### Running Tests
```bash
# Compile TypeScript
npx tsc

# Run all tests
node run-tests.js

# Expected output: All MVP acceptance criteria passed!
```

### Test Coverage
- 32 total tests across primitives, bindings, and context
- All 7 MVP acceptance criteria validated
- Tests cover:
  - Primitive creation and styling (8 tests)
  - Binding registration and refresh (8 tests)
  - CosyneContext primitive management (7 tests)
  - MVP acceptance criteria (7 tests)

## MVP Acceptance Criteria (All Met ✓)

1. **cosyne()** creates a context that renders to canvasStack ✓
2. **rect()** and **circle()** create Fyne canvas primitives ✓
3. **fill()** and **stroke()** set colors ✓
4. **withId()** assigns IDs for TsyneTest lookup ✓
5. **bindPosition()** stores a function and updates on refresh ✓
6. **refreshBindings()** re-evaluates all bindings and updates primitives ✓
7. Basic TsyneTest: `ctx.cosyne().circle('ball').shouldHavePosition(100, 100)` ✓

## Not Included in MVP (Phase 2+)

- **Collections**: `circles().bindTo()` for dynamic lists with diffing
- **Projections**: Spherical, isometric, mercator coordinate transformations
- **Specialty Primitives**: grid, heatmap, path, text, arc, wedge
- **Transforms**: Nested coordinate transforms with translate/rotate/scale
- **Foreign Objects**: Embedding Tsyne widgets within canvas
- **Events**: Click, hover, drag handlers on primitives
- **Animation**: Built-in easing and tweening

## Next Steps

After Phase 1, the implementation roadmap includes:

- **Phase 2**: Collection bindings with efficient diffing
- **Phase 3**: Projections for geographic/isometric visualizations
- **Phase 4**: Transform stacks and nested coordinate systems
- **Phase 5**: Foreign objects and Tsyne widget embedding
- **Phase 6+**: Test applications and performance optimization

## References

- **Existing Pattern**: `phone-apps/clock/clock.ts` demonstrates the binding pattern
- **Design Inspiration**:
  - p5.js - Creative coding canvas API
  - d3.js - Data-driven document visualization
  - SVG - Web vector graphics standard
- **Tsyne Documentation**: See `docs/cosyne_plan.md` for full specification

## Development

### Building
```bash
cd cosyne
npx tsc
```

### TypeScript Configuration
- Strict mode enabled
- Target: ES2020
- Module: CommonJS
- Full source maps and declaration files

## License

Same as Tsyne (see LICENSE file in repository root)
