import * as assert from 'assert';
import { Logger } from '../../utils/logger';

suite('Utils Test Suite', () => {

    test('Logger - should be a static class', () => {
        assert.ok(Logger);
        assert.strictEqual(typeof Logger.info, 'function');
        assert.strictEqual(typeof Logger.warn, 'function');
        assert.strictEqual(typeof Logger.error, 'function');
    });

    test('Logger - should log info messages', () => {
        // Logger.info should not throw
        assert.doesNotThrow(() => {
            Logger.info('Test info message');
        });
    });

    test('Logger - should log warning messages', () => {
        // Logger.warn should not throw
        assert.doesNotThrow(() => {
            Logger.warn('Test warning message');
        });
    });

    test('Logger - should log error messages', () => {
        // Logger.error should not throw
        assert.doesNotThrow(() => {
            Logger.error('Test error message');
        });
    });

    test('Logger - should have show method', () => {
        assert.strictEqual(typeof Logger.show, 'function');
        
        // Logger.show should not throw
        assert.doesNotThrow(() => {
            Logger.show();
        });
    });

    test('Logger - should have dispose method', () => {
        assert.strictEqual(typeof Logger.dispose, 'function');
        
        // Logger.dispose should not throw
        assert.doesNotThrow(() => {
            Logger.dispose();
        });
    });

    test('Logger - should handle string messages correctly', () => {
        const testMessages = [
            'Simple message',
            'Message with numbers: 123',
            'Message with special chars: !@#$%^&*()',
            '中文消息测试'
        ];
        
        testMessages.forEach(message => {
            assert.doesNotThrow(() => {
                Logger.info(message);
                Logger.warn(message);
                Logger.error(message);
            });
        });
    });
});
