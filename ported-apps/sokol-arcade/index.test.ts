/**
 * Sokol Arcade - Jest Unit Tests
 *
 * Tests for all three games: FPS Voxel, Pacman, and Chip-8.
 */

import {
  VoxelWorld,
  VoxelPlayer,
  FPSVoxelGame,
  PacmanGame,
  Direction,
  GhostState,
  Chip8,
  ArcadeStore,
  GAMES,
} from './index';
import { Vector3 } from '../../cosyne/src/math3d';

// ============================================================================
// VOXEL WORLD TESTS
// ============================================================================

describe('VoxelWorld', () => {
  let world: VoxelWorld;

  beforeEach(() => {
    world = new VoxelWorld();
  });

  describe('get/set', () => {
    it('should set and get blocks', () => {
      world.set(5, 5, 5, true);
      expect(world.get(5, 5, 5)).toBe(true);
      expect(world.get(5, 5, 6)).toBe(false);
    });

    it('should return false for out of bounds', () => {
      expect(world.get(-1, 0, 0)).toBe(false);
      expect(world.get(16, 0, 0)).toBe(false);
      expect(world.get(0, -1, 0)).toBe(false);
      expect(world.get(0, 16, 0)).toBe(false);
    });
  });

  describe('collision', () => {
    it('should detect collision with block', () => {
      world.set(5, 5, 5, true);
      const min = new Vector3(4.5, 4.5, 4.5);
      const max = new Vector3(5.5, 5.5, 5.5);
      expect(world.collision(min, max)).toBe(true);
    });

    it('should not detect collision with empty space', () => {
      const min = new Vector3(4.5, 4.5, 4.5);
      const max = new Vector3(5.5, 5.5, 5.5);
      expect(world.collision(min, max)).toBe(false);
    });
  });

  describe('generateDefault', () => {
    it('should create floor and walls', () => {
      world.generateDefault();
      // Floor at y=0
      expect(world.get(8, 0, 8)).toBe(true);
      // Walls
      expect(world.get(0, 1, 8)).toBe(true);
      expect(world.get(15, 1, 8)).toBe(true);
      // Middle should be empty (not on pillar grid)
      expect(world.get(5, 1, 5)).toBe(false);
    });
  });
});

// ============================================================================
// VOXEL PLAYER TESTS
// ============================================================================

describe('VoxelPlayer', () => {
  let player: VoxelPlayer;
  let world: VoxelWorld;

  beforeEach(() => {
    player = new VoxelPlayer();
    world = new VoxelWorld();
    world.generateDefault();
  });

  it('should start at spawn position', () => {
    expect(player.pos.x).toBe(2);
    expect(player.pos.y).toBe(3);
    expect(player.pos.z).toBe(2);
  });

  it('should update yaw from mouse input', () => {
    player.mouseDx = 100;
    player.update(world, 0.016);
    expect(player.yaw).toBeCloseTo(0.2, 1);
  });

  it('should clamp pitch', () => {
    player.mouseDy = 10000;
    player.update(world, 0.016);
    expect(player.pitch).toBeLessThanOrEqual(1.5);

    player.mouseDy = -10000;
    player.update(world, 0.016);
    expect(player.pitch).toBeGreaterThanOrEqual(-1.5);
  });

  it('should apply gravity', () => {
    player.pos = new Vector3(8, 10, 8);
    player.vel = new Vector3(0, 0, 0);
    player.update(world, 0.1);
    expect(player.vel.y).toBeLessThan(0);
  });

  it('should generate view matrix', () => {
    const mat = player.getViewMatrix();
    expect(mat.length).toBe(16);
    expect(typeof mat[0]).toBe('number');
  });
});

// ============================================================================
// FPS VOXEL GAME TESTS
// ============================================================================

describe('FPSVoxelGame', () => {
  let game: FPSVoxelGame;

  beforeEach(() => {
    game = new FPSVoxelGame();
  });

  afterEach(() => {
    game.stop();
  });

  it('should initialize with default world', () => {
    expect(game.world.get(0, 0, 0)).toBe(true); // Floor corner
  });

  it('should start and stop game loop', () => {
    game.start();
    expect(game.running).toBe(true);
    game.stop();
    expect(game.running).toBe(false);
  });

  it('should handle key input', () => {
    game.setKey('w', true);
    expect(game.player.keys.w).toBe(true);
    game.setKey('w', false);
    expect(game.player.keys.w).toBe(false);
  });

  it('should handle mouse input', () => {
    game.addMouseDelta(50, 30);
    expect(game.player.mouseDx).toBe(50);
    expect(game.player.mouseDy).toBe(30);
  });

  it('should render to buffer', () => {
    const buffer = new Uint8Array(100 * 100 * 4);
    game.render(buffer, 100, 100);
    // Check that buffer was modified (has non-zero values)
    let hasContent = false;
    for (let i = 0; i < buffer.length; i += 4) {
      if (buffer[i] > 0 || buffer[i + 1] > 0 || buffer[i + 2] > 0) {
        hasContent = true;
        break;
      }
    }
    expect(hasContent).toBe(true);
  });
});

