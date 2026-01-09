# Disk Use - Disk Usage Analyzer

A disk usage analyzer for Tsyne featuring a hierarchical tree view and interactive treemap visualization, inspired by disk-inventory-x.

## Features

- **Hierarchical File Browser**: Expandable tree view showing directory structure with sizes
- **Treemap Visualization**: Color-coded rectangles proportional to disk usage
- **Interactive Selection**: Click directories in tree or treemap to navigate and select
- **Size Formatting**: Automatic formatting from bytes to KB, MB, GB, TB
- **Performance**: Lazy-loading of directory contents with efficient size calculations
- **Observable Pattern**: Reactive UI updates when selections change

## Architecture

### Components

**DiskUsageStore** (`disk-usage-store.ts`)
- Manages file system state and disk scanning
- Lazy-loads directory children on expansion
- Calculates total sizes including subdirectories
- Observable pattern with change listeners
- Methods:
  - `initializeFromPath(dirPath)`: Start scanning from a directory
  - `selectNode(node)`: Change selection
  - `toggleNodeExpansion(node)`: Expand/collapse directories
  - `getFormattedSize(bytes)`: Convert bytes to human-readable format
  - `getSortedChildren(node)`: Get children sorted by size (descending)

**DiskUseApp** (`disk-use.ts`)
- Main UI builder following Tsyne patterns
- Left sidebar: scrollable tree view with expandable directories
- Right panel:
  - Info section: path, size, item count
  - Treemap visualization using tappableCanvasRaster
- Treemap algorithm: Recursive partitioning by aspect ratio
- Color mapping: Hue gradient (red for largest, green for smallest)

### Data Structures

```typescript
interface DiskNode {
  name: string;              // Directory/file name
  path: string;              // Absolute file path
  size: number;              // Total size in bytes
  isDirectory: boolean;      // Is this a directory?
  children: DiskNode[];      // Lazy-loaded children
  parent: DiskNode | null;   // Parent node reference
  isExpanded: boolean;       // UI expansion state
  loadedChildren: boolean;   // Have children been loaded?
}
```

## Usage

### Standalone Execution

```bash
npx tsx disk-use.ts
```

Or with Tsyne:

```bash
tsyne disk-use.ts
```

### Testing

```bash
npm test
```

Runs 19 unit tests covering:
- Store initialization and navigation
- Node expansion and contraction
- Size calculations and formatting
- File system edge cases (empty dirs, many files)
- Observable change notifications

### TsyneTest Integration Tests

Located in `core/src/__tests__/larger-apps/disk-usage/index.test.ts`:

```bash
cd /home/user/tsyne
pnpm test core/src/__tests__/larger-apps/disk-usage/index.test.ts
```

Tests UI interactions:
- App title rendering
- Path and size display
- Size formatting verification
- Label creation and display

## Implementation Details

### Treemap Algorithm

The treemap uses recursive rectangular partitioning:

1. Calculate total size of all children
2. Allocate space proportionally to each child
3. Alternate between horizontal and vertical cuts
4. Recursively partition each child's space
5. Limit depth to prevent fragmentation

### Color Mapping

Uses HSL color space:
- **Hue**: Maps file/folder size to spectrum (240° = green, 0° = red)
- **Saturation**: Fixed at 70%
- **Lightness**: Fixed at 50%

Largest items appear red, smallest items appear green.

### Interactive Features

- **Tree View**:
  - Click expand arrows to load subdirectories
  - Click item names to select and view in treemap
  - Shows formatted size for each directory

- **Treemap**:
  - Click rectangles to select
  - Larger rectangles indicate more disk usage
  - Labels show file/folder names (truncated if needed)

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ Disk Use                                             [✕] │
├──────────────────────────┬──────────────────────────────┤
│ Disk Usage               │ Path: /home/user             │
│ ┌────────────────────────┤ Size: 237.45 GB             │
│ │ ▼ Downloads (125 GB)   │ Items: 42                    │
│ │  ▶ Documents (45 GB)   │                              │
│ │  ▶ Pictures (67 GB)    │  ┌──────────────────────────┐│
│ │  ▶ .cache (150 GB)     │  │    [Large Area]          ││
│ │  ▶ .local (45 GB)      │  │                          ││
│ │  ▶ Code (34 GB)        │  │  [Smaller] [Medium]      ││
│ │  ▶ Music (12 GB)       │  │     [Small]              ││
│ │                        │  │                          ││
│ └────────────────────────┤  └──────────────────────────┘│
└──────────────────────────┴──────────────────────────────┘
```

## File System Operations

- Uses Node.js `fs` module for directory traversal
- Handles permission errors gracefully
- Symlinks are followed (future: add cycle detection)
- Special files are skipped in size calculations
- Hidden files/directories are included

## Performance Characteristics

- **Initial Load**: O(n) where n = files in root directory
- **Expansion**: O(m) where m = files in expanded directory
- **Size Update**: O(1) (precomputed)
- **Treemap Render**: O(k log k) where k = visible nodes

## Future Enhancements

- [ ] Show/hide hidden files
- [ ] Filter by file type
- [ ] Real-time size updates
- [ ] Export disk report
- [ ] Bookmark favorite directories
- [ ] Search functionality
- [ ] Cycle detection for symlinks
- [ ] Permission/access indicators
- [ ] Animated treemap transitions
- [ ] Context menu for disk operations

## Testing Coverage

- ✅ 19 unit tests (100% store coverage)
- ✅ 5 TsyneTest UI tests
- ✅ Edge cases: empty directories, 50+ files
- ✅ Observable pattern verification
- ✅ Path expansion and traversal

## Dependencies

- **Runtime**: Node.js `fs`, `path`, `os` modules
- **Dev**: TypeScript, Jest, ts-jest
- **Framework**: Tsyne (App, Widget system)

## License

MIT

## Similar Applications

- **disk-inventory-x** - Original inspiration
- **WizTree** - Windows disk usage analyzer
- **Baobab** - GNOME disk usage analyzer
- **ncdu** - Console disk usage analyzer
