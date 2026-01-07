/**
 * Binding system for Cosyne primitives
 *
 * Bindings store functions that are evaluated on refresh to update primitive properties.
 * This allows primitives to be animated or controlled by reactive state.
 */

export type BindingFunction<T> = () => T;

export interface PositionBinding {
  x: number;
  y: number;
}

/**
 * Represents a single binding (function + last evaluated value)
 */
export class Binding<T> {
  private lastValue: T | undefined;

  constructor(private fn: BindingFunction<T>) {
    this.lastValue = undefined;
  }

  evaluate(): T {
    this.lastValue = this.fn();
    return this.lastValue;
  }

  getLastValue(): T | undefined {
    return this.lastValue;
  }
}

/**
 * Registry of all bindings in a Cosyne context
 * Manages evaluation and refresh of all bound primitives
 */
export class BindingRegistry {
  private bindings: Binding<any>[] = [];

  register<T>(binding: Binding<T>): void {
    this.bindings.push(binding);
  }

  refreshAll(): void {
    for (const binding of this.bindings) {
      binding.evaluate();
    }
  }

  clear(): void {
    this.bindings = [];
  }

  count(): number {
    return this.bindings.length;
  }
}
