/**
 * JyneBrowserTest Examples
 *
 * Demonstrates testing Jyne Browser pages with automated tests
 *
 * Run: npm run build && node examples/browser.test.js
 */

import { browserTest, describeBrowser, JyneBrowserTest } from '../src';

describeBrowser('Jyne Browser Tests', () => {
  // Test 1: Basic page navigation
  browserTest(
    'should navigate to home page',
    [
      {
        path: '/',
        code: `
const { vbox, label } = jyne;
vbox(() => {
  label('Welcome to Home Page');
});
        `
      }
    ],
    async (bt: JyneBrowserTest) => {
      await bt.createBrowser('/');

      const ctx = bt.getContext();

      // Find the welcome label
      const welcomeLabel = await ctx.findWidget({ text: 'Welcome to Home Page' });
      if (!welcomeLabel) {
        throw new Error('Welcome label not found');
      }

      console.log('  ✓ Home page loaded successfully');
    }
  );

  // Test 2: Navigation between pages
  browserTest(
    'should navigate between pages',
    [
      {
        path: '/',
        code: `
const { vbox, label, button } = jyne;
vbox(() => {
  label('Home Page');
  button('Go to About', () => {
    browserContext.changePage('/about');
  });
});
        `
      },
      {
        path: '/about',
        code: `
const { vbox, label } = jyne;
vbox(() => {
  label('About Page');
});
        `
      }
    ],
    async (bt: JyneBrowserTest) => {
      await bt.createBrowser('/');

      const ctx = bt.getContext();

      // Verify we're on home page
      bt.assertUrl('/');
      console.log('  ✓ Started on home page');

      // Click "Go to About" button
      const aboutButton = await ctx.findWidget({ text: 'Go to About' });
      if (!aboutButton) {
        throw new Error('About button not found');
      }

      await ctx.clickWidget(aboutButton.id);
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for navigation

      // Verify we're on about page
      bt.assertUrl('/about');
      console.log('  ✓ Navigated to about page');

      // Verify about page content
      const aboutLabel = await ctx.findWidget({ text: 'About Page' });
      if (!aboutLabel) {
        throw new Error('About label not found');
      }
      console.log('  ✓ About page content loaded');
    }
  );

  // Test 3: Back/Forward navigation
  browserTest(
    'should support back and forward navigation',
    [
      {
        path: '/page1',
        code: `
const { vbox, label, button } = jyne;
vbox(() => {
  label('Page 1');
  button('Go to Page 2', () => {
    browserContext.changePage('/page2');
  });
});
        `
      },
      {
        path: '/page2',
        code: `
const { vbox, label } = jyne;
vbox(() => {
  label('Page 2');
});
        `
      }
    ],
    async (bt: JyneBrowserTest) => {
      await bt.createBrowser('/page1');

      const ctx = bt.getContext();

      // Navigate to page 2
      const page2Button = await ctx.findWidget({ text: 'Go to Page 2' });
      await ctx.clickWidget(page2Button!.id);
      await new Promise(resolve => setTimeout(resolve, 200));

      bt.assertUrl('/page2');
      console.log('  ✓ Navigated to page 2');

      // Go back
      await bt.back();
      bt.assertUrl('/page1');
      console.log('  ✓ Back navigation works');

      // Go forward
      await bt.forward();
      bt.assertUrl('/page2');
      console.log('  ✓ Forward navigation works');
    }
  );

  // Test 4: Reload page
  browserTest(
    'should reload current page',
    [
      {
        path: '/',
        code: `
const { vbox, label } = jyne;
vbox(() => {
  label('Reloadable Page');
  label('Time: ' + Date.now());
});
        `
      }
    ],
    async (bt: JyneBrowserTest) => {
      await bt.createBrowser('/');

      const ctx = bt.getContext();

      // Find initial timestamp
      const allWidgets = await ctx.getAllWidgets();
      const timeLabelBefore = allWidgets.find(w => w.text?.startsWith('Time:'));
      const timestampBefore = timeLabelBefore?.text;

      console.log('  ✓ Page loaded with timestamp:', timestampBefore);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload
      await bt.reload();

      // Find new timestamp
      const allWidgetsAfter = await ctx.getAllWidgets();
      const timeLabelAfter = allWidgetsAfter.find(w => w.text?.startsWith('Time:'));
      const timestampAfter = timeLabelAfter?.text;

      console.log('  ✓ Page reloaded with timestamp:', timestampAfter);

      // Timestamps should be different (page was reloaded)
      if (timestampBefore === timestampAfter) {
        throw new Error('Page did not reload - timestamps are the same');
      }

      console.log('  ✓ Reload changed page content');
    }
  );

  // Test 5: Form submission
  browserTest(
    'should handle form submission',
    [
      {
        path: '/',
        code: `
const { vbox, label, entry, button } = jyne;

let nameEntry;

vbox(() => {
  label('Enter your name:');
  nameEntry = entry('Your name');

  button('Submit', async () => {
    const name = await nameEntry.getText();
    console.log('Submitted name:', name);
    browserContext.changePage('/thanks?name=' + encodeURIComponent(name));
  });
});
        `
      },
      {
        path: '/thanks',
        code: `
const { vbox, label } = jyne;
vbox(() => {
  label('Thank you!');
});
        `
      }
    ],
    async (bt: JyneBrowserTest) => {
      await bt.createBrowser('/');

      const ctx = bt.getContext();

      // Find name entry
      const nameEntry = await ctx.findWidget({ type: 'entry' });
      if (!nameEntry) {
        throw new Error('Name entry not found');
      }

      // Type name
      await ctx.typeText(nameEntry.id, 'Alice');
      console.log('  ✓ Typed name into entry');

      // Click submit button
      const submitButton = await ctx.findWidget({ text: 'Submit' });
      await ctx.clickWidget(submitButton!.id);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify navigation to thanks page
      const currentUrl = bt.getCurrentUrl();
      if (!currentUrl.includes('/thanks')) {
        throw new Error(`Expected /thanks page, got ${currentUrl}`);
      }
      console.log('  ✓ Form submitted and navigated to thanks page');
    }
  );
});

// Run the tests
console.log('\n🧪 Running Jyne Browser Tests...\n');
