export interface PreviewImageData {
    width: number;
    height: number;
    format: 'jpg' | 'png' | 'rgba';
    data: Uint8Array;
    timestamp: number;
}

export interface ImageFrame {
    header: {
        magic: number;      // 0x12345678
        width: number;
        height: number;
        format: 'jpg' | 'png' | 'rgba';
        timestamp: number;
    };
    data: Uint8Array;
}

export interface Command {
    type: 'resolution' | 'orientation' | 'input' | 'refresh';
    data: Record<string, unknown>;
    timestamp: number;
}

export enum ConnectionStatus {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Error = 'error'
}

export interface DeviceConfig {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    devicePixelRatio: number;
}

export interface PreviewSettings {
    autoRefresh: boolean;
    autoConnect: boolean;
    websocket: {
        host: string;
        port: number;
    };
    device: DeviceConfig;
}
