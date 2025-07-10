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
