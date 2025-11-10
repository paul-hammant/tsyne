/**
 * Jyne Browser Example
 *
 * Demonstrates the Swiby-style browser that loads Jyne pages from a web server.
 *
 * To run this example:
 * 1. Start the sample server: node examples/server.js
 * 2. Run the browser: node examples/browser.js
 */

import { createBrowser } from '../src/browser';

async function main() {
  // Create browser and navigate to initial page
  const browser = await createBrowser('http://localhost:3000/', {
    title: 'Jyne Browser',
    width: 900,
    height: 700
  });

  // Run the browser
  await browser.run();
}

main().catch(console.error);
