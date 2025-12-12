/**
 * Eyes - Animated Eyes Following Mouse
 *
 * Ported from ChrysaLisp: https://github.com/vygr/ChrysaLisp/blob/master/apps/eyes/app.lisp
 * Original authors: ChrysaLisp contributors
 * License: See original repository
 *
 * An animated eyes display that follows the mouse cursor.
 *
 * @tsyne-app:name Eyes
 * @tsyne-app:icon <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/></svg>
 * @tsyne-app:category fun
 * @tsyne-app:builder createEyesApp
 */

import { app } from '../core/src';
import type { App } from '../core/src/app';
import type { Window } from '../core/src/window';
import { CanvasCircle, TappableCanvasRaster } from '../core/src/widgets/canvas';

// Default configuration
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 200;

// Colors as RGBA values
const SKY_BLUE: [number, number, number, number] = [135, 206, 235, 255];
const SCLERA_COLOR: [number, number, number, number] = [255, 255, 255, 255];
const SCLERA_OUTLINE: [number, number, number, number] = [51, 51, 51, 255];
const IRIS_COLOR: [number, number, number, number] = [76, 175, 80, 255]; // Green
const IRIS_OUTLINE: [number, number, number, number] = [46, 125, 50, 255];
const PUPIL_COLOR: [number, number, number, number] = [0, 0, 0, 255];
const HIGHLIGHT_COLOR: [number, number, number, number] = [255, 255, 255, 255];

// Scale factors
const IRIS_SCALE = 0.4; // Iris radius relative to eye
const PUPIL_SCALE = 0.5; // Pupil radius relative to iris
const HIGHLIGHT_SCALE = 0.2; // Highlight size relative to pupil

/**
 * Eyes class - manages the animated eyes
 */
export class Eyes {
  private width: number;
  private height: number;
  private mouseX: number = 0;
  private mouseY: number = 0;

  // Eye positions
  private leftEye: { x: number; y: number; radius: number } = { x: 0, y: 0, radius: 0 };
  private rightEye: { x: number; y: number; radius: number } = { x: 0, y: 0, radius: 0 };

  // Current iris positions (animated)
  private leftIrisOffset: { x: number; y: number } = { x: 0, y: 0 };
  private rightIrisOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor(width: number = DEFAULT_WIDTH, height: number = DEFAULT_HEIGHT) {
    this.width = width;
    this.height = height;
    this.calculateEyePositions();
    // Initialize mouse at center
    this.mouseX = width / 2;
    this.mouseY = height / 2;
  }

  private calculateEyePositions(): void {
    const eyeRadius = Math.min(this.width / 4, this.height / 2) * 0.8;
    const centerY = this.height / 2;

    this.leftEye = {
      x: this.width / 4,
      y: centerY,
      radius: eyeRadius,
    };

    this.rightEye = {
      x: (this.width * 3) / 4,
      y: centerY,
      radius: eyeRadius,
    };
  }

  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.calculateEyePositions();
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
    this.updateIrisPositions();
  }

  private updateIrisPositions(): void {
    this.leftIrisOffset = this.calculateIrisOffset(this.leftEye);
    this.rightIrisOffset = this.calculateIrisOffset(this.rightEye);
  }

  private calculateIrisOffset(eye: { x: number; y: number; radius: number }): { x: number; y: number } {
    const dx = this.mouseX - eye.x;
    const dy = this.mouseY - eye.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      return { x: 0, y: 0 };
    }

    // Maximum offset is the eye radius minus the iris radius
    const maxOffset = eye.radius * (1 - IRIS_SCALE);

    // Calculate normalized offset
    const scale = Math.min(distance, maxOffset * 2) / (maxOffset * 2);
    const offsetX = (dx / distance) * maxOffset * scale;
    const offsetY = (dy / distance) * maxOffset * scale;

    return { x: offsetX, y: offsetY };
  }

  getLeftEye(): { x: number; y: number; radius: number } {
    return this.leftEye;
  }

  getRightEye(): { x: number; y: number; radius: number } {
    return this.rightEye;
  }

  getLeftIrisOffset(): { x: number; y: number } {
    return this.leftIrisOffset;
  }

  getRightIrisOffset(): { x: number; y: number } {
    return this.rightIrisOffset;
  }

  getIrisRadius(eyeRadius: number): number {
    return eyeRadius * IRIS_SCALE;
  }

  getPupilRadius(irisRadius: number): number {
    return irisRadius * PUPIL_SCALE;
  }

  getHighlightRadius(pupilRadius: number): number {
    return pupilRadius * HIGHLIGHT_SCALE;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}

