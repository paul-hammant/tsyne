/**
 * Unit tests for Cosyne primitives
 */

import { CosyneCircle } from '../src/primitives/circle';
import { CosyneRect } from '../src/primitives/rect';
import { CosyneLine } from '../src/primitives/line';

// Mock underlying widget
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

describe('CosyneCircle', () => {
  it('should create a circle with correct initial properties', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget);

    expect(circle.getPosition()).toEqual({ x: 100, y: 100 });
    expect(circle.getRadius()).toEqual(20);
  });

  it('should set custom ID', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget);

    circle.withId('myCircle');
    expect(circle.getId()).toEqual('myCircle');
  });

  it('should chain ID setting with other methods', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget).withId('ball').fill('#ff0000');

    expect(circle.getId()).toEqual('ball');
  });

  it('should apply fill color', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget);

    circle.fill('#ff0000');
    expect(widget.properties.fillColor).toEqual('#ff0000');
  });

  it('should apply stroke', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget);

    circle.stroke('#000000', 2);
    expect(widget.properties.strokeColor).toEqual('#000000');
    expect(widget.properties.strokeWidth).toEqual(2);
  });

  it('should update position from binding', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget);

    circle.updatePosition({ x: 200, y: 250 });
    expect(circle.getPosition()).toEqual({ x: 200, y: 250 });
  });

  it('should chain fill and stroke', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget)
      .fill('#ff0000')
      .stroke('#000000', 2)
      .withId('coloredCircle');

    expect(circle.getId()).toEqual('coloredCircle');
    expect(widget.properties.fillColor).toEqual('#ff0000');
    expect(widget.properties.strokeColor).toEqual('#000000');
  });

  it('should change radius', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget);

    circle.setRadius(30);
    expect(circle.getRadius()).toEqual(30);
  });
});

describe('CosyneRect', () => {
  it('should create a rect with correct initial properties', () => {
    const widget = new MockWidget();
    const rect = new CosyneRect(50, 50, 100, 80, widget);

    expect(rect.getPosition()).toEqual({ x: 50, y: 50 });
    expect(rect.getDimensions()).toEqual({ width: 100, height: 80 });
  });

  it('should set custom ID', () => {
    const widget = new MockWidget();
    const rect = new CosyneRect(50, 50, 100, 80, widget);

    rect.withId('myRect');
    expect(rect.getId()).toEqual('myRect');
  });

  it('should apply fill color', () => {
    const widget = new MockWidget();
    const rect = new CosyneRect(50, 50, 100, 80, widget);

    rect.fill('#0000ff');
    expect(widget.properties.fillColor).toEqual('#0000ff');
  });

  it('should apply stroke', () => {
    const widget = new MockWidget();
    const rect = new CosyneRect(50, 50, 100, 80, widget);

    rect.stroke('#333333', 3);
    expect(widget.properties.strokeColor).toEqual('#333333');
    expect(widget.properties.strokeWidth).toEqual(3);
  });

  it('should update position from binding', () => {
    const widget = new MockWidget();
    const rect = new CosyneRect(50, 50, 100, 80, widget);

    rect.updatePosition({ x: 100, y: 150 });
    expect(rect.getPosition()).toEqual({ x: 100, y: 150 });
  });

  it('should change dimensions', () => {
    const widget = new MockWidget();
    const rect = new CosyneRect(50, 50, 100, 80, widget);

    rect.setDimensions(200, 150);
    expect(rect.getDimensions()).toEqual({ width: 200, height: 150 });
  });

  it('should chain operations', () => {
    const widget = new MockWidget();
    const rect = new CosyneRect(50, 50, 100, 80, widget)
      .fill('#00ff00')
      .stroke('#000000', 1)
      .withId('greenRect');

    expect(rect.getId()).toEqual('greenRect');
    expect(widget.properties.fillColor).toEqual('#00ff00');
  });
});

describe('CosyneLine', () => {
  it('should create a line with correct initial endpoints', () => {
    const widget = new MockWidget();
    const line = new CosyneLine(0, 0, 100, 100, widget);

    expect(line.getEndpoints()).toEqual({ x1: 0, y1: 0, x2: 100, y2: 100 });
  });

  it('should set custom ID', () => {
    const widget = new MockWidget();
    const line = new CosyneLine(0, 0, 100, 100, widget);

    line.withId('myLine');
    expect(line.getId()).toEqual('myLine');
  });

  it('should apply stroke (lines use stroke only)', () => {
    const widget = new MockWidget();
    const line = new CosyneLine(0, 0, 100, 100, widget);

    line.stroke('#333333', 2);
    expect(widget.properties.strokeColor).toEqual('#333333');
    expect(widget.properties.strokeWidth).toEqual(2);
  });

  it('should update endpoints', () => {
    const widget = new MockWidget();
    const line = new CosyneLine(0, 0, 100, 100, widget);

    line.updateEndpoints({ x1: 10, y1: 20, x2: 110, y2: 120 });
    expect(line.getEndpoints()).toEqual({ x1: 10, y1: 20, x2: 110, y2: 120 });
  });

  it('should chain operations', () => {
    const widget = new MockWidget();
    const line = new CosyneLine(0, 0, 100, 100, widget)
      .stroke('#333333', 2)
      .withId('diagonalLine');

    expect(line.getId()).toEqual('diagonalLine');
    expect(widget.properties.strokeColor).toEqual('#333333');
  });
});

describe('Primitive base functionality', () => {
  it('TC-PRIM-001: Circle renders at correct position', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget);

    expect(circle.getPosition()).toEqual({ x: 100, y: 100 });
  });

  it('TC-PRIM-002: Circle respects fill and stroke', () => {
    const widget = new MockWidget();
    const circle = new CosyneCircle(100, 100, 20, widget)
      .fill('#ff0000')
      .stroke('#000000', 2);

    expect(widget.properties.fillColor).toEqual('#ff0000');
    expect(widget.properties.strokeColor).toEqual('#000000');
    expect(widget.properties.strokeWidth).toEqual(2);
  });

  it('TC-PRIM-003: Line renders between two points', () => {
    const widget = new MockWidget();
    const line = new CosyneLine(0, 0, 200, 200, widget);

    const endpoints = line.getEndpoints();
    expect(endpoints.x1).toEqual(0);
    expect(endpoints.y1).toEqual(0);
    expect(endpoints.x2).toEqual(200);
    expect(endpoints.y2).toEqual(200);
  });

  it('TC-PRIM-005: Rect renders with correct dimensions', () => {
    const widget = new MockWidget();
    const rect = new CosyneRect(50, 50, 100, 80, widget);

    const dims = rect.getDimensions();
    expect(dims.width).toEqual(100);
    expect(dims.height).toEqual(80);
  });

  it('TC-PRIM-009: Multiple primitives can be created', () => {
    const widget1 = new MockWidget();
    const widget2 = new MockWidget();
    const widget3 = new MockWidget();

    const circle = new CosyneCircle(100, 100, 20, widget1).withId('c1');
    const rect = new CosyneRect(50, 50, 100, 80, widget2).withId('r1');
    const line = new CosyneLine(0, 0, 200, 200, widget3).withId('l1');

    expect(circle.getId()).toEqual('c1');
    expect(rect.getId()).toEqual('r1');
    expect(line.getId()).toEqual('l1');
  });
});
