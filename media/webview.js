// WebView前端逻辑
(function() {
    'use strict';

    // 获取VS Code API
    const vscode = acquireVsCodeApi();
    
    // DOM元素
    const elements = {
        refreshBtn: document.getElementById('refreshBtn'),
        screenshotBtn: document.getElementById('screenshotBtn'),
        statusText: document.getElementById('statusText'),
        statusDot: document.getElementById('statusDot'),
        imageContainer: document.getElementById('imageContainer'),
        placeholder: document.getElementById('placeholder'),
        previewImage: document.getElementById('previewImage'),
        imageInfo: document.getElementById('imageInfo')
    };

    // 状态管理
    let currentStatus = 'disconnected';
    let currentImage = null;

    // 初始化
    function init() {
        console.log('WebView initializing...');
        
        // 绑定事件监听器
        bindEventListeners();
        
        // 通知扩展WebView已准备就绪
        vscode.postMessage({ type: 'ready' });
        
        console.log('WebView initialized');
    }

    function bindEventListeners() {
        // 刷新按钮
        elements.refreshBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'refresh' });
            showToast('正在刷新预览...');
        });

        // 截图按钮
        elements.screenshotBtn.addEventListener('click', () => {
            if (currentImage) {
                vscode.postMessage({ type: 'screenshot' });
                showToast('正在保存截图...');
            } else {
                showToast('没有可用的图像', 'warning');
            }
        });

        // 图像加载事件
        elements.previewImage.addEventListener('load', () => {
            console.log('Image loaded successfully');
        });

        elements.previewImage.addEventListener('error', (e) => {
            console.error('Image load error:', e);
            showError('图像加载失败');
        });

        // 监听VS Code消息
        window.addEventListener('message', handleMessage);

        // 键盘快捷键
        document.addEventListener('keydown', handleKeyDown);
    }

    function handleMessage(event) {
        const message = event.data;
        
        switch (message.type) {
            case 'updateImage':
                updateImage(message.data);
                break;
                
            case 'updateStatus':
                updateStatus(message.data.status);
                break;
                
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    function updateImage(data) {
        try {
            console.log('Updating image:', data);
            
            currentImage = data;
            
            // 隐藏占位符，显示图像
            elements.placeholder.style.display = 'none';
            elements.previewImage.style.display = 'block';
            
            // 设置图像源
            elements.previewImage.src = data.imageUrl;
            
            // 更新图像信息
            const info = `${data.width} × ${data.height} | ${data.format.toUpperCase()} | ${formatTimestamp(data.timestamp)}`;
            elements.imageInfo.textContent = info;
            
            showToast('预览已更新');
            
        } catch (error) {
            console.error('Failed to update image:', error);
            showError('更新图像失败');
        }
    }

    function updateStatus(status) {
        console.log('Status updated:', status);
        
        currentStatus = status;
        
        // 更新状态文本和指示器
        switch (status) {
            case 'connected':
                elements.statusText.textContent = '已连接';
                elements.statusDot.className = 'status-dot online';
                elements.refreshBtn.disabled = false;
                elements.screenshotBtn.disabled = false;
                break;
                
            case 'connecting':
                elements.statusText.textContent = '连接中...';
                elements.statusDot.className = 'status-dot connecting';
                elements.refreshBtn.disabled = true;
                elements.screenshotBtn.disabled = true;
                break;
                
            case 'disconnected':
                elements.statusText.textContent = '未连接';
                elements.statusDot.className = 'status-dot offline';
                elements.refreshBtn.disabled = true;
                elements.screenshotBtn.disabled = true;
                showPlaceholder();
                break;
                
            case 'error':
                elements.statusText.textContent = '连接错误';
                elements.statusDot.className = 'status-dot offline';
                elements.refreshBtn.disabled = true;
                elements.screenshotBtn.disabled = true;
                showError('连接出现错误');
                break;
        }
    }

    function showPlaceholder() {
        elements.placeholder.style.display = 'flex';
        elements.previewImage.style.display = 'none';
        elements.imageInfo.textContent = '';
        currentImage = null;
    }

    function handleKeyDown(event) {
        // F5 刷新
        if (event.key === 'F5') {
            event.preventDefault();
            if (currentStatus === 'connected') {
                vscode.postMessage({ type: 'refresh' });
            }
        }
        
        // Ctrl+S 截图
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            if (currentImage) {
                vscode.postMessage({ type: 'screenshot' });
            }
        }
    }

    function showToast(message, type = 'info') {
        // 创建toast通知
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            backgroundColor: type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4caf50',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease'
        });
        
        document.body.appendChild(toast);
        
        // 动画显示
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    function showError(message) {
        showToast(message, 'error');
        vscode.postMessage({ 
            type: 'error', 
            data: message 
        });
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
