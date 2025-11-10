// Home Page - TypeScript content for Jyne Browser
// URL: http://localhost:3000/

const { vbox, label, button } = jyne;

vbox(() => {
  label('Welcome to Jyne Browser!');
  label('');
  label('This is a TypeScript page loaded from the server.');
  label('Current URL: ' + browserContext.currentUrl);
  label('');

  button('Go to About', () => {
    browserContext.changePage('/about');
  });

  button('Go to Contact', () => {
    browserContext.changePage('/contact');
  });

  button('Go to Form Demo', () => {
    browserContext.changePage('/form');
  });
});
