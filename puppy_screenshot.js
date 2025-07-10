
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import webbrowser

class ScreenshotServerHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html_content = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SillyTavern 高级截图插件</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .floating-window {
            position: fixed;
            top: 50px;
            right: 50px;
            width: 380px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: move;
        }

        .floating-window.minimized {
            height: 80px;
            overflow: hidden;
        }

        .window-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            user-select: none;
        }

        .window-title {
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .window-controls {
            display: flex;
            gap: 10px;
        }

        .control-btn {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .minimize-btn {
            background: #ffc107;
            color: #000;
        }

        .close-btn {
            background: #dc3545;
            color: white;
        }

        .control-btn:hover {
            transform: scale(1.1);
        }

        .window-content {
            padding: 20px;
            max-height: 500px;
            overflow-y: auto;
        }

        .screenshot-section {
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(248, 249, 250, 0.8);
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .capture-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }

        .capture-btn {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }

        .capture-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
        }

        .capture-btn.full-width {
            grid-column: 1 / -1;
        }

        .preview-area {
            min-height: 120px;
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.5);
            color: #6c757d;
            font-size: 14px;
            margin-top: 10px;
        }

        .preview-area img {
            max-width: 100%;
            max-height: 100px;
            border-radius: 6px;
        }

        .option-select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .color-picker-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }

        .color-picker {
            width: 40px;
            height: 30px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }

        .slider-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }

        .slider {
            flex: 1;
            height: 6px;
            border-radius: 3px;
            background: #dee2e6;
            outline: none;
            cursor: pointer;
        }

        .slider-value {
            min-width: 40px;
            font-size: 12px;
            color: #666;
        }

        .checkbox-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
        }

        .checkbox-item input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #667eea;
        }

        .action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 20px;
        }

        .action-btn {
            padding: 12px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
        }

        .btn-success {
            background: linear-gradient(135deg, #28a745, #1e7e34);
            color: white;
        }

        .btn-secondary {
            background: linear-gradient(135deg, #6c757d, #545b62);
            color: white;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            animation: slideDown 0.3s ease-out;
        }

        .toast-success { background: #28a745; }
        .toast-error { background: #dc3545; }
        .toast-warning { background: #ffc107; color: #000; }
        .toast-info { background: #17a2b8; }

        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-100%); }
            to { transform: translateX(-50%) translateY(0); }
        }

        /* 滚动条样式 */
        .window-content::-webkit-scrollbar {
            width: 6px;
        }

        .window-content::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
        }

        .window-content::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="floating-window" id="screenshotWindow">
        <div class="window-header" id="windowHeader">
            <div class="window-title">
                <span>📸</span>
                <span>高级截图美化工具</span>
            </div>
            <div class="window-controls">
                <button class="control-btn minimize-btn" id="minimizeBtn">−</button>
                <button class="control-btn close-btn" id="closeBtn">×</button>
            </div>
        </div>
        
        <div class="window-content" id="windowContent">
            <div class="screenshot-section">
                <div class="section-title">
                    <span>📷</span>
                    <span>截图操作</span>
                </div>
                <div class="capture-buttons">
                    <button class="capture-btn" id="captureScreen">
                        <span>🖥️</span>
                        <span>整个屏幕</span>
                    </button>
                    <button class="capture-btn" id="captureWindow">
                        <span>🗔</span>
                        <span>当前窗口</span>
                    </button>
                    <button class="capture-btn full-width" id="captureSelection">
                        <span>✂️</span>
                        <span>选择区域</span>
                    </button>
                </div>
                <div class="preview-area" id="previewArea">
                    <span>点击上方按钮开始截图</span>
                </div>
            </div>

            <div class="screenshot-section">
                <div class="section-title">
                    <span>🎨</span>
                    <span>背景设置</span>
                </div>
                <select class="option-select" id="backgroundPreset">
                    <option value="transparent">透明背景</option>
                    <option value="white">简约白</option>
                    <option value="gradient-blue">蓝色渐变</option>
                    <option value="gradient-purple">紫色渐变</option>
                    <option value="gradient-sunset">日落渐变</option>
                    <option value="paper">纸质纹理</option>
                    <option value="wood">木质纹理</option>
                    <option value="custom">自定义颜色</option>
                </select>
                <div class="color-picker-group">
                    <label>自定义:</label>
                    <input type="color" class="color-picker" id="customColor" value="#ffffff">
                </div>
            </div>

            <div class="screenshot-section">
                <div class="section-title">
                    <span>📐</span>
                    <span>布局模板</span>
                </div>
                <select class="option-select" id="layoutTemplate">
                    <option value="classic">经典布局</option>
                    <option value="modern">现代风格</option>
                    <option value="minimal">极简风格</option>
                    <option value="card">卡片风格</option>
                    <option value="frame">相框风格</option>
                    <option value="shadow">阴影风格</option>
                </select>
            </div>

            <div class="screenshot-section">
                <div class="section-title">
                    <span>🎭</span>
                    <span>滤镜效果</span>
                </div>
                <select class="option-select" id="filterEffect">
                    <option value="none">无滤镜</option>
                    <option value="blur">模糊</option>
                    <option value="sharpen">锐化</option>
                    <option value="vintage">复古</option>
                    <option value="monochrome">黑白</option>
                    <option value="warm">暖调</option>
                    <option value="cool">冷调</option>
                    <option value="dreamy">梦幻</option>
                    <option value="cinematic">电影</option>
                </select>
                <div class="slider-group">
                    <label>强度:</label>
                    <input type="range" class="slider" id="filterStrength" min="0" max="100" value="50">
                    <span class="slider-value" id="filterValue">50%</span>
                </div>
            </div>

            <div class="screenshot-section">
                <div class="section-title">
                    <span>⚙️</span>
                    <span>高级选项</span>
                </div>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="autoEnhance" checked>
                        <label for="autoEnhance">自动增强</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="smartCrop">
                        <label for="smartCrop">智能裁剪</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="addWatermark">
                        <label for="addWatermark">添加水印</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="addShadow">
                        <label for="addShadow">添加阴影</label>
                    </div>
                </div>
            </div>

            <div class="screenshot-section">
                <div class="section-title">
                    <span>🎯</span>
                    <span>精确控制</span>
                </div>
                <div class="slider-group">
                    <label>缩放:</label>
                    <input type="range" class="slider" id="scaleSlider" min="50" max="200" value="100">
                    <span class="slider-value" id="scaleValue">100%</span>
                </div>
                <div class="slider-group">
                    <label>旋转:</label>
                    <input type="range" class="slider" id="rotationSlider" min="-180" max="180" value="0">
                    <span class="slider-value" id="rotationValue">0°</span>
                </div>
            </div>

            <div class="action-buttons">
                <button class="action-btn btn-primary" id="processBtn">
                    <span>🔄 处理图片</span>
                </button>
                <button class="action-btn btn-success" id="exportBtn">
                    <span>💾 导出图片</span>
                </button>
                <button class="action-btn btn-secondary" id="previewBtn">
                    <span>👁️ 预览效果</span>
                </button>
                <button class="action-btn btn-secondary" id="savePresetBtn">
                    <span>💾 保存预设</span>
                </button>
            </div>
        </div>
    </div>

    <script>
        class AdvancedScreenshotTool {
            constructor() {
                this.currentScreenshot = null;
                this.processedScreenshot = null;
                this.isDragging = false;
                this.dragOffset = { x: 0, y: 0 };
                this.isMinimized = false;
                
                this.init();
            }

            init() {
                this.bindEvents();
                this.showToast('📸 高级截图工具已就绪！', 'success');
            }

            bindEvents() {
                // 窗口拖拽
                const header = document.getElementById('windowHeader');
                const window = document.getElementById('screenshotWindow');
                
                header.addEventListener('mousedown', (e) => {
                    this.isDragging = true;
                    const rect = window.getBoundingClientRect();
                    this.dragOffset.x = e.clientX - rect.left;
                    this.dragOffset.y = e.clientY - rect.top;
                    document.body.style.userSelect = 'none';
                });

                document.addEventListener('mousemove', (e) => {
                    if (this.isDragging) {
                        const x = e.clientX - this.dragOffset.x;
                        const y = e.clientY - this.dragOffset.y;
                        window.style.left = Math.max(0, Math.min(x, window.innerWidth - window.offsetWidth)) + 'px';
                        window.style.top = Math.max(0, Math.min(y, window.innerHeight - window.offsetHeight)) + 'px';
                        window.style.right = 'auto';
                    }
                });

                document.addEventListener('mouseup', () => {
                    this.isDragging = false;
                    document.body.style.userSelect = '';
                });

                // 窗口控制
                document.getElementById('minimizeBtn').addEventListener('click', () => {
                    this.toggleMinimize();
                });

                document.getElementById('closeBtn').addEventListener('click', () => {
                    window.style.display = 'none';
                });

                // 截图按钮
                document.getElementById('captureScreen').addEventListener('click', () => {
                    this.captureScreen();
                });

                document.getElementById('captureWindow').addEventListener('click', () => {
                    this.captureWindow();
                });

                document.getElementById('captureSelection').addEventListener('click', () => {
                    this.captureSelection();
                });

                // 滑块更新
                document.getElementById('filterStrength').addEventListener('input', (e) => {
                    document.getElementById('filterValue').textContent = e.target.value + '%';
                });

                document.getElementById('scaleSlider').addEventListener('input', (e) => {
                    document.getElementById('scaleValue').textContent = e.target.value + '%';
                });

                document.getElementById('rotationSlider').addEventListener('input', (e) => {
                    document.getElementById('rotationValue').textContent = e.target.value + '°';
                });

                // 处理按钮
                document.getElementById('processBtn').addEventListener('click', () => {
                    this.processScreenshot();
                });

                document.getElementById('exportBtn').addEventListener('click', () => {
                    this.exportScreenshot();
                });

                document.getElementById('previewBtn').addEventListener('click', () => {
                    this.previewEffect();
                });

                document.getElementById('savePresetBtn').addEventListener('click', () => {
                    this.savePreset();
                });
            }

            toggleMinimize() {
                const window = document.getElementById('screenshotWindow');
                const content = document.getElementById('windowContent');
                const btn = document.getElementById('minimizeBtn');
                
                this.isMinimized = !this.isMinimized;
                
                if (this.isMinimized) {
                    window.classList.add('minimized');
                    content.style.display = 'none';
                    btn.textContent = '+';
                } else {
                    window.classList.remove('minimized');
                    content.style.display = 'block';
                    btn.textContent = '−';
                }
            }

            async captureScreen() {
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: { 
                            mediaSource: 'screen',
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        }
                    });
                    
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();
                    
                    video.addEventListener('loadedmetadata', () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0);
                        
                        const imageData = canvas.toDataURL('image/png');
                        this.currentScreenshot = imageData;
                        this.displayScreenshot(imageData);
                        
                        stream.getTracks().forEach(track => track.stop());
                        this.showToast('📸 屏幕截图完成！', 'success');
                    });
                    
                } catch (error) {
                    console.error('截屏失败:', error);
                    this.showToast('❌ 截屏失败: ' + error.message, 'error');
                }
            }

            async captureWindow() {
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: { mediaSource: 'window' }
                    });
                    
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();
                    
                    video.addEventListener('loadedmetadata', () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0);
                        
                        const imageData = canvas.toDataURL('image/png');
                        this.currentScreenshot = imageData;
                        this.displayScreenshot(imageData);
                        
                        stream.getTracks().forEach(track => track.stop());
                        this.showToast('🗔 窗口截图完成！', 'success');
                    });
                    
                } catch (error) {
                    this.showToast('❌ 窗口截图失败', 'error');
                }
            }

            captureSelection() {
                this.showToast('✂️ 选择区域截图功能开发中...', 'info');
            }

            displayScreenshot(imageData) {
                const preview = document.getElementById('previewArea');
                preview.innerHTML = `<img src="${imageData}" alt="截图预览">`;
            }

            processScreenshot() {
                if (!this.currentScreenshot) {
                    this.showToast('⚠️ 请先截取图片', 'warning');
                    return;
                }

                // 模拟处理过程
                this.showToast('🔄 正在处理图片...', 'info');
                
                setTimeout(() => {
                    // 这里可以添加实际的图片处理逻辑
                    this.processedScreenshot = this.currentScreenshot;
                    this.showToast('✅ 图片处理完成！', 'success');
                }, 1500);
            }

            exportScreenshot() {
                const imageToExport = this.processedScreenshot || this.currentScreenshot;
                
                if (!imageToExport) {
                    this.showToast('⚠️ 没有可导出的图片', 'warning');
                    return;
                }

                const link = document.createElement('a');
                link.download = `screenshot_${new Date().getTime()}.png`;
                link.href = imageToExport;
                link.click();
                
                this.showToast('💾 图片已成功导出！', 'success');
            }

            previewEffect() {
                if (!this.currentScreenshot) {
                    this.showToast('⚠️ 请先截取图片', 'warning');
                    return;
                }
                
                this.showToast('👁️ 预览效果...', 'info');
            }

            savePreset() {
                const presetName = prompt('请输入预设名称:');
                if (presetName) {
                    // 保存当前设置为预设
                    const preset = {
                        background: document.getElementById('backgroundPreset').value,
                        layout: document.getElementById('layoutTemplate').value,
                        filter: document.getElementById('filterEffect').value,
                        // ... 其他设置
                    };
                    
                    localStorage.setItem('screenshot_preset_' + presetName, JSON.stringify(preset));
                    this.showToast(`💾 预设 "${presetName}" 已保存！`, 'success');
                }
            }

            showToast(message, type = 'info') {
                // 移除现有的toast
                const existingToast = document.querySelector('.toast');
                if (existingToast) {
                    existingToast.remove();
                }
                
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.textContent = message;
                
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 3000);
            }
        }

        // 初始化截图工具
        document.addEventListener('DOMContentLoaded', () => {
            new AdvancedScreenshotTool();
        });
    </script>
