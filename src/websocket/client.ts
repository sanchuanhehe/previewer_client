import WebSocket from 'ws';
import { Logger } from '../utils/logger';
import { PreviewImageData, ConnectionStatus, Command } from '../shared/types';
import { ImageProcessor } from './imageProcessor';

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private host: string;
    private port: number;
    private imageProcessor: ImageProcessor;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly reconnectInterval = 3000; // 3秒重连

    // 事件回调
    private onImageReceivedCallback?: (imageData: PreviewImageData) => void;
    private onStatusChangedCallback?: (status: ConnectionStatus) => void;
    private onErrorCallback?: (error: Error) => void;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
        this.imageProcessor = new ImageProcessor();
    }

    async connect(): Promise<void> {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                Logger.warn('WebSocket is already connected');
                return;
            }

            Logger.info(`Connecting to WebSocket server at ${this.host}:${this.port}`);
            
            const url = `ws://${this.host}:${this.port}`;
            this.ws = new WebSocket(url);

            if (this.ws) {
                this.ws.on('open', () => {
                    Logger.info('WebSocket connected successfully');
                    this.onStatusChangedCallback?.(ConnectionStatus.Connected);
                    this.clearReconnectTimer();
                });

                this.ws.on('message', (data: WebSocket.Data) => {
                    this.handleMessage(data);
                });

                this.ws.on('error', (error: Error) => {
                    Logger.error(`WebSocket error: ${error.message}`);
                    this.onErrorCallback?.(error);
                    this.onStatusChangedCallback?.(ConnectionStatus.Error);
                });

                this.ws.on('close', (code: number, reason: Buffer) => {
                    Logger.warn(`WebSocket connection closed: ${code} - ${reason.toString()}`);
                    this.onStatusChangedCallback?.(ConnectionStatus.Disconnected);
                    this.scheduleReconnect();
                });
            }

        } catch (error) {
            Logger.error(`Failed to connect WebSocket: ${error}`);
            this.onErrorCallback?.(error as Error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.clearReconnectTimer();
        
        if (this.ws) {
            Logger.info('Disconnecting WebSocket');
            this.ws.close();
            this.ws = null;
        }
        
        this.onStatusChangedCallback?.(ConnectionStatus.Disconnected);
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    async sendCommand(command: Command): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('WebSocket is not connected');
        }

        try {
            const message = JSON.stringify(command);
            this.ws!.send(message);
            Logger.info(`Command sent: ${command.type}`);
        } catch (error) {
            Logger.error(`Failed to send command: ${error}`);
            throw error;
        }
    }

    async sendRefreshCommand(): Promise<void> {
        const command: Command = {
            type: 'refresh',
            data: {},
            timestamp: Date.now()
        };
        await this.sendCommand(command);
    }

    async sendResolutionChange(width: number, height: number): Promise<void> {
        const command: Command = {
            type: 'resolution',
            data: { width, height },
            timestamp: Date.now()
        };
        await this.sendCommand(command);
    }

    private handleMessage(data: WebSocket.Data): void {
        try {
            if (Buffer.isBuffer(data)) {
                // 处理二进制图像数据
                const imageData = this.imageProcessor.parseImageData(data);
                if (imageData) {
                    this.onImageReceivedCallback?.(imageData);
                }
            } else {
                // 处理文本消息
                const message = data.toString();
                Logger.info(`Received text message: ${message}`);
                // 可以在这里处理其他类型的消息
            }
        } catch (error) {
            Logger.error(`Failed to handle message: ${error}`);
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return;
        }

        Logger.info(`Scheduling reconnect in ${this.reconnectInterval}ms`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect().catch((error) => {
                Logger.error(`Reconnection failed: ${error}`);
            });
        }, this.reconnectInterval);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    // 事件监听器
    onImageReceived(callback: (imageData: PreviewImageData) => void): void {
        this.onImageReceivedCallback = callback;
    }

    onStatusChanged(callback: (status: ConnectionStatus) => void): void {
        this.onStatusChangedCallback = callback;
    }

    onError(callback: (error: Error) => void): void {
        this.onErrorCallback = callback;
    }
}
