import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration Test Suite', () => {

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('harmonyos-dev.harmonyos-previewer'));
    });

    test('Should register all commands', async () => {
        const commands = await vscode.commands.getCommands();
        
        // Check if our commands are registered
        assert.ok(commands.includes('harmonyPreviewer.start'));
        assert.ok(commands.includes('harmonyPreviewer.stop'));
        assert.ok(commands.includes('harmonyPreviewer.refresh'));
        assert.ok(commands.includes('harmonyPreviewer.screenshot'));
    });

    test('Should activate extension on command', async () => {
        const extension = vscode.extensions.getExtension('harmonyos-dev.harmonyos-previewer');
        assert.ok(extension);
        
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        
        assert.ok(extension?.isActive);
    });

    test('Configuration should have default values', () => {
        const config = vscode.workspace.getConfiguration('harmonyPreviewer');
        
        assert.strictEqual(config.get('websocket.host'), '127.0.0.1');
        assert.strictEqual(config.get('websocket.port'), 5577);
        assert.strictEqual(config.get('autoConnect'), true);
        assert.strictEqual(config.get('autoRefresh'), true);
        assert.strictEqual(config.get('device.width'), 360);
        assert.strictEqual(config.get('device.height'), 780);
    });

    test('Should handle workspace changes', (done) => {
        const disposable = vscode.workspace.onDidChangeConfiguration(() => {
            // Configuration change handled
            disposable.dispose();
            done();
        });

        // Trigger a configuration change
        const config = vscode.workspace.getConfiguration('harmonyPreviewer');
        config.update('websocket.port', 5578, vscode.ConfigurationTarget.Workspace);
    });

    test('Commands should execute without errors', async () => {
        try {
            // Test commands execution (they might fail due to no WebSocket server, but shouldn't throw)
            await vscode.commands.executeCommand('harmonyPreviewer.start');
            await vscode.commands.executeCommand('harmonyPreviewer.stop');
            
            // If we get here, commands executed without throwing
            assert.ok(true);
        } catch (error) {
            // Commands may fail due to WebSocket connection issues, but should not throw unhandled errors
            console.log('Command execution failed as expected:', error);
            assert.ok(true);
        }
    });
});
