import * as vscode from 'vscode';
import { PreviewImageData, ConnectionStatus } from '../shared/types';
import { ImageProcessor } from '../websocket/imageProcessor';
import { Logger } from '../utils/logger';

export class PreviewPanel {
    public static readonly viewType = 'harmonyPreviewer.preview';
    
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionContext: vscode.ExtensionContext;
    private readonly imageProcessor: ImageProcessor;
    private disposables: vscode.Disposable[] = [];
    private currentImageData: PreviewImageData | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.imageProcessor = new ImageProcessor();

        // 创建WebView面板
        this.panel = vscode.window.createWebviewPanel(
            PreviewPanel.viewType,
            'HarmonyOS预览器',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media'),
                    vscode.Uri.joinPath(context.extensionUri, 'out')
                ]
            }
        );

        // 设置WebView内容
        this.panel.webview.html = this.getWebviewContent();

        // 监听WebView消息
        this.panel.webview.onDidReceiveMessage(
            (message) => this.handleWebviewMessage(message),
            null,
            this.disposables
        );

        // 监听面板关闭
        this.panel.onDidDispose(
            () => this.dispose(),
            null,
            this.disposables
        );

        Logger.info('Preview panel created');
    }

    public updateImage(imageData: PreviewImageData): void {
        try {
            this.currentImageData = imageData;
            const dataUrl = this.imageProcessor.convertToDataUrl(imageData);
            
            this.panel.webview.postMessage({
                type: 'updateImage',
                data: {
                    imageUrl: dataUrl,
                    width: imageData.width,
                    height: imageData.height,
                    format: imageData.format,
                    timestamp: imageData.timestamp
                }
            });

            Logger.info(`Image updated: ${imageData.width}x${imageData.height}`);
        } catch (error) {
            Logger.error(`Failed to update image: ${error}`);
        }
    }

    public updateStatus(status: ConnectionStatus): void {
        this.panel.webview.postMessage({
            type: 'updateStatus',
            data: { status }
        });
    }

    public async takeScreenshot(): Promise<void> {
        if (!this.currentImageData) {
            vscode.window.showWarningMessage('没有可用的图像数据');
            return;
        }

        try {
            const options: vscode.SaveDialogOptions = {
                defaultUri: vscode.Uri.file(`screenshot_${Date.now()}.${this.currentImageData.format}`),
                filters: {
                    'Images': ['jpg', 'jpeg', 'png']
                }
            };

            const uri = await vscode.window.showSaveDialog(options);
            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(this.currentImageData.data));
                vscode.window.showInformationMessage(`截图已保存到: ${uri.fsPath}`);
            }
        } catch (error) {
            Logger.error(`Failed to save screenshot: ${error}`);
            vscode.window.showErrorMessage(`保存截图失败: ${error}`);
        }
    }

    public reveal(): void {
        this.panel.reveal();
    }

    public dispose(): void {
        Logger.info('Disposing preview panel');
        
        // 清理资源
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }

        this.panel.dispose();
    }

    public onDidDispose(callback: () => void): void {
        this.panel.onDidDispose(callback);
    }

    private handleWebviewMessage(message: { type: string; data?: unknown }): void {
        switch (message.type) {
            case 'ready':
                Logger.info('WebView is ready');
                // 发送初始状态
                this.updateStatus(ConnectionStatus.Disconnected);
                break;
                
            case 'refresh':
                vscode.commands.executeCommand('harmonyPreviewer.refresh');
                break;
                
            case 'screenshot':
                this.takeScreenshot();
                break;
                
            case 'error':
                Logger.error(`WebView error: ${message.data}`);
                break;
                
            default:
                Logger.warn(`Unknown message type: ${message.type}`);
        }
    }

    private getWebviewContent(): string {
        const scriptUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionContext.extensionUri, 'media', 'webview.js')
        );
        
        const styleUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionContext.extensionUri, 'media', 'webview.css')
        );

        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
          img-src ${this.panel.webview.cspSource} data: https:; 
          script-src 'nonce-${nonce}';
          style-src ${this.panel.webview.cspSource} 'unsafe-inline';">
    <link href="${styleUri}" rel="stylesheet">
    <title>HarmonyOS预览器</title>
</head>
<body>
    <div class="container">
        <div class="toolbar">
            <button id="refreshBtn" class="btn" title="刷新预览">
                <span class="icon">🔄</span>
                刷新
            </button>
            <button id="screenshotBtn" class="btn" title="截图">
                <span class="icon">📷</span>
                截图
            </button>
            <div class="status-indicator">
                <span id="statusText">未连接</span>
                <div id="statusDot" class="status-dot offline"></div>
            </div>
        </div>
        
        <div class="preview-area">
            <div id="imageContainer" class="image-container">
                <div id="placeholder" class="placeholder">
                    <div class="placeholder-icon">📱</div>
                    <div class="placeholder-text">等待预览内容...</div>
                </div>
                <img id="previewImage" class="preview-image" style="display: none;" />
            </div>
            
            <div class="image-info">
                <span id="imageInfo"></span>
            </div>
        </div>
    </div>
    
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
