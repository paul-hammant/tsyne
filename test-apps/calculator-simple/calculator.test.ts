/**
 * JyneTest Integration Tests for Simple Calculator
 *
 * Since the simple calculator mixes UI and logic, ALL tests
 * must use JyneTest (no Jest unit tests possible).
 *
 * PROS:
 * - Tests exactly what users see/do
 * - Catches integration bugs
 * - End-to-end validation
 *
 * CONS:
 * - Slower than unit tests (~3s vs ~100ms)
 * - Harder to debug failures
 * - Cannot test edge cases quickly
 * - Must spawn bridge for every test
 */

import { app } from '../../src';
import { JyneTest, TestContext } from '../../src/index-test';

describe('Simple Calculator Tests', () => {
  let jyneTest: JyneTest;
  let ctx: TestContext;

  beforeEach(() => {
    jyneTest = new JyneTest({ headed: false });
  });

  afterEach(async () => {
    await jyneTest.cleanup();
  });

  test('should display initial value of 0', async () => {
    const testApp = jyneTest.createApp((app) => {
      require('./calculator'); // Loads the monolithic app
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    const display = ctx.getByExactText("0");
    await ctx.expect(display).toHaveText("0");
  });

  test('should perform addition', async () => {
    const testApp = jyneTest.createApp((app) => {
      require('./calculator');
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    await ctx.getByExactText("5").click();
    await ctx.wait(50);
    await ctx.getByExactText("+").click();
    await ctx.wait(50);
    await ctx.getByExactText("3").click();
    await ctx.wait(50);
    await ctx.getByExactText("=").click();
    await ctx.wait(50);

    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("8");
  });

  test('should perform subtraction', async () => {
    const testApp = jyneTest.createApp((app) => {
      require('./calculator');
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    await ctx.getByExactText("9").click();
    await ctx.wait(50);
    await ctx.getByExactText("-").click();
    await ctx.wait(50);
    await ctx.getByExactText("4").click();
    await ctx.wait(50);
    await ctx.getByExactText("=").click();
    await ctx.wait(50);

    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("5");
  });

  test('should handle division by zero', async () => {
    const testApp = jyneTest.createApp((app) => {
      require('./calculator');
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    await ctx.getByExactText("5").click();
    await ctx.wait(50);
    await ctx.getByExactText("÷").click();
    await ctx.wait(50);
    await ctx.getByExactText("0").click();
    await ctx.wait(50);
    await ctx.getByExactText("=").click();
    await ctx.wait(50);

    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("Error");
  });

  test('should clear display', async () => {
    const testApp = jyneTest.createApp((app) => {
      require('./calculator');
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    await ctx.getByExactText("1").click();
    await ctx.wait(50);
    await ctx.getByExactText("2").click();
    await ctx.wait(50);
    await ctx.getByExactText("3").click();
    await ctx.wait(50);
    await ctx.getByExactText("Clr").click();
    await ctx.wait(50);

    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("0");
  });
});

// Simple test runner (since we can't mix with Jest)
async function runTests() {
  console.log('\n=== Simple Calculator Test Suite (JyneTest Only) ===\n');

  const tests = [
    { name: 'Initial display', fn: test1 },
    { name: 'Addition', fn: test2 },
    { name: 'Subtraction', fn: test3 },
    { name: 'Division by zero', fn: test4 },
    { name: 'Clear function', fn: test5 },
  ];

  let passed = 0;
  let failed = 0;

  const startTime = Date.now();

  for (const test of tests) {
    try {
      await test.fn();
      console.log(`✓ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${test.name}`);
      console.log(`  ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log(`Total time: ${elapsed}s (average ${(parseFloat(elapsed) / tests.length).toFixed(2)}s per test)`);
  console.log('\nNote: All tests use JyneTest (no Jest unit tests)');
  console.log('Each test spawns the bridge process (~500ms overhead)\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Individual test implementations
async function test1() {
  const jyneTest = new JyneTest({ headed: false });

  // Note: We can't easily import the app here, so we'd need a different approach
  // This is a limitation of the monolithic design!

  await jyneTest.cleanup();
}

// ... (similar implementations for other tests)

if (require.main === module) {
  console.log('Note: Full test suite not yet implemented for monolithic design');
  console.log('This demonstrates the difficulty of testing monolithic apps!');
}
