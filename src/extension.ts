import * as vscode from 'vscode';
import { PreviewPanel } from './webview/previewPanel';
import { WebSocketClient } from './websocket/client';
import { Logger } from './utils/logger';

let previewPanel: PreviewPanel | undefined;
let webSocketClient: WebSocketClient | undefined;

export function activate(context: vscode.ExtensionContext) {
    Logger.info('HarmonyOS Previewer extension is being activated');

    // 注册命令
    const startCommand = vscode.commands.registerCommand('harmonyPreviewer.start', async () => {
        await startPreviewer(context);
    });

    const stopCommand = vscode.commands.registerCommand('harmonyPreviewer.stop', async () => {
        await stopPreviewer();
    });

    const refreshCommand = vscode.commands.registerCommand('harmonyPreviewer.refresh', async () => {
        if (webSocketClient && webSocketClient.isConnected()) {
            await webSocketClient.sendRefreshCommand();
        }
    });

    const screenshotCommand = vscode.commands.registerCommand('harmonyPreviewer.screenshot', async () => {
        if (previewPanel) {
            await previewPanel.takeScreenshot();
        }
    });

    // 监听配置变化
    const configChangeListener = vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('harmonyPreviewer')) {
            Logger.info('Configuration changed, restarting if needed');
            if (webSocketClient && webSocketClient.isConnected()) {
                restartPreviewer(context);
            }
        }
    });

    // 监听文件保存
    const fileSaveListener = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        const config = vscode.workspace.getConfiguration('harmonyPreviewer');
        if (config.get('autoRefresh') && document.fileName.endsWith('.ets')) {
            Logger.info(`File saved: ${document.fileName}, refreshing preview`);
            if (webSocketClient && webSocketClient.isConnected()) {
                webSocketClient.sendRefreshCommand();
            }
        }
    });

    context.subscriptions.push(
        startCommand,
        stopCommand,
        refreshCommand,
        screenshotCommand,
        configChangeListener,
        fileSaveListener
    );

    // 设置上下文状态
    vscode.commands.executeCommand('setContext', 'harmonyPreviewer.active', false);

    Logger.info('HarmonyOS Previewer extension activated successfully');
}

async function startPreviewer(context: vscode.ExtensionContext) {
    try {
        if (previewPanel) {
            previewPanel.reveal();
            return;
        }

        // 创建预览面板
        previewPanel = new PreviewPanel(context);
        
        // 监听面板关闭
        previewPanel.onDidDispose(() => {
            previewPanel = undefined;
            stopPreviewer();
        });

        // 创建WebSocket客户端
        const config = vscode.workspace.getConfiguration('harmonyPreviewer');
        const host = config.get<string>('websocket.host', '127.0.0.1');
        const port = config.get<number>('websocket.port', 5577);

        webSocketClient = new WebSocketClient(host, port);
        
        // 设置WebSocket事件监听
        webSocketClient.onImageReceived((imageData) => {
            if (previewPanel) {
                previewPanel.updateImage(imageData);
            }
        });

        webSocketClient.onStatusChanged((status) => {
            if (previewPanel) {
                previewPanel.updateStatus(status);
            }
        });

        webSocketClient.onError((error) => {
            Logger.error(`WebSocket error: ${error.message}`);
            vscode.window.showErrorMessage(`预览器连接错误: ${error.message}`);
        });

        // 连接到预览器组件
        if (config.get('autoConnect')) {
            await webSocketClient.connect();
        }

        vscode.commands.executeCommand('setContext', 'harmonyPreviewer.active', true);
        vscode.window.showInformationMessage('HarmonyOS预览器已启动');

    } catch (error) {
        Logger.error(`Failed to start previewer: ${error}`);
        vscode.window.showErrorMessage(`启动预览器失败: ${error}`);
    }
}

async function stopPreviewer() {
    try {
        if (webSocketClient) {
            await webSocketClient.disconnect();
            webSocketClient = undefined;
        }

        if (previewPanel) {
            previewPanel.dispose();
            previewPanel = undefined;
        }

        vscode.commands.executeCommand('setContext', 'harmonyPreviewer.active', false);
        vscode.window.showInformationMessage('HarmonyOS预览器已停止');

    } catch (error) {
        Logger.error(`Failed to stop previewer: ${error}`);
        vscode.window.showErrorMessage(`停止预览器失败: ${error}`);
    }
}

async function restartPreviewer(context: vscode.ExtensionContext) {
    await stopPreviewer();
    setTimeout(() => {
        startPreviewer(context);
    }, 1000);
}

export function deactivate() {
    Logger.info('HarmonyOS Previewer extension is being deactivated');
    stopPreviewer();
}
