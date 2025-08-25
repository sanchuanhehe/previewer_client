#!/bin/bash

# HarmonyOS测试工作区启动脚本
# 用于测试HarmonyOS Previewer VS Code扩展

echo "🚀 启动HarmonyOS测试工作区..."

# 检查当前目录
if [ ! -f "oh-package.json5" ]; then
    echo "❌ 错误: 请在HarmonyOS项目根目录运行此脚本"
    exit 1
fi

# 检查VS Code是否安装
if ! command -v code &> /dev/null; then
    echo "❌ 错误: VS Code未安装或不在PATH中"
    exit 1
fi

# 检查是否有工作区文件
if [ ! -f "test-workspace.code-workspace" ]; then
    echo "❌ 错误: 工作区配置文件不存在"
    exit 1
fi

echo "📦 项目信息:"
echo "   - 项目类型: HarmonyOS应用"
echo "   - 主页面: entry/src/main/ets/pages/Index.ets"
echo "   - 配置文件: oh-package.json5"

# 启动VS Code工作区
echo "🔧 启动VS Code工作区..."
code test-workspace.code-workspace

echo "✅ VS Code工作区已启动"
echo ""
echo "📋 测试步骤:"
echo "1. 等待VS Code完全加载"
echo "2. 按 Ctrl+Shift+P 打开命令面板"
echo "3. 输入 'HarmonyOS Previewer: Start Previewer'"
echo "4. 在侧边栏查看预览面板"
echo "5. 修改 Index.ets 文件测试实时更新"
echo ""
echo "🔧 可用命令:"
echo "   - Ctrl+Shift+P → 'HarmonyOS Previewer: Start Previewer'"
echo "   - Ctrl+Shift+P → 'HarmonyOS Previewer: Show Previewer Panel'"
echo "   - Ctrl+Shift+P → 'HarmonyOS Previewer: Stop Previewer'"
echo ""
echo "📖 更多信息请查看 README.md"
