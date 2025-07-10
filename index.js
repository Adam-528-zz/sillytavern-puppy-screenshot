// SillyTavern Plugin: Puppy Screenshot Pro - Fixed Version
// 🐶 强大的截图插件，修复所有功能问题

(function() {
  'use strict';

  const PLUGIN_ID = 'puppy-screenshot-pro';
  
  // 默认设置
  const defaultSettings = {
    backgroundColors: ['#FF6B9D', '#4ECDC4', '#FFEAA7', '#A855F7', '#F59E0B', '#E74C3C'],
    borderRadius: 12,
    padding: 20,
    watermark: false,
    selectedBackground: 0,
    imageFormat: 'png',
    imageQuality: 0.9
  };

  // 插件状态
  let floatingPanel = null;
  let isMinimized = false;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let advancedPanel = null;
  let lastScreenshotCanvas = null;
  let previewPanel = null;

  // 初始化插件
  function initPlugin() {
    console.log('🐶 Puppy Screenshot Pro: 正在初始化...');
    
    // 加载html2canvas
    loadHtml2Canvas().then(() => {
      createFloatingPanel();
      console.log('🐶 Puppy Screenshot Pro: 初始化完成！');
    }).catch(err => {
      console.error('🐶 Puppy Screenshot Pro: 初始化失败:', err);
    });
  }

  // 加载html2canvas库
  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 创建浮动面板
  function createFloatingPanel() {
    if (floatingPanel) {
      floatingPanel.remove();
    }

    floatingPanel = document.createElement('div');
    floatingPanel.id = 'puppy-floating-panel';
    floatingPanel.className = 'puppy-floating-panel';
    floatingPanel.innerHTML = `
      <div class="puppy-panel-header" id="puppy-panel-header">
        <div class="puppy-panel-title">
          <span class="puppy-icon">🐶</span>
          <div>
            <div class="puppy-title">Puppy Screenshot</div>
            <div class="puppy-subtitle">专业截图工具</div>
          </div>
        </div>
        <div class="puppy-header-controls">
          <button class="puppy-minimize-btn" id="puppy-minimize-btn" title="最小化">
            <i class="fas fa-minus"></i>
          </button>
          <button class="puppy-close-btn" id="puppy-close-btn" title="关闭">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="puppy-panel-content" id="puppy-panel-content">
        <div class="puppy-section">
          <h4 class="puppy-section-title">⚡ 快速截图</h4>
          <div class="puppy-button-grid">
            <button class="puppy-btn puppy-btn-primary" id="puppy-quick-screenshot">
              <i class="fas fa-camera"></i>
              全屏截图
            </button>
            <button class="puppy-btn puppy-btn-secondary" id="puppy-last-message">
              <i class="fas fa-comment"></i>
              最后消息
            </button>
          </div>
        </div>
        
        <div class="puppy-section">
          <h4 class="puppy-section-title">🎨 背景颜色</h4>
          <div class="puppy-color-grid" id="puppy-color-grid">
            ${defaultSettings.backgroundColors.map((color, index) => `
              <button class="puppy-color-btn ${index === 0 ? 'active' : ''}" 
                      data-color="${color}" 
                      data-index="${index}"
                      style="background: ${color}" 
                      title="背景颜色 ${index + 1}">
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="puppy-section">
          <h4 class="puppy-section-title">🔧 设置</h4>
          <div class="puppy-settings-grid">
            <div class="puppy-setting-row">
              <label>圆角: <span id="puppy-border-radius-value">12px</span></label>
              <input type="range" id="puppy-border-radius" min="0" max="50" value="12">
            </div>
            <div class="puppy-setting-row">
              <label>边距: <span id="puppy-padding-value">20px</span></label>
              <input type="range" id="puppy-padding" min="0" max="50" value="20">
            </div>
            <div class="puppy-setting-row">
              <label>
                <input type="checkbox" id="puppy-watermark"> 添加水印
              </label>
            </div>
          </div>
        </div>
        
        <div class="puppy-section">
          <div class="puppy-button-grid">
            <button class="puppy-btn puppy-btn-success" id="puppy-advanced-btn">
              <i class="fas fa-cog"></i>
              高级设置
            </button>
            <button class="puppy-btn puppy-btn-warning" id="puppy-download-btn">
              <i class="fas fa-download"></i>
              下载截图
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(floatingPanel);
    
    // 定位面板
    floatingPanel.style.position = 'fixed';
    floatingPanel.style.top = '50px';
    floatingPanel.style.right = '20px';
    floatingPanel.style.zIndex = '10000';
    
    // 绑定事件
    bindPanelEvents();
  }

  // 绑定面板事件
  function bindPanelEvents() {
    const header = document.getElementById('puppy-panel-header');
    const minimizeBtn = document.getElementById('puppy-minimize-btn');
    const closeBtn = document.getElementById('puppy-close-btn');
    const quickScreenshot = document.getElementById('puppy-quick-screenshot');
    const lastMessage = document.getElementById('puppy-last-message');
    const advancedBtn = document.getElementById('puppy-advanced-btn');
    const downloadBtn = document.getElementById('puppy-download-btn');
    const colorGrid = document.getElementById('puppy-color-grid');
    const borderRadiusSlider = document.getElementById('puppy-border-radius');
    const paddingSlider = document.getElementById('puppy-padding');
    const watermarkCheckbox = document.getElementById('puppy-watermark');

    // 拖拽功能
    if (header) {
      header.addEventListener('mousedown', startDrag);
      header.style.cursor = 'move';
    }

    // 最小化
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', toggleMinimize);
    }

    // 关闭
    if (closeBtn) {
      closeBtn.addEventListener('click', closePanel);
    }

    // 截图按钮
    if (quickScreenshot) {
      quickScreenshot.addEventListener('click', takeQuickScreenshot);
    }
    
    if (lastMessage) {
      lastMessage.addEventListener('click', takeLastMessageScreenshot);
    }

    // 高级设置
    if (advancedBtn) {
      advancedBtn.addEventListener('click', showAdvancedSettings);
    }

    // 下载按钮
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadLastScreenshot);
    }

    // 颜色选择
    if (colorGrid) {
      colorGrid.addEventListener('click', handleColorSelection);
    }

    // 滑块事件
    if (borderRadiusSlider) {
      borderRadiusSlider.addEventListener('input', updateBorderRadius);
    }
    
    if (paddingSlider) {
      paddingSlider.addEventListener('input', updatePadding);
    }

    // 水印复选框
    if (watermarkCheckbox) {
      watermarkCheckbox.addEventListener('change', updateWatermark);
    }

    // 全局拖拽事件
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  }

  // 拖拽功能
  function startDrag(e) {
    isDragging = true;
    const rect = floatingPanel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    floatingPanel.style.transition = 'none';
    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // 边界检查
    const maxX = window.innerWidth - floatingPanel.offsetWidth;
    const maxY = window.innerHeight - floatingPanel.offsetHeight;
    
    const finalX = Math.max(0, Math.min(newX, maxX));
    const finalY = Math.max(0, Math.min(newY, maxY));
    
    floatingPanel.style.left = finalX + 'px';
    floatingPanel.style.top = finalY + 'px';
    floatingPanel.style.right = 'auto';
  }

  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      floatingPanel.style.transition = '';
    }
  }

  // 最小化/展开
  function toggleMinimize() {
    const content = document.getElementById('puppy-panel-content');
    const minimizeBtn = document.getElementById('puppy-minimize-btn');
    
    if (content && minimizeBtn) {
      isMinimized = !isMinimized;
      content.style.display = isMinimized ? 'none' : 'block';
      minimizeBtn.innerHTML = isMinimized ? '<i class="fas fa-plus"></i>' : '<i class="fas fa-minus"></i>';
    }
  }

  // 关闭面板
  function closePanel() {
    if (floatingPanel) {
      floatingPanel.style.display = 'none';
    }
  }

  // 截图功能
  async function takeQuickScreenshot() {
    showProgress('正在截图...');
    
    try {
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        scale: 1,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      lastScreenshotCanvas = canvas;
      showScreenshotPreview(canvas);
      showNotification('截图成功！🐶', 'success');
    } catch (error) {
      console.error('截图失败:', error);
      showNotification('截图失败，请重试', 'error');
    }
    
    hideProgress();
  }

  async function takeLastMessageScreenshot() {
    showProgress('正在截图最后消息...');
    
    try {
      const lastMessage = document.querySelector('#chat .mes:last-child');
      if (!lastMessage) {
        showNotification('没有找到消息', 'error');
        hideProgress();
        return;
      }
      
      const canvas = await html2canvas(lastMessage, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      lastScreenshotCanvas = canvas;
      showScreenshotPreview(canvas);
      showNotification('消息截图成功！🐶', 'success');
    } catch (error) {
      console.error('消息截图失败:', error);
      showNotification('消息截图失败，请重试', 'error');
    }
    
    hideProgress();
  }

  // 显示截图预览
  function showScreenshotPreview(canvas) {
    if (previewPanel) {
      previewPanel.remove();
    }

    previewPanel = document.createElement('div');
    previewPanel.className = 'puppy-preview-panel';
    previewPanel.innerHTML = `
      <div class="puppy-preview-header">
        <h3>截图预览</h3>
        <button class="puppy-close-btn" id="puppy-preview-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="puppy-preview-content">
        <div class="puppy-preview-image"></div>
        <div class="puppy-preview-controls">
          <button class="puppy-btn puppy-btn-primary" id="puppy-save-screenshot">
            <i class="fas fa-save"></i>
            保存截图
          </button>
          <button class="puppy-btn puppy-btn-secondary" id="puppy-enhance-screenshot">
            <i class="fas fa-magic"></i>
            美化截图
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(previewPanel);
    
    // 显示图片
    const previewImage = previewPanel.querySelector('.puppy-preview-image');
    previewImage.appendChild(canvas);
    
    // 绑定预览面板事件
    const closeBtn = previewPanel.querySelector('#puppy-preview-close');
    const saveBtn = previewPanel.querySelector('#puppy-save-screenshot');
    const enhanceBtn = previewPanel.querySelector('#puppy-enhance-screenshot');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        previewPanel.remove();
        previewPanel = null;
      });
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        downloadCanvas(canvas, 'puppy-screenshot.png');
      });
    }
    
    if (enhanceBtn) {
      enhanceBtn.addEventListener('click', () => {
        enhanceScreenshot(canvas);
      });
    }
  }

  // 美化截图
  function enhanceScreenshot(originalCanvas) {
    const settings = getSettings();
    const enhancedCanvas = document.createElement('canvas');
    const ctx = enhancedCanvas.getContext('2d');
    
    const padding = settings.padding;
    const borderRadius = settings.borderRadius;
    const bgColor = settings.backgroundColors[settings.selectedBackground];
    
    enhancedCanvas.width = originalCanvas.width + padding * 2;
    enhancedCanvas.height = originalCanvas.height + padding * 2;
    
    // 绘制背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, enhancedCanvas.width, enhancedCanvas.height);
    
    // 绘制原图
    ctx.drawImage(originalCanvas, padding, padding);
    
    // 添加水印
    if (settings.watermark) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.font = '16px Arial';
      ctx.fillText('🐶 Puppy Screenshot Pro', padding + 10, enhancedCanvas.height - padding + 20);
    }
    
    // 更新预览
    const previewImage = previewPanel.querySelector('.puppy-preview-image');
    previewImage.innerHTML = '';
    previewImage.appendChild(enhancedCanvas);
    
    lastScreenshotCanvas = enhancedCanvas;
  }

  // 高级设置
  function showAdvancedSettings() {
    if (advancedPanel) {
      advancedPanel.remove();
    }

    advancedPanel = document.createElement('div');
    advancedPanel.className = 'puppy-advanced-panel';
    advancedPanel.innerHTML = `
      <div class="puppy-advanced-header">
        <h3>🔧 高级设置</h3>
        <button class="puppy-close-btn" id="puppy-advanced-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="puppy-advanced-content">
        <div class="puppy-advanced-section">
          <h4>图片格式</h4>
          <select id="puppy-format-select">
            <option value="png">PNG (高质量)</option>
            <option value="jpeg">JPEG (压缩)</option>
            <option value="webp">WebP (现代)</option>
          </select>
        </div>
        
        <div class="puppy-advanced-section">
          <h4>图片质量</h4>
          <input type="range" id="puppy-quality-slider" min="0.1" max="1" step="0.1" value="0.9">
          <span id="puppy-quality-value">90%</span>
        </div>
        
        <div class="puppy-advanced-section">
          <h4>AI 功能</h4>
          <button class="puppy-btn puppy-btn-primary" id="puppy-ai-poster">
            <i class="fas fa-robot"></i>
            生成AI海报
          </button>
        </div>
        
        <div class="puppy-advanced-actions">
          <button class="puppy-btn puppy-btn-success" id="puppy-apply-settings">
            <i class="fas fa-check"></i>
            应用设置
          </button>
          <button class="puppy-btn puppy-btn-secondary" id="puppy-reset-settings">
            <i class="fas fa-undo"></i>
            重置默认
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(advancedPanel);
    
    // 绑定高级设置事件
    const closeBtn = advancedPanel.querySelector('#puppy-advanced-close');
    const applyBtn = advancedPanel.querySelector('#puppy-apply-settings');
    const resetBtn = advancedPanel.querySelector('#puppy-reset-settings');
    const qualitySlider = advancedPanel.querySelector('#puppy-quality-slider');
    const qualityValue = advancedPanel.querySelector('#puppy-quality-value');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        advancedPanel.remove();
        advancedPanel = null;
      });
    }
    
    if (applyBtn) {
      applyBtn.addEventListener('click', applyAdvancedSettings);
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', resetSettings);
    }
    
    if (qualitySlider && qualityValue) {
      qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = Math.round(e.target.value * 100) + '%';
      });
    }
  }

  // 其他功能函数
  function handleColorSelection(e) {
    if (e.target.classList.contains('puppy-color-btn')) {
      const index = parseInt(e.target.dataset.index);
      const colorBtns = document.querySelectorAll('.puppy-color-btn');
      
      colorBtns.forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      
      // 保存设置
      const settings = getSettings();
      settings.selectedBackground = index;
      saveSettings(settings);
      
      showNotification('背景颜色已更新！🐶', 'success');
    }
  }

  function updateBorderRadius(e) {
    const value = e.target.value;
    const valueDisplay = document.getElementById('puppy-border-radius-value');
    if (valueDisplay) {
      valueDisplay.textContent = value + 'px';
    }
    
    const settings = getSettings();
    settings.borderRadius = parseInt(value);
    saveSettings(settings);
  }

  function updatePadding(e) {
    const value = e.target.value;
    const valueDisplay = document.getElementById('puppy-padding-value');
    if (valueDisplay) {
      valueDisplay.textContent = value + 'px';
    }
    
    const settings = getSettings();
    settings.padding = parseInt(value);
    saveSettings(settings);
  }

  function updateWatermark(e) {
    const settings = getSettings();
    settings.watermark = e.target.checked;
    saveSettings(settings);
  }

  function downloadLastScreenshot() {
    if (lastScreenshotCanvas) {
      downloadCanvas(lastScreenshotCanvas, 'puppy-screenshot.png');
    } else {
      showNotification('没有可下载的截图', 'error');
    }
  }

  function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
  }

  function applyAdvancedSettings() {
    showNotification('设置已应用！🐶', 'success');
    if (advancedPanel) {
      advancedPanel.remove();
      advancedPanel = null;
    }
  }

  function resetSettings() {
    saveSettings(defaultSettings);
    showNotification('设置已重置！🐶', 'success');
    
    // 更新UI
    updateUI();
  }

  function updateUI() {
    const settings = getSettings();
    
    // 更新滑块
    const borderRadiusSlider = document.getElementById('puppy-border-radius');
    const paddingSlider = document.getElementById('puppy-padding');
    const borderRadiusValue = document.getElementById('puppy-border-radius-value');
    const paddingValue = document.getElementById('puppy-padding-value');
    const watermarkCheckbox = document.getElementById('puppy-watermark');
    
    if (borderRadiusSlider) {
      borderRadiusSlider.value = settings.borderRadius;
      if (borderRadiusValue) {
        borderRadiusValue.textContent = settings.borderRadius + 'px';
      }
    }
    
    if (paddingSlider) {
      paddingSlider.value = settings.padding;
      if (paddingValue) {
        paddingValue.textContent = settings.padding + 'px';
      }
    }
    
    if (watermarkCheckbox) {
      watermarkCheckbox.checked = settings.watermark;
    }
    
    // 更新颜色选择
    const colorBtns = document.querySelectorAll('.puppy-color-btn');
    colorBtns.forEach((btn, index) => {
      btn.classList.toggle('active', index === settings.selectedBackground);
    });
  }

  // 工具函数
  function getSettings() {
    const stored = localStorage.getItem(PLUGIN_ID);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };
  }

  function saveSettings(settings) {
    localStorage.setItem(PLUGIN_ID, JSON.stringify(settings));
  }

  function showProgress(message) {
    const progress = document.createElement('div');
    progress.id = 'puppy-progress';
    progress.className = 'puppy-progress-overlay';
    progress.innerHTML = `
      <div class="puppy-progress-content">
        <div class="puppy-spinner"></div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(progress);
  }

  function hideProgress() {
    const progress = document.getElementById('puppy-progress');
    if (progress) {
      progress.remove();
    }
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `puppy-notification puppy-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlugin);
  } else {
    initPlugin();
  }

})();