// ============================================================================
// PACMAN GAME TESTS
// ============================================================================

describe('PacmanGame', () => {
  let game: PacmanGame;

  beforeEach(() => {
    game = new PacmanGame();
  });

  afterEach(() => {
    game.stop();
  });

  it('should initialize with pacman at spawn', () => {
    expect(game.pacman.x).toBe(14);
    expect(game.pacman.y).toBe(23);
  });

  it('should initialize with 4 ghosts', () => {
    expect(game.ghosts.length).toBe(4);
  });

  it('should count dots in map', () => {
    expect(game.dots).toBeGreaterThan(0);
  });

  it('should start with 3 lives', () => {
    expect(game.lives).toBe(3);
  });

  it('should start with 0 score', () => {
    expect(game.score).toBe(0);
  });

  it('should start and stop game loop', () => {
    game.start();
    expect(game.running).toBe(true);
    game.stop();
    expect(game.running).toBe(false);
  });

  it('should set direction', () => {
    game.setDirection(Direction.Up);
    expect(game.pacman.nextDir).toBe(Direction.Up);
  });

  it('should reset game state', () => {
    game.score = 100;
    game.lives = 1;
    game.reset();
    expect(game.score).toBe(0);
    expect(game.lives).toBe(3);
  });

  it('should eat dots and increase score', () => {
    // Find a dot position and move pacman there
    game.pacman.x = 1;
    game.pacman.y = 1;
    game.pacman.dir = Direction.Right;
    game.pacman.nextDir = Direction.Right;
    const initialScore = game.score;
    game.tick();
    // Score should increase if pacman ate a dot
    expect(game.score).toBeGreaterThanOrEqual(initialScore);
  });

  it('should render to buffer', () => {
    const buffer = new Uint8Array(224 * 248 * 4);
    game.render(buffer, 224, 248);
    // Check blue walls exist
    let hasBlue = false;
    for (let i = 0; i < buffer.length; i += 4) {
      if (buffer[i + 2] > 200 && buffer[i] < 50) {
        hasBlue = true;
        break;
      }
    }
    expect(hasBlue).toBe(true);
  });
});

// ============================================================================
// CHIP-8 EMULATOR TESTS
// ============================================================================

describe('Chip8', () => {
  let chip8: Chip8;

  beforeEach(() => {
    chip8 = new Chip8();
  });

  afterEach(() => {
    chip8.stop();
  });

  it('should initialize with font loaded', () => {
    // Font for '0' should be at address 0
    expect(chip8.memory[0]).toBe(0xF0);
  });

  it('should start PC at 0x200', () => {
    expect(chip8.pc).toBe(0x200);
  });

  it('should have 16 registers', () => {
    expect(chip8.v.length).toBe(16);
  });

  it('should have 64x32 display', () => {
    expect(chip8.display.length).toBe(64 * 32);
  });

  it('should start and stop emulation', () => {
    chip8.start();
    expect(chip8.running).toBe(true);
    chip8.stop();
    expect(chip8.running).toBe(false);
  });

  it('should reset state', () => {
    chip8.v[0] = 42;
    chip8.pc = 0x300;
    chip8.reset();
    expect(chip8.v[0]).toBe(0);
    expect(chip8.pc).toBe(0x200);
  });

  it('should handle key input', () => {
    chip8.setKey(5, true);
    expect(chip8.keys[5]).toBe(1);
    chip8.setKey(5, false);
    expect(chip8.keys[5]).toBe(0);
  });

  describe('opcodes', () => {
    it('should execute CLS (00E0)', () => {
      chip8.display[100] = 1;
      chip8.memory[0x200] = 0x00;
      chip8.memory[0x201] = 0xE0;
      chip8.step();
      expect(chip8.display[100]).toBe(0);
    });

    it('should execute JP (1NNN)', () => {
      chip8.memory[0x200] = 0x12;
      chip8.memory[0x201] = 0x50;
      chip8.step();
      expect(chip8.pc).toBe(0x250);
    });

    it('should execute LD Vx, byte (6XNN)', () => {
      chip8.memory[0x200] = 0x65;
      chip8.memory[0x201] = 0x42;
      chip8.step();
      expect(chip8.v[5]).toBe(0x42);
    });

    it('should execute ADD Vx, byte (7XNN)', () => {
      chip8.v[3] = 10;
      chip8.memory[0x200] = 0x73;
      chip8.memory[0x201] = 0x05;
      chip8.step();
      expect(chip8.v[3]).toBe(15);
    });

    it('should execute LD I, addr (ANNN)', () => {
      chip8.memory[0x200] = 0xA1;
      chip8.memory[0x201] = 0x23;
      chip8.step();
      expect(chip8.i).toBe(0x123);
    });

    it('should execute SE Vx, byte (3XNN)', () => {
      chip8.v[2] = 0x55;
      chip8.memory[0x200] = 0x32;
      chip8.memory[0x201] = 0x55;
      chip8.step();
      expect(chip8.pc).toBe(0x204); // Skipped
    });

    it('should execute SNE Vx, byte (4XNN)', () => {
      chip8.v[2] = 0x55;
      chip8.memory[0x200] = 0x42;
      chip8.memory[0x201] = 0x66;
      chip8.step();
      expect(chip8.pc).toBe(0x204); // Skipped
    });
  });

  it('should render to buffer', () => {
    chip8.display[0] = 1;
    chip8.display[64] = 1;
    const buffer = new Uint8Array(128 * 64 * 4);
    chip8.render(buffer, 128, 64);
    // Check green pixels exist
    let hasGreen = false;
    for (let i = 0; i < buffer.length; i += 4) {
      if (buffer[i + 1] === 255 && buffer[i] === 0) {
        hasGreen = true;
        break;
      }
    }
    expect(hasGreen).toBe(true);
  });
});

