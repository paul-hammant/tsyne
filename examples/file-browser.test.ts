// Test for file browser FileIcon demo
import { TsyneTest, TestContext } from '../src/index-test';
import * as path from 'path';
import * as fs from 'fs';

describe('File Browser - FileIcon Demo', () => {
  let tsyneTest: TsyneTest;
  let ctx: TestContext;
  const tempDir = '/tmp/tsyne-file-browser-test';

  beforeAll(() => {
    // Create temp directory and sample files for testing
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    // Create sample files
    const testFiles = ['test.txt', 'script.js', 'image.png'];
    testFiles.forEach(file => {
      const filePath = path.join(tempDir, file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'test content');
      }
    });
  });

  afterAll(() => {
    // Cleanup temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    const headed = process.env.TSYNE_HEADED === '1';
    tsyneTest = new TsyneTest({ headed });
  });

  afterEach(async () => {
    await tsyneTest.cleanup();
  });

  test('should display file icons and allow file selection', async () => {
    const testApp = await tsyneTest.createApp((app) => {
      app.window({ title: 'File Browser Test', width: 500, height: 400 }, (win) => {
        let statusLabel: any;

        win.setContent(() => {
          app.border({
            top: () => {
              app.label('File Browser Test', undefined, 'center', undefined, { bold: true });
            },
            center: () => {
              app.vbox(() => {
                // Test FileIcon with different file types
                app.hbox(() => {
                  app.fileicon(path.join(tempDir, 'test.txt'));
                  app.button('test.txt', () => {
                    statusLabel.setText('Selected: test.txt');
                  });
                });

                app.hbox(() => {
                  app.fileicon(path.join(tempDir, 'script.js'));
                  app.button('script.js', () => {
                    statusLabel.setText('Selected: script.js');
                  });
                });

                app.hbox(() => {
                  app.fileicon(path.join(tempDir, 'image.png'));
                  app.button('image.png', () => {
                    statusLabel.setText('Selected: image.png');
                  });
                });
              });
            },
            bottom: () => {
              app.vbox(() => {
                app.separator();
                statusLabel = app.label('No file selected');
              });
            }
          });
        });

        win.show();
      });
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Verify title is displayed
    await ctx.expect(ctx.getByExactText('File Browser Test')).toBeVisible();

    // Verify file buttons are displayed
    await ctx.expect(ctx.getByExactText('test.txt')).toBeVisible();
    await ctx.expect(ctx.getByExactText('script.js')).toBeVisible();
    await ctx.expect(ctx.getByExactText('image.png')).toBeVisible();

    // Click on a file and verify selection
    await ctx.getByExactText('test.txt').click();
    await ctx.expect(ctx.getByExactText('Selected: test.txt')).toBeVisible();

    // Click another file
    await ctx.getByExactText('script.js').click();
    await ctx.expect(ctx.getByExactText('Selected: script.js')).toBeVisible();

    // Capture screenshot if TAKE_SCREENSHOTS=1
    if (process.env.TAKE_SCREENSHOTS === '1') {
      const screenshotPath = path.join(__dirname, 'screenshots', 'file-browser.png');
      await ctx.wait(500); // Wait for rendering
      await tsyneTest.screenshot(screenshotPath);
      console.log(`Screenshot saved: ${screenshotPath}`);
    }
  });

  test('FileIcon should handle directory paths', async () => {
    const testApp = await tsyneTest.createApp((app) => {
      app.window({ title: 'Directory Icon Test', width: 400, height: 300 }, (win) => {
        win.setContent(() => {
          app.vbox(() => {
            app.label('Directory Icon Test');
            // FileIcon for a directory
            app.fileicon(tempDir);
            app.label('Directory displayed above');
          });
        });

        win.show();
      });
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Verify the label is displayed (confirming the widget structure works)
    await ctx.expect(ctx.getByExactText('Directory Icon Test')).toBeVisible();
    await ctx.expect(ctx.getByExactText('Directory displayed above')).toBeVisible();
  });
});
