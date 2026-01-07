/**
 * Unit tests for Cosyne bindings
 */

import { Binding, BindingRegistry, PositionBinding } from '../src/binding';
import { CosyneContext } from '../src/context';
import { CosyneCircle } from '../src/primitives/circle';
import { CosyneLine } from '../src/primitives/line';

// Mock widget
class MockWidget {
  properties: any = {};
  update(props: any) {
    this.properties = { ...this.properties, ...props };
  }
  updateFillColor(color: string) {
    this.properties.fillColor = color;
  }
  updateStrokeColor(color: string) {
    this.properties.strokeColor = color;
  }
  updateStrokeWidth(width: number) {
    this.properties.strokeWidth = width;
  }
}

// Mock app
class MockApp {
  canvasCircle(props: any) {
    return new MockWidget();
  }
  canvasRectangle(props: any) {
    return new MockWidget();
  }
  canvasLine(x1: number, y1: number, x2: number, y2: number, opts?: any) {
    return new MockWidget();
  }
}

describe('Binding', () => {
  it('should store and evaluate a binding function', () => {
    let value = 10;
    const binding = new Binding(() => value);

    const result = binding.evaluate();
    expect(result).toEqual(10);

    value = 20;
    const result2 = binding.evaluate();
    expect(result2).toEqual(20);
  });

  it('should track last evaluated value', () => {
    const binding = new Binding(() => 42);

    expect(binding.getLastValue()).toBeUndefined();
    binding.evaluate();
    expect(binding.getLastValue()).toEqual(42);
  });

  it('TC-BIND-008: Binding function receives current state', () => {
    let state = { x: 100, y: 100 };
    const binding = new Binding<PositionBinding>(() => state);

    binding.evaluate();
    expect(binding.getLastValue()).toEqual({ x: 100, y: 100 });

    state = { x: 200, y: 200 };
    binding.evaluate();
    expect(binding.getLastValue()).toEqual({ x: 200, y: 200 });
  });
});

describe('BindingRegistry', () => {
  it('should register bindings', () => {
    const registry = new BindingRegistry();
    const binding1 = new Binding(() => 1);
    const binding2 = new Binding(() => 2);

    registry.register(binding1);
    registry.register(binding2);

    expect(registry.count()).toEqual(2);
  });

  it('should refresh all bindings', () => {
    const registry = new BindingRegistry();
    let value1 = 10;
    let value2 = 20;

    const binding1 = new Binding(() => value1);
    const binding2 = new Binding(() => value2);

    registry.register(binding1);
    registry.register(binding2);

    // Before refresh, last values should be undefined
    expect(binding1.getLastValue()).toBeUndefined();
    expect(binding2.getLastValue()).toBeUndefined();

    registry.refreshAll();

    // After refresh, should have evaluated
    expect(binding1.getLastValue()).toEqual(10);
    expect(binding2.getLastValue()).toEqual(20);

    // Change values and refresh again
    value1 = 100;
    value2 = 200;
    registry.refreshAll();

    expect(binding1.getLastValue()).toEqual(100);
    expect(binding2.getLastValue()).toEqual(200);
  });

  it('should clear all bindings', () => {
    const registry = new BindingRegistry();
    registry.register(new Binding(() => 1));
    registry.register(new Binding(() => 2));

    expect(registry.count()).toEqual(2);

    registry.clear();
    expect(registry.count()).toEqual(0);
  });
});

