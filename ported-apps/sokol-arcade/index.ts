/**
 * Sokol Arcade - Multi-Game Launcher
 *
 * A unified arcade launcher featuring ports of Sokol-based games:
 * - FPS Voxel: Simple voxel FPS (from lizard-demon/fps)
 * - Pacman: Classic maze chase game (from floooh/pacman.zig)
 * - Chip-8: Classic 8-bit emulator (from floooh/chipz)
 * - FPS Advanced: Quake-style movement (already ported)
 *
 * @tsyne-app:name Sokol Arcade
 * @tsyne-app:icon mediaPlay
 * @tsyne-app:category Games
 * @tsyne-app:args (a: App) => void
 *
 * Original projects:
 * - https://github.com/lizard-demon/fps
 * - https://github.com/floooh/pacman.zig
 * - https://github.com/floooh/chipz
 *
 * Portions copyright floooh, Spyware (lizard-demon), and Paul Hammant 2025
 */

import { Vector3 } from '../../cosyne/src/math3d';

// ============================================================================
// COMMON TYPES
// ============================================================================

export type GameType = 'launcher' | 'fps-voxel' | 'pacman' | 'chip8';

export interface GameInfo {
  id: GameType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const GAMES: GameInfo[] = [
  {
    id: 'fps-voxel',
    name: 'FPS Voxel',
    description: 'Simple voxel first-person shooter',
    icon: '[]',
    color: '#4CAF50'
  },
  {
    id: 'pacman',
    name: 'Pacman',
    description: 'Classic maze chase game',
    icon: 'C<',
    color: '#FFEB3B'
  },
  {
    id: 'chip8',
    name: 'Chip-8',
    description: '8-bit game emulator',
    icon: '><',
    color: '#2196F3'
  }
];

// ============================================================================
// FPS VOXEL GAME (from lizard-demon/fps - 256 lines Zig)
// ============================================================================

export class VoxelWorld {
  blocks: boolean[] = new Array(4096).fill(false);

  get(x: number, y: number, z: number): boolean {
    if (x < 0 || x >= 16 || y < 0 || y >= 16 || z < 0 || z >= 16) return false;
    return this.blocks[x + y * 16 + z * 256];
  }

  set(x: number, y: number, z: number, value: boolean): void {
    if (x >= 0 && x < 16 && y >= 0 && y < 16 && z >= 0 && z < 16) {
      this.blocks[x + y * 16 + z * 256] = value;
    }
  }

  collision(min: Vector3, max: Vector3): boolean {
    const minX = Math.max(0, Math.floor(min.x));
    const minY = Math.max(0, Math.floor(min.y));
    const minZ = Math.max(0, Math.floor(min.z));
    const maxX = Math.min(16, Math.floor(max.x) + 1);
    const maxY = Math.min(16, Math.floor(max.y) + 1);
    const maxZ = Math.min(16, Math.floor(max.z) + 1);

    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        for (let z = minZ; z < maxZ; z++) {
          if (this.get(x, y, z)) return true;
        }
      }
    }
    return false;
  }

  generateDefault(): void {
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        for (let z = 0; z < 16; z++) {
          // Floor, walls, and pillars
          if (y === 0 || x === 0 || x === 15 || z === 0 || z === 15 ||
              (x % 4 === 0 && z % 4 === 0 && y < 3)) {
            this.set(x, y, z, true);
          }
        }
      }
    }
  }
}

export class VoxelPlayer {
  pos = new Vector3(2, 3, 2);
  vel = Vector3.zero();
  yaw = 0;
  pitch = 0;
  mouseDx = 0;
  mouseDy = 0;
  keys = { w: false, a: false, s: false, d: false, space: false };

