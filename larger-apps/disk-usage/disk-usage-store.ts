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

function getDirectorySize(dirPath: string): number {
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
      childNode.size = child.isDirectory ? getDirectorySize(child.path) : 0;
      return childNode;
    });

    node.loadedChildren = true;
  } catch (err) {
    // Handle permission errors
    node.loadedChildren = true;
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
      this.root.size = getDirectorySize(dirPath);
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
    children.sort((a, b) => b.size - a.size);
    return children;
  }
}
