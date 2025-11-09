import { app, window, vbox, hbox, button, label, App } from '../../src';
import { CalculatorLogic } from './calculator-logic';

/**
 * Calculator UI - Presentation layer
 *
 * This is the "View" that connects to the "Model" (CalculatorLogic).
 * UI-specific behavior is here, business logic is in CalculatorLogic.
 *
 * This separation allows:
 * - Pure Jest tests for CalculatorLogic (fast, no UI)
 * - JyneTest for UI integration (complete end-to-end)
 */

export class CalculatorUI {
  private logic: CalculatorLogic;
  private display: any;

  constructor(private jyneApp: App) {
    this.logic = new CalculatorLogic();
  }

  /**
   * Build the calculator UI
   */
  build(): void {
    window({ title: "Calculator" }, () => {
      vbox(() => {
        // Display
        this.display = label(this.logic.getDisplay());

        // Number pad and operators
        hbox(() => {
          button("7", () => this.handleNumberClick("7"));
          button("8", () => this.handleNumberClick("8"));
          button("9", () => this.handleNumberClick("9"));
          button("÷", () => this.handleOperatorClick("÷"));
        });

        hbox(() => {
          button("4", () => this.handleNumberClick("4"));
          button("5", () => this.handleNumberClick("5"));
          button("6", () => this.handleNumberClick("6"));
          button("×", () => this.handleOperatorClick("×"));
        });

        hbox(() => {
          button("1", () => this.handleNumberClick("1"));
          button("2", () => this.handleNumberClick("2"));
          button("3", () => this.handleNumberClick("3"));
          button("-", () => this.handleOperatorClick("-"));
        });

        hbox(() => {
          button("0", () => this.handleNumberClick("0"));
          button(".", () => this.handleDecimalClick());
          button("Clr", () => this.handleClearClick());
          button("+", () => this.handleOperatorClick("+"));
        });

        hbox(() => {
          button("=", () => this.handleEqualsClick());
        });
      });
    });
  }

  /**
   * Run the calculator application
   */
  async run(): Promise<void> {
    await this.jyneApp.run();
  }

  // UI Event Handlers - delegate to logic and update display

  private handleNumberClick(num: string) {
    const display = this.logic.inputNumber(num);
    this.updateDisplay(display);
  }

  private handleDecimalClick() {
    const display = this.logic.inputDecimal();
    this.updateDisplay(display);
  }

  private handleOperatorClick(op: string) {
    const display = this.logic.inputOperator(op);
    this.updateDisplay(display);
  }

  private handleEqualsClick() {
    const display = this.logic.calculate();
    this.updateDisplay(display);
  }

  private handleClearClick() {
    const display = this.logic.clear();
    this.updateDisplay(display);
  }

  private updateDisplay(value: string) {
    if (this.display) {
      this.display.setText(value);
    }
  }

  // Expose logic for testing if needed
  getLogic(): CalculatorLogic {
    return this.logic;
  }
}

// Main entry point for running the calculator
if (require.main === module) {
  const calculatorApp = app({ title: "Jyne Calculator" }, () => {
    const calc = new CalculatorUI(calculatorApp as any);
    calc.build();
  });
}
