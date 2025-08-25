import * as assert from 'assert';
import { ImageProcessor } from '../../websocket/imageProcessor';
import { PreviewImageData } from '../../shared/types';

suite('WebSocket Module Test Suite', () => {
    
    test('ImageProcessor - should create processor instance', () => {
        const processor = new ImageProcessor();
        assert.ok(processor);
    });

    test('ImageProcessor - should validate valid image data', () => {
        const processor = new ImageProcessor();
        
        const validImageData: PreviewImageData = {
            width: 100,
            height: 200,
            format: 'png',
            data: new Uint8Array([1, 2, 3, 4]),
            timestamp: Date.now()
        };
        
        const result = processor.validateImageData(validImageData);
        assert.strictEqual(result, true);
    });

    test('ImageProcessor - should reject invalid image data', () => {
        const processor = new ImageProcessor();
        
        const invalidImageData: PreviewImageData = {
            width: -1, // invalid width
            height: 200,
            format: 'png',
            data: new Uint8Array([1, 2, 3, 4]),
            timestamp: Date.now()
        };
        
        const result = processor.validateImageData(invalidImageData);
        assert.strictEqual(result, false);
    });

    test('ImageProcessor - should convert valid image data to data URL', () => {
        const processor = new ImageProcessor();
        
        const testImageData: PreviewImageData = {
            width: 100,
            height: 200,
            format: 'png',
            data: new Uint8Array([1, 2, 3, 4]),
            timestamp: Date.now()
        };
        
        const result = processor.convertToDataUrl(testImageData);
        assert.ok(result.startsWith('data:image/png;base64,'));
    });

    test('ImageProcessor - should handle JPEG format', () => {
        const processor = new ImageProcessor();
        
        const jpegImageData: PreviewImageData = {
            width: 100,
            height: 200,
            format: 'jpg',
            data: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]),
            timestamp: Date.now()
        };
        
        const result = processor.convertToDataUrl(jpegImageData);
        assert.ok(result.startsWith('data:image/jpeg;base64,'));
    });

    test('ImageProcessor - should handle RGBA format with fallback', () => {
        const processor = new ImageProcessor();
        
        const rgbaImageData: PreviewImageData = {
            width: 100,
            height: 200,
            format: 'rgba',
            data: new Uint8Array([255, 255, 255, 255]),
            timestamp: Date.now()
        };
        
        const result = processor.convertToDataUrl(rgbaImageData);
        assert.ok(result.startsWith('data:image/png;base64,'));
    });

    test('ImageProcessor - should parse valid binary data', () => {
        const processor = new ImageProcessor();
        
        // Create a buffer with the expected magic number and header
        const MAGIC_NUMBER = 0x12345678;
        const HEADER_SIZE = 40;
        const buffer = Buffer.alloc(HEADER_SIZE + 4);
        
        // Write header
        buffer.writeUInt32LE(MAGIC_NUMBER, 0); // magic number
        buffer.writeInt32LE(100, 4);           // width
        buffer.writeInt32LE(200, 8);           // height
        
        // Write some image data
        buffer.writeUInt8(0xFF, HEADER_SIZE);
        buffer.writeUInt8(0xD8, HEADER_SIZE + 1);
        buffer.writeUInt8(0xFF, HEADER_SIZE + 2);
        buffer.writeUInt8(0xE0, HEADER_SIZE + 3);
        
        const result = processor.parseImageData(buffer);
        
        assert.ok(result !== null);
        if (result) {
            assert.strictEqual(result.width, 100);
            assert.strictEqual(result.height, 200);
            assert.strictEqual(result.format, 'jpg'); // Should detect JPEG from header
            assert.strictEqual(result.data.length, 4);
        }
    });

    test('ImageProcessor - should reject invalid buffer', () => {
        const processor = new ImageProcessor();
        
        // Create a buffer that's too small
        const smallBuffer = Buffer.alloc(10);
        const result = processor.parseImageData(smallBuffer);
        
        assert.strictEqual(result, null);
    });

    test('ImageProcessor - should reject wrong magic number', () => {
        const processor = new ImageProcessor();
        
        const buffer = Buffer.alloc(40);
        buffer.writeUInt32LE(0x87654321, 0); // wrong magic number
        
        const result = processor.parseImageData(buffer);
        assert.strictEqual(result, null);
    });

    test('Logger - should create logger instance', () => {
        const { Logger } = require('../../utils/logger');
        const logger = new Logger('test');
        
        assert.ok(logger);
    });

    test('Types - should validate PreviewImageData interface', () => {
        const testImageData: PreviewImageData = {
            width: 360,
            height: 780,
            format: 'png',
            data: new Uint8Array([1, 2, 3, 4]),
            timestamp: Date.now()
        };
        
        assert.strictEqual(testImageData.width, 360);
        assert.strictEqual(testImageData.height, 780);
        assert.strictEqual(testImageData.format, 'png');
        assert.ok(testImageData.data instanceof Uint8Array);
        assert.ok(typeof testImageData.timestamp === 'number');
    });
});
