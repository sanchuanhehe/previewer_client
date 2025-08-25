import { PreviewImageData } from '../shared/types';
import { Logger } from '../utils/logger';

export class ImageProcessor {
    private readonly MAGIC_NUMBER = 0x12345678;
    private readonly HEADER_SIZE = 40;

    parseImageData(buffer: Buffer): PreviewImageData | null {
        try {
            if (buffer.length < this.HEADER_SIZE) {
                Logger.warn('Buffer too small for header');
                return null;
            }

            // 解析头部信息
            const magic = buffer.readUInt32LE(0);
            if (magic !== this.MAGIC_NUMBER) {
                Logger.warn(`Invalid magic number: 0x${magic.toString(16)}`);
                return null;
            }

            const width = buffer.readInt32LE(4);
            const height = buffer.readInt32LE(8);
            // const originalWidth = buffer.readInt32LE(12);
            // const originalHeight = buffer.readInt32LE(16);

            // 检查是否有足够的数据
            const imageDataSize = buffer.length - this.HEADER_SIZE;
            if (imageDataSize <= 0) {
                Logger.warn('No image data found');
                return null;
            }

            // 提取图像数据
            const imageData = buffer.slice(this.HEADER_SIZE);

            // 判断图像格式
            let format: 'jpg' | 'png' | 'rgba' = 'rgba';
            if (this.isJpegData(imageData)) {
                format = 'jpg';
            } else if (this.isPngData(imageData)) {
                format = 'png';
            }

            Logger.info(`Parsed image: ${width}x${height}, format: ${format}, size: ${imageDataSize} bytes`);

            return {
                width,
                height,
                format,
                data: new Uint8Array(imageData),
                timestamp: Date.now()
            };

        } catch (error) {
            Logger.error(`Failed to parse image data: ${error}`);
            return null;
        }
    }

    private isJpegData(buffer: Buffer): boolean {
        // JPEG文件以 FF D8 开头
        return buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xD8;
    }

    private isPngData(buffer: Buffer): boolean {
        // PNG文件以 89 50 4E 47 开头
        return buffer.length >= 4 && 
               buffer[0] === 0x89 && 
               buffer[1] === 0x50 && 
               buffer[2] === 0x4E && 
               buffer[3] === 0x47;
    }

    convertToDataUrl(imageData: PreviewImageData): string {
        try {
            const base64Data = Buffer.from(imageData.data).toString('base64');
            
            switch (imageData.format) {
                case 'jpg':
                    return `data:image/jpeg;base64,${base64Data}`;
                case 'png':
                    return `data:image/png;base64,${base64Data}`;
                case 'rgba':
                    // 对于RGBA数据，我们需要创建一个canvas来转换
                    return this.convertRgbaToDataUrl();
                default:
                    throw new Error(`Unsupported image format: ${imageData.format}`);
            }
        } catch (error) {
            Logger.error(`Failed to convert image to data URL: ${error}`);
            throw error;
        }
    }

    private convertRgbaToDataUrl(): string {
        // 这里可以实现RGBA到PNG的转换
        // 暂时返回一个占位符
        Logger.warn('RGBA to data URL conversion not implemented yet');
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }

    validateImageData(imageData: PreviewImageData): boolean {
        return imageData.width > 0 && 
               imageData.height > 0 && 
               imageData.data.length > 0 &&
               ['jpg', 'png', 'rgba'].includes(imageData.format);
    }
}