  update(world: VoxelWorld, dt: number): void {
    // Mouse look
    this.yaw += this.mouseDx * 0.002;
    this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch + this.mouseDy * 0.002));
    this.mouseDx = 0;
    this.mouseDy = 0;

    // Movement
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);
    const forward = this.keys.w ? 1 : this.keys.s ? -1 : 0;
    const strafe = this.keys.d ? 1 : this.keys.a ? -1 : 0;

    this.vel = new Vector3(
      (sinYaw * forward + cosYaw * strafe) * 6.0,
      this.vel.y - 15.0 * dt,
      (-cosYaw * forward + sinYaw * strafe) * 6.0
    );

    // Collision detection
    const oldPos = this.pos.clone();
    const hull = new Vector3(0.4, 0.8, 0.4);

    // Move on each axis separately
    for (const axis of [0, 2, 1]) {
      const newPos = this.pos.clone();
      if (axis === 0) newPos.x += this.vel.x * dt;
      else if (axis === 1) newPos.y += this.vel.y * dt;
      else newPos.z += this.vel.z * dt;

      const minBounds = newPos.sub(hull);
      const maxBounds = newPos.add(hull);

      if (world.collision(minBounds, maxBounds)) {
        if (axis === 0) this.pos.x = oldPos.x;
        else if (axis === 2) this.pos.z = oldPos.z;
        else {
          this.pos.y = oldPos.y;
          if (this.keys.space && this.vel.y <= 0) {
            this.vel = new Vector3(this.vel.x, 8.0, this.vel.z);
          } else {
            this.vel = new Vector3(this.vel.x, 0, this.vel.z);
          }
        }
      } else {
        this.pos = newPos;
      }
    }
  }

  getViewMatrix(): number[] {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    return [
      cy, sy * sp, -sy * cp, 0,
      0, cp, sp, 0,
      sy, -cy * sp, cy * cp, 0,
      -this.pos.x * cy - this.pos.z * sy,
      -this.pos.x * sy * sp - this.pos.y * cp + this.pos.z * cy * sp,
      this.pos.x * sy * cp - this.pos.y * sp - this.pos.z * cy * cp,
      1
    ];
  }
}

export class FPSVoxelGame {
  world = new VoxelWorld();
  player = new VoxelPlayer();
  running = false;
  intervalId: ReturnType<typeof setInterval> | null = null;
  lastTime = 0;
  onUpdate?: () => void;

  constructor() {
    this.world.generateDefault();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = Date.now();
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.player.update(this.world, dt);
      this.onUpdate?.();
    }, 16);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
  }

  setKey(key: string, pressed: boolean): void {
    const k = key.toLowerCase();
    if (k === 'w') this.player.keys.w = pressed;
    else if (k === 'a') this.player.keys.a = pressed;
    else if (k === 's') this.player.keys.s = pressed;
    else if (k === 'd') this.player.keys.d = pressed;
    else if (k === ' ') this.player.keys.space = pressed;
  }

  addMouseDelta(dx: number, dy: number): void {
    this.player.mouseDx += dx;
    this.player.mouseDy += dy;
  }

  render(buffer: Uint8Array, width: number, height: number): void {
    // Clear to dark blue
    for (let i = 0; i < width * height; i++) {
      buffer[i * 4] = 25;
      buffer[i * 4 + 1] = 25;
      buffer[i * 4 + 2] = 51;
      buffer[i * 4 + 3] = 255;
    }

    const viewMat = this.player.getViewMatrix();
    const fov = Math.PI / 2;
    const aspect = width / height;

    // Render voxels as projected points
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        for (let z = 0; z < 16; z++) {
          if (!this.world.get(x, y, z)) continue;

          // Check if visible face
          const faces = [
            { check: !this.world.get(x + 1, y, z), color: [200, 200, 200] },
            { check: !this.world.get(x - 1, y, z), color: [150, 150, 150] },
            { check: !this.world.get(x, y + 1, z), color: [255, 255, 255] },
            { check: !this.world.get(x, y - 1, z), color: [100, 100, 100] },
            { check: !this.world.get(x, y, z + 1), color: [180, 180, 180] },
            { check: !this.world.get(x, y, z - 1), color: [120, 120, 120] },
          ];

          for (const face of faces) {
            if (!face.check) continue;

            // Project center of block
            const wx = x + 0.5, wy = y + 0.5, wz = z + 0.5;
            const vx = viewMat[0] * wx + viewMat[4] * wy + viewMat[8] * wz + viewMat[12];
            const vy = viewMat[1] * wx + viewMat[5] * wy + viewMat[9] * wz + viewMat[13];
            const vz = viewMat[2] * wx + viewMat[6] * wy + viewMat[10] * wz + viewMat[14];

            if (vz >= -0.1) continue; // Behind camera

            const f = 1.0 / Math.tan(fov / 2);
            const px = (f / aspect) * vx / (-vz);
            const py = f * vy / (-vz);

            const sx = Math.floor((px + 1) * width / 2);
            const sy = Math.floor((1 - py) * height / 2);

            // Draw block as small square based on distance
            const dist = Math.sqrt(vx * vx + vy * vy + vz * vz);
            const size = Math.max(1, Math.floor(20 / dist));

            for (let dy = -size; dy <= size; dy++) {
              for (let dx = -size; dx <= size; dx++) {
                const px2 = sx + dx, py2 = sy + dy;
                if (px2 >= 0 && px2 < width && py2 >= 0 && py2 < height) {
                  const idx = (py2 * width + px2) * 4;
                  buffer[idx] = face.color[0];
                  buffer[idx + 1] = face.color[1];
                  buffer[idx + 2] = face.color[2];
                }
              }
            }
            break; // Only render one face per block
          }
        }
      }
    }

    // Draw crosshair
    const cx = Math.floor(width / 2), cy = Math.floor(height / 2);
    for (let i = -5; i <= 5; i++) {
      if (cx + i >= 0 && cx + i < width) {
        const idx = (cy * width + cx + i) * 4;
        buffer[idx] = 255; buffer[idx + 1] = 255; buffer[idx + 2] = 255;
      }
      if (cy + i >= 0 && cy + i < height) {
        const idx = ((cy + i) * width + cx) * 4;
        buffer[idx] = 255; buffer[idx + 1] = 255; buffer[idx + 2] = 255;
      }
    }
  }
}

