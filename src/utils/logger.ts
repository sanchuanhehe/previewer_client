import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel | undefined;

    private static getChannel(): vscode.OutputChannel {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('HarmonyOS Previewer');
        }
        return this.outputChannel;
    }

    static info(message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] INFO: ${message}`;
        this.getChannel().appendLine(logMessage);
        // console.log(logMessage);
    }

    static warn(message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] WARN: ${message}`;
        this.getChannel().appendLine(logMessage);
        // console.warn(logMessage);
    }

    static error(message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}`;
        this.getChannel().appendLine(logMessage);
        // console.error(logMessage);
    }

    static show(): void {
        this.getChannel().show();
    }

    static dispose(): void {
        if (this.outputChannel) {
            this.outputChannel.dispose();
            this.outputChannel = undefined;
        }
    }
}
