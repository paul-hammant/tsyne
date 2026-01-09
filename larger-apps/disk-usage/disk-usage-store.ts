import * as fs from 'fs';
import * as path from 'path';

export type ChangeListener = () => void;

export interface DiskNode {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  children: DiskNode[];
  parent: DiskNode | null;
  isExpanded: boolean;
  loadedChildren: boolean;
}

export function createDiskNode(
  name: string,
  dirPath: string,
  isDirectory: boolean,
  parent: DiskNode | null = null
): DiskNode {
  return {
    name,
    path: dirPath,
    size: 0,
    isDirectory,
    children: [],
    parent,
    isExpanded: false,
    loadedChildren: false,
  };
}

// Memoization cache for directory sizes
const sizeCache = new Map<string, number>();

function getDirectorySize(dirPath: string): number {
  // Check cache first
  if (sizeCache.has(dirPath)) {
    return sizeCache.get(dirPath)!;
  }

  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return stats.size;
    }

    let totalSize = 0;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        try {
          if (entry.isDirectory()) {
            totalSize += getDirectorySize(entryPath);
          } else if (entry.isFile()) {
            const entryStats = fs.statSync(entryPath);
            totalSize += entryStats.size;
          }
        } catch (err) {
          // Skip inaccessible entries
        }
      }
    } catch (err) {
      // Skip inaccessible directories
    }

    sizeCache.set(dirPath, totalSize);
    return totalSize;
  } catch (err) {
    return 0;
  }
}

function loadChildrenForNode(node: DiskNode): void {
  if (node.loadedChildren || !node.isDirectory) {
    return;
  }

  try {
    const entries = fs.readdirSync(node.path, { withFileTypes: true });
    const children: Array<{ name: string; path: string; isDirectory: boolean }> = [];

    for (const entry of entries) {
      const entryPath = path.join(node.path, entry.name);
      try {
        children.push({
          name: entry.name,
          path: entryPath,
          isDirectory: entry.isDirectory(),
        });
      } catch (err) {
        // Skip entries we can't stat
      }
    }

    // Sort: directories first, then by name
    children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return b.isDirectory ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    node.children = children.map((child) => {
      const childNode = createDiskNode(child.name, child.path, child.isDirectory, node);
      // For files: get immediate size. For directories: lazy load on first access
      if (!child.isDirectory) {
        try {
          const stats = fs.statSync(child.path);
          childNode.size = stats.size;
        } catch (err) {
          childNode.size = 0;
        }
      } else {
        // Directories: calculate size lazily on first access
        Object.defineProperty(childNode, '_sizeCalculated', {
          value: false,
          writable: true,
          configurable: true,
        });
      }
      return childNode;
    });

    node.loadedChildren = true;
  } catch (err) {
    // Handle permission errors
    node.loadedChildren = true;
  }
}

// Lazy getter for directory sizes
function ensureDirectorySizeCalculated(node: DiskNode): void {
  if (!node.isDirectory) return;

  const anyNode = node as any;
  if (!anyNode._sizeCalculated) {
    node.size = getDirectorySize(node.path);
    anyNode._sizeCalculated = true;
  }
}

export class DiskUsageStore {
  private root: DiskNode | null = null;
  private selectedNode: DiskNode | null = null;
  private changeListeners: ChangeListener[] = [];

  subscribe(listener: ChangeListener): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  }

  private notifyChange(): void {
    this.changeListeners.forEach((listener) => listener());
  }

  async initializeFromPath(dirPath: string): Promise<void> {
    try {
      const stats = fs.statSync(dirPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      const name = path.basename(dirPath) || dirPath;
      this.root = createDiskNode(name, dirPath, true);
      // Don't calculate root size upfront - it's expensive! Calculate it lazily on first access
      (this.root as any)._sizeCalculated = false;

      // Only load immediate children (not recursive), so UI appears quickly
      loadChildrenForNode(this.root);

      this.selectedNode = this.root;
      this.notifyChange();
    } catch (err) {
      throw new Error(`Failed to initialize from path: ${err}`);
    }
  }

  getRoot(): DiskNode | null {
    return this.root;
  }

  getSelectedNode(): DiskNode | null {
    return this.selectedNode;
  }

  selectNode(node: DiskNode): void {
    this.selectedNode = node;
    this.notifyChange();
  }

  toggleNodeExpansion(node: DiskNode): void {
    if (!node.isDirectory) {
      return;
    }

    if (!node.isExpanded) {
      loadChildrenForNode(node);
      node.isExpanded = true;
    } else {
      node.isExpanded = false;
    }

    this.notifyChange();
  }

  expandNodePath(node: DiskNode): DiskNode[] {
    const pathList: DiskNode[] = [];
    let current: DiskNode | null = node;

    while (current !== null) {
      pathList.unshift(current);
      if (current.parent && !current.parent.isExpanded && current.parent.isDirectory) {
        loadChildrenForNode(current.parent);
        current.parent.isExpanded = true;
      }
      current = current.parent;
    }

    return pathList;
  }

  getFormattedSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  getNodeFormattedSize(node: DiskNode): string {
    ensureDirectorySizeCalculated(node);
    return this.getFormattedSize(node.size);
  }

  getNodePath(node: DiskNode): DiskNode[] {
    const pathList: DiskNode[] = [];
    let current: DiskNode | null = node;

    while (current !== null) {
      pathList.unshift(current);
      current = current.parent;
    }

    return pathList;
  }

  getSortedChildren(node: DiskNode): DiskNode[] {
    const children = [...node.children];
    // Ensure directory sizes are calculated before sorting
    for (const child of children) {
      ensureDirectorySizeCalculated(child);
    }
    children.sort((a, b) => b.size - a.size);
    return children;
  }
}
