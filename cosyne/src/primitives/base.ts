/**
 * Base class for all Cosyne primitives
 */

import { Binding, BindingFunction, PositionBinding } from '../binding';

export interface PrimitiveOptions {
  id?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * Base primitive that wraps a Tsyne canvas primitive
 */
export abstract class Primitive<TUnderlyingWidget> {
  protected customId: string | undefined;
  protected fillColor: string | undefined;
  protected strokeColor: string | undefined;
  protected strokeWidth: number | undefined;
  protected positionBinding: Binding<PositionBinding> | undefined;
  protected visibleBinding: Binding<boolean> | undefined;

  constructor(
    protected underlying: TUnderlyingWidget,
    options?: PrimitiveOptions
  ) {
    if (options?.id) {
      this.customId = options.id;
    }
    if (options?.fillColor) {
      this.fillColor = options.fillColor;
    }
    if (options?.strokeColor) {
      this.strokeColor = options.strokeColor;
    }
    if (options?.strokeWidth) {
      this.strokeWidth = options.strokeWidth;
    }
  }

  /**
   * Get the custom ID for this primitive (for testing)
   */
  getId(): string | undefined {
    return this.customId;
  }

  /**
   * Set custom ID for testing and debugging
   */
  withId(id: string): this {
    this.customId = id;
    return this;
  }

  /**
   * Set fill color
   */
  fill(color: string): this {
    this.fillColor = color;
    this.applyFill();
    return this;
  }

  /**
   * Set stroke color and width
   */
  stroke(color: string, width: number = 1): this {
    this.strokeColor = color;
    this.strokeWidth = width;
    this.applyStroke();
    return this;
  }

  /**
   * Bind position to a function that returns x, y coordinates
   */
  bindPosition(fn: BindingFunction<PositionBinding>): this {
    this.positionBinding = new Binding(fn);
    return this;
  }

  /**
   * Bind visibility to a function
   */
  bindVisible(fn: BindingFunction<boolean>): this {
    this.visibleBinding = new Binding(fn);
    return this;
  }

  /**
   * Get the underlying Tsyne widget
   */
  getUnderlying(): TUnderlyingWidget {
    return this.underlying;
  }

  /**
   * Get position binding if set
   */
  getPositionBinding(): Binding<PositionBinding> | undefined {
    return this.positionBinding;
  }

  /**
   * Get visible binding if set
   */
  getVisibleBinding(): Binding<boolean> | undefined {
    return this.visibleBinding;
  }

  /**
   * Apply fill color to underlying widget (implemented by subclasses)
   */
  protected abstract applyFill(): void;

  /**
   * Apply stroke to underlying widget (implemented by subclasses)
   */
  protected abstract applyStroke(): void;

  /**
   * Update position from binding (implemented by subclasses)
   */
  abstract updatePosition(pos: PositionBinding): void;

  /**
   * Update visibility from binding (implemented by subclasses)
   */
  abstract updateVisibility(visible: boolean): void;
}