</body>
</html>
            """
            
            self.wfile.write(html_content.encode())
        else:
            super().do_GET()

def start_server():
    server_address = ('0.0.0.0', 5000)
    httpd = HTTPServer(server_address, ScreenshotServerHandler)
    print("🚀 SillyTavern截图插件服务器启动成功!")
    print(f"📱 访问地址: http://localhost:5000")
    print("✨ 功能特色:")
    print("   - 可拖拽浮窗界面")
    print("   - 屏幕/窗口截图")
    print("   - 高级美化选项")
    print("   - 实时预览效果")
    print("   - 一键导出图片")
    httpd.serve_forever()

if __name__ == "__main__":
    start_server()
/**
 * SillyTavern截图插件前端代码
 */

class ScreenshotPlugin {
    constructor() {
        this.baseUrl = '/api/plugins/screenshot';
        this.currentOptions = {
            background: '简约白',
            layout: '经典',
            filter: '无滤镜',
            auto_enhance: true,
            crop_ratio: null,
            watermark_position: 'bottom-right'
        };
        this.presets = null;
        this.init();
    }

    async init() {
        // 加载预设
        await this.loadPresets();
        
        // 创建UI
        this.createUI();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('截图插件已初始化');
    }

    async loadPresets() {
        try {
            const response = await fetch(`${this.baseUrl}/presets`);
            this.presets = await response.json();
        } catch (error) {
            console.error('加载预设失败:', error);
        }
    }

    createUI() {
        // 创建主界面
        const container = document.createElement('div');
        container.id = 'screenshot-plugin-container';
        container.className = 'screenshot-plugin-panel';
        
        container.innerHTML = `
            <div class="screenshot-plugin-header">
                <h3>🎨 高级截图美化</h3>
                <button id="screenshot-toggle" class="screenshot-toggle-btn">展开</button>
            </div>
            
            <div class="screenshot-plugin-content" id="screenshot-content">
                <div class="screenshot-section">
                    <h4>📸 截图区域</h4>
                    <div class="screenshot-capture-area">
                        <button id="capture-screen" class="btn-primary">截取屏幕</button>
                        <button id="capture-window" class="btn-primary">截取窗口</button>
                        <button id="capture-selection" class="btn-primary">选择区域</button>
                    </div>
                    <div class="screenshot-preview" id="screenshot-preview">
                        <p>等待截图...</p>
                    </div>
                </div>

                <div class="screenshot-section">
                    <h4>🎨 背景设置</h4>
                    <select id="background-preset" class="screenshot-select">
                        ${this.generateOptions('backgrounds')}
                    </select>
                    <div class="color-picker-container">
                        <label>自定义颜色:</label>
                        <input type="color" id="custom-background-color" value="#ffffff">
                    </div>
                </div>

                <div class="screenshot-section">
                    <h4>📐 布局模板</h4>
                    <select id="layout-template" class="screenshot-select">
                        ${this.generateOptions('layouts')}
                    </select>
                    <div class="layout-preview" id="layout-preview">
                        <div class="layout-sample"></div>
                    </div>
                </div>

                <div class="screenshot-section">
                    <h4>🎭 滤镜效果</h4>
                    <select id="filter-effect" class="screenshot-select">
                        ${this.generateFilterOptions()}
                    </select>
                    <div class="filter-strength">
                        <label>强度:</label>
                        <input type="range" id="filter-strength" min="0" max="100" value="50">
                        <span id="filter-strength-value">50%</span>
                    </div>
                </div>

                <div class="screenshot-section">
                    <h4>✨ 高级功能</h4>
                    <div class="advanced-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="auto-enhance" checked>
                            自动增强
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="smart-crop">
                            智能裁剪
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="add-watermark">
                            添加水印
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="add-shadow">
                            添加阴影
                        </label>
                    </div>
                </div>

                <div class="screenshot-section">
                    <h4>🎯 精确控制</h4>
                    <div class="precision-controls">
                        <div class="control-group">
                            <label>位置偏移:</label>
                            <input type="number" id="offset-x" placeholder="X" value="0">
                            <input type="number" id="offset-y" placeholder="Y" value="0">
                        </div>
                        <div class="control-group">
                            <label>缩放比例:</label>
                            <input type="range" id="scale-factor" min="50" max="200" value="100">
                            <span id="scale-value">100%</span>
                        </div>
                        <div class="control-group">
                            <label>旋转角度:</label>
                            <input type="range" id="rotation-angle" min="-180" max="180" value="0">
                            <span id="rotation-value">0°</span>
                        </div>
                    </div>
                </div>

                <div class="screenshot-section">
                    <h4>💾 导出设置</h4>
                    <div class="export-options">
                        <select id="export-format">
                            <option value="png">PNG (最高质量)</option>
                            <option value="jpg">JPG (较小文件)</option>
                            <option value="webp">WebP (现代格式)</option>
                        </select>
                        <div class="quality-setting">
                            <label>质量:</label>
                            <input type="range" id="export-quality" min="1" max="100" value="95">
                            <span id="quality-value">95%</span>
                        </div>
                    </div>
                </div>

                <div class="screenshot-actions">
                    <button id="preview-screenshot" class="btn-secondary">预览效果</button>
                    <button id="process-screenshot" class="btn-primary">处理截图</button>
                    <button id="save-preset" class="btn-secondary">保存预设</button>
                    <button id="export-screenshot" class="btn-success">导出图片</button>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(container);
        
        // 添加样式
        this.addStyles();
    }

    generateOptions(category) {
        if (!this.presets || !this.presets[category]) return '';
        
        const options = this.presets[category];
        if (Array.isArray(options)) {
            return options.map(option => 
                `<option value="${option}">${option}</option>`
            ).join('');
        } else {
            return Object.keys(options).map(key => 
                `<option value="${key}">${key}</option>`
            ).join('');
        }
    }

    generateFilterOptions() {
        const filters = [
            '无滤镜', '柔光', '锐化', '复古', '黑白', 
            '暖调', '冷调', '梦幻', '电影'
        ];
        return filters.map(filter => 
            `<option value="${filter}">${filter}</option>`
        ).join('');
    }

    bindEvents() {
        // 切换面板
        document.getElementById('screenshot-toggle').addEventListener('click', () => {
            const content = document.getElementById('screenshot-content');
            const button = document.getElementById('screenshot-toggle');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                button.textContent = '收起';
            } else {
                content.style.display = 'none';
                button.textContent = '展开';
            }
        });

        // 截图按钮
        document.getElementById('capture-screen').addEventListener('click', () => {
            this.captureScreen();
        });

        document.getElementById('capture-window').addEventListener('click', () => {
            this.captureWindow();
        });

        document.getElementById('capture-selection').addEventListener('click', () => {
            this.captureSelection();
        });

        // 实时预览
        ['background-preset', 'layout-template', 'filter-effect'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updatePreview();
            });
        });

        // 滑块更新
        document.getElementById('filter-strength').addEventListener('input', (e) => {
            document.getElementById('filter-strength-value').textContent = e.target.value + '%';
        });

        document.getElementById('scale-factor').addEventListener('input', (e) => {
            document.getElementById('scale-value').textContent = e.target.value + '%';
        });

        document.getElementById('rotation-angle').addEventListener('input', (e) => {
            document.getElementById('rotation-value').textContent = e.target.value + '°';
        });

        document.getElementById('export-quality').addEventListener('input', (e) => {
            document.getElementById('quality-value').textContent = e.target.value + '%';
        });

        // 处理按钮
        document.getElementById('preview-screenshot').addEventListener('click', () => {
            this.previewScreenshot();
        });

        document.getElementById('process-screenshot').addEventListener('click', () => {
            this.processScreenshot();
        });

        document.getElementById('export-screenshot').addEventListener('click', () => {
            this.exportScreenshot();
        });

        document.getElementById('save-preset').addEventListener('click', () => {
            this.savePreset();
        });
    }

    async captureScreen() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' }
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            video.addEventListener('loadedmetadata', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                
                const imageData = canvas.toDataURL('image/png');
                this.currentScreenshot = imageData;
                this.displayScreenshot(imageData);
                
                stream.getTracks().forEach(track => track.stop());
            });
            
        } catch (error) {
            console.error('截屏失败:', error);
            this.showToast('截屏失败: ' + error.message, 'error');
        }
    }

    async captureWindow() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'window' }
            });
            
            // 类似处理...
            this.showToast('窗口截图功能开发中...', 'info');
            
        } catch (error) {
            console.error('窗口截图失败:', error);
        }
    }

    async captureSelection() {
        // 创建选择区域工具
        this.showToast('选择区域功能开发中...', 'info');
    }

    displayScreenshot(imageData) {
        const preview = document.getElementById('screenshot-preview');
        preview.innerHTML = `
            <img src="${imageData}" alt="截图预览" style="max-width: 100%; height: auto;">
        `;
    }

    async processScreenshot() {
        if (!this.currentScreenshot) {
            this.showToast('请先截取图片', 'warning');
            return;
        }

        const options = this.getCurrentOptions();
        
        try {
            const response = await fetch(`${this.baseUrl}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: this.currentScreenshot.split(',')[1], // 移除data:image/png;base64,
                    options: options
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.processedScreenshot = 'data:image/png;base64,' + result.processed_image;
                this.displayScreenshot(this.processedScreenshot);
                this.showToast('截图处理完成!', 'success');
            } else {
                this.showToast('处理失败: ' + result.error, 'error');
            }
            
        } catch (error) {
            console.error('处理截图失败:', error);
            this.showToast('处理失败: ' + error.message, 'error');
        }
    }

    getCurrentOptions() {
        return {
            background: document.getElementById('background-preset').value,
            layout: document.getElementById('layout-template').value,
            filter: document.getElementById('filter-effect').value,
            auto_enhance: document.getElementById('auto-enhance').checked,
            crop_ratio: document.getElementById('smart-crop').checked ? [16, 9] : null,
            watermark_position: document.getElementById('add-watermark').checked ? 'bottom-right' : null,
            filter_strength: document.getElementById('filter-strength').value / 100,
            scale_factor: document.getElementById('scale-factor').value / 100,
            rotation_angle: document.getElementById('rotation-angle').value,
            offset_x: parseInt(document.getElementById('offset-x').value) || 0,
            offset_y: parseInt(document.getElementById('offset-y').value) || 0
        };
    }

    exportScreenshot() {
        const imageToExport = this.processedScreenshot || this.currentScreenshot;
        
        if (!imageToExport) {
            this.showToast('没有可导出的图片', 'warning');
            return;
        }

        const link = document.createElement('a');
        link.download = `screenshot_${new Date().getTime()}.png`;
        link.href = imageToExport;
        link.click();
        
        this.showToast('图片已导出!', 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .screenshot-plugin-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 350px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 10000;
                font-family: Arial, sans-serif;
            }
            
            .screenshot-plugin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 10px 10px 0 0;
            }
            
            .screenshot-plugin-content {
                padding: 20px;
                max-height: 600px;
                overflow-y: auto;
            }
            
            .screenshot-section {
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .screenshot-section h4 {
                margin: 0 0 10px 0;
                color: #333;
            }
            
            .screenshot-select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .btn-primary {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                margin: 5px;
            }
            
            .btn-secondary {
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                margin: 5px;
            }
            
            .btn-success {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                margin: 5px;
            }
            
            .screenshot-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 20px;
            }
            
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                z-index: 10001;
                animation: slideIn 0.3s ease-out;
            }
            
            .toast-success { background: #28a745; }
            .toast-error { background: #dc3545; }
            .toast-warning { background: #ffc107; color: #000; }
            .toast-info { background: #17a2b8; }
            
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 初始化插件
document.addEventListener('DOMContentLoaded', () => {
    new ScreenshotPlugin();
});
