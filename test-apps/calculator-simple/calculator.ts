import { app, window, vbox, hbox, button, label } from '../../src';

/**
 * Simple Calculator - Monolithic Implementation
 *
 * PROS:
 * - Simple and straightforward
 * - All code in one place
 * - Easy to understand for beginners
 * - Quick to prototype
 * - No abstraction overhead
 *
 * CONS:
 * - Business logic mixed with UI
 * - Cannot unit test logic separately
 * - Slower tests (must use JyneTest for everything)
 * - Harder to maintain as it grows
 * - Cannot reuse logic in different UIs
 *
 * WHEN TO USE:
 * - Small applications
 * - Prototypes and demos
 * - Simple UI tools
 * - Learning/educational examples
 */

let display: any;
let currentValue = "0";
let operator: string | null = null;
let previousValue = "0";
let shouldResetDisplay = false;

function updateDisplay(value: string) {
  currentValue = value;
  if (display) {
    display.setText(value);
  }
}

function handleNumber(num: string) {
  if (shouldResetDisplay) {
    updateDisplay(num);
    shouldResetDisplay = false;
  } else {
    const newValue = currentValue === "0" ? num : currentValue + num;
    updateDisplay(newValue);
  }
}

function handleDecimal() {
  if (shouldResetDisplay) {
    updateDisplay("0.");
    shouldResetDisplay = false;
  } else if (!currentValue.includes(".")) {
    updateDisplay(currentValue + ".");
  }
}

function handleOperator(op: string) {
  if (operator && !shouldResetDisplay) {
    calculate();
  }
  previousValue = currentValue;
  operator = op;
  shouldResetDisplay = true;
}

function calculate() {
  if (!operator) {
    return;
  }

  const prev = parseFloat(previousValue);
  const current = parseFloat(currentValue);
  let result = 0;

  switch (operator) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
    case '×':
      result = prev * current;
      break;
    case '÷':
      if (current === 0) {
        updateDisplay("Error");
        operator = null;
        shouldResetDisplay = true;
        return;
      }
      result = prev / current;
      break;
    default:
      return;
  }

  const resultStr = Number.isInteger(result)
    ? result.toString()
    : result.toFixed(8).replace(/\.?0+$/, '');

  updateDisplay(resultStr);
  operator = null;
  shouldResetDisplay = true;
}

function clear() {
  currentValue = "0";
  previousValue = "0";
  operator = null;
  shouldResetDisplay = false;
  updateDisplay("0");
}

// Build and run the calculator
app({ title: "Simple Calculator" }, () => {
  window({ title: "Calculator - Monolithic" }, () => {
    vbox(() => {
      display = label("0");

      hbox(() => {
        button("7", () => handleNumber("7"));
        button("8", () => handleNumber("8"));
        button("9", () => handleNumber("9"));
        button("÷", () => handleOperator("÷"));
      });

      hbox(() => {
        button("4", () => handleNumber("4"));
        button("5", () => handleNumber("5"));
        button("6", () => handleNumber("6"));
        button("×", () => handleOperator("×"));
      });

      hbox(() => {
        button("1", () => handleNumber("1"));
        button("2", () => handleNumber("2"));
        button("3", () => handleNumber("3"));
        button("-", () => handleOperator("-"));
      });

      hbox(() => {
        button("0", () => handleNumber("0"));
        button(".", () => handleDecimal());
        button("Clr", () => clear());
        button("+", () => handleOperator("+"));
      });

      hbox(() => {
        button("=", () => calculate());
      });
    });
  });
});
