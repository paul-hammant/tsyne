import { DiskUsageStore, createDiskNode, DiskNode } from './disk-usage-store';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('DiskUsageStore', () => {
  let store: DiskUsageStore;
  let tempDir: string;

  beforeEach(() => {
    store = new DiskUsageStore();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'disk-usage-test-'));
  });

  afterEach(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('createDiskNode', () => {
    it('should create a file node with correct properties', () => {
      const node = createDiskNode('test.txt', '/path/to/test.txt', false);
      expect(node.name).toBe('test.txt');
      expect(node.path).toBe('/path/to/test.txt');
      expect(node.isDirectory).toBe(false);
      expect(node.size).toBe(0);
      expect(node.children).toEqual([]);
      expect(node.parent).toBeNull();
      expect(node.isExpanded).toBe(false);
      expect(node.loadedChildren).toBe(false);
    });

    it('should create a directory node with correct properties', () => {
      const node = createDiskNode('folder', '/path/to/folder', true);
      expect(node.name).toBe('folder');
      expect(node.isDirectory).toBe(true);
      expect(node.children).toEqual([]);
      expect(node.parent).toBeNull();
    });

    it('should link parent node when provided', () => {
      const parent = createDiskNode('parent', '/parent', true);
      const child = createDiskNode('child', '/parent/child', false, parent);
      expect(child.parent).toBe(parent);
    });
  });

  describe('initializeFromPath', () => {
    it('should initialize from a valid directory', async () => {
      // Create test files
      fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'content');
      fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'more content');

      await store.initializeFromPath(tempDir);
      const root = store.getRoot();

      expect(root).not.toBeNull();
      expect(root?.isDirectory).toBe(true);
      expect(root?.size).toBeGreaterThan(0);
      expect(store.getSelectedNode()).toBe(root);
    });

    it('should throw error for non-directory path', async () => {
      const filePath = path.join(tempDir, 'file.txt');
      fs.writeFileSync(filePath, 'content');

      await expect(store.initializeFromPath(filePath)).rejects.toThrow(
        'Path is not a directory'
      );
    });

    it('should throw error for non-existent path', async () => {
      await expect(
        store.initializeFromPath('/non/existent/path/12345')
      ).rejects.toThrow();
    });
  });

  describe('selectNode', () => {
    it('should update selected node and trigger listeners', async () => {
      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      const listener = jest.fn();
      store.subscribe(listener);

      store.selectNode(root);
      expect(store.getSelectedNode()).toBe(root);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('toggleNodeExpansion', () => {
    it('should expand a directory node', async () => {
      // Create nested structure
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir);
      fs.writeFileSync(path.join(subDir, 'nested.txt'), 'nested content');

      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      // Root is initialized with children loaded
      expect(root.isExpanded).toBe(false);
      expect(root.loadedChildren).toBe(true);
      expect(root.children.length).toBeGreaterThan(0);

      store.toggleNodeExpansion(root);

      expect(root.isExpanded).toBe(true);
      expect(root.loadedChildren).toBe(true);
    });

    it('should collapse an expanded node', async () => {
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir);

      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      store.toggleNodeExpansion(root);
      expect(root.isExpanded).toBe(true);

      store.toggleNodeExpansion(root);
      expect(root.isExpanded).toBe(false);
    });

    it('should not expand file nodes', async () => {
      fs.writeFileSync(path.join(tempDir, 'file.txt'), 'content');
      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      store.toggleNodeExpansion(root);
      const children = root.children;
      const fileNode = children.find((child) => !child.isDirectory);

      if (fileNode) {
        store.toggleNodeExpansion(fileNode);
        expect(fileNode.isExpanded).toBe(false);
      }
    });
  });

  describe('expandNodePath', () => {
    it('should expand all ancestor nodes up to root', async () => {
      // Create nested structure: /tempDir/a/b/c
      const dirA = path.join(tempDir, 'a');
      const dirB = path.join(dirA, 'b');
      const dirC = path.join(dirB, 'c');

      fs.mkdirSync(dirA);
      fs.mkdirSync(dirB);
      fs.mkdirSync(dirC);

      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      // Manually build the tree structure for testing
      store.toggleNodeExpansion(root);
      const nodeA = root.children.find((n) => n.name === 'a');
      if (nodeA) {
        store.toggleNodeExpansion(nodeA);
        const nodeB = nodeA.children.find((n) => n.name === 'b');
        if (nodeB) {
          store.toggleNodeExpansion(nodeB);
          const nodeC = nodeB.children.find((n) => n.name === 'c');
          if (nodeC) {
            store.expandNodePath(nodeC);
            const pathList = store.getNodePath(nodeC);
            expect(pathList).toContain(root);
            expect(pathList).toContain(nodeA);
            expect(pathList).toContain(nodeB);
            expect(pathList).toContain(nodeC);
          }
        }
      }
    });
  });

  describe('getFormattedSize', () => {
    it('should format bytes correctly', () => {
      expect(store.getFormattedSize(0)).toBe('0.00 B');
      expect(store.getFormattedSize(512)).toBe('512.00 B');
      expect(store.getFormattedSize(1024)).toBe('1.00 KB');
      expect(store.getFormattedSize(1024 * 1024)).toBe('1.00 MB');
      expect(store.getFormattedSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(store.getFormattedSize(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB');
    });

    it('should handle large sizes correctly', () => {
      const result = store.getFormattedSize(1024 * 1024 * 1024 * 10);
      expect(result).toBe('10.00 GB');
    });
  });

  describe('getNodePath', () => {
    it('should return list of ancestors from node to root', async () => {
      const subDir = path.join(tempDir, 'sub');
      fs.mkdirSync(subDir);

      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      store.toggleNodeExpansion(root);
      const subNode = root.children.find((n) => n.name === 'sub');

      if (subNode) {
        const pathList = store.getNodePath(subNode);
        expect(pathList[0]).toBe(root);
        expect(pathList[pathList.length - 1]).toBe(subNode);
        expect(pathList.length).toBe(2);
      }
    });
  });

  describe('getSortedChildren', () => {
    it('should return children sorted by size in descending order', async () => {
      // Create files of different sizes
      fs.writeFileSync(path.join(tempDir, 'small.txt'), 'x');
      fs.writeFileSync(path.join(tempDir, 'medium.txt'), 'xx'.repeat(50));
      fs.writeFileSync(path.join(tempDir, 'large.txt'), 'x'.repeat(200));

      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      store.toggleNodeExpansion(root);
      const sorted = store.getSortedChildren(root);

      // Verify descending size order
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].size).toBeGreaterThanOrEqual(sorted[i].size);
      }
    });
  });

  describe('subscription and change listeners', () => {
    it('should add and call listeners on changes', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsubscribe1 = store.subscribe(listener1);
      const unsubscribe2 = store.subscribe(listener2);

      await store.initializeFromPath(tempDir);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      listener1.mockClear();
      listener2.mockClear();

      store.selectNode(store.getRoot()!);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      listener1.mockClear();
      listener2.mockClear();

      unsubscribe1();
      store.selectNode(store.getRoot()!);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing from listeners', async () => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      await store.initializeFromPath(tempDir);
      expect(listener).toHaveBeenCalled();

      listener.mockClear();
      unsubscribe();
      store.selectNode(store.getRoot()!);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('directory traversal edge cases', () => {
    it('should handle empty directories', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      fs.mkdirSync(emptyDir);

      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      store.toggleNodeExpansion(root);
      const emptyNode = root.children.find((n) => n.name === 'empty');

      if (emptyNode) {
        store.toggleNodeExpansion(emptyNode);
        expect(emptyNode.children).toEqual([]);
      }
    });

    it('should handle directories with many files', async () => {
      // Create 50 files
      for (let i = 0; i < 50; i++) {
        fs.writeFileSync(
          path.join(tempDir, `file${i}.txt`),
          `content ${i}`
        );
      }

      await store.initializeFromPath(tempDir);
      const root = store.getRoot()!;

      store.toggleNodeExpansion(root);
      expect(root.children.length).toBe(50);
    });
  });
});