// ============================================================================
// PACMAN GAME (from floooh/pacman.zig - simplified)
// ============================================================================

export enum Direction { Right, Down, Left, Up }
export enum GhostState { Chase, Scatter, Frightened, Eaten }

const PACMAN_MAP = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '     #.##### ## #####.#     ',
  '     #.##          ##.#     ',
  '     #.## ###--### ##.#     ',
  '######.## #      # ##.######',
  '      .   #      #   .      ',
  '######.## #      # ##.######',
  '     #.## ######## ##.#     ',
  '     #.##          ##.#     ',
  '     #.## ######## ##.#     ',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......  .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
];

export interface Entity {
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
}

export class PacmanGame {
  map: string[] = [...PACMAN_MAP];
  pacman: Entity = { x: 14, y: 23, dir: Direction.Left, nextDir: Direction.Left };
  ghosts: Entity[] = [
    { x: 14, y: 11, dir: Direction.Left, nextDir: Direction.Left },
    { x: 12, y: 14, dir: Direction.Up, nextDir: Direction.Up },
    { x: 14, y: 14, dir: Direction.Down, nextDir: Direction.Down },
    { x: 16, y: 14, dir: Direction.Up, nextDir: Direction.Up },
  ];
  ghostStates: GhostState[] = [GhostState.Scatter, GhostState.Scatter, GhostState.Scatter, GhostState.Scatter];
  score = 0;
  lives = 3;
  dots = 0;
  frightenedTimer = 0;
  running = false;
  intervalId: ReturnType<typeof setInterval> | null = null;
  tickCount = 0;
  onUpdate?: () => void;

  constructor() {
    this.countDots();
  }

  countDots(): void {
    this.dots = 0;
    for (const row of this.map) {
      for (const c of row) {
        if (c === '.' || c === 'o') this.dots++;
      }
    }
  }

  reset(): void {
    this.map = [...PACMAN_MAP];
    this.pacman = { x: 14, y: 23, dir: Direction.Left, nextDir: Direction.Left };
    this.ghosts = [
      { x: 14, y: 11, dir: Direction.Left, nextDir: Direction.Left },
      { x: 12, y: 14, dir: Direction.Up, nextDir: Direction.Up },
      { x: 14, y: 14, dir: Direction.Down, nextDir: Direction.Down },
      { x: 16, y: 14, dir: Direction.Up, nextDir: Direction.Up },
    ];
    this.ghostStates = [GhostState.Scatter, GhostState.Scatter, GhostState.Scatter, GhostState.Scatter];
    this.score = 0;
    this.lives = 3;
    this.frightenedTimer = 0;
    this.countDots();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.intervalId = setInterval(() => {
      this.tick();
      this.onUpdate?.();
    }, 150);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
  }

  setDirection(dir: Direction): void {
    this.pacman.nextDir = dir;
  }

  private canMove(x: number, y: number, dir: Direction): boolean {
    const dx = dir === Direction.Right ? 1 : dir === Direction.Left ? -1 : 0;
    const dy = dir === Direction.Down ? 1 : dir === Direction.Up ? -1 : 0;
    const nx = (x + dx + 28) % 28;
    const ny = y + dy;
    if (ny < 0 || ny >= 31) return false;
    const c = this.map[ny]?.[nx];
    return c !== '#' && c !== '-' && c !== undefined;
  }

  private move(entity: Entity): void {
    if (this.canMove(entity.x, entity.y, entity.nextDir)) {
      entity.dir = entity.nextDir;
    }
    if (this.canMove(entity.x, entity.y, entity.dir)) {
      const dx = entity.dir === Direction.Right ? 1 : entity.dir === Direction.Left ? -1 : 0;
      const dy = entity.dir === Direction.Down ? 1 : entity.dir === Direction.Up ? -1 : 0;
      entity.x = (entity.x + dx + 28) % 28;
      entity.y = entity.y + dy;
    }
  }

