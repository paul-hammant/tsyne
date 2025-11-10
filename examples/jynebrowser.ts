/**
 * Jyne Browser - Load Jyne TypeScript pages from web servers
 *
 * A Swiby-inspired browser that loads Jyne pages dynamically from HTTP servers.
 * Pages are TypeScript code (not JavaScript) that use the Jyne API.
 *
 * Usage:
 *   node examples/jynebrowser.js <url>
 *
 * Examples:
 *   node examples/jynebrowser.js http://localhost:3000/
 *   node examples/jynebrowser.js https://example.com/jyne/index
 *
 * To run with sample server:
 *   Terminal 1: node examples/server.js
 *   Terminal 2: node examples/jynebrowser.js http://localhost:3000/
 */

import { createBrowser } from '../src/browser';

async function main() {
  // Get URL from command-line arguments
  const url = process.argv[2];

  if (!url) {
    console.error('Jyne Browser - Load Jyne TypeScript pages from web servers');
    console.error('');
    console.error('Usage: node examples/jynebrowser.js <url>');
    console.error('');
    console.error('Examples:');
    console.error('  node examples/jynebrowser.js http://localhost:3000/');
    console.error('  node examples/jynebrowser.js https://example.com/jyne/index');
    console.error('');
    console.error('Note: Pages must be TypeScript code using the Jyne API,');
    console.error('      not HTML or JavaScript.');
    console.error('');
    console.error('To run with sample server:');
    console.error('  Terminal 1: node examples/server.js');
    console.error('  Terminal 2: node examples/jynebrowser.js http://localhost:3000/');
    process.exit(1);
  }

  // Create browser and navigate to initial page
  const browser = await createBrowser(url, {
    title: 'Jyne Browser',
    width: 900,
    height: 700
  });

  // Run the browser
  await browser.run();
}

main().catch(err => {
  console.error('Jyne Browser error:', err.message || err);
  process.exit(1);
});
