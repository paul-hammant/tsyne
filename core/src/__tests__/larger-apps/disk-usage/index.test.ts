/**
 * TsyneTest for Disk Use App
 *
 * Integration tests for the Disk Usage analyzer app UI using TsyneTest framework.
 * Tests directory navigation, disk visualization, and size calculations.
 */

import { TsyneTest, TestContext } from '../../index-test';
import { buildDiskUseApp } from '../../../../../larger-apps/disk-usage/disk-use';

describe('Disk Use App UI Tests', () => {
  let tsyneTest: TsyneTest;
  let ctx: TestContext;

  beforeEach(async () => {
    tsyneTest = new TsyneTest({ headed: false });
  });

  afterEach(async () => {
    // Cleanup
  });

  it('should render the app with title', async () => {
    const testApp = await tsyneTest.createApp((app) => {
      buildDiskUseApp(app);
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Check app title
    const title = await ctx.getById('diskuse-title').within(2000).getText();
    expect(title).toBe('Disk Usage');
  });

  it('should display path and size information', async () => {
    const testApp = await tsyneTest.createApp((app) => {
      buildDiskUseApp(app);
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Check path label exists
    const pathLabel = await ctx.getById('diskuse-path').within(2000).getText();
    expect(pathLabel).toMatch(/^Path: /);

    // Check size label exists
    const sizeLabel = await ctx.getById('diskuse-size').within(2000).getText();
    expect(sizeLabel).toMatch(/^Size: /);
  });

  it('should display size formatting correctly', async () => {
    const testApp = await tsyneTest.createApp((app) => {
      buildDiskUseApp(app);
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Check that size is formatted (should contain unit like B, KB, MB, etc)
    const sizeLabel = await ctx.getById('diskuse-size').within(2000).getText();
    const sizeRegex = /Size: [\d.]+ [KMGT]?B/;
    expect(sizeLabel).toMatch(sizeRegex);
  });

  it('should render without errors on app startup', async () => {
    let appCreated = false;
    let appRunned = false;

    try {
      const testApp = await tsyneTest.createApp((app) => {
        appCreated = true;
        buildDiskUseApp(app);
      });

      ctx = tsyneTest.getContext();
      appRunned = true;
      await testApp.run();

      expect(appCreated).toBe(true);
      expect(appRunned).toBe(true);
    } catch (err) {
      fail(`App creation or running failed: ${err}`);
    }
  });

  it('should have disk usage title label', async () => {
    const testApp = await tsyneTest.createApp((app) => {
      buildDiskUseApp(app);
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    const title = await ctx.getById('diskuse-title').within(2000).getText();
    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });
});
