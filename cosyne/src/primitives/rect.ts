/**
 * Rectangle primitive for Cosyne
 */

import { Primitive, PrimitiveOptions } from './base';
import { PositionBinding } from '../binding';

export interface RectOptions extends PrimitiveOptions {
  width?: number;
  height?: number;
}

/**
 * Rectangle primitive - wraps Tsyne canvasRectangle
 */
export class CosyneRect extends Primitive<any> {
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  constructor(x: number, y: number, width: number, height: number, underlying: any, options?: RectOptions) {
    super(underlying, options);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Get current dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Set dimensions
   */
  setDimensions(width: number, height: number): this {
    this.width = width;
    this.height = height;
    this.updateUnderlying();
    return this;
  }

  protected applyFill(): void {
    if (this.underlying && this.fillColor) {
      // Update fill color on underlying widget
      if (this.underlying.updateFillColor) {
        this.underlying.updateFillColor(this.fillColor);
      }
    }
  }

  protected applyStroke(): void {
    if (this.underlying && this.strokeColor !== undefined) {
      // Update stroke on underlying widget
      if (this.underlying.updateStrokeColor) {
        this.underlying.updateStrokeColor(this.strokeColor);
      }
      if (this.underlying.updateStrokeWidth && this.strokeWidth !== undefined) {
        this.underlying.updateStrokeWidth(this.strokeWidth);
      }
    }
  }

  updatePosition(pos: PositionBinding): void {
    this.x = pos.x;
    this.y = pos.y;
    this.updateUnderlying();
  }

  updateVisibility(visible: boolean): void {
    // Visibility updates would be handled by the canvas stack
    // For now, this is a no-op but the infrastructure is in place
  }

  updateFill(color: string): void {
    this.fillColor = color;
    this.applyFill();
  }

  updateStroke(color: string): void {
    this.strokeColor = color;
    this.applyStroke();
  }

  updateAlpha(alpha: number): void {
    this.alpha = alpha;
    // Canvas alpha updates would be implemented here
  }

  /**
   * Update the underlying Tsyne widget with current properties
   */
  private updateUnderlying(): void {
    if (this.underlying && this.underlying.update) {
      this.underlying.update({
        x: this.x,
        y: this.y,
        x2: this.x + this.width,
        y2: this.y + this.height,
      });
    }
  }
}
