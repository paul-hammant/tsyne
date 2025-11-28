/**
 * Test for Fory mode bridge connection
 *
 * This test verifies that:
 * 1. Bridge starts in Fory mode
 * 2. TypeScript client connects via Fory over UDS
 * 3. Basic widget operations work over Fory
 */

import { ForyBridgeConnection } from '../src/forybridge';

describe('Fory Mode', () => {
  let bridge: ForyBridgeConnection;

  beforeAll(async () => {
    // Start bridge in Fory mode (headless for testing)
    bridge = new ForyBridgeConnection(true);
    await bridge.waitUntilReady();
  }, 10000);

  afterAll(async () => {
    if (bridge) {
      bridge.shutdown();
    }
  });

  test('connects successfully via Fory', async () => {
    // If we got here, connection succeeded
    expect(bridge).toBeDefined();
  });

  test('can create a window via Fory', async () => {
    const result = await bridge.send('createWindow', {
      windowId: 'test_window_1',
      title: 'Fory Test Window',
      width: 400,
      height: 300
    });

    // No error means success
    expect(result).toBeDefined();
  });

  test('can create widgets via Fory', async () => {
    // Create a VBox container
    await bridge.send('createVBox', {
      widgetId: 'test_vbox_1'
    });

    // Create a label
    await bridge.send('createLabel', {
      widgetId: 'test_label_1',
      text: 'Hello from Fory!'
    });

    // Create a button
    await bridge.send('createButton', {
      widgetId: 'test_button_1',
      text: 'Click Me'
    });

    // If we got here without errors, widgets were created
    expect(true).toBe(true);
  });

  test('can set window content via Fory', async () => {
    await bridge.send('setContent', {
      windowId: 'test_window_1',
      widgetId: 'test_vbox_1'
    });

    expect(true).toBe(true);
  });

  test('can update widget text via Fory', async () => {
    await bridge.send('setText', {
      widgetId: 'test_label_1',
      text: 'Updated via Fory!'
    });

    expect(true).toBe(true);
  });

  test('can quit via Fory', async () => {
    await bridge.send('quit', {});
    expect(true).toBe(true);
  });
});
