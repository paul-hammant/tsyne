// Icon Gallery - displays all available theme icons
// Demonstrates the widget.Icon functionality

import { app, ThemeIconName } from '../src';

// All available theme icon names organized by category
const iconCategories: { category: string; icons: ThemeIconName[] }[] = [
  {
    category: 'Navigation & UI',
    icons: ['NavigateBack', 'NavigateNext', 'Menu', 'MenuExpand', 'MenuDropDown', 'MenuDropUp', 'MoveUp', 'MoveDown']
  },
  {
    category: 'File & Folder',
    icons: ['File', 'FileApplication', 'FileAudio', 'FileImage', 'FileText', 'FileVideo', 'Folder', 'FolderNew', 'FolderOpen']
  },
  {
    category: 'Document',
    icons: ['Document', 'DocumentCreate', 'DocumentPrint', 'DocumentSave']
  },
  {
    category: 'Media',
    icons: ['MediaPlay', 'MediaPause', 'MediaStop', 'MediaRecord', 'MediaReplay', 'MediaMusic', 'MediaPhoto', 'MediaVideo', 'MediaFastForward', 'MediaFastRewind', 'MediaSkipNext', 'MediaSkipPrevious']
  },
  {
    category: 'Content Actions',
    icons: ['ContentAdd', 'ContentRemove', 'ContentCopy', 'ContentCut', 'ContentPaste', 'ContentClear', 'ContentUndo', 'ContentRedo']
  },
  {
    category: 'Dialog & Status',
    icons: ['Confirm', 'Cancel', 'Delete', 'Error', 'Warning', 'Info', 'Question']
  },
  {
    category: 'Form Elements',
    icons: ['CheckButton', 'CheckButtonChecked', 'RadioButton', 'RadioButtonChecked']
  },
  {
    category: 'General',
    icons: ['Home', 'Settings', 'Help', 'Search', 'SearchReplace', 'Visibility', 'VisibilityOff', 'Account', 'Login', 'Logout', 'Upload', 'Download', 'History', 'Computer', 'Storage', 'Grid', 'List']
  },
  {
    category: 'Mail',
    icons: ['MailAttachment', 'MailCompose', 'MailForward', 'MailReply', 'MailReplyAll', 'MailSend']
  },
  {
    category: 'View & Zoom',
    icons: ['ZoomFit', 'ZoomIn', 'ZoomOut', 'ViewFullScreen', 'ViewRefresh', 'ViewRestore']
  },
  {
    category: 'Colors',
    icons: ['ColorAchromatic', 'ColorChromatic', 'ColorPalette']
  },
  {
    category: 'Other',
    icons: ['MoreHorizontal', 'MoreVertical', 'VolumeMute', 'VolumeDown', 'VolumeUp', 'BrokenImage']
  }
];

app({ title: 'Icon Gallery' }, (a) => {
  a.window({ title: 'Tsyne Icon Gallery - All Theme Icons', width: 900, height: 700 }, (win) => {
    win.setContent(() => {
      a.scroll(() => {
        a.vbox(() => {
          a.label('Fyne Theme Icon Gallery', undefined, 'center', undefined, { bold: true });
          a.label('All available icons that can be used with a.icon()', undefined, 'center');
          a.separator();

          // Render each category
          for (const { category, icons } of iconCategories) {
            a.label(category, undefined, 'leading', undefined, { bold: true });

            // Create a grid with 8 columns for icons
            a.gridwrap(100, 80, () => {
              for (const iconName of icons) {
                a.vbox(() => {
                  a.center(() => {
                    a.icon(iconName);
                  });
                  a.label(iconName, undefined, 'center', undefined, { monospace: true });
                });
              }
            });

            a.separator();
          }

          // Usage example section
          a.label('Usage Example:', undefined, 'leading', undefined, { bold: true });
          a.label("a.icon('Home');", undefined, 'leading', undefined, { monospace: true });
          a.label("a.icon('Settings');", undefined, 'leading', undefined, { monospace: true });
          a.label("a.icon('MediaPlay');", undefined, 'leading', undefined, { monospace: true });
        });
      });
    });
    win.show();
  });
});