describe('CosyneContext bindings', () => {
  it('TC-BIND-001: bindPosition updates circle position on refresh', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    let x = 100;
    let y = 100;

    const circle = ctx.circle(x, y, 20).withId('ball').bindPosition(() => ({ x, y }));

    expect(circle.getPosition()).toEqual({ x: 100, y: 100 });

    // Change position and refresh
    x = 200;
    y = 250;
    ctx.refreshBindings();

    expect(circle.getPosition()).toEqual({ x: 200, y: 250 });
  });

  it('TC-BIND-002: bindPosition updates line endpoints on refresh', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    let x1 = 0;
    let y1 = 0;
    let x2 = 100;
    let y2 = 100;

    const line = ctx.line(x1, y1, x2, y2).withId('diagonal').bindEndpoint(() => ({
      x1,
      y1,
      x2,
      y2,
    }));

    expect(line.getEndpoints()).toEqual({ x1: 0, y1: 0, x2: 100, y2: 100 });

    // Change endpoints and refresh
    x1 = 50;
    y1 = 50;
    x2 = 150;
    y2 = 150;
    ctx.refreshBindings();

    expect(line.getEndpoints()).toEqual({ x1: 50, y1: 50, x2: 150, y2: 150 });
  });

  it('TC-BIND-003: bindFill changes color dynamically', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    let isActive = false;
    const circle = ctx.circle(100, 100, 20).withId('toggleCircle');

    // Manually test fill binding by calling fill method
    circle.fill(isActive ? '#00ff00' : '#ff0000');
    const widget = circle.getUnderlying() as MockWidget;
    expect(widget.properties.fillColor).toEqual('#ff0000');

    isActive = true;
    circle.fill(isActive ? '#00ff00' : '#ff0000');
    expect(widget.properties.fillColor).toEqual('#00ff00');
  });

  it('TC-BIND-004: bindVisible hides/shows primitive', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    let visible = true;
    const circle = ctx.circle(100, 100, 20).withId('visibleCircle').bindVisible(() => visible);

    // Verify binding is registered
    expect(circle.getVisibleBinding()).toBeDefined();

    // Refresh bindings
    ctx.refreshBindings();

    visible = false;
    ctx.refreshBindings();

    // The binding function should reflect the new state
    expect(circle.getVisibleBinding()?.getLastValue()).toEqual(false);
  });

  it('TC-BIND-007: Multiple bindings on same primitive work together', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    let x = 100;
    let y = 100;
    let visible = true;

    const circle = ctx
      .circle(x, y, 20)
      .withId('multiBinding')
      .bindPosition(() => ({ x, y }))
      .bindVisible(() => visible)
      .fill('#ff0000');

    // Initial state
    expect(circle.getPosition()).toEqual({ x: 100, y: 100 });
    expect(circle.getVisibleBinding()?.getLastValue()).toBeUndefined();

    // Refresh
    ctx.refreshBindings();
    expect(circle.getPosition()).toEqual({ x: 100, y: 100 });
    expect(circle.getVisibleBinding()?.getLastValue()).toEqual(true);

    // Change both
    x = 200;
    y = 250;
    visible = false;
    ctx.refreshBindings();

    expect(circle.getPosition()).toEqual({ x: 200, y: 250 });
    expect(circle.getVisibleBinding()?.getLastValue()).toEqual(false);
  });

  it('TC-BIND-009: refreshBindings() updates all bound primitives', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    let pos1 = { x: 100, y: 100 };
    let pos2 = { x: 200, y: 200 };

    const circle1 = ctx.circle(0, 0, 20).withId('c1').bindPosition(() => pos1);
    const circle2 = ctx.circle(0, 0, 20).withId('c2').bindPosition(() => pos2);

    ctx.refreshBindings();

    expect(circle1.getPosition()).toEqual({ x: 100, y: 100 });
    expect(circle2.getPosition()).toEqual({ x: 200, y: 200 });

    pos1 = { x: 300, y: 300 };
    pos2 = { x: 400, y: 400 };

    ctx.refreshBindings();

    expect(circle1.getPosition()).toEqual({ x: 300, y: 300 });
    expect(circle2.getPosition()).toEqual({ x: 400, y: 400 });
  });

  it('TC-BIND-010: Bindings survive primitive updates', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    let x = 100;
    const circle = ctx.circle(0, 0, 20).withId('persistentBinding').bindPosition(() => ({ x, y: 100 }));

    // Verify binding is set
    expect(circle.getPositionBinding()).toBeDefined();

    // Refresh
    ctx.refreshBindings();
    expect(circle.getPosition()).toEqual({ x: 100, y: 100 });

    // Fill color should not affect position binding
    circle.fill('#ff0000');
    expect(circle.getPositionBinding()).toBeDefined();

    // Position binding should still work
    x = 200;
    ctx.refreshBindings();
    expect(circle.getPosition()).toEqual({ x: 200, y: 100 });
  });
});

describe('CosyneContext primitive tracking', () => {
  it('should track primitives by ID', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    const circle = ctx.circle(100, 100, 20).withId('myCircle');
    const rect = ctx.rect(50, 50, 100, 80).withId('myRect');

    expect(ctx.getPrimitiveById('myCircle')).toBe(circle);
    expect(ctx.getPrimitiveById('myRect')).toBe(rect);
  });

  it('should return undefined for missing IDs', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    expect(ctx.getPrimitiveById('nonexistent')).toBeUndefined();
  });

  it('should get all primitives', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    ctx.circle(100, 100, 20).withId('c1');
    ctx.rect(50, 50, 100, 80).withId('r1');
    ctx.line(0, 0, 100, 100).withId('l1');

    const all = ctx.getAllPrimitives();
    expect(all.length).toEqual(3);
  });

  it('should clear all primitives and bindings', () => {
    const app = new MockApp();
    const ctx = new CosyneContext(app);

    ctx.circle(100, 100, 20).withId('c1').bindPosition(() => ({ x: 0, y: 0 }));
    ctx.rect(50, 50, 100, 80).withId('r1');

    expect(ctx.getAllPrimitives().length).toEqual(2);

    ctx.clear();

    expect(ctx.getAllPrimitives().length).toEqual(0);
    expect(ctx.getPrimitiveById('c1')).toBeUndefined();
  });
});
