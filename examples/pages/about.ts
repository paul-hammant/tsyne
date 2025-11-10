// About Page - TypeScript content for Jyne Browser
// URL: http://localhost:3000/about

const { vbox, label, button, separator } = jyne;

vbox(() => {
  label('About Jyne Browser');
  separator();
  label('');
  label('Jyne Browser is a Swiby-inspired browser that loads');
  label('TypeScript pages from web servers dynamically.');
  label('');
  label('Features:');
  label('• Pages are TypeScript code (not HTML)');
  label('• Server-side rendering from any language');
  label('• Native desktop widgets via Fyne');
  label('• Browser chrome with address bar and navigation');
  label('');

  button('Back to Home', () => {
    browserContext.changePage('/');
  });

  button('Browser Back', () => {
    browserContext.back();
  });
});
