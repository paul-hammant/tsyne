import { app } from '../../src';
import { JyneTest, TestContext } from '../../src/index-test';
import { Calculator } from './calculator';

/**
 * Comprehensive test suite for the Calculator application
 *
 * Demonstrates JyneTest features:
 * - Headless and headed testing modes
 * - Widget locators and selectors
 * - Assertions and expectations
 * - UI interaction simulation
 * - State verification
 */

describe('Calculator Tests', () => {
  let jyneTest: JyneTest;
  let ctx: TestContext;

  beforeEach(async () => {
    // Create test instance (headless by default)
    jyneTest = new JyneTest({ headed: false });
  });

  afterEach(async () => {
    await jyneTest.cleanup();
  });

  test('should display initial value of 0', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Find display label and verify it shows 0
    const display = ctx.getByExactText("0");
    await ctx.expect(display).toHaveText("0");
  });

  test('should handle single digit input', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Click button "5"
    await ctx.getByExactText("5").click();

    // Display should show "5"
    await ctx.wait(50); // Small wait for state update
    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("5");
  });

  test('should handle multiple digit input', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Click 1, 2, 3
    await ctx.getByExactText("1").click();
    await ctx.wait(50);
    await ctx.getByExactText("2").click();
    await ctx.wait(50);
    await ctx.getByExactText("3").click();
    await ctx.wait(50);

    // Display should show "123"
    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("123");
  });

  test('should perform addition', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Calculate: 5 + 3 = 8
    await ctx.getByExactText("5").click();
    await ctx.wait(50);
    await ctx.getByExactText("+").click();
    await ctx.wait(50);
    await ctx.getByExactText("3").click();
    await ctx.wait(50);
    await ctx.getByExactText("=").click();
    await ctx.wait(50);

    // Display should show "8"
    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("8");
  });

  test('should perform subtraction', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Calculate: 9 - 4 = 5
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

  test('should perform multiplication', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Calculate: 6 × 7 = 42
    await ctx.getByExactText("6").click();
    await ctx.wait(50);
    await ctx.getByExactText("×").click();
    await ctx.wait(50);
    await ctx.getByExactText("7").click();
    await ctx.wait(50);
    await ctx.getByExactText("=").click();
    await ctx.wait(50);

    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("42");
  });

  test('should perform division', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Calculate: 8 ÷ 2 = 4
    await ctx.getByExactText("8").click();
    await ctx.wait(50);
    await ctx.getByExactText("÷").click();
    await ctx.wait(50);
    await ctx.getByExactText("2").click();
    await ctx.wait(50);
    await ctx.getByExactText("=").click();
    await ctx.wait(50);

    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("4");
  });

  test('should handle division by zero', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Calculate: 5 ÷ 0 = Error
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

  test('should handle decimal numbers', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Enter: 3.14
    await ctx.getByExactText("3").click();
    await ctx.wait(50);
    await ctx.getByExactText(".").click();
    await ctx.wait(50);
    await ctx.getByExactText("1").click();
    await ctx.wait(50);
    await ctx.getByExactText("4").click();
    await ctx.wait(50);

    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("3.14");
  });

  test('should clear display', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Enter 123, then clear
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

  test('should handle chain operations', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Calculate: 2 + 3 + 4 = 9
    await ctx.getByExactText("2").click();
    await ctx.wait(50);
    await ctx.getByExactText("+").click();
    await ctx.wait(50);
    await ctx.getByExactText("3").click();
    await ctx.wait(50);
    await ctx.getByExactText("+").click();
    await ctx.wait(50);
    await ctx.getByExactText("4").click();
    await ctx.wait(50);
    await ctx.getByExactText("=").click();
    await ctx.wait(50);

    const display = ctx.getByType("label");
    await ctx.expect(display).toHaveText("9");
  });

  test('should have all buttons visible', async () => {
    const testApp = jyneTest.createApp((app) => {
      const calc = new Calculator(app);
      calc.build();
    });

    ctx = jyneTest.getContext();
    await testApp.run();

    // Verify all digit buttons exist
    for (let i = 0; i <= 9; i++) {
      const btn = ctx.getByExactText(i.toString());
      await ctx.expect(btn).toBeVisible();
    }

    // Verify operator buttons exist
    await ctx.expect(ctx.getByExactText("+")).toBeVisible();
    await ctx.expect(ctx.getByExactText("-")).toBeVisible();
    await ctx.expect(ctx.getByExactText("×")).toBeVisible();
    await ctx.expect(ctx.getByExactText("÷")).toBeVisible();
    await ctx.expect(ctx.getByExactText("=")).toBeVisible();
    await ctx.expect(ctx.getByExactText(".")).toBeVisible();
    await ctx.expect(ctx.getByExactText("Clr")).toBeVisible();
  });
});

