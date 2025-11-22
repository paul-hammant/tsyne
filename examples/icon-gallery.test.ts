// Test for Icon Gallery example
import { TsyneTest, TestContext } from '../src/index-test';
import { ThemeIconName } from '../src';
import * as path from 'path';

describe('Icon Gallery', () => {
  let tsyneTest: TsyneTest;
  let ctx: TestContext;

  beforeEach(async () => {
    const headed = process.env.TSYNE_HEADED === '1';
    tsyneTest = new TsyneTest({ headed });
  });

  afterEach(async () => {
    await tsyneTest.cleanup();
  });

  test('should display icons and their labels', async () => {
    const testApp = await tsyneTest.createApp((app) => {
      app.window({ title: 'Icon Test', width: 400, height: 300 }, (win) => {
        win.setContent(() => {
          app.vbox(() => {
            app.label('Icon Widget Test');
            app.separator();

            // Test a few representative icons from different categories
            app.hbox(() => {
              app.vbox(() => {
                app.icon('Home');
                app.label('Home');
              });
              app.vbox(() => {
                app.icon('Settings');
                app.label('Settings');
              });
              app.vbox(() => {
                app.icon('MediaPlay');
                app.label('MediaPlay');
              });
            });

            app.separator();

            // Test more icons
            app.hbox(() => {
              app.vbox(() => {
                app.icon('File');
                app.label('File');
              });
              app.vbox(() => {
                app.icon('Folder');
                app.label('Folder');
              });
              app.vbox(() => {
                app.icon('Search');
                app.label('Search');
              });
            });
          });
        });
        win.show();
      });
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Verify the labels are visible (which confirms icons were created)
    await ctx.expect(ctx.getByExactText('Icon Widget Test')).toBeVisible();
    await ctx.expect(ctx.getByExactText('Home')).toBeVisible();
    await ctx.expect(ctx.getByExactText('Settings')).toBeVisible();
    await ctx.expect(ctx.getByExactText('MediaPlay')).toBeVisible();
    await ctx.expect(ctx.getByExactText('File')).toBeVisible();
    await ctx.expect(ctx.getByExactText('Folder')).toBeVisible();
    await ctx.expect(ctx.getByExactText('Search')).toBeVisible();

    // Capture screenshot if TAKE_SCREENSHOTS=1
    if (process.env.TAKE_SCREENSHOTS === '1') {
      const screenshotPath = path.join(__dirname, 'screenshots', 'icon-gallery.png');
      await ctx.wait(500);
      await tsyneTest.screenshot(screenshotPath);
      console.log(`Screenshot saved: ${screenshotPath}`);
    }
  });

  test('should create various icon categories', async () => {
    // Test multiple icon categories
    const testIcons: ThemeIconName[] = [
      'NavigateBack', 'NavigateNext',  // Navigation
      'Document', 'DocumentSave',       // Document
      'ContentAdd', 'ContentRemove',    // Content
      'Info', 'Warning', 'Error',       // Status
      'ZoomIn', 'ZoomOut',              // View
    ];

    const testApp = await tsyneTest.createApp((app) => {
      app.window({ title: 'Icon Categories Test', width: 600, height: 200 }, (win) => {
        win.setContent(() => {
          app.hbox(() => {
            for (const iconName of testIcons) {
              app.vbox(() => {
                app.icon(iconName);
                app.label(iconName);
              });
            }
          });
        });
        win.show();
      });
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Verify all icon labels are visible
    for (const iconName of testIcons) {
      await ctx.expect(ctx.getByExactText(iconName)).toBeVisible();
    }
  });
});