  tick(): void {
    this.tickCount++;

    // Update frightened timer
    if (this.frightenedTimer > 0) {
      this.frightenedTimer--;
      if (this.frightenedTimer === 0) {
        for (let i = 0; i < 4; i++) {
          if (this.ghostStates[i] === GhostState.Frightened) {
            this.ghostStates[i] = GhostState.Chase;
          }
        }
      }
    }

    // Move pacman
    this.move(this.pacman);

    // Eat dots
    const c = this.map[this.pacman.y]?.[this.pacman.x];
    if (c === '.') {
      this.map[this.pacman.y] = this.map[this.pacman.y].substring(0, this.pacman.x) + ' ' +
        this.map[this.pacman.y].substring(this.pacman.x + 1);
      this.score += 10;
      this.dots--;
    } else if (c === 'o') {
      this.map[this.pacman.y] = this.map[this.pacman.y].substring(0, this.pacman.x) + ' ' +
        this.map[this.pacman.y].substring(this.pacman.x + 1);
      this.score += 50;
      this.dots--;
      this.frightenedTimer = 40;
      for (let i = 0; i < 4; i++) {
        if (this.ghostStates[i] !== GhostState.Eaten) {
          this.ghostStates[i] = GhostState.Frightened;
        }
      }
    }

    // Move ghosts (every other tick for slower movement)
    if (this.tickCount % 2 === 0) {
      for (let i = 0; i < 4; i++) {
        if (this.ghostStates[i] === GhostState.Eaten) continue;

        // Simple AI: move towards/away from pacman
        const ghost = this.ghosts[i];
        const dirs = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];
        let bestDir = ghost.dir;
        let bestDist = this.ghostStates[i] === GhostState.Frightened ? -Infinity : Infinity;

        for (const dir of dirs) {
          // Don't reverse direction
          if ((dir === Direction.Up && ghost.dir === Direction.Down) ||
              (dir === Direction.Down && ghost.dir === Direction.Up) ||
              (dir === Direction.Left && ghost.dir === Direction.Right) ||
              (dir === Direction.Right && ghost.dir === Direction.Left)) continue;

          if (!this.canMove(ghost.x, ghost.y, dir)) continue;

          const dx = dir === Direction.Right ? 1 : dir === Direction.Left ? -1 : 0;
          const dy = dir === Direction.Down ? 1 : dir === Direction.Up ? -1 : 0;
          const nx = ghost.x + dx, ny = ghost.y + dy;
          const dist = Math.abs(nx - this.pacman.x) + Math.abs(ny - this.pacman.y);

          if (this.ghostStates[i] === GhostState.Frightened) {
            if (dist > bestDist) { bestDist = dist; bestDir = dir; }
          } else {
            if (dist < bestDist) { bestDist = dist; bestDir = dir; }
          }
        }
        ghost.nextDir = bestDir;
        this.move(ghost);
      }
    }

    // Check ghost collisions
    for (let i = 0; i < 4; i++) {
      if (this.ghosts[i].x === this.pacman.x && this.ghosts[i].y === this.pacman.y) {
        if (this.ghostStates[i] === GhostState.Frightened) {
          this.ghostStates[i] = GhostState.Eaten;
          this.score += 200;
          this.ghosts[i] = { x: 14, y: 14, dir: Direction.Up, nextDir: Direction.Up };
        } else if (this.ghostStates[i] !== GhostState.Eaten) {
          this.lives--;
          if (this.lives > 0) {
            this.pacman = { x: 14, y: 23, dir: Direction.Left, nextDir: Direction.Left };
          }
        }
      }
    }
  }

  render(buffer: Uint8Array, width: number, height: number): void {
    const cellW = Math.floor(width / 28);
    const cellH = Math.floor(height / 31);

    // Clear to black
    buffer.fill(0);
    for (let i = 3; i < buffer.length; i += 4) buffer[i] = 255;

    // Draw map
    for (let y = 0; y < 31; y++) {
      for (let x = 0; x < 28; x++) {
        const c = this.map[y]?.[x] || ' ';
        let color = [0, 0, 0];
        if (c === '#') color = [33, 33, 222];
        else if (c === '.') color = [255, 184, 174];
        else if (c === 'o') color = [255, 184, 174];
        else if (c === '-') color = [255, 184, 222];

        const px = x * cellW, py = y * cellH;
        for (let dy = 0; dy < cellH; dy++) {
          for (let dx = 0; dx < cellW; dx++) {
            const idx = ((py + dy) * width + px + dx) * 4;
            if (c === '.' && (dx < cellW / 3 || dx > cellW * 2 / 3 || dy < cellH / 3 || dy > cellH * 2 / 3)) continue;
            if (c === 'o' && Math.sqrt((dx - cellW / 2) ** 2 + (dy - cellH / 2) ** 2) > cellW / 2) continue;
            buffer[idx] = color[0];
            buffer[idx + 1] = color[1];
            buffer[idx + 2] = color[2];
          }
        }
      }
    }

    // Draw pacman
    const px = this.pacman.x * cellW, py = this.pacman.y * cellH;
    for (let dy = 0; dy < cellH; dy++) {
      for (let dx = 0; dx < cellW; dx++) {
        const dist = Math.sqrt((dx - cellW / 2) ** 2 + (dy - cellH / 2) ** 2);
        if (dist < cellW / 2) {
          const idx = ((py + dy) * width + px + dx) * 4;
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 0;
        }
      }
    }

    // Draw ghosts
    const ghostColors = [[255, 0, 0], [255, 184, 255], [0, 255, 255], [255, 184, 82]];
    for (let i = 0; i < 4; i++) {
      const g = this.ghosts[i];
      const gx = g.x * cellW, gy = g.y * cellH;
      const color = this.ghostStates[i] === GhostState.Frightened ? [33, 33, 255] :
                    this.ghostStates[i] === GhostState.Eaten ? [255, 255, 255] : ghostColors[i];
      for (let dy = 0; dy < cellH; dy++) {
        for (let dx = 0; dx < cellW; dx++) {
          if (dy < cellH / 2 || (dx + dy) % 4 < 2) {
            const idx = ((gy + dy) * width + gx + dx) * 4;
            buffer[idx] = color[0];
            buffer[idx + 1] = color[1];
            buffer[idx + 2] = color[2];
          }
        }
      }
    }
  }
}