// Simple test runner
async function runTests() {
  console.log('\n=== Calculator Test Suite ===\n');

  const tests = [
    { name: 'Initial display shows 0', fn: test1 },
    { name: 'Single digit input', fn: test2 },
    { name: 'Multiple digit input', fn: test3 },
    { name: 'Addition', fn: test4 },
    { name: 'Subtraction', fn: test5 },
    { name: 'Multiplication', fn: test6 },
    { name: 'Division', fn: test7 },
    { name: 'Division by zero', fn: test8 },
    { name: 'Decimal numbers', fn: test9 },
    { name: 'Clear function', fn: test10 },
    { name: 'Chain operations', fn: test11 },
  ];

  let passed = 0;
  let failed = 0;

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

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// Helper functions to run individual tests
function beforeEach() {
  return new JyneTest({ headed: false });
}

function afterEach(jyneTest: JyneTest) {
  return jyneTest.cleanup();
}

async function test1() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
  await testApp.run();

  const display = ctx.getByExactText("0");
  await ctx.expect(display).toHaveText("0");

  await afterEach(jyneTest);
}

async function test2() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
  await testApp.run();

  await ctx.getByExactText("5").click();
  await ctx.wait(50);
  const display = ctx.getByType("label");
  await ctx.expect(display).toHaveText("5");

  await afterEach(jyneTest);
}

async function test3() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
  await testApp.run();

  await ctx.getByExactText("1").click();
  await ctx.wait(50);
  await ctx.getByExactText("2").click();
  await ctx.wait(50);
  await ctx.getByExactText("3").click();
  await ctx.wait(50);

  const display = ctx.getByType("label");
  await ctx.expect(display).toHaveText("123");

  await afterEach(jyneTest);
}

async function test4() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
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

  await afterEach(jyneTest);
}

async function test5() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
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

  await afterEach(jyneTest);
}

async function test6() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
  await testApp.run();

  await ctx.getByExactText("6").click();
  await ctx.wait(50);
  await ctx.getByExactText("×").click();
  await ctx.wait(50);
  await ctx.getByExactText("7").click();
  await ctx.wait(50);
  await ctx.getByExactText("=").click();
  await ctx.wait(50);

  const display = ctx.getByType("label");
  await ctx.expect(display).toHaveText("42");

  await afterEach(jyneTest);
}

async function test7() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
  await testApp.run();

  await ctx.getByExactText("8").click();
  await ctx.wait(50);
  await ctx.getByExactText("÷").click();
  await ctx.wait(50);
  await ctx.getByExactText("2").click();
  await ctx.wait(50);
  await ctx.getByExactText("=").click();
  await ctx.wait(50);

  const display = ctx.getByType("label");
  await ctx.expect(display).toHaveText("4");

  await afterEach(jyneTest);
}

async function test8() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
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

  await afterEach(jyneTest);
}

async function test9() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
  await testApp.run();

  await ctx.getByExactText("3").click();
  await ctx.wait(50);
  await ctx.getByExactText(".").click();
  await ctx.wait(50);
  await ctx.getByExactText("1").click();
  await ctx.wait(50);
  await ctx.getByExactText("4").click();
  await ctx.wait(50);

  const display = ctx.getByType("label");
  await ctx.expect(display).toHaveText("3.14");

  await afterEach(jyneTest);
}

async function test10() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
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

  await afterEach(jyneTest);
}

async function test11() {
  const jyneTest = beforeEach();
  const testApp = jyneTest.createApp((app) => {
    const calc = new Calculator(app);
    calc.build();
  });
  const ctx = jyneTest.getContext();
  await testApp.run();

  await ctx.getByExactText("2").click();
  await ctx.wait(50);
  await ctx.getByExactText("+").click();
  await ctx.wait(50);
  await ctx.getByExactText("3").click();
  await ctx.wait(50);
  await ctx.getByExactText("+").click();
  await ctx.wait(50);
  await ctx.getByExactText("4").click();
  await ctx.wait(50);
  await ctx.getByExactText("=").click();
  await ctx.wait(50);

  const display = ctx.getByType("label");
  await ctx.expect(display).toHaveText("9");

  await afterEach(jyneTest);
}

// Run tests if this is the main module
if (require.main === module) {
  runTests().catch(console.error);
}
