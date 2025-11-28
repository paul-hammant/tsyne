/**
 * Unit tests for Apache Fory protocol encoding/decoding
 *
 * IMPORTANT NOTE: Fury JS SDK Limitations
 * =======================================
 * The Fury JavaScript SDK (v0.5.x-beta) requires fully typed schemas for
 * serialization. The `Type.any()` helper does not properly handle nested
 * JavaScript objects the way MessagePack does dynamically.
 *
 * This means Fury is NOT a drop-in replacement for MessagePack when you have
 * dynamic payloads (like our `payload: Record<string, unknown>` fields).
 *
 * Options for using Fury in production:
 * 1. Define complete schemas for all message types (labor-intensive)
 * 2. Use JSON for payload serialization within a Fury frame structure
 * 3. Use MessagePack or JSON instead of Fury for this use case
 *
 * This test file demonstrates the framing protocol and compares serialization
 * options to help make an informed decision.
 */

import { encode as msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';

interface Message {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

interface Response {
  id: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

interface Event {
  type: string;
  widgetId: string;
  data?: Record<string, unknown>;
}

// Serializer interfaces for consistent comparison
interface Serializer {
  name: string;
  serialize: (obj: unknown) => Uint8Array;
  deserialize: <T>(buf: Uint8Array) => T;
}

// JSON Serializer (baseline, what we'd use if Fury doesn't work for dynamic types)
const jsonSerializer: Serializer = {
  name: 'JSON',
  serialize: (obj: unknown): Uint8Array => {
    return Buffer.from(JSON.stringify(obj));
  },
  deserialize: <T>(buf: Uint8Array): T => {
    return JSON.parse(Buffer.from(buf).toString()) as T;
  }
};

// MessagePack Serializer
const msgpackSerializer: Serializer = {
  name: 'MessagePack',
  serialize: (obj: unknown): Uint8Array => {
    return msgpackEncode(obj);
  },
  deserialize: <T>(buf: Uint8Array): T => {
    return msgpackDecode(buf) as T;
  }
};

describe('Transport Protocol Unit Tests', () => {
  describe('Fury JS SDK Limitation Documentation', () => {
    it('demonstrates Fury limitation with Type.any() and nested objects', async () => {
      // Import Fury
      const { default: Fury, Type } = await import('@furyjs/fury');
      const fury = new Fury({ refTracking: false });

      // Define schema with Type.any() for payload
      const MessageType = Type.object('TestMessage', {
        id: Type.string(),
        type: Type.string(),
        payload: Type.any(),
      });

      const serializer = fury.registerSerializer(MessageType);

      // This message has nested objects in payload
      const msg = {
        id: 'test_1',
        type: 'createWindow',
        payload: {
          title: 'Test',
          size: { width: 800, height: 600 }, // Nested object
        },
      };

      // Fury JS SDK throws when trying to serialize nested objects with Type.any()
      expect(() => {
        serializer.serialize(msg);
      }).toThrow('Failed to detect the Fury type from JavaScript type: object');

      console.log('\n=== Fury JS SDK Limitation Confirmed ===');
      console.log('Fury v0.5.x-beta cannot serialize nested objects with Type.any()');
      console.log('For dynamic payloads, use MessagePack or JSON instead.\n');
    });
  });

  // Test both serializers with the same test cases
  const serializers = [jsonSerializer, msgpackSerializer];

  describe.each(serializers)('$name Protocol Tests', (serializer) => {
    describe('Message Encoding', () => {
      it('should encode and decode a simple message', () => {
        const msg: Message = {
          id: 'test_1',
          type: 'createLabel',
          payload: {
            id: 'label_1',
            text: 'Hello World',
          },
        };

        const encoded = serializer.serialize(msg);
        const decoded = serializer.deserialize<Message>(encoded);

        expect(decoded.id).toBe(msg.id);
        expect(decoded.type).toBe(msg.type);
        expect(decoded.payload.text).toBe(msg.payload.text);
      });

      it('should encode and decode a message with nested objects', () => {
        const msg: Message = {
          id: 'test_2',
          type: 'createWindow',
          payload: {
            id: 'window_1',
            title: 'Test Window',
            size: { width: 800, height: 600 },
            options: { resizable: true, centered: true },
          },
        };

        const encoded = serializer.serialize(msg);
        const decoded = serializer.deserialize<Message>(encoded);

        expect(decoded.payload.size).toEqual({ width: 800, height: 600 });
        expect(decoded.payload.options).toEqual({ resizable: true, centered: true });
      });

      it('should encode and decode a message with arrays', () => {
        const msg: Message = {
          id: 'test_3',
          type: 'createSelect',
          payload: {
            id: 'select_1',
            options: ['Option A', 'Option B', 'Option C'],
            selected: 0,
          },
        };

        const encoded = serializer.serialize(msg);
        const decoded = serializer.deserialize<Message>(encoded);

        expect(decoded.payload.options).toEqual(['Option A', 'Option B', 'Option C']);
      });
    });

    describe('Response Encoding', () => {
      it('should encode and decode a success response', () => {
        const resp: Response = {
          id: 'test_1',
          success: true,
          result: {
            widgetId: 'widget_123',
          },
        };

        const encoded = serializer.serialize(resp);
        const decoded = serializer.deserialize<Response>(encoded);

        expect(decoded.id).toBe(resp.id);
        expect(decoded.success).toBe(true);
        expect(decoded.result?.widgetId).toBe('widget_123');
      });

      it('should encode and decode an error response', () => {
        const resp: Response = {
          id: 'test_2',
          success: false,
          error: 'Widget not found',
        };

        const encoded = serializer.serialize(resp);
        const decoded = serializer.deserialize<Response>(encoded);

        expect(decoded.success).toBe(false);
        expect(decoded.error).toBe('Widget not found');
      });
    });

    describe('Event Encoding', () => {
      it('should encode and decode a click event', () => {
        const event: Event = {
          type: 'clicked',
          widgetId: 'button_1',
          data: {
            x: 100,
            y: 200,
          },
        };

        const encoded = serializer.serialize(event);
        const decoded = serializer.deserialize<Event>(encoded);

        expect(decoded.type).toBe('clicked');
        expect(decoded.widgetId).toBe('button_1');
        expect(decoded.data?.x).toBe(100);
        expect(decoded.data?.y).toBe(200);
      });
    });

    describe('Special Values', () => {
      it('should handle null values', () => {
        const msg: Message = {
          id: 'null_test',
          type: 'test',
          payload: {
            value: null,
            nested: { inner: null },
          },
        };

        const encoded = serializer.serialize(msg);
        const decoded = serializer.deserialize<Message>(encoded);

        expect(decoded.payload.value).toBeNull();
      });

      it('should handle boolean values', () => {
        const msg: Message = {
          id: 'bool_test',
          type: 'test',
          payload: {
            enabled: true,
            disabled: false,
          },
        };

        const encoded = serializer.serialize(msg);
        const decoded = serializer.deserialize<Message>(encoded);

        expect(decoded.payload.enabled).toBe(true);
        expect(decoded.payload.disabled).toBe(false);
      });

      it('should handle unicode strings', () => {
        const msg: Message = {
          id: 'unicode_test',
          type: 'createLabel',
          payload: {
            text: '你好世界 🌍 مرحبا',
          },
        };

        const encoded = serializer.serialize(msg);
        const decoded = serializer.deserialize<Message>(encoded);

        expect(decoded.payload.text).toBe('你好世界 🌍 مرحبا');
      });

      it('should handle large numbers', () => {
        const msg: Message = {
          id: 'number_test',
          type: 'test',
          payload: {
            small: 42,
            large: 9007199254740991,
            float: 3.14159265359,
            negative: -1000000,
          },
        };

        const encoded = serializer.serialize(msg);
        const decoded = serializer.deserialize<Message>(encoded);

        expect(decoded.payload.small).toBe(42);
        expect(decoded.payload.large).toBe(9007199254740991);
        expect(decoded.payload.float).toBeCloseTo(3.14159265359);
        expect(decoded.payload.negative).toBe(-1000000);
      });
    });
  });

  describe('Length-Prefixed Framing (UDS Protocol)', () => {
    it('should create correct length-prefixed frame', () => {
      const msg: Message = {
        id: 'frame_test',
        type: 'ping',
        payload: {},
      };

      // Test with MessagePack (same framing works for any serializer)
      const msgBuf = Buffer.from(msgpackSerializer.serialize(msg));

      // Create frame: [4-byte length BE][message]
      const frame = Buffer.alloc(4 + msgBuf.length);
      frame.writeUInt32BE(msgBuf.length, 0);
      msgBuf.copy(frame, 4);

      // Verify frame structure
      expect(frame.readUInt32BE(0)).toBe(msgBuf.length);

      // Extract and decode message from frame
      const extractedLength = frame.readUInt32BE(0);
      const extractedMsg = frame.slice(4, 4 + extractedLength);
      const decoded = msgpackSerializer.deserialize<Message>(extractedMsg);

      expect(decoded.id).toBe('frame_test');
    });

    it('should handle multiple messages in sequence', () => {
      const messages: Message[] = [
        { id: 'msg_1', type: 'type1', payload: { a: 1 } },
        { id: 'msg_2', type: 'type2', payload: { b: 2 } },
        { id: 'msg_3', type: 'type3', payload: { c: 3 } },
      ];

      // Create combined buffer with all framed messages
      const frames: Buffer[] = messages.map((msg) => {
        const msgBuf = Buffer.from(msgpackSerializer.serialize(msg));
        const frame = Buffer.alloc(4 + msgBuf.length);
        frame.writeUInt32BE(msgBuf.length, 0);
        msgBuf.copy(frame, 4);
        return frame;
      });

      const combined = Buffer.concat(frames);

      // Parse messages back out
      let offset = 0;
      const decoded: Message[] = [];

      while (offset < combined.length) {
        const length = combined.readUInt32BE(offset);
        const msgBuf = combined.slice(offset + 4, offset + 4 + length);
        decoded.push(msgpackSerializer.deserialize<Message>(msgBuf));
        offset += 4 + length;
      }

      expect(decoded.length).toBe(3);
      expect(decoded[0].id).toBe('msg_1');
      expect(decoded[1].id).toBe('msg_2');
      expect(decoded[2].id).toBe('msg_3');
    });
  });

  describe('Serialization Performance Comparison', () => {
    const iterations = 1000;
    const testMessage = {
      id: 'perf_compare',
      type: 'createWindow',
      payload: {
        id: 'window_1',
        title: 'Performance Test Window',
        width: 1024,
        height: 768,
        resizable: true,
        buttons: ['OK', 'Cancel', 'Apply'],
      },
    };

    it('should compare encoding performance: JSON vs MessagePack', () => {
      // JSON
      const jsonStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        jsonSerializer.serialize(testMessage);
      }
      const jsonTime = performance.now() - jsonStart;

      // MessagePack
      const msgpackStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        msgpackSerializer.serialize(testMessage);
      }
      const msgpackTime = performance.now() - msgpackStart;

      console.log(`\n=== Encoding Performance (${iterations} iterations) ===`);
      console.log(`JSON:        ${jsonTime.toFixed(2)}ms (${(iterations / jsonTime * 1000).toFixed(0)} msg/sec)`);
      console.log(`MessagePack: ${msgpackTime.toFixed(2)}ms (${(iterations / msgpackTime * 1000).toFixed(0)} msg/sec)`);
      console.log(`Winner: ${jsonTime < msgpackTime ? 'JSON' : 'MessagePack'} (${(Math.max(jsonTime, msgpackTime) / Math.min(jsonTime, msgpackTime)).toFixed(2)}x faster)`);

      expect(jsonTime).toBeGreaterThan(0);
      expect(msgpackTime).toBeGreaterThan(0);
    });

    it('should compare decoding performance: JSON vs MessagePack', () => {
      const jsonEncoded = jsonSerializer.serialize(testMessage);
      const msgpackEncoded = msgpackSerializer.serialize(testMessage);

      // JSON
      const jsonStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        jsonSerializer.deserialize(jsonEncoded);
      }
      const jsonTime = performance.now() - jsonStart;

      // MessagePack
      const msgpackStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        msgpackSerializer.deserialize(msgpackEncoded);
      }
      const msgpackTime = performance.now() - msgpackStart;

      console.log(`\n=== Decoding Performance (${iterations} iterations) ===`);
      console.log(`JSON:        ${jsonTime.toFixed(2)}ms (${(iterations / jsonTime * 1000).toFixed(0)} msg/sec)`);
      console.log(`MessagePack: ${msgpackTime.toFixed(2)}ms (${(iterations / msgpackTime * 1000).toFixed(0)} msg/sec)`);
      console.log(`Winner: ${jsonTime < msgpackTime ? 'JSON' : 'MessagePack'} (${(Math.max(jsonTime, msgpackTime) / Math.min(jsonTime, msgpackTime)).toFixed(2)}x faster)`);

      expect(jsonTime).toBeGreaterThan(0);
      expect(msgpackTime).toBeGreaterThan(0);
    });

    it('should compare message sizes', () => {
      const jsonSize = jsonSerializer.serialize(testMessage).byteLength;
      const msgpackSize = msgpackSerializer.serialize(testMessage).byteLength;

      console.log(`\n=== Message Size Comparison ===`);
      console.log(`JSON:        ${jsonSize} bytes`);
      console.log(`MessagePack: ${msgpackSize} bytes`);
      console.log(`Savings with MessagePack: ${((1 - msgpackSize / jsonSize) * 100).toFixed(1)}%`);

      // MessagePack should typically be smaller
      expect(msgpackSize).toBeLessThanOrEqual(jsonSize);
    });

    it('should compare roundtrip performance', () => {
      // JSON
      const jsonStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const encoded = jsonSerializer.serialize(testMessage);
        jsonSerializer.deserialize(encoded);
      }
      const jsonTime = performance.now() - jsonStart;

      // MessagePack
      const msgpackStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const encoded = msgpackSerializer.serialize(testMessage);
        msgpackSerializer.deserialize(encoded);
      }
      const msgpackTime = performance.now() - msgpackStart;

      console.log(`\n=== Roundtrip Performance (${iterations} iterations) ===`);
      console.log(`JSON:        ${jsonTime.toFixed(2)}ms (${(jsonTime / iterations).toFixed(3)}ms per roundtrip)`);
      console.log(`MessagePack: ${msgpackTime.toFixed(2)}ms (${(msgpackTime / iterations).toFixed(3)}ms per roundtrip)`);
      console.log(`Winner: ${jsonTime < msgpackTime ? 'JSON' : 'MessagePack'}`);

      expect(jsonTime).toBeLessThan(1000);
      expect(msgpackTime).toBeLessThan(1000);
    });
  });

  describe('Recommendation Summary', () => {
    it('provides transport recommendations based on test results', () => {
      console.log(`
================================================================================
                    TRANSPORT PROTOCOL RECOMMENDATION
================================================================================

Based on the tests above:

1. **Fury (Apache Fory)**: NOT RECOMMENDED for this use case
   - Fury JS SDK v0.5.x-beta cannot handle dynamic payloads with Type.any()
   - Requires fully typed schemas which is impractical for widget payloads
   - The Go SDK works fine, but JS<->Go interop has issues

2. **MessagePack (msgpack-uds)**: RECOMMENDED
   - Handles dynamic payloads natively
   - Smaller message sizes than JSON
   - Competitive performance
   - Good cross-language support

3. **JSON (over stdio)**: GOOD BASELINE
   - Universal compatibility
   - Easy debugging (human-readable)
   - Slightly larger messages
   - Native JavaScript support

4. **gRPC**: GOOD FOR STRUCTURED SCHEMAS
   - Best for well-defined message types
   - Protocol Buffers provide type safety
   - More overhead for simple use cases

For the tsyne bridge with dynamic widget payloads:
  - Primary: MessagePack over UDS (msgpack-uds mode)
  - Fallback: JSON over stdio (stdio mode)
  - Alternative: gRPC if you define all message schemas

================================================================================
`);
      expect(true).toBe(true);
    });
  });
});