// ============================================================================
// CHIP-8 EMULATOR (from floooh/chipz - simplified)
// ============================================================================

export class Chip8 {
  memory = new Uint8Array(4096);
  v = new Uint8Array(16); // Registers V0-VF
  i = 0; // Index register
  pc = 0x200; // Program counter
  stack: number[] = [];
  delayTimer = 0;
  soundTimer = 0;
  display = new Uint8Array(64 * 32);
  keys = new Uint8Array(16);
  waiting = false;
  waitReg = 0;
  running = false;
  intervalId: ReturnType<typeof setInterval> | null = null;
  onUpdate?: () => void;

  constructor() {
    this.loadFont();
    this.loadDefaultProgram();
  }

  loadFont(): void {
    const font = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80, // F
    ];
    for (let i = 0; i < font.length; i++) {
      this.memory[i] = font[i];
    }
  }

  loadDefaultProgram(): void {
    // Simple bouncing ball program
    const program = [
      0x60, 0x00, // V0 = 0 (x)
      0x61, 0x00, // V1 = 0 (y)
      0x62, 0x01, // V2 = 1 (dx)
      0x63, 0x01, // V3 = 1 (dy)
      0xA0, 0x00, // I = 0 (sprite at font 0)
      0x00, 0xE0, // CLS
      0xD0, 0x15, // DRW V0, V1, 5
      0x80, 0x24, // V0 += V2
      0x81, 0x34, // V1 += V3
      0x40, 0x3B, // SNE V0, 59
      0x72, 0xFE, // V2 = -V2 (add -2)
      0x30, 0x00, // SE V0, 0
      0x72, 0x02, // V2 = +2
      0x41, 0x1B, // SNE V1, 27
      0x73, 0xFE, // V3 = -V3
      0x31, 0x00, // SE V1, 0
      0x73, 0x02, // V3 = +2
      0x12, 0x0A, // JP 0x20A (loop to DRW)
    ];
    for (let i = 0; i < program.length; i++) {
      this.memory[0x200 + i] = program[i];
    }
  }

  loadProgram(data: Uint8Array): void {
    this.reset();
    for (let i = 0; i < data.length && i + 0x200 < 4096; i++) {
      this.memory[0x200 + i] = data[i];
    }
  }

  reset(): void {
    this.v.fill(0);
    this.i = 0;
    this.pc = 0x200;
    this.stack = [];
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display.fill(0);
    this.keys.fill(0);
    this.waiting = false;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.intervalId = setInterval(() => {
      for (let i = 0; i < 10; i++) this.step();
      if (this.delayTimer > 0) this.delayTimer--;
      if (this.soundTimer > 0) this.soundTimer--;
      this.onUpdate?.();
    }, 16);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
  }

  setKey(key: number, pressed: boolean): void {
    if (key >= 0 && key < 16) {
      this.keys[key] = pressed ? 1 : 0;
      if (pressed && this.waiting) {
        this.v[this.waitReg] = key;
        this.waiting = false;
      }
    }
  }

  step(): void {
    if (this.waiting) return;

    const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
    this.pc += 2;

    const x = (opcode >> 8) & 0xF;
    const y = (opcode >> 4) & 0xF;
    const n = opcode & 0xF;
    const nn = opcode & 0xFF;
    const nnn = opcode & 0xFFF;

    switch (opcode & 0xF000) {
      case 0x0000:
        if (opcode === 0x00E0) this.display.fill(0);
        else if (opcode === 0x00EE) this.pc = this.stack.pop() || 0x200;
        break;
      case 0x1000: this.pc = nnn; break;
      case 0x2000: this.stack.push(this.pc); this.pc = nnn; break;
      case 0x3000: if (this.v[x] === nn) this.pc += 2; break;
      case 0x4000: if (this.v[x] !== nn) this.pc += 2; break;
      case 0x5000: if (this.v[x] === this.v[y]) this.pc += 2; break;
      case 0x6000: this.v[x] = nn; break;
      case 0x7000: this.v[x] = (this.v[x] + nn) & 0xFF; break;
      case 0x8000:
        switch (n) {
          case 0x0: this.v[x] = this.v[y]; break;
          case 0x1: this.v[x] |= this.v[y]; break;
          case 0x2: this.v[x] &= this.v[y]; break;
          case 0x3: this.v[x] ^= this.v[y]; break;
          case 0x4: {
            const sum = this.v[x] + this.v[y];
            this.v[0xF] = sum > 255 ? 1 : 0;
            this.v[x] = sum & 0xFF;
            break;
          }
          case 0x5: {
            this.v[0xF] = this.v[x] >= this.v[y] ? 1 : 0;
            this.v[x] = (this.v[x] - this.v[y]) & 0xFF;
            break;
          }
          case 0x6: {
            this.v[0xF] = this.v[x] & 1;
            this.v[x] >>= 1;
            break;
          }
          case 0x7: {
            this.v[0xF] = this.v[y] >= this.v[x] ? 1 : 0;
            this.v[x] = (this.v[y] - this.v[x]) & 0xFF;
            break;
          }
          case 0xE: {
            this.v[0xF] = (this.v[x] >> 7) & 1;
            this.v[x] = (this.v[x] << 1) & 0xFF;
            break;
          }
        }
        break;
      case 0x9000: if (this.v[x] !== this.v[y]) this.pc += 2; break;
      case 0xA000: this.i = nnn; break;
      case 0xB000: this.pc = nnn + this.v[0]; break;
      case 0xC000: this.v[x] = Math.floor(Math.random() * 256) & nn; break;
      case 0xD000: {
        this.v[0xF] = 0;
        for (let row = 0; row < n; row++) {
          const sprite = this.memory[this.i + row];
          for (let col = 0; col < 8; col++) {
            if ((sprite & (0x80 >> col)) !== 0) {
              const px = (this.v[x] + col) % 64;
              const py = (this.v[y] + row) % 32;
              const idx = py * 64 + px;
              if (this.display[idx] === 1) this.v[0xF] = 1;
              this.display[idx] ^= 1;
            }
          }
        }
        break;
      }
      case 0xE000:
        if (nn === 0x9E) { if (this.keys[this.v[x]]) this.pc += 2; }
        else if (nn === 0xA1) { if (!this.keys[this.v[x]]) this.pc += 2; }
        break;
      case 0xF000:
        switch (nn) {
          case 0x07: this.v[x] = this.delayTimer; break;
          case 0x0A: this.waiting = true; this.waitReg = x; break;
          case 0x15: this.delayTimer = this.v[x]; break;
          case 0x18: this.soundTimer = this.v[x]; break;
          case 0x1E: this.i = (this.i + this.v[x]) & 0xFFF; break;
          case 0x29: this.i = this.v[x] * 5; break;
          case 0x33: {
            this.memory[this.i] = Math.floor(this.v[x] / 100);
            this.memory[this.i + 1] = Math.floor(this.v[x] / 10) % 10;
            this.memory[this.i + 2] = this.v[x] % 10;
            break;
          }
          case 0x55: for (let i = 0; i <= x; i++) this.memory[this.i + i] = this.v[i]; break;
          case 0x65: for (let i = 0; i <= x; i++) this.v[i] = this.memory[this.i + i]; break;
        }
        break;
    }
  }

  render(buffer: Uint8Array, width: number, height: number): void {
    const scaleX = Math.floor(width / 64);
    const scaleY = Math.floor(height / 32);

    // Clear to black
    buffer.fill(0);
    for (let i = 3; i < buffer.length; i += 4) buffer[i] = 255;

    // Draw display
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        if (this.display[y * 64 + x]) {
          for (let dy = 0; dy < scaleY; dy++) {
            for (let dx = 0; dx < scaleX; dx++) {
              const px = x * scaleX + dx;
              const py = y * scaleY + dy;
              if (px < width && py < height) {
                const idx = (py * width + px) * 4;
                buffer[idx] = 0;
                buffer[idx + 1] = 255;
                buffer[idx + 2] = 0;
              }
            }
          }
        }
      }
    }
  }
}

