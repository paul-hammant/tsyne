import { app, window, vbox, button, label } from '../src';

// Simple Hello World example demonstrating Jyne's elegant declarative syntax
app({ title: "Hello Jyne" }, () => {
  window({ title: "Hello World" }, () => {
    vbox(() => {
      label("Welcome to Jyne!");
      label("A TypeScript wrapper for Fyne");

      button("Click Me", () => {
        console.log("Button clicked!");
      });

      button("Exit", () => {
        process.exit(0);
      });
    });
  });
});
