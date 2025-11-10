/**
 * Sample Jyne Page Server
 *
 * A simple HTTP server that serves Jyne pages as TypeScript code.
 * This demonstrates how any web framework (Express, Spring, Sinatra, Flask, etc.)
 * can serve Jyne pages dynamically.
 *
 * Run: node examples/server.js
 */

const http = require('http');

const PORT = 3000;

// Sample Jyne pages as TypeScript code
const pages = {
  '/': `
    // Home page
    const { vbox, hbox, label, button, separator } = jyne;

    jyne.window({ title: 'Home' }, (win) => {
      win.setContent(() => {
        vbox(() => {
          label('Welcome to Jyne Browser!');
          label('');
          label('This page was loaded from: ' + browserContext.currentUrl);
          label('');

          separator();
          label('');

          label('Navigation:');
          hbox(() => {
            button('Go to About', () => {
              browserContext.changePage('http://localhost:3000/about');
            });

            button('Go to Contact', () => {
              browserContext.changePage('http://localhost:3000/contact');
            });

            button('Go to Form', () => {
              browserContext.changePage('http://localhost:3000/form');
            });
          });

          label('');
          separator();
          label('');

          label('Features:');
          label('  • Pages loaded dynamically from server');
          label('  • Back/Forward navigation');
          label('  • Standard HTTP (GET, redirects, errors)');
          label('  • Server can be any language/framework');
          label('  • Fully declarative Jyne TypeScript');
        });
      });

      win.show();
    });
  `,

  '/about': `
    // About page
    const { vbox, hbox, label, button, separator, card } = jyne;

    jyne.window({ title: 'About' }, (win) => {
      win.setContent(() => {
        vbox(() => {
          label('About Jyne Browser');
          label('');

          card('Jyne Browser', 'Swiby-inspired browser for desktop apps', () => {
            vbox(() => {
              label('The Jyne Browser loads pages from web servers,');
              label('similar to how web browsers load HTML.');
              label('');
              label('Pages are written in TypeScript using the Jyne API.');
              label('Servers can be implemented in any language:');
              label('  • Node.js / Express');
              label('  • Java / Spring');
              label('  • Ruby / Sinatra');
              label('  • Python / Flask');
              label('  • Go / Gin');
            });
          });

          label('');

          hbox(() => {
            button('Back', () => {
              browserContext.back();
            });

            button('Home', () => {
              browserContext.changePage('http://localhost:3000/');
            });
          });
        });
      });

      win.show();
    });
  `,

  '/contact': `
    // Contact page
    const { vbox, hbox, label, button, separator, entry, form } = jyne;

    jyne.window({ title: 'Contact' }, (win) => {
      let nameField;
      let emailField;
      let messageField;

      win.setContent(() => {
        vbox(() => {
          label('Contact Us');
          label('');

          nameField = entry('Your name');
          emailField = entry('Your email');
          messageField = entry('Your message');

          label('');

          form(
            [
              { label: 'Name', widget: nameField },
              { label: 'Email', widget: emailField },
              { label: 'Message', widget: messageField }
            ],
            async () => {
              // Submit handler
              const name = await nameField.getText();
              const email = await emailField.getText();
              const message = await messageField.getText();

              console.log('Form submitted:', { name, email, message });

              // In real app, would POST to server
              // For demo, navigate to thank you page
              browserContext.changePage('http://localhost:3000/thanks');
            },
            () => {
              // Cancel handler
              browserContext.back();
            }
          );

          label('');
          separator();
          label('');

          button('Back to Home', () => {
            browserContext.changePage('http://localhost:3000/');
          });
        });
      });

      win.show();
    });
  `,

  '/thanks': `
    // Thank you page
    const { vbox, label, button, center } = jyne;

    jyne.window({ title: 'Thank You' }, (win) => {
      win.setContent(() => {
        center(() => {
          vbox(() => {
            label('Thank You!');
            label('');
            label('Your message has been received.');
            label('We will get back to you soon.');
            label('');
            label('');

            button('Back to Home', () => {
              browserContext.changePage('http://localhost:3000/');
            });
          });
        });
      });

      win.show();
    });
  `,

  '/form': `
    // Form demo page
    const { vbox, hbox, label, button, entry, checkbox, select, slider } = jyne;

    jyne.window({ title: 'Form Demo' }, (win) => {
      let usernameEntry;
      let passwordEntry;
      let rememberCheckbox;
      let roleSelect;

      win.setContent(() => {
        vbox(() => {
          label('Login Form Demo');
          label('');

          label('Username:');
          usernameEntry = entry('Enter username');
          label('');

          label('Password:');
          passwordEntry = entry('Enter password');
          label('');

          rememberCheckbox = checkbox('Remember me', (checked) => {
            console.log('Remember me:', checked);
          });

          label('');
          label('Role:');
          roleSelect = select(['User', 'Admin', 'Guest'], (selected) => {
            console.log('Role selected:', selected);
          });

          label('');
          label('');

          hbox(() => {
            button('Login', async () => {
              const username = await usernameEntry.getText();
              const password = await passwordEntry.getText();
              console.log('Login:', username, password);
              browserContext.changePage('http://localhost:3000/thanks');
            });

            button('Cancel', () => {
              browserContext.back();
            });
          });

          label('');
          label('');

          button('Back to Home', () => {
            browserContext.changePage('http://localhost:3000/');
          });
        });
      });

      win.show();
    });
  `
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(\`Request: \${req.method} \${req.url}\`);

  // Only handle GET requests
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // Get the page code
  const pageCode = pages[req.url];

  if (pageCode) {
    // Return the Jyne page as TypeScript
    res.writeHead(200, { 'Content-Type': 'text/typescript' });
    res.end(pageCode);
  } else {
    // 404 - page not found
    res.writeHead(404, { 'Content-Type': 'text/typescript' });
    res.end(\`
      const { vbox, label, button } = jyne;

      jyne.window({ title: '404 Not Found' }, (win) => {
        win.setContent(() => {
          vbox(() => {
            label('404 - Page Not Found');
            label('');
            label('The requested page does not exist: ' + browserContext.currentUrl);
            label('');

            button('Go Home', () => {
              browserContext.changePage('http://localhost:3000/');
            });
          });
        });

        win.show();
      });
    \`);
  }
});

server.listen(PORT, () => {
  console.log(\`Jyne Page Server running at http://localhost:\${PORT}/\`);
  console.log('Available pages:');
  console.log('  http://localhost:3000/');
  console.log('  http://localhost:3000/about');
  console.log('  http://localhost:3000/contact');
  console.log('  http://localhost:3000/form');
  console.log('  http://localhost:3000/thanks');
  console.log('');
  console.log('Start the browser with: node examples/browser.js');
});
