#!/usr/bin/env node

/**
 * OpenHarmony SDK 下载和Previewer安装脚本
 * 下载地址: https://repo.huaweicloud.com/openharmony/os/5.1.0-Release/ohos-sdk-windows_linux-public.tar.gz
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PreviewerSDKManager {
    constructor() {
        this.sdkUrl = 'https://repo.huaweicloud.com/openharmony/os/5.1.0-Release/ohos-sdk-windows_linux-public.tar.gz';
        this.downloadDir = path.join(__dirname, '..', '.sdk-cache');
        this.sdkArchive = path.join(this.downloadDir, 'ohos-sdk.tar.gz');
        this.extractDir = path.join(this.downloadDir, 'extracted');
        this.previewerPath = null;
        
        // 确保下载目录存在
        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }
    }

    /**
     * 下载SDK文件
     */
    async downloadSDK() {
        console.log('🔄 正在下载OpenHarmony SDK...');
        console.log(`📦 下载地址: ${this.sdkUrl}`);
        
        // 检查是否已经下载
        if (fs.existsSync(this.sdkArchive)) {
            const stats = fs.statSync(this.sdkArchive);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ SDK文件已存在 (${fileSizeMB}MB)，跳过下载`);
            return;
        }

        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(this.sdkArchive);
            let downloadedBytes = 0;
            
            const request = https.get(this.sdkUrl, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`下载失败，HTTP状态码: ${response.statusCode}`));
                    return;
                }

                const totalBytes = parseInt(response.headers['content-length'], 10);
                const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
                
                console.log(`📊 文件大小: ${totalMB}MB`);

                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(2);
                    const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
                    
                    // 显示下载进度
                    process.stdout.write(`\r⏬ 下载进度: ${downloadedMB}MB / ${totalMB}MB (${progress}%)`);
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log('\n✅ SDK下载完成');
                    resolve();
                });
            });

            request.on('error', (err) => {
                fs.unlink(this.sdkArchive, () => {}); // 删除不完整的文件
                reject(new Error(`下载错误: ${err.message}`));
            });

            file.on('error', (err) => {
                fs.unlink(this.sdkArchive, () => {});
                reject(new Error(`文件写入错误: ${err.message}`));
            });
        });
    }

    /**
     * 解压SDK文件（处理嵌套压缩包）
     */
    async extractSDK() {
        console.log('🔄 正在解压SDK...');
        
        // 检查是否已经解压
        if (fs.existsSync(this.extractDir) && fs.readdirSync(this.extractDir).length > 0) {
            console.log('✅ SDK已解压，跳过解压步骤');
            return;
        }

        // 确保解压目录存在
        if (!fs.existsSync(this.extractDir)) {
            fs.mkdirSync(this.extractDir, { recursive: true });
        }

        try {
            // 第一层解压：解压主压缩包
            console.log('📦 解压主压缩包...');
            await execAsync(
                `tar -xzf "${this.sdkArchive}" -C "${this.extractDir}"`,
                { maxBuffer: 1024 * 1024 * 100 } // 100MB buffer
            );
            
            // 查找嵌套的压缩包
            const findNestedArchives = (dir, depth = 0) => {
                if (depth > 3) return []; // 限制搜索深度
                
                const archives = [];
                try {
                    const items = fs.readdirSync(dir);
                    
                    for (const item of items) {
                        const fullPath = path.join(dir, item);
                        const stat = fs.statSync(fullPath);
                        
                        if (stat.isFile() && (item.endsWith('.tar.gz') || item.endsWith('.tgz') || item.endsWith('.zip'))) {
                            archives.push(fullPath);
                        } else if (stat.isDirectory() && !item.startsWith('.')) {
                            archives.push(...findNestedArchives(fullPath, depth + 1));
                        }
                    }
                } catch (e) {
                    // 忽略访问错误
                }
                
                return archives;
            };

            // 查找所有嵌套压缩包
            const nestedArchives = findNestedArchives(this.extractDir);
            console.log(`🔍 找到 ${nestedArchives.length} 个嵌套压缩包`);

            // 解压所有嵌套压缩包
            for (const archive of nestedArchives) {
                console.log(`📦 解压嵌套压缩包: ${path.basename(archive)}`);
                const archiveDir = path.dirname(archive);
                
                try {
                    if (archive.endsWith('.zip')) {
                        // 处理ZIP文件
                        await execAsync(`unzip -q "${archive}" -d "${archiveDir}"`);
                    } else {
                        // 处理tar.gz文件
                        await execAsync(`tar -xzf "${archive}" -C "${archiveDir}"`);
                    }
                    
                    // 删除已解压的压缩包以节省空间
                    fs.unlinkSync(archive);
                    console.log(`✅ 已解压并删除: ${path.basename(archive)}`);
                } catch (error) {
                    console.warn(`⚠️  解压 ${path.basename(archive)} 失败: ${error.message}`);
                }
            }
            
            console.log('✅ SDK解压完成（包括嵌套压缩包）');
        } catch (error) {
            throw new Error(`解压失败: ${error.message}`);
        }
    }

    /**
     * 查找Previewer可执行文件
     */
    async findPreviewerExecutable() {
        console.log('🔍 正在查找Previewer可执行文件...');
        
        // 递归搜索previewer可执行文件
        const findExecutable = (dir, depth = 0) => {
            if (depth > 8) return null; // 增加搜索深度以处理嵌套结构
            
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isFile()) {
                        // 检查各种可能的previewer可执行文件名
                        const executableNames = [
                            'previewer',
                            'previewer.exe', 
                            'Previewer',
                            'Previewer.exe'
                        ];
                        
                        if (executableNames.includes(item)) {
                            console.log(`🎯 发现可能的可执行文件: ${fullPath}`);
                            
                            // 检查是否有执行权限
                            try {
                                fs.accessSync(fullPath, fs.constants.X_OK);
                                return fullPath;
                            } catch (e) {
                                // 尝试添加执行权限
                                try {
                                    fs.chmodSync(fullPath, '755');
                                    console.log(`🔧 已添加执行权限: ${fullPath}`);
                                    return fullPath;
                                } catch (chmodError) {
                                    console.warn(`⚠️  无法设置执行权限: ${fullPath}`);
                                }
                            }
                        }
                    } else if (stat.isDirectory() && !item.startsWith('.')) {
                        // 优先搜索可能包含previewer的目录
                        const priorityDirs = ['previewer', 'bin', 'tools'];
                        const isPriorityDir = priorityDirs.some(dir => item.toLowerCase().includes(dir));
                        
                        if (isPriorityDir || depth < 5) {
                            const found = findExecutable(fullPath, depth + 1);
                            if (found) return found;
                        }
                    }
                }
            } catch (e) {
                // 忽略访问错误
            }
            
            return null;
        };

        // 首先搜索标准路径
        console.log('📂 搜索SDK目录结构...');
        this.previewerPath = findExecutable(this.extractDir);
        
        if (this.previewerPath) {
            console.log(`✅ 找到Previewer: ${this.previewerPath}`);
            return this.previewerPath;
        }
        
        throw new Error('❌ 未找到Previewer可执行文件。请检查SDK是否包含Previewer组件。');
    }

    /**
     * 检查并安装系统依赖
     */
    async checkAndInstallDependencies() {
        console.log('🔍 检查系统依赖...');
        
        // 检查是否为Linux系统
        if (process.platform !== 'linux') {
            console.log('⚠️  非Linux系统，跳过依赖检查');
            return;
        }

        try {
            // 先安装Qt和其他基础依赖
            await this.installCommonQtDependencies();
            
            // 创建必要的符号链接
            await this.createSymbolicLinks();
            
            // 使用ldd检查Previewer的依赖
            console.log('🔍 分析Previewer依赖...');
            const { stdout: lddOutput } = await execAsync(`ldd "${this.previewerPath}"`, {
                timeout: 10000
            });
            
            const missingLibs = [];
            const lddLines = lddOutput.split('\n');
            
            for (const line of lddLines) {
                if (line.includes('not found')) {
                    const libName = line.split('=>')[0].trim();
                    missingLibs.push(libName);
                    console.log(`❌ 缺失: ${libName}`);
                }
            }

            if (missingLibs.length > 0) {
                console.log(`\n🔧 尝试安装缺失的依赖库...`);
                await this.installMissingLibraries(missingLibs);
            } else {
                console.log('✅ 所有依赖库都已满足');
            }

        } catch (error) {
            console.log(`⚠️  依赖检查失败: ${error.message}`);
            console.log('💡 将尝试安装常见的Qt依赖');
            await this.installCommonQtDependencies();
        }
    }

    /**
     * 创建必要的符号链接
     */
    async createSymbolicLinks() {
        console.log('🔗 创建必要的符号链接...');
        
        const previewerBinDir = path.dirname(this.previewerPath);
        
        try {
            // 创建libhilog.so符号链接
            const hilogLinuxPath = path.join(previewerBinDir, 'libhilog_linux.so');
            const hilogPath = path.join(previewerBinDir, 'libhilog.so');
            
            if (fs.existsSync(hilogLinuxPath) && !fs.existsSync(hilogPath)) {
                await execAsync(`ln -sf libhilog_linux.so libhilog.so`, { cwd: previewerBinDir });
                console.log('✅ 创建 libhilog.so 符号链接');
            }
            
            // 创建libshared_libz.so符号链接
            const sharedZPath = path.join(previewerBinDir, 'libshared_libz.so');
            if (!fs.existsSync(sharedZPath)) {
                await execAsync(`ln -sf /usr/lib/x86_64-linux-gnu/libz.so.1 libshared_libz.so`, { cwd: previewerBinDir });
                console.log('✅ 创建 libshared_libz.so 符号链接');
            }
            
            // 创建libbrotli_shared.so符号链接
            const brotliPath = path.join(previewerBinDir, 'libbrotli_shared.so');
            if (!fs.existsSync(brotliPath)) {
                await execAsync(`ln -sf /usr/lib/x86_64-linux-gnu/libbrotlidec.so.1.0.9 libbrotli_shared.so`, { cwd: previewerBinDir });
                console.log('✅ 创建 libbrotli_shared.so 符号链接');
            }
            
            // 创建libc_ares.so符号链接
            const caresPath = path.join(previewerBinDir, 'libc_ares.so');
            if (!fs.existsSync(caresPath)) {
                await execAsync(`ln -sf /usr/lib/x86_64-linux-gnu/libcares.so.2 libc_ares.so`, { cwd: previewerBinDir });
                console.log('✅ 创建 libc_ares.so 符号链接');
            }
            
        } catch (error) {
            console.log(`⚠️  创建符号链接失败: ${error.message}`);
        }
    }

    /**
     * 安装常见的Qt依赖
     */
    async installCommonQtDependencies() {
        console.log('📦 尝试安装常见的Qt依赖...');
        
        const commonPackages = [
            'qtbase5-dev',
            'libqt5core5a',
            'libqt5gui5', 
            'libqt5widgets5',
            'libqt5network5',
            'zlib1g-dev',
            'libbrotli1',
            'libc-ares2'
        ];

        await this.installPackagesWithPackageManager(commonPackages);
    }

    /**
     * 安装缺失的库文件
     */
    async installMissingLibraries(missingLibs) {
        console.log('📦 分析缺失的库文件...');
        
        // Qt库映射到包名（针对Ubuntu/Debian）
        const qtLibPackages = {
            'libQt5Core.so': ['libqt5core5a'],
            'libQt5Gui.so': ['libqt5gui5'],
            'libQt5Widgets.so': ['libqt5widgets5'],
            'libQt5Network.so': ['libqt5network5'],
            'libQt5Quick.so': ['libqt5quick5'],
            'libQt5Qml.so': ['libqt5qml5'],
            'libshared_libz.so': ['zlib1g'],
            'libssl.so': ['libssl3'],
            'libcrypto.so': ['libssl3']
        };

        const packagesToInstall = new Set(['qt5-default']); // 总是包含基础包
        
        // 收集需要安装的包
        for (const lib of missingLibs) {
            for (const [libKey, packages] of Object.entries(qtLibPackages)) {
                if (lib.includes(libKey.replace('.so', ''))) {
                    packages.forEach(pkg => packagesToInstall.add(pkg));
                }
            }
        }

        const packages = Array.from(packagesToInstall);
        console.log(`📦 需要安装的包: ${packages.join(', ')}`);

        await this.installPackagesWithPackageManager(packages);
    }

    /**
     * 使用包管理器安装包
     */
    async installPackagesWithPackageManager(packages) {
        console.log('🔧 检测包管理器...');
        
        try {
            // 检测apt-get
            await execAsync('which apt-get');
            console.log('✅ 检测到apt-get包管理器');
            
            // 检查sudo权限
            try {
                await execAsync('sudo -n true', { timeout: 1000 });
                console.log('✅ 检测到sudo权限');
            } catch (e) {
                console.log('⚠️  需要sudo权限来安装系统包');
                console.log('💡 请手动运行以下命令:');
                console.log(`   sudo apt-get update && sudo apt-get install -y ${packages.join(' ')}`);
                return;
            }

            // 更新包列表
            console.log('📦 更新包列表...');
            await execAsync('sudo apt-get update', { timeout: 60000 });

            // 安装包
            const installCmd = `sudo apt-get install -y ${packages.join(' ')}`;
            console.log(`🔧 执行: ${installCmd}`);
            
            await execAsync(installCmd, { 
                timeout: 300000, // 5分钟超时
                maxBuffer: 1024 * 1024 * 50 // 50MB buffer
            });
            
            console.log('✅ Qt依赖库安装完成');

        } catch (error) {
            console.log(`❌ 包安装失败: ${error.message}`);
            console.log('💡 请手动安装Qt5开发库:');
            console.log('   sudo apt-get install qt5-default libqt5core5a libqt5gui5 libqt5widgets5');
        }
    }

    /**
     * 测试Previewer是否可以正常启动
     */
    async testPreviewerExecution() {
        console.log('🧪 正在测试Previewer可执行性...');
        
        if (!this.previewerPath) {
            throw new Error('Previewer路径未设置');
        }

        const previewerBinDir = path.dirname(this.previewerPath);
        const env = {
            ...process.env,
            QT_QPA_PLATFORM: 'offscreen', // 用于无头环境
            DISPLAY: process.env.DISPLAY || ':99',
            LD_LIBRARY_PATH: previewerBinDir + ':' + (process.env.LD_LIBRARY_PATH || '')
        };

        return new Promise((resolve, reject) => {
            // 测试基本执行能力
            const testArgs = ['--help'];
            console.log(`🚀 执行命令: ${this.previewerPath} ${testArgs.join(' ')}`);
            console.log(`📚 库路径: ${env.LD_LIBRARY_PATH}`);
            
            const child = spawn(this.previewerPath, testArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 10000, // 10秒超时
                env: env
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                console.log(`📊 Previewer退出码: ${code}`);
                
                // 宽松的成功判断条件
                const isSuccess = (
                    code === 0 || 
                    code === 11 || // Previewer因为参数错误退出，但库加载成功
                    stdout.includes('help') || 
                    stdout.includes('usage') || 
                    stderr.includes('help') ||
                    stderr.includes('RichPreviewer enter') ||
                    stderr.includes('CommandParser')
                );
                
                if (isSuccess) {
                    if (code === 11 || stderr.includes('RichPreviewer enter')) {
                        console.log('✅ Previewer可执行文件测试通过（依赖库加载成功）');
                    } else {
                        console.log('✅ Previewer可执行文件测试通过');
                    }
                    
                    resolve({ 
                        code, 
                        stdout: stdout.substring(0, 200), 
                        stderr: stderr.substring(0, 200),
                        success: true
                    });
                } else {
                    console.error('❌ Previewer执行失败');
                    console.error(`退出码: ${code}`);
                    console.error(`错误输出: ${stderr.substring(0, 300)}`);
                    reject(new Error(`Previewer执行失败，退出码: ${code}`));
                }
            });

            child.on('error', (error) => {
                console.error(`🚨 Previewer启动错误: ${error.message}`);
                reject(new Error(`Previewer启动错误: ${error.message}`));
            });

            // 防止hang住
            setTimeout(() => {
                if (!child.killed) {
                    console.log('⏰ 超时，终止Previewer进程');
                    child.kill('SIGTERM');
                }
            }, 8000);
        });
    }

    /**
     * 获取SDK信息
     */
    getSDKInfo() {
        return {
            downloadUrl: this.sdkUrl,
            localPath: this.sdkArchive,
            extractPath: this.extractDir,
            previewerPath: this.previewerPath,
            isReady: this.previewerPath !== null
        };
    }

    /**
     * 完整的安装和测试流程
     */
    async setupAndTest(forceReextract = false) {
        try {
            console.log('🚀 开始OpenHarmony Previewer SDK安装和测试流程');
            console.log('==========================================');
            
            await this.downloadSDK();
            
            // 如果强制重新解压，先清理解压目录
            if (forceReextract && fs.existsSync(this.extractDir)) {
                console.log('🧹 清理旧的解压文件...');
                await execAsync(`rm -rf "${this.extractDir}"`);
            }
            
            await this.extractSDK();
            await this.findPreviewerExecutable();
            
            // 检查并安装依赖
            await this.checkAndInstallDependencies();
            
            await this.testPreviewerExecution();
            
            console.log('==========================================');
            console.log('🎉 Previewer SDK安装和测试完成');
            console.log(`📍 Previewer路径: ${this.previewerPath}`);
            
            return this.getSDKInfo();
            
        } catch (error) {
            console.error('==========================================');
            console.error('❌ 安装和测试过程失败');
            console.error(`错误: ${error.message}`);
            console.error('==========================================');
            throw error;
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const manager = new PreviewerSDKManager();
    
    // 处理命令行参数
    const args = process.argv.slice(2);
    const forceReextract = args.includes('--force-reextract');
    
    if (args.includes('--help')) {
        console.log(`
OpenHarmony Previewer SDK 管理器

用法: node setup-previewer-sdk.js [选项]

选项:
  --help              显示此帮助信息
  --force-reextract   强制重新解压SDK

示例:
  node setup-previewer-sdk.js                    # 基本安装和测试
  node setup-previewer-sdk.js --force-reextract  # 强制重新解压
        `);
        process.exit(0);
    }
    
    manager.setupAndTest(forceReextract)
        .then((info) => {
            console.log('\n📊 SDK信息:');
            console.log(JSON.stringify(info, null, 2));
            console.log('\n✅ 所有操作完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ 操作失败:', error.message);
            process.exit(1);
        });
}

module.exports = PreviewerSDKManager;