/**
 * Render eyes to a pixel buffer
 */

/**
 * Eyes UI class
 */
export class EyesUI {
  private a: App;
  private win: Window | null = null;
  private eyes: Eyes;
  private canvasWidth: number = DEFAULT_WIDTH;
  private canvasHeight: number = DEFAULT_HEIGHT;
  private canvas: TappableCanvasRaster | null = null;
  private trackingMouse: boolean = true;

  private leftSclera: CanvasCircle | null = null;
  private leftIris: CanvasCircle | null = null;
  private leftPupil: CanvasCircle | null = null;
  private leftHighlight: CanvasCircle | null = null;

  private rightSclera: CanvasCircle | null = null;
  private rightIris: CanvasCircle | null = null;
  private rightPupil: CanvasCircle | null = null;
  private rightHighlight: CanvasCircle | null = null;

  constructor(a: App) {
    this.a = a;
    this.eyes = new Eyes(this.canvasWidth, this.canvasHeight);
  }

  private async updateCanvas(): Promise<void> {
    const leftEye = this.eyes.getLeftEye();
    const rightEye = this.eyes.getRightEye();
    const leftOffset = this.eyes.getLeftIrisOffset();
    const rightOffset = this.eyes.getRightIrisOffset();
    const irisRadius = this.eyes.getIrisRadius(leftEye.radius);
    const pupilRadius = this.eyes.getPupilRadius(irisRadius);
    const highlightRadius = this.eyes.getHighlightRadius(pupilRadius);

    this.leftIris?.update({ x: leftEye.x + leftOffset.x - irisRadius, y: leftEye.y + leftOffset.y - irisRadius, x2: leftEye.x + leftOffset.x + irisRadius, y2: leftEye.y + leftOffset.y + irisRadius });
    this.leftPupil?.update({ x: leftEye.x + leftOffset.x - pupilRadius, y: leftEye.y + leftOffset.y - pupilRadius, x2: leftEye.x + leftOffset.x + pupilRadius, y2: leftEye.y + leftOffset.y + pupilRadius });
    this.leftHighlight?.update({ x: leftEye.x + leftOffset.x - pupilRadius * 0.3 - highlightRadius, y: leftEye.y + leftOffset.y - pupilRadius * 0.3 - highlightRadius, x2: leftEye.x + leftOffset.x - pupilRadius * 0.3 + highlightRadius, y2: leftEye.y + leftOffset.y - pupilRadius * 0.3 + highlightRadius });

    this.rightIris?.update({ x: rightEye.x + rightOffset.x - irisRadius, y: rightEye.y + rightOffset.y - irisRadius, x2: rightEye.x + rightOffset.x + irisRadius, y2: rightEye.y + rightOffset.y + irisRadius });
    this.rightPupil?.update({ x: rightEye.x + rightOffset.x - pupilRadius, y: rightEye.y + rightOffset.y - pupilRadius, x2: rightEye.x + rightOffset.x + pupilRadius, y2: rightEye.y + rightOffset.y + pupilRadius });
    this.rightHighlight?.update({ x: rightEye.x + rightOffset.x - pupilRadius * 0.3 - highlightRadius, y: rightEye.y + rightOffset.y - pupilRadius * 0.3 - highlightRadius, x2: rightEye.x + rightOffset.x - pupilRadius * 0.3 + highlightRadius, y2: rightEye.y + rightOffset.y - pupilRadius * 0.3 + highlightRadius });
  }

  cleanup(): void {
    // Nothing to clean up now that we don't have animation
  }