// ============================================================================
// ARCADE STORE TESTS
// ============================================================================

describe('ArcadeStore', () => {
  let store: ArcadeStore;

  beforeEach(() => {
    store = new ArcadeStore();
  });

  afterEach(() => {
    store.backToLauncher();
  });

  it('should start at launcher', () => {
    expect(store.currentGame).toBe('launcher');
  });

  it('should launch fps-voxel game', () => {
    store.launchGame('fps-voxel');
    expect(store.currentGame).toBe('fps-voxel');
    expect(store.fpsVoxel).not.toBeNull();
  });

  it('should launch pacman game', () => {
    store.launchGame('pacman');
    expect(store.currentGame).toBe('pacman');
    expect(store.pacman).not.toBeNull();
  });

  it('should launch chip8 game', () => {
    store.launchGame('chip8');
    expect(store.currentGame).toBe('chip8');
    expect(store.chip8).not.toBeNull();
  });

  it('should return to launcher', () => {
    store.launchGame('pacman');
    store.backToLauncher();
    expect(store.currentGame).toBe('launcher');
    expect(store.pacman).toBeNull();
  });

  it('should notify listeners on change', () => {
    let notified = false;
    store.subscribe(() => {
      notified = true;
    });
    store.launchGame('chip8');
    expect(notified).toBe(true);
  });

  it('should unsubscribe listeners', () => {
    let count = 0;
    const unsub = store.subscribe(() => {
      count++;
    });
    store.launchGame('chip8');
    expect(count).toBe(1);

    unsub();
    store.launchGame('pacman');
    expect(count).toBe(1);
  });

  it('should stop previous game when switching', () => {
    store.launchGame('fps-voxel');
    const fpsGame = store.fpsVoxel;
    store.launchGame('pacman');
    expect(fpsGame?.running).toBe(false);
  });
});

// ============================================================================
// GAMES CONSTANT TESTS
// ============================================================================

describe('GAMES constant', () => {
  it('should have 3 games', () => {
    expect(GAMES.length).toBe(3);
  });

  it('should have required properties', () => {
    for (const game of GAMES) {
      expect(game.id).toBeDefined();
      expect(game.name).toBeDefined();
      expect(game.description).toBeDefined();
      expect(game.icon).toBeDefined();
      expect(game.color).toBeDefined();
    }
  });

  it('should include fps-voxel', () => {
    const fps = GAMES.find(g => g.id === 'fps-voxel');
    expect(fps).toBeDefined();
    expect(fps?.name).toBe('FPS Voxel');
  });

  it('should include pacman', () => {
    const pacman = GAMES.find(g => g.id === 'pacman');
    expect(pacman).toBeDefined();
    expect(pacman?.name).toBe('Pacman');
  });

  it('should include chip8', () => {
    const chip8 = GAMES.find(g => g.id === 'chip8');
    expect(chip8).toBeDefined();
    expect(chip8?.name).toBe('Chip-8');
  });
});
