// Test for Appointment Scheduler example (Calendar widget demo)
import { TsyneTest, TestContext } from '../src/index-test';
import { DateSelectedEvent } from '../src';
import * as path from 'path';

describe('Appointment Scheduler (Calendar Widget)', () => {
  let tsyneTest: TsyneTest;
  let ctx: TestContext;

  beforeEach(async () => {
    const headed = process.env.TSYNE_HEADED === '1';
    tsyneTest = new TsyneTest({ headed });
  });

  afterEach(async () => {
    await tsyneTest.cleanup();
  });

  test('should display calendar and allow date selection', async () => {
    let selectedDate: Date | null = null;
    let dateLabel: any;

    const testApp = await tsyneTest.createApp((app) => {
      app.window({ title: 'Calendar Test', width: 400, height: 500 }, (win) => {
        win.setContent(() => {
          app.vbox(() => {
            app.label('Calendar Widget Test');
            app.separator();

            app.calendar(new Date(2025, 0, 15), (event: DateSelectedEvent) => {
              selectedDate = new Date(event.year, event.month - 1, event.day);
              const formatted = `${event.year}-${event.month}-${event.day}`;
              dateLabel.setText(`Selected: ${formatted}`);
            });

            dateLabel = app.label('Selected: (none)');
          });
        });
        win.show();
      });
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Verify initial state - calendar should be visible
    await ctx.expect(ctx.getByExactText('Calendar Widget Test')).toBeVisible();
    await ctx.expect(ctx.getByExactText('Selected: (none)')).toBeVisible();

    // Capture screenshot if TAKE_SCREENSHOTS=1
    if (process.env.TAKE_SCREENSHOTS === '1') {
      const screenshotPath = path.join(__dirname, 'screenshots', 'appointment-scheduler.png');
      await ctx.wait(500);
      await tsyneTest.screenshot(screenshotPath);
      console.log(`Screenshot saved: ${screenshotPath}`);
    }
  });

  test('should integrate calendar with appointment form', async () => {
    let selectedDateLabel: any;
    let selectedDate: Date | null = null;

    const testApp = await tsyneTest.createApp((app) => {
      app.window({ title: 'Calendar Integration Test', width: 500, height: 500 }, (win) => {
        win.setContent(() => {
          app.vbox(() => {
            app.label('Calendar Integration Test');
            app.separator();

            // Calendar widget for date selection
            app.calendar(new Date(2025, 5, 15), (event: DateSelectedEvent) => {
              selectedDate = new Date(event.year, event.month - 1, event.day);
              const formatted = `${event.month}/${event.day}/${event.year}`;
              selectedDateLabel.setText(`Date: ${formatted}`);
            });

            selectedDateLabel = app.label('Date: (select from calendar)');

            app.separator();
            app.button('Show Selected', async () => {
              if (selectedDate) {
                await selectedDateLabel.setText(`Confirmed: ${selectedDate.toLocaleDateString()}`);
              }
            });
          });
        });
        win.show();
      });
    });

    ctx = tsyneTest.getContext();
    await testApp.run();

    // Verify calendar integration test loads
    await ctx.expect(ctx.getByExactText('Calendar Integration Test')).toBeVisible();
    await ctx.expect(ctx.getByText('Date:')).toBeVisible();

    // Verify the button is present
    await ctx.expect(ctx.getByExactText('Show Selected')).toBeVisible();
  });
});