  buildUI(win: Window): void {
    this.win = win;

    this.a.vbox(() => {
      this.a.center(() => {
        this.a.stack(() => {
          this.a.canvasRectangle({ width: this.canvasWidth, height: this.canvasHeight, fillColor: `rgba(${SKY_BLUE.join(',')})` });
          this.canvas = this.a.tappableCanvasRaster(this.canvasWidth, this.canvasHeight, {
            pixels: [],
            onMouseMove: (x, y) => {
              if (this.trackingMouse) {
                this.eyes.setMousePosition(x, y);
                this.updateCanvas();
              }
            },
            onTap: (x, y) => {
              // Toggle tracking mode on tap
              this.trackingMouse = !this.trackingMouse;
            }
        });

          const leftEye = this.eyes.getLeftEye();
          const rightEye = this.eyes.getRightEye();
          const irisRadius = this.eyes.getIrisRadius(leftEye.radius);
          const pupilRadius = this.eyes.getPupilRadius(irisRadius);
          const highlightRadius = this.eyes.getHighlightRadius(pupilRadius);

          this.leftSclera = this.a.canvasCircle({ x: leftEye.x - leftEye.radius, y: leftEye.y - leftEye.radius, x2: leftEye.x + leftEye.radius, y2: leftEye.y + leftEye.radius, fillColor: `rgba(${SCLERA_COLOR.join(',')})`, strokeColor: `rgba(${SCLERA_OUTLINE.join(',')})`, strokeWidth: 2 });
          this.leftIris = this.a.canvasCircle({ x: leftEye.x - irisRadius, y: leftEye.y - irisRadius, x2: leftEye.x + irisRadius, y2: leftEye.y + irisRadius, fillColor: `rgba(${IRIS_COLOR.join(',')})`, strokeColor: `rgba(${IRIS_OUTLINE.join(',')})`, strokeWidth: 1 });
          this.leftPupil = this.a.canvasCircle({ x: leftEye.x - pupilRadius, y: leftEye.y - pupilRadius, x2: leftEye.x + pupilRadius, y2: leftEye.y + pupilRadius, fillColor: `rgba(${PUPIL_COLOR.join(',')})` });
          this.leftHighlight = this.a.canvasCircle({ x: leftEye.x - pupilRadius * 0.3 - highlightRadius, y: leftEye.y - pupilRadius * 0.3 - highlightRadius, x2: leftEye.x - pupilRadius * 0.3 + highlightRadius, y2: leftEye.y - pupilRadius * 0.3 + highlightRadius, fillColor: `rgba(${HIGHLIGHT_COLOR.join(',')})` });

          this.rightSclera = this.a.canvasCircle({ x: rightEye.x - rightEye.radius, y: rightEye.y - rightEye.radius, x2: rightEye.x + rightEye.radius, y2: rightEye.y + rightEye.radius, fillColor: `rgba(${SCLERA_COLOR.join(',')})`, strokeColor: `rgba(${SCLERA_OUTLINE.join(',')})`, strokeWidth: 2 });
          this.rightIris = this.a.canvasCircle({ x: rightEye.x - irisRadius, y: rightEye.y - irisRadius, x2: rightEye.x + irisRadius, y2: rightEye.y + irisRadius, fillColor: `rgba(${IRIS_COLOR.join(',')})`, strokeColor: `rgba(${IRIS_OUTLINE.join(',')})`, strokeWidth: 1 });
          this.rightPupil = this.a.canvasCircle({ x: rightEye.x - pupilRadius, y: rightEye.y - pupilRadius, x2: rightEye.x + pupilRadius, y2: rightEye.y + pupilRadius, fillColor: `rgba(${PUPIL_COLOR.join(',')})` });
          this.rightHighlight = this.a.canvasCircle({ x: rightEye.x - pupilRadius * 0.3 - highlightRadius, y: rightEye.y - pupilRadius * 0.3 - highlightRadius, x2: rightEye.x - pupilRadius * 0.3 + highlightRadius, y2: rightEye.y - pupilRadius * 0.3 + highlightRadius, fillColor: `rgba(${HIGHLIGHT_COLOR.join(',')})` });
        });
      });

      this.a.separator();

      this.a.label('Move mouse over the eyes - tap to toggle tracking');
    });

    // Initial render
    this.updateCanvas();
  }
}

/**
 * Create the Eyes app
 */
export function createEyesApp(a: App): EyesUI {
  const ui = new EyesUI(a);

  a.registerCleanup(() => ui.cleanup());

  a.window({ title: 'Eyes', width: 450, height: 300 }, (win: Window) => {
    win.setContent(() => {
      ui.buildUI(win);
    });
    win.show();
  });

  return ui;
}

// Eyes class is already exported above

/**
 * Main application entry point
 */
if (require.main === module) {
  app({ title: 'Eyes' }, async (a: App) => {
    createEyesApp(a);
    await a.run();
  });
}