// ============================================================================
// ARCADE STORE
// ============================================================================

type ChangeListener = () => void;

export class ArcadeStore {
  private changeListeners: ChangeListener[] = [];
  currentGame: GameType = 'launcher';

  // Game instances
  fpsVoxel: FPSVoxelGame | null = null;
  pacman: PacmanGame | null = null;
  chip8: Chip8 | null = null;

  subscribe(listener: ChangeListener): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  private notifyChange(): void {
    this.changeListeners.forEach(l => l());
  }

  launchGame(game: GameType): void {
    this.stopCurrentGame();
    this.currentGame = game;

    switch (game) {
      case 'fps-voxel':
        this.fpsVoxel = new FPSVoxelGame();
        this.fpsVoxel.onUpdate = () => this.notifyChange();
        this.fpsVoxel.start();
        break;
      case 'pacman':
        this.pacman = new PacmanGame();
        this.pacman.onUpdate = () => this.notifyChange();
        this.pacman.start();
        break;
      case 'chip8':
        this.chip8 = new Chip8();
        this.chip8.onUpdate = () => this.notifyChange();
        this.chip8.start();
        break;
    }
    this.notifyChange();
  }

  backToLauncher(): void {
    this.stopCurrentGame();
    this.currentGame = 'launcher';
    this.notifyChange();
  }

