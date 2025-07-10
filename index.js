// SillyTavern Plugin: Puppy Screenshot Pro - Mobile Fixed Version
// 🐶 修复移动端和拖拽问题

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
  let startPosition = { x: 0, y: 0 };
  let advancedPanel = null;
  let lastScreenshotCanvas = null;
  let previewPanel = null;
  let isMobile = false;

  // 检测移动设备
  function detectMobile() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 初始化插件
  function initPlugin() {
    console.log('🐶 Puppy Screenshot Pro: 正在初始化...');
    
    isMobile = detectMobile();
    
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
    
    // 移动端适配
    if (isMobile) {
      floatingPanel.classList.add('puppy-mobile');
    }
    
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
          <button class="puppy-minimize-btn" id="puppy-minimize-btn" title="最小化" type="button">
            <span>−</span>
          </button>
          <button class="puppy-close-btn" id="puppy-close-btn" title="关闭" type="button">
            <span>×</span>
          </button>
        </div>
      </div>
      <div class="puppy-panel-content" id="puppy-panel-content">
        <div class="puppy-section">
          <h4 class="puppy-section-title">⚡ 快速截图</h4>
          <div class="puppy-button-grid">
            <button class="puppy-btn puppy-btn-primary" id="puppy-quick-screenshot" type="button">
              <span class="puppy-btn-icon">📸</span>
              <span>全屏截图</span>
            </button>
            <button class="puppy-btn puppy-btn-secondary" id="puppy-last-message" type="button">
              <span class="puppy-btn-icon">💬</span>
              <span>最后消息</span>
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
                      title="背景颜色 ${index + 1}"
                      type="button">
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
            <button class="puppy-btn puppy-btn-success" id="puppy-advanced-btn" type="button">
              <span class="puppy-btn-icon">⚙️</span>
              <span>高级设置</span>
            </button>
            <button class="puppy-btn puppy-btn-warning" id="puppy-download-btn" type="button">
              <span class="puppy-btn-icon">⬇️</span>
              <span>下载截图</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(floatingPanel);
    
    // 设置初始位置
    setInitialPosition();
    
    // 绑定事件
    bindPanelEvents();
  }

  // 设置初始位置
  function setInitialPosition() {
    if (isMobile) {
      // 移动端固定在顶部
      floatingPanel.style.position = 'fixed';
      floatingPanel.style.top = '10px';
      floatingPanel.style.left = '10px';
      floatingPanel.style.right = '10px';
      floatingPanel.style.width = 'auto';
      floatingPanel.style.zIndex = '999999';
    } else {
      // 桌面端右上角
      floatingPanel.style.position = 'fixed';
      floatingPanel.style.top = '50px';
      floatingPanel.style.right = '20px';
      floatingPanel.style.width = '300px';
      floatingPanel.style.zIndex = '999999';
    }
  }

  // 绑定面板事件
  function bindPanelEvents() {
    // 防止事件冲突
    removeAllEventListeners();
    
    const header = floatingPanel.querySelector('#puppy-panel-header');
    const minimizeBtn = floatingPanel.querySelector('#puppy-minimize-btn');
    const closeBtn = floatingPanel.querySelector('#puppy-close-btn');
    const quickScreenshot = floatingPanel.querySelector('#puppy-quick-screenshot');
    const lastMessage = floatingPanel.querySelector('#puppy-last-message');
    const advancedBtn = floatingPanel.querySelector('#puppy-advanced-btn');
    const downloadBtn = floatingPanel.querySelector('#puppy-download-btn');
    const colorGrid = floatingPanel.querySelector('#puppy-color-grid');
    const borderRadiusSlider = floatingPanel.querySelector('#puppy-border-radius');
    const paddingSlider = floatingPanel.querySelector('#puppy-padding');
    const watermarkCheckbox = floatingPanel.querySelector('#puppy-watermark');

    // 拖拽功能 - 桌面端
    if (header && !isMobile) {
      header.style.cursor = 'move';
      header.addEventListener('mousedown', handleMouseDown, { passive: false });
    }

    // 拖拽功能 - 移动端
    if (header && isMobile) {
      header.style.cursor = 'grab';
      header.addEventListener('touchstart', handleTouchStart, { passive: false });
    }

    // 按钮事件
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', toggleMinimize);
      minimizeBtn.addEventListener('touchend', toggleMinimize);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closePanel);
      closeBtn.addEventListener('touchend', closePanel);
    }

    if (quickScreenshot) {
      quickScreenshot.addEventListener('click', takeQuickScreenshot);
      quickScreenshot.addEventListener('touchend', takeQuickScreenshot);
    }
    
    if (lastMessage) {
      lastMessage.addEventListener('click', takeLastMessageScreenshot);
      lastMessage.addEventListener('touchend', takeLastMessageScreenshot);
    }

    if (advancedBtn) {
      advancedBtn.addEventListener('click', showAdvancedSettings);
      advancedBtn.addEventListener('touchend', showAdvancedSettings);
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadLastScreenshot);
      downloadBtn.addEventListener('touchend', downloadLastScreenshot);
    }

    // 颜色选择
    if (colorGrid) {
      colorGrid.addEventListener('click', handleColorSelection);
      colorGrid.addEventListener('touchend', handleColorSelection);
    }

    // 滑块事件
    if (borderRadiusSlider) {
      borderRadiusSlider.addEventListener('input', updateBorderRadius);
      borderRadiusSlider.addEventListener('change', updateBorderRadius);
    }
    
    if (paddingSlider) {
      paddingSlider.addEventListener('input', updatePadding);
      paddingSlider.addEventListener('change', updatePadding);
    }

    // 水印复选框
    if (watermarkCheckbox) {
      watermarkCheckbox.addEventListener('change', updateWatermark);
    }

    // 全局事件
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }

  // 移除所有事件监听器
  function removeAllEventListeners() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }

  // 鼠标拖拽处理
  function handleMouseDown(e) {
    if (isMobile) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = true;
    const rect = floatingPanel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    startPosition.x = e.clientX;
    startPosition.y = e.clientY;
    
    floatingPanel.style.transition = 'none';
    floatingPanel.style.cursor = 'grabbing';
  }

  function handleMouseMove(e) {
    if (!isDragging || isMobile) return;
    
    e.preventDefault();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    updatePosition(newX, newY);
  }

  function handleMouseUp(e) {
    if (!isDragging || isMobile) return;
    
    isDragging = false;
    floatingPanel.style.transition = '';
    floatingPanel.style.cursor = '';
    
    const header = floatingPanel.querySelector('#puppy-panel-header');
    if (header) {
      header.style.cursor = 'move';
    }
  }

  // 触摸拖拽处理
  function handleTouchStart(e) {
    if (!isMobile) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    isDragging = true;
    const rect = floatingPanel.getBoundingClientRect();
    dragOffset.x = touch.clientX - rect.left;
    dragOffset.y = touch.clientY - rect.top;
    startPosition.x = touch.clientX;
    startPosition.y = touch.clientY;
    
    floatingPanel.style.transition = 'none';
    const header = floatingPanel.querySelector('#puppy-panel-header');
    if (header) {
      header.style.cursor = 'grabbing';
    }
  }

  function handleTouchMove(e) {
    if (!isDragging || !isMobile) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    updatePosition(newX, newY);
  }

  function handleTouchEnd(e) {
    if (!isDragging || !isMobile) return;
    
    isDragging = false;
    floatingPanel.style.transition = '';
    
    const header = floatingPanel.querySelector('#puppy-panel-header');
    if (header) {
      header.style.cursor = 'grab';
    }
  }

  // 更新位置
  function updatePosition(x, y) {
    const maxX = window.innerWidth - floatingPanel.offsetWidth;
    const maxY = window.innerHeight - floatingPanel.offsetHeight;
    
    const finalX = Math.max(0, Math.min(x, maxX));
    const finalY = Math.max(0, Math.min(y, maxY));
    
    floatingPanel.style.left = finalX + 'px';
    floatingPanel.style.top = finalY + 'px';
    floatingPanel.style.right = 'auto';
    floatingPanel.style.bottom = 'auto';
  }

  // 最小化/展开
  function toggleMinimize(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const content = floatingPanel.querySelector('#puppy-panel-content');
    const minimizeBtn = floatingPanel.querySelector('#puppy-minimize-btn');
    
    if (content && minimizeBtn) {
      isMinimized = !isMinimized;
      content.style.display = isMinimized ? 'none' : 'block';
      minimizeBtn.querySelector('span').textContent = isMinimized ? '+' : '−';
      
      // 移动端调整样式
      if (isMobile && isMinimized) {
        floatingPanel.style.width = 'auto';
        floatingPanel.style.minWidth = '200px';
      }
    }
  }

  // 关闭面板
  function closePanel(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (floatingPanel) {
      floatingPanel.style.display = 'none';
    }
  }

  // 截图功能
  async function takeQuickScreenshot(e) {
    e.preventDefault();
    e.stopPropagation();
    
    showProgress('正在截图...');
    
    try {
      // 临时隐藏面板
      const originalDisplay = floatingPanel.style.display;
      floatingPanel.style.display = 'none';
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        scale: isMobile ? 1 : 2,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // 恢复面板
      floatingPanel.style.display = originalDisplay;
      
      lastScreenshotCanvas = canvas;
      showScreenshotPreview(canvas);
      showNotification('截图成功！🐶', 'success');
    } catch (error) {
      console.error('截图失败:', error);
      showNotification('截图失败，请重试', 'error');
      floatingPanel.style.display = originalDisplay;
    }
    
    hideProgress();
  }

  async function takeLastMessageScreenshot(e) {
    e.preventDefault();
    e.stopPropagation();
    
    showProgress('正在截图最后消息...');
    
    try {
      const lastMessage = document.querySelector('#chat .mes:last-child, .message:last-child, [class*="message"]:last-child');
      if (!lastMessage) {
        showNotification('没有找到消息', 'error');
        hideProgress();
        return;
      }
      
      const canvas = await html2canvas(lastMessage, {
        allowTaint: true,
        useCORS: true,
        scale: isMobile ? 1 : 2,
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
    if (isMobile) {
      previewPanel.classList.add('puppy-mobile');
    }
    
    previewPanel.innerHTML = `
      <div class="puppy-preview-header">
        <h3>截图预览</h3>
        <button class="puppy-close-btn" id="puppy-preview-close" type="button">
          <span>×</span>
        </button>
      </div>
      <div class="puppy-preview-content">
        <div class="puppy-preview-image"></div>
        <div class="puppy-preview-controls">
          <button class="puppy-btn puppy-btn-primary" id="puppy-save-screenshot" type="button">
            <span class="puppy-btn-icon">💾</span>
            <span>保存截图</span>
          </button>
          <button class="puppy-btn puppy-btn-secondary" id="puppy-enhance-screenshot" type="button">
            <span class="puppy-btn-icon">✨</span>
            <span>美化截图</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(previewPanel);
    
    // 显示图片
    const previewImage = previewPanel.querySelector('.puppy-preview-image');
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    previewImage.appendChild(img);
    
    // 绑定预览面板事件
    const closeBtn = previewPanel.querySelector('#puppy-preview-close');
    const saveBtn = previewPanel.querySelector('#puppy-save-screenshot');
    const enhanceBtn = previewPanel.querySelector('#puppy-enhance-screenshot');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closePreview);
      closeBtn.addEventListener('touchend', closePreview);
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => downloadCanvas(canvas, 'puppy-screenshot.png'));
      saveBtn.addEventListener('touchend', () => downloadCanvas(canvas, 'puppy-screenshot.png'));
    }
    
    if (enhanceBtn) {
      enhanceBtn.addEventListener('click', () => enhanceScreenshot(canvas));
      enhanceBtn.addEventListener('touchend', () => enhanceScreenshot(canvas));
    }
  }

  function closePreview(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (previewPanel) {
      previewPanel.remove();
      previewPanel = null;
    }
  }

  // 其他功能函数
  function handleColorSelection(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.classList.contains('puppy-color-btn')) {
      const index = parseInt(e.target.dataset.index);
      const colorBtns = floatingPanel.querySelectorAll('.puppy-color-btn');
      
      colorBtns.forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      
      const settings = getSettings();
      settings.selectedBackground = index;
      saveSettings(settings);
      
      showNotification('背景颜色已更新！🐶', 'success');
    }
  }

  function updateBorderRadius(e) {
    const value = e.target.value;
    const valueDisplay = floatingPanel.querySelector('#puppy-border-radius-value');
    if (valueDisplay) {
      valueDisplay.textContent = value + 'px';
    }
    
    const settings = getSettings();
    settings.borderRadius = parseInt(value);
    saveSettings(settings);
  }

  function updatePadding(e) {
    const value = e.target.value;
    const valueDisplay = floatingPanel.querySelector('#puppy-padding-value');
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

  function downloadLastScreenshot(e) {
    e.preventDefault();
    e.stopPropagation();
    
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
      ctx.fillText('🐶 Puppy Screenshot Pro', padding + 10, enhancedCanvas.height - 10);
    }
    
    // 更新预览
    const previewImage = previewPanel.querySelector('.puppy-preview-image');
    const img = document.createElement('img');
    img.src = enhancedCanvas.toDataURL();
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    previewImage.innerHTML = '';
    previewImage.appendChild(img);
    
    lastScreenshotCanvas = enhancedCanvas;
  }

  function showAdvancedSettings(e) {
    e.preventDefault();
    e.stopPropagation();
    
    showNotification('高级设置功能开发中...', 'warning');
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
    if (isMobile) {
      notification.classList.add('puppy-mobile');
    }
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 窗口大小变化处理
  window.addEventListener('resize', function() {
    const wasMobile = isMobile;
    isMobile = detectMobile();
    
    if (wasMobile !== isMobile && floatingPanel) {
      // 设备类型改变，重新创建面板
      createFloatingPanel();
    }
  });

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlugin);
  } else {
    initPlugin();
  }

})();
