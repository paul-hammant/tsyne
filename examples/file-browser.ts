// File Browser Demo - Demonstrates the FileIcon widget
// Shows file type icons for various file types

import { app } from '../src';
import * as fs from 'fs';
import * as path from 'path';

// Sample file types to demonstrate
const sampleFiles = [
  { name: 'document.txt', type: 'Text File' },
  { name: 'script.js', type: 'JavaScript' },
  { name: 'styles.css', type: 'Stylesheet' },
  { name: 'page.html', type: 'HTML' },
  { name: 'data.json', type: 'JSON' },
  { name: 'image.png', type: 'Image' },
  { name: 'photo.jpg', type: 'Image' },
  { name: 'archive.zip', type: 'Archive' },
  { name: 'config.yaml', type: 'YAML' },
  { name: 'readme.md', type: 'Markdown' },
  { name: 'app.ts', type: 'TypeScript' },
  { name: 'main.go', type: 'Go' },
];

// Create temp files for demo (they need to exist for FileIcon to work properly)
const tempDir = '/tmp/tsyne-file-browser-demo';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create sample files
sampleFiles.forEach(file => {
  const filePath = path.join(tempDir, file.name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `Sample ${file.type} content`);
  }
});

app({ title: 'File Browser' }, (a) => {
  a.window({ title: 'File Browser - FileIcon Demo', width: 600, height: 500 }, (win) => {
    let currentDir = tempDir;
    let selectedFile = '';
    let statusLabel: any;

    win.setContent(() => {
      a.border({
        top: () => {
          a.vbox(() => {
            a.label('File Browser Demo', undefined, 'center', undefined, { bold: true });
            a.label(`Showing files in: ${currentDir}`, undefined, 'leading', 'word');
            a.separator();
          });
        },
        center: () => {
          a.scroll(() => {
            a.vbox(() => {
              // Display file icons in a grid-like layout
              sampleFiles.forEach(file => {
                const filePath = path.join(tempDir, file.name);
                a.hbox(() => {
                  // FileIcon widget - shows icon based on file extension
                  a.fileicon(filePath);

                  // File name button (clickable)
                  a.button(file.name, () => {
                    selectedFile = file.name;
                    if (statusLabel) {
                      statusLabel.setText(`Selected: ${file.name} (${file.type})`);
                    }
                  });

                  // File type label
                  a.label(`  [${file.type}]`);
                });
              });
            });
          });
        },
        bottom: () => {
          a.vbox(() => {
            a.separator();
            statusLabel = a.label('Click a file to select it');
          });
        }
      });
    });

    win.show();
  });
});