  private stopCurrentGame(): void {
    this.fpsVoxel?.stop();
    this.pacman?.stop();
    this.chip8?.stop();
    this.fpsVoxel = null;
    this.pacman = null;
    this.chip8 = null;
  }
}

// ============================================================================
// VIEW BUILDER
// ============================================================================

export function buildSokolArcadeApp(a: any): void {
  const store = new ArcadeStore();
  let contentContainer: any;
  let canvas: any;
  const canvasWidth = 448;
  const canvasHeight = 320;
  let renderInterval: ReturnType<typeof setInterval> | undefined;

  function renderCurrentGame(): void {
    if (!canvas) return;
    const buffer = new Uint8Array(canvasWidth * canvasHeight * 4);

    if (store.currentGame === 'fps-voxel' && store.fpsVoxel) {
      store.fpsVoxel.render(buffer, canvasWidth, canvasHeight);
    } else if (store.currentGame === 'pacman' && store.pacman) {
      store.pacman.render(buffer, canvasWidth, canvasHeight);
    } else if (store.currentGame === 'chip8' && store.chip8) {
      store.chip8.render(buffer, canvasWidth, canvasHeight);
    }

    canvas.setPixelBuffer(buffer).catch(() => {});
  }

  a.window({ title: 'Sokol Arcade', width: 520, height: 480 }, (win: any) => {
    win.setContent(() => {
      a.vbox(() => {
        // Header
        a.hbox(() => {
          a.label('Sokol Arcade').withId('title');
          a.spacer();
          a.button('Back')
            .withId('btn-back')
            .onClick(() => store.backToLauncher())
            .when(() => store.currentGame !== 'launcher');
        });

        a.separator();

        // Content area - either launcher or game
        contentContainer = a.vbox(() => {
          // Launcher view
          a.vbox(() => {
            a.label('Choose a Game:').withId('choose-label');
            a.hbox(() => {
              for (const game of GAMES) {
                a.vbox(() => {
                  a.button(game.icon)
                    .withId(`btn-${game.id}`)
                    .onClick(() => store.launchGame(game.id));
                  a.label(game.name).withId(`label-${game.id}`);
                });
              }
            });
            a.separator();
            a.label('FPS Voxel: WASD + Arrow keys').withId('help-fps');
            a.label('Pacman: Arrow keys to move').withId('help-pacman');
            a.label('Chip-8: Keys 0-F for input').withId('help-chip8');
          }).when(() => store.currentGame === 'launcher');

          // FPS Voxel game view
          a.vbox(() => {
            canvas = a.tappableCanvasRaster(canvasWidth, canvasHeight, {
              onKeyDown: (key: string) => {
                if (store.fpsVoxel) store.fpsVoxel.setKey(key, true);
              },
              onKeyUp: (key: string) => {
                if (store.fpsVoxel) store.fpsVoxel.setKey(key, false);
              }
            }).withId('fps-canvas');
            a.hbox(() => {
              a.button('Look L').onClick(() => store.fpsVoxel?.addMouseDelta(-30, 0));
              a.button('Look R').onClick(() => store.fpsVoxel?.addMouseDelta(30, 0));
              a.button('Look Up').onClick(() => store.fpsVoxel?.addMouseDelta(0, -20));
              a.button('Look Dn').onClick(() => store.fpsVoxel?.addMouseDelta(0, 20));
            });
            a.label('WASD: Move | Space: Jump').withId('fps-help');
          }).when(() => store.currentGame === 'fps-voxel');

          // Pacman game view
          a.vbox(() => {
            canvas = a.tappableCanvasRaster(canvasWidth, canvasHeight, {}).withId('pacman-canvas');
            a.hbox(() => {
              a.label('Score:').withId('pm-score-label');
              a.label('0').withId('pm-score').bindTo({
                text: () => store.pacman?.score.toString() || '0'
              });
              a.spacer();
              a.label('Lives:').withId('pm-lives-label');
              a.label('3').withId('pm-lives').bindTo({
                text: () => store.pacman?.lives.toString() || '3'
              });
            });
            a.hbox(() => {
              a.button('Up').onClick(() => store.pacman?.setDirection(Direction.Up)).withId('pm-up');
              a.button('Down').onClick(() => store.pacman?.setDirection(Direction.Down)).withId('pm-down');
              a.button('Left').onClick(() => store.pacman?.setDirection(Direction.Left)).withId('pm-left');
              a.button('Right').onClick(() => store.pacman?.setDirection(Direction.Right)).withId('pm-right');
            });
          }).when(() => store.currentGame === 'pacman');

          // Chip-8 emulator view
          a.vbox(() => {
            canvas = a.tappableCanvasRaster(canvasWidth, canvasHeight, {}).withId('chip8-canvas');
            a.hbox(() => {
              a.button('Reset').onClick(() => {
                store.chip8?.reset();
                store.chip8?.loadDefaultProgram();
              }).withId('c8-reset');
              a.label('Bouncing Ball Demo').withId('c8-program');
            });
          }).when(() => store.currentGame === 'chip8');
        });
      });
    });

    // Subscribe to store changes
    store.subscribe(async () => {
      await contentContainer?.refresh?.();
    });

    // Start render loop
    setTimeout(() => {
      renderInterval = setInterval(() => {
        if (store.currentGame !== 'launcher') {
          renderCurrentGame();
        }
      }, 1000 / 30);
    }, 100);

    // Handle keyboard
    win.onKeyDown?.((key: string) => {
      if (store.currentGame === 'fps-voxel' && store.fpsVoxel) {
        if (key === 'ArrowLeft') store.fpsVoxel.addMouseDelta(-20, 0);
        else if (key === 'ArrowRight') store.fpsVoxel.addMouseDelta(20, 0);
        else if (key === 'ArrowUp') store.fpsVoxel.addMouseDelta(0, -15);
        else if (key === 'ArrowDown') store.fpsVoxel.addMouseDelta(0, 15);
        else store.fpsVoxel.setKey(key, true);
      } else if (store.currentGame === 'pacman' && store.pacman) {
        if (key === 'ArrowUp') store.pacman.setDirection(Direction.Up);
        else if (key === 'ArrowDown') store.pacman.setDirection(Direction.Down);
        else if (key === 'ArrowLeft') store.pacman.setDirection(Direction.Left);
        else if (key === 'ArrowRight') store.pacman.setDirection(Direction.Right);
      } else if (store.currentGame === 'chip8' && store.chip8) {
        const keyMap: Record<string, number> = {
          '1': 1, '2': 2, '3': 3, '4': 0xC,
          'q': 4, 'w': 5, 'e': 6, 'r': 0xD,
          'a': 7, 's': 8, 'd': 9, 'f': 0xE,
          'z': 0xA, 'x': 0, 'c': 0xB, 'v': 0xF,
        };
        const k = keyMap[key.toLowerCase()];
        if (k !== undefined) store.chip8.setKey(k, true);
      }
    });

    win.onKeyUp?.((key: string) => {
      if (store.currentGame === 'fps-voxel' && store.fpsVoxel) {
        store.fpsVoxel.setKey(key, false);
      } else if (store.currentGame === 'chip8' && store.chip8) {
        const keyMap: Record<string, number> = {
          '1': 1, '2': 2, '3': 3, '4': 0xC,
          'q': 4, 'w': 5, 'e': 6, 'r': 0xD,
          'a': 7, 's': 8, 'd': 9, 'f': 0xE,
          'z': 0xA, 'x': 0, 'c': 0xB, 'v': 0xF,
        };
        const k = keyMap[key.toLowerCase()];
        if (k !== undefined) store.chip8.setKey(k, false);
      }
    });

    // Cleanup
    win.setCloseIntercept?.(async () => {
      store.backToLauncher();
      if (renderInterval) clearInterval(renderInterval);
      return true;
    });

    win.show();
  });
}

export default buildSokolArcadeApp;
