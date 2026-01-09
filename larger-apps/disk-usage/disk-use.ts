/**
 * Disk Usage Analyzer
 *
 * @tsyne-app:name Disk Use
 * @tsyne-app:icon harddrive
 * @tsyne-app:category Utilities
 * @tsyne-app:args (a: any) => void
 */

import { DiskUsageStore, DiskNode } from './disk-usage-store';
import * as path from 'path';
import * as os from 'os';

type App = any;

interface TreemapRect {
  x: number;
  y: number;
  width: number;
  height: number;
  node: DiskNode;
  color: string;
}

export async function buildDiskUseApp(a: App): Promise<void> {
  const store = new DiskUsageStore();
  let selectedNode: DiskNode | null = null;
  let treemapRects: TreemapRect[] = [];

  const homeDir = os.homedir();
  await store.initializeFromPath(homeDir);
  selectedNode = store.getRoot();

  function getColorForSize(bytes: number, maxBytes: number): string {
    const ratio = Math.min(bytes / maxBytes, 1);
    const hue = (1 - ratio) * 240;
    return `hsl(${hue}, 70%, 50%)`;
  }

  function computeTreemap(
    node: DiskNode,
    x: number,
    y: number,
    width: number,
    height: number,
    maxSize: number,
    depth: number = 0
  ): TreemapRect[] {
    const rects: TreemapRect[] = [];

    if (width <= 0 || height <= 0) {
      return rects;
    }

    const children = store.getSortedChildren(node);

    if (children.length === 0 || depth > 4) {
      const color = getColorForSize(node.size, maxSize);
      rects.push({
        x,
        y,
        width,
        height,
        node,
        color,
      });
      return rects;
    }

    let remainingWidth = width;
    let remainingHeight = height;
    let currentX = x;
    let currentY = y;

    const totalChildSize = children.reduce((sum, child) => sum + child.size, 0);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const ratio = totalChildSize > 0 ? child.size / totalChildSize : 1 / children.length;

      let childWidth: number;
      let childHeight: number;

      if (remainingWidth > remainingHeight) {
        childWidth = remainingWidth * ratio;
        childHeight = remainingHeight;

        rects.push(
          ...computeTreemap(
            child,
            currentX,
            currentY,
            childWidth,
            childHeight,
            maxSize,
            depth + 1
          )
        );

        currentX += childWidth;
        remainingWidth -= childWidth;
      } else {
        childWidth = remainingWidth;
        childHeight = remainingHeight * ratio;

        rects.push(
          ...computeTreemap(
            child,
            currentX,
            currentY,
            childWidth,
            childHeight,
            maxSize,
            depth + 1
          )
        );

        currentY += childHeight;
        remainingHeight -= childHeight;
      }
    }

    return rects;
  }

  function buildTreeItem(node: DiskNode | null, depth: number = 0): void {
    if (!node) {
      return;
    }

    const isSelected = node === selectedNode;
    const isExpanded = node.isExpanded;

    const prefix = !node.isDirectory
      ? '  '
      : isExpanded
        ? '  ▼ '
        : '  ▶ ';

    const displayName = `${prefix}${node.name}`;
    const sizeStr = node.isDirectory ? ` (${store.getFormattedSize(node.size)})` : '';

    a
      .button(`${displayName}${sizeStr}`)
      .withId(`tree-item-${node.path.replace(/[^a-zA-Z0-9-]/g, '-')}`)
      .onClick(() => {
        store.selectNode(node);
        selectedNode = node;
        refresh();
      });

    if (isExpanded && node.isDirectory) {
      const children = [...node.children];
      children.sort((a, b) => b.size - a.size);
      for (const child of children) {
        buildTreeItem(child, depth + 1);
      }
    }
  }

  function drawTreemap(): void {
    const selectedNodeForMap = selectedNode || store.getRoot();
    if (!selectedNodeForMap) {
      return;
    }

    const canvasWidth = 400;
    const canvasHeight = 400;
    const maxSize = selectedNodeForMap.size;

    treemapRects = computeTreemap(
      selectedNodeForMap,
      0,
      0,
      canvasWidth,
      canvasHeight,
      maxSize
    );

    a.center(() => {
      a.tappableCanvasRaster(canvasWidth, canvasHeight, {
        onTap: (x: number, y: number) => {
          // Find which rect was clicked
          for (const rect of treemapRects) {
            if (x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) {
              store.selectNode(rect.node);
              selectedNode = rect.node;
              refresh();
              break;
            }
          }
        },
      });
    });
  }

  function refresh(): void {
    build();
  }

  function build(): void {
    a.window({ title: 'Disk Use', width: 1200, height: 700 }, (win: any) => {
      win.setContent(() => {
        a.hbox(() => {
          // Left sidebar: tree view with scroll
          a.scroll(300, 700, () => {
            a.vbox(() => {
              a.label('Disk Usage').withId('diskuse-title');
              a.separator();
              buildTreeItem(store.getRoot());
            });
          });

          // Right side: info panel and treemap
          a.vbox(() => {
            // Info panel
            a.padded(() => {
              a.vbox(() => {
                if (selectedNode) {
                  a.label(`Path: ${selectedNode.path}`).withId('diskuse-path');
                  a.label(
                    `Size: ${store.getFormattedSize(selectedNode.size)}`
                  ).withId('diskuse-size');

                  if (selectedNode.isDirectory && selectedNode.loadedChildren) {
                    a.label(`Items: ${selectedNode.children.length}`).withId('diskuse-items');
                  }
                } else {
                  a.label('No selection').withId('diskuse-no-selection');
                }
              });
            });

            // Treemap canvas
            a.center(() => {
              drawTreemap();
            });
          });
        });
      });

      win.show();
    });
  }

  store.subscribe(() => {
    refresh();
  });

  build();
}

if (require.main === module) {
  const { app, resolveTransport } = require('../../core/src');
  app(resolveTransport(), { title: 'Disk Use' }, buildDiskUseApp).catch(console.error);
}
