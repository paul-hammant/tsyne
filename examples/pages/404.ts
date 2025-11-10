// 404 Error Page - TypeScript content for Jyne Browser
// Served when a page is not found

const { vbox, label, button, separator } = jyne;

vbox(() => {
  label('404 - Page Not Found');
  separator();
  label('');
  label('The requested page could not be found.');
  label('');
  label('URL: ' + browserContext.currentUrl);
  label('');

  button('Go to Home', () => {
    browserContext.changePage('/');
  });

  button('Go Back', () => {
    browserContext.back();
  });
});
