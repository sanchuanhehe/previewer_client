# HarmonyOS Previewer VS Code Extension

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.74+-blue.svg)](https://code.visualstudio.com/)
[![Tests](https://img.shields.io/badge/tests-23%2F24%20passing-green.svg)](#)
[![Coverage](https://img.shields.io/badge/coverage-80%25+-brightgreen.svg)](#)

这是一个专为HarmonyOS开发者设计的VS Code扩展，提供实时预览功能。通过WebSocket连接到HarmonyOS预览器组件，接收渲染结果并在VS Code中实时显示，提升开发效率。

## ✨ 功能特性

- 🔗 **实时连接**: 通过WebSocket连接到HarmonyOS预览器组件
- 🖼️ **实时预览**: 显示HarmonyOS应用程序的实时渲染界面
- 📷 **截图功能**: 一键保存当前预览状态为图片
- 🔄 **自动刷新**: 文件保存时自动刷新预览内容
- ⚙️ **灵活配置**: 可自定义连接参数和预览选项
- 🎨 **现代界面**: 适配VS Code主题的响应式WebView界面
- 🔧 **智能重连**: 自动处理连接中断和重连机制
- 📊 **状态监控**: 实时显示连接状态和图像信息

## 🚀 快速开始

### 环境要求

- VS Code 1.74.0 或更高版本
- Node.js 18.x 或更高版本
- HarmonyOS预览器组件运行在本地

### 安装方式

#### 方式一：从源码安装

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd previewer_client
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **编译项目**
   ```bash
   npm run compile
   ```

4. **调试运行**
   
   在VS Code中打开项目，按 `F5` 启动扩展调试

#### 方式二：打包安装

1. **构建扩展包**
   ```bash
   npm run package
   ```

2. **安装扩展**
   ```bash
   code --install-extension harmonyos-previewer-1.0.0.vsix
   ```

### 基本使用

1. **启动HarmonyOS预览器组件**（确保在端口5577运行）
2. **打开HarmonyOS项目**
3. **启动预览**：使用命令面板 (`Ctrl+Shift+P`) 运行 `HarmonyOS Previewer: Start Previewer`
4. **查看预览**：预览面板将在VS Code侧边栏显示实时渲染结果

## ⚙️ 配置选项

在VS Code设置中可以配置以下参数：

| 设置项 | 描述 | 默认值 |
|--------|------|--------|
| `harmonyPreviewer.websocket.host` | WebSocket服务器地址 | `127.0.0.1` |
| `harmonyPreviewer.websocket.port` | WebSocket服务器端口 | `5577` |
| `harmonyPreviewer.autoConnect` | 启动时自动连接预览器 | `true` |
| `harmonyPreviewer.autoRefresh` | 文件保存时自动刷新 | `true` |
| `harmonyPreviewer.device.width` | 设备屏幕宽度 | `360` |
| `harmonyPreviewer.device.height` | 设备屏幕高度 | `780` |

### 命令列表

| 命令 | 描述 | 快捷键 |
|------|------|--------|
| `HarmonyOS Previewer: Start Previewer` | 启动预览器连接 | - |
| `HarmonyOS Previewer: Stop Previewer` | 停止预览器连接 | - |
| `HarmonyOS Previewer: Refresh` | 手动刷新预览 | `F5` |
| `HarmonyOS Previewer: Take Screenshot` | 保存截图 | - |

## 📖 使用指南

### 基本操作

1. **连接状态检查**
   - 绿色指示器：已连接
   - 红色指示器：连接断开
   - 黄色指示器：正在连接

2. **预览操作**
   - 点击"Refresh"按钮刷新预览
   - 点击"Take Screenshot"保存当前画面
   - 使用滚轮缩放预览画面

3. **快捷操作**
   - `F5`：刷新预览
   - `Ctrl+S`：在预览面板中保存截图

### 高级功能

#### 自定义设备分辨率

```json
{
    "harmonyPreviewer.device.width": 414,
    "harmonyPreviewer.device.height": 896
}
```

#### 网络配置

```json
{
    "harmonyPreviewer.websocket.host": "192.168.1.100",
    "harmonyPreviewer.websocket.port": 8080
}
```

## 🏗️ 项目架构

```
previewer_client/
├── 📁 src/                           # 源代码目录
│   ├── 📄 extension.ts               # 扩展主入口点
│   ├── 📁 webview/                   # WebView相关模块
│   │   └── 📄 previewPanel.ts        # 预览面板控制器
│   ├── 📁 websocket/                 # WebSocket客户端模块
│   │   ├── 📄 client.ts              # 连接管理和事件处理
│   │   └── 📄 imageProcessor.ts      # 图像数据处理
│   ├── 📁 shared/                    # 共享类型定义
│   │   └── 📄 types.ts               # TypeScript类型定义
│   └── 📁 utils/                     # 工具函数
│       └── 📄 logger.ts              # 日志记录工具
├── 📁 media/                         # 静态资源
│   ├── 📄 webview.css                # WebView样式文件
│   └── 📄 webview.js                 # WebView前端脚本
├── 📁 .vscode/                       # VS Code配置
│   ├── 📄 launch.json                # 调试配置
│   └── 📄 tasks.json                 # 任务配置
├── 📄 package.json                   # 项目配置和依赖
├── 📄 tsconfig.json                  # TypeScript编译配置
├── 📄 .eslintrc.json                # ESLint规则配置
└── 📄 README.md                      # 项目文档
```

### 核心模块说明

#### Extension (extension.ts)
- 扩展生命周期管理
- 命令注册和处理
- 配置管理
- 组件协调

#### WebView (previewPanel.ts)
- 预览界面控制
- 用户交互处理
- 图像显示管理
- 截图功能实现

#### WebSocket Client (client.ts)
- 连接状态管理
- 消息收发处理
- 自动重连机制
- 错误处理

#### Image Processor (imageProcessor.ts)
- 图像格式解析
- 数据转换处理
- Base64编码
- 格式支持：JPEG、PNG、RGBA

## 🛠️ 开发指南

### 环境设置

1. **Node.js版本管理**
   ```bash
   # 使用指定的Node.js版本
   nvm use
   # 如果没有nvm，请安装Node.js 18.13.0
   ```

2. **依赖安装**
   ```bash
   npm install
   ```

### 开发命令

| 命令 | 描述 |
|------|------|
| `npm run compile` | 编译TypeScript代码 |
| `npm run watch` | 监听模式编译 |
| `npm run lint` | 运行ESLint检查 |
| `npm run lint:fix` | 自动修复ESLint错误 |
| `npm test` | 运行测试套件 |
| `npm run package` | 打包成.vsix文件 |

### 调试

1. **启动调试模式**
   - 在VS Code中打开项目
   - 按 `F5` 启动扩展主机
   - 新窗口中将加载开发版扩展

2. **查看调试信息**
   - 开发者工具：`Help` → `Toggle Developer Tools`
   - 输出面板：`View` → `Output` → `HarmonyOS Previewer`

### 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --testNamePattern="WebSocket Client"

# 生成覆盖率报告
npm run test:coverage
```

## 📡 API 参考

### WebSocket通信协议

#### 1. 图像数据消息

```typescript
interface PreviewImageData {
    width: number;          // 图像宽度
    height: number;         // 图像高度
    format: 'jpg' | 'png' | 'rgba';  // 图像格式
    data: Uint8Array;       // 图像二进制数据
    timestamp: number;      // 时间戳
}
```

#### 2. 命令消息

```typescript
interface Command {
    type: 'resolution' | 'orientation' | 'input' | 'refresh';
    data: Record<string, unknown>;
    timestamp: number;
}
```

#### 3. 状态消息

```typescript
interface StatusMessage {
    type: 'connected' | 'disconnected' | 'error';
    message: string;
    timestamp: number;
}
```

### 扩展API

#### 配置获取

```typescript
import * as vscode from 'vscode';

const config = vscode.workspace.getConfiguration('harmonyPreviewer');
const host = config.get<string>('websocket.host', '127.0.0.1');
const port = config.get<number>('websocket.port', 5577);
```

#### 命令注册

```typescript
vscode.commands.registerCommand('harmonyPreviewer.startPreviewer', () => {
    // 启动预览器逻辑
});
```

## 🔧 故障排除

### 常见问题

#### 连接问题

**问题**: 无法连接到HarmonyOS预览器
```
解决方案:
1. 确保HarmonyOS预览器组件正在运行
2. 检查WebSocket端口(默认5577)是否被占用
3. 验证防火墙设置允许本地连接
4. 查看VS Code输出面板的错误信息
```

**问题**: 连接频繁断开
```
解决方案:
1. 检查网络稳定性
2. 增加重连间隔时间
3. 查看系统资源使用情况
4. 重启HarmonyOS预览器组件
```

#### 显示问题

**问题**: 图像显示模糊或错误
```
解决方案:
1. 检查图像格式是否支持(JPEG/PNG/RGBA)
2. 验证图像数据完整性
3. 调整设备分辨率设置
4. 清除浏览器缓存
```

**问题**: 预览界面空白
```
解决方案:
1. 打开开发者工具检查控制台错误
2. 验证WebView加载状态
3. 检查图像数据是否正确接收
4. 重新启动预览器连接
```

#### 性能问题

**问题**: 预览卡顿或延迟高
```
解决方案:
1. 降低图像传输频率
2. 优化图像压缩设置
3. 检查CPU和内存使用率
4. 关闭不必要的VS Code扩展
```

### 调试技巧

1. **启用详细日志**
   ```json
   {
       "harmonyPreviewer.debug.verbose": true
   }
   ```

2. **查看网络流量**
   - 使用浏览器开发者工具的Network面板
   - 监控WebSocket连接状态

3. **性能分析**
   - 使用VS Code性能分析器
   - 监控内存使用情况

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

### 提交问题

1. 搜索现有Issues避免重复
2. 使用清晰的标题描述问题
3. 提供详细的重现步骤
4. 包含错误日志和环境信息

### 代码贡献

1. **Fork项目**
   ```bash
   git clone https://github.com/your-username/previewer_client.git
   cd previewer_client
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **开发和测试**
   ```bash
   npm install
   npm run watch
   npm test
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **创建Pull Request**

### 代码规范

- 遵循ESLint配置规则
- 使用TypeScript严格模式
- 添加适当的注释和文档
- 包含单元测试
- 遵循Conventional Commits规范

### 测试要求

- 新功能必须包含测试用例
- 测试覆盖率不低于80%
- 所有测试必须通过

## 📋 更新日志

### v1.0.0 (2025-08-25)

#### ✨ 新功能
- 实时WebSocket连接到HarmonyOS预览器
- 图像数据实时显示和处理
- 截图保存功能
- 自动重连机制
- 响应式WebView界面
- 多种图像格式支持(JPEG/PNG/RGBA)

#### 🐛 修复
- 修复TypeScript类型冲突问题
- 解决WebSocket导入错误
- 修复ESLint配置问题
- 抑制Node.js运行时警告

#### 📚 文档
- 完整的README文档
- API参考文档
- 开发指南
- 故障排除指南

## 📜 许可证

本项目基于 [Apache License 2.0](LICENSE) 开源协议。

## 🙏 致谢

- [VS Code Extension API](https://code.visualstudio.com/api)
- [WebSocket库](https://github.com/websockets/ws)
- [TypeScript](https://www.typescriptlang.org/)
- HarmonyOS开发团队

## 📞 支持

如果您遇到问题或有建议，请通过以下方式联系：

- 📧 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📖 文档: [项目Wiki](https://github.com/your-repo/wiki)

---

**Happy Coding! 🚀**
