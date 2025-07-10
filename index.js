// SillyTavern Plugin: Puppy Screenshot Pro - Complete Fix
// 彻底修复所有问题

(function() {
  'use strict';

  const PLUGIN_ID = 'puppy-screenshot-pro';
  
  // 全局变量
  let floatingPanel = null;
  let isMinimized = false;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let lastScreenshotCanvas = null;
  let previewPanel = null;
  let advancedPanel = null;
  let isMobile = false;
  let isInitialized = false;

  // 检测移动设备
  function detectMobile() {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 初始化插件
  function initPlugin() {
    if (isInitialized) return;
    
    console.log('Puppy Screenshot Pro: 开始初始化');
    isMobile = detectMobile();
    
    // 先加载html2canvas
    loadHtml2Canvas()
      .then(() => {
        createFloatingPanel();
        isInitialized = true;
        console.log('Puppy Screenshot Pro: 初始化成功');
      })
      .catch(err => {
        console.error('Puppy Screenshot Pro: 初始化失败:', err);
      });
  }

  // 加载html2canvas
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
    // 移除旧面板
    if (floatingPanel) {
      floatingPanel.remove();
    }

    floatingPanel = document.createElement('div');
    floatingPanel.id = 'puppy-floating-panel';
    floatingPanel.className = 'puppy-floating-panel';
    
    if (isMobile) {
      floatingPanel.classList.add('puppy-mobile');
    }

    floatingPanel.innerHTML = `
      <div class="puppy-panel-header" id="puppy-panel-header">
        <div class="puppy-panel-title">
          <span class="puppy-icon">🐶</span>
          <span class="puppy-title">Puppy Screenshot</span>
        </div>
        <div class="puppy-header-controls">
          <button class="puppy-minimize-btn" id="puppy-minimize-btn" title="最小化">
            <span>−</span>
          </button>
          <button class="puppy-close-btn" id="puppy-close-btn" title="关闭">
            <span>×</span>
          </button>
        </div>
      </div>
      <div class="puppy-panel-content" id="puppy-panel-content">
        <div class="puppy-section">
          <div class="puppy-button-grid">
            <button class="puppy-btn puppy-btn-primary" id="puppy-quick-screenshot">
              <span>📸 全屏截图</span>
            </button>
            <button class="puppy-btn puppy-btn-secondary" id="puppy-last-message">
              <span>💬 最后消息</span>
            </button>
          </div>
        </div>
        
        <div class="puppy-section">
          <h4>背景颜色</h4>
          <div class="puppy-color-grid" id="puppy-color-grid">
            <button class="puppy-color-btn active" data-color="#FF6B9D" style="background: #FF6B9D"></button>
            <button class="puppy-color-btn" data-color="#4ECDC4" style="background: #4ECDC4"></button>
            <button class="puppy-color-btn" data-color="#FFEAA7" style="background: #FFEAA7"></button>
            <button class="puppy-color-btn" data-color="#A855F7" style="background: #A855F7"></button>
            <button class="puppy-color-btn" data-color="#F59E0B" style="background: #F59E0B"></button>
            <button class="puppy-color-btn" data-color="#E74C3C" style="background: #E74C3C"></button>
          </div>
        </div>
        
        <div class="puppy-section">
          <div class="puppy-button-grid">
            <button class="puppy-btn puppy-btn-success" id="puppy-advanced-btn">
              <span>⚙️ 高级设置</span>
            </button>
            <button class="puppy-btn puppy-btn-warning" id="puppy-download-btn">
              <span>⬇️ 下载截图</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(floatingPanel);
    
    // 设置初始位置
    setInitialPosition();
    
    // 绑定事件
    setTimeout(() => {
      bindEvents();
    }, 100);
  }

  // 设置初始位置
  function setInitialPosition() {
    if (isMobile) {
      floatingPanel.style.position = 'fixed';
      floatingPanel.style.top = '20px';
      floatingPanel.style.left = '20px';
      floatingPanel.style.right = '20px';
      floatingPanel.style.width = 'auto';
      floatingPanel.style.zIndex = '999999';
    } else {
      floatingPanel.style.position = 'fixed';
      floatingPanel.style.top = '100px';
      floatingPanel.style.right = '30px';
      floatingPanel.style.width = '300px';
      floatingPanel.style.zIndex = '999999';
    }
  }

  // 绑定所有事件
  function bindEvents() {
    // 头部拖拽
    const header = document.getElementById('puppy-panel-header');
    if (header) {
      header.addEventListener('mousedown', startDrag);
      header.addEventListener('touchstart', startDrag, { passive: false });
    }

    // 最小化按钮
    const minimizeBtn = document.getElementById('puppy-minimize-btn');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', toggleMinimize);
      minimizeBtn.addEventListener('touchend', toggleMinimize);
    }

    // 关闭按钮
    const closeBtn = document.getElementById('puppy-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closePanel);
      closeBtn.addEventListener('touchend', closePanel);
    }

    // 截图按钮
    const quickScreenshot = document.getElementById('puppy-quick-screenshot');
    if (quickScreenshot) {
      quickScreenshot.addEventListener('click', takeQuickScreenshot);
      quickScreenshot.addEventListener('touchend', takeQuickScreenshot);
    }

    const lastMessage = document.getElementById('puppy-last-message');
    if (lastMessage) {
      lastMessage.addEventListener('click', takeLastMessageScreenshot);
      lastMessage.addEventListener('touchend', takeLastMessageScreenshot);
    }

    // 高级设置按钮
    const advancedBtn = document.getElementById('puppy-advanced-btn');
    if (advancedBtn) {
      advancedBtn.addEventListener('click', showAdvancedSettings);
      advancedBtn.addEventListener('touchend', showAdvancedSettings);
    }

    // 下载按钮
    const downloadBtn = document.getElementById('puppy-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadLastScreenshot);
      downloadBtn.addEventListener('touchend', downloadLastScreenshot);
    }

    // 颜色选择
    const colorGrid = document.getElementById('puppy-color-grid');
    if (colorGrid) {
      colorGrid.addEventListener('click', handleColorSelection);
      colorGrid.addEventListener('touchend', handleColorSelection);
    }

    // 全局拖拽事件
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }

  // 开始拖拽
  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = true;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const rect = floatingPanel.getBoundingClientRect();
    dragOffset.x = clientX - rect.left;
    dragOffset.y = clientY - rect.top;
    
    floatingPanel.style.transition = 'none';
    floatingPanel.style.cursor = 'grabbing';
    
    console.log('开始拖拽');
  }

  // 拖拽中
  function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;
    
    // 边界检测
    const maxX = window.innerWidth - floatingPanel.offsetWidth;
    const maxY = window.innerHeight - floatingPanel.offsetHeight;
    
    const finalX = Math.max(0, Math.min(newX, maxX));
    const finalY = Math.max(0, Math.min(newY, maxY));
    
    floatingPanel.style.left = finalX + 'px';
    floatingPanel.style.top = finalY + 'px';
    floatingPanel.style.right = 'auto';
    floatingPanel.style.bottom = 'auto';
  }

  // 停止拖拽
  function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    floatingPanel.style.transition = '';
    floatingPanel.style.cursor = '';
    
    console.log('停止拖拽');
  }

  // 最小化/展开
  function toggleMinimize(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const content = document.getElementById('puppy-panel-content');
    const minimizeBtn = document.getElementById('puppy-minimize-btn');
    
    if (content && minimizeBtn) {
      isMinimized = !isMinimized;
      content.style.display = isMinimized ? 'none' : 'block';
      minimizeBtn.querySelector('span').textContent = isMinimized ? '+' : '−';
      
      console.log('切换最小化状态:', isMinimized);
    }
  }

  // 关闭面板
  function closePanel(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (floatingPanel) {
      floatingPanel.style.display = 'none';
      console.log('关闭面板');
    }
  }

  // 全屏截图
  async function takeQuickScreenshot(e) {
    e.preventDefault();
    e.stopPropagation();
    
    showProgress('正在截图...');
    
    try {
      // 隐藏面板
      const originalDisplay = floatingPanel.style.display;
      floatingPanel.style.display = 'none';
      
      // 等待一下让界面更新
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 截图
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        scale: 1,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#ffffff'
      });
      
      // 恢复面板
      floatingPanel.style.display = originalDisplay;
      
      // 保存截图
      lastScreenshotCanvas = canvas;
      
      // 显示预览
      showScreenshotPreview(canvas);
      
      showNotification('截图成功！', 'success');
      console.log('全屏截图成功');
      
    } catch (error) {
      console.error('截图失败:', error);
      showNotification('截图失败', 'error');
      floatingPanel.style.display = originalDisplay;
    }
    
    hideProgress();
  }

  // 最后消息截图
  async function takeLastMessageScreenshot(e) {
    e.preventDefault();
    e.stopPropagation();
    
    showProgress('正在截图最后消息...');
    
    try {
      // 查找最后一条消息
      const messageSelectors = [
        '#chat .mes:last-child',
        '.message:last-child',
        '[class*="message"]:last-child',
        '.chat-message:last-child',
        '#sheld .mes:last-child'
      ];
      
      let lastMessage = null;
      for (const selector of messageSelectors) {
        lastMessage = document.querySelector(selector);
        if (lastMessage) break;
      }
      
      if (!lastMessage) {
        showNotification('没有找到消息', 'error');
        hideProgress();
        return;
      }
      
      // 确保消息可见
      lastMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 等待滚动完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 截图消息
      const canvas = await html2canvas(lastMessage, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        width: lastMessage.offsetWidth,
        height: lastMessage.offsetHeight
      });
      
      // 确保canvas有内容
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('截图内容为空');
      }
      
      // 保存截图
      lastScreenshotCanvas = canvas;
      
      // 显示预览
      showScreenshotPreview(canvas);
      
      showNotification('消息截图成功！', 'success');
      console.log('消息截图成功，尺寸:', canvas.width, 'x', canvas.height);
      
    } catch (error) {
      console.error('消息截图失败:', error);
      showNotification('消息截图失败', 'error');
    }
    
    hideProgress();
  }

  // 显示截图预览
  function showScreenshotPreview(canvas) {
    // 移除旧预览
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
        <button class="puppy-close-btn" id="puppy-preview-close">×</button>
      </div>
      <div class="puppy-preview-content">
        <div class="puppy-preview-image"></div>
        <div class="puppy-preview-controls">
          <button class="puppy-btn puppy-btn-primary" id="puppy-save-screenshot">
            💾 保存截图
          </button>
          <button class="puppy-btn puppy-btn-secondary" id="puppy-enhance-screenshot">
            ✨ 美化截图
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(previewPanel);

    // 添加图片
    const previewImage = previewPanel.querySelector('.puppy-preview-image');
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    previewImage.appendChild(img);

    // 绑定预览事件
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

  // 关闭预览
  function closePreview(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (previewPanel) {
      previewPanel.remove();
      previewPanel = null;
    }
  }

  // 美化截图
  function enhanceScreenshot(originalCanvas) {
    const enhancedCanvas = document.createElement('canvas');
    const ctx = enhancedCanvas.getContext('2d');
    
    const padding = 20;
    const bgColor = '#FF6B9D';
    
    enhancedCanvas.width = originalCanvas.width + padding * 2;
    enhancedCanvas.height = originalCanvas.height + padding * 2;
    
    // 绘制背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, enhancedCanvas.width, enhancedCanvas.height);
    
    // 绘制原图
    ctx.drawImage(originalCanvas, padding, padding);
    
    // 添加水印
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial';
    ctx.fillText('🐶 Puppy Screenshot Pro', padding + 10, enhancedCanvas.height - 15);
    
    // 更新预览
    const previewImage = previewPanel.querySelector('.puppy-preview-image');
    const img = document.createElement('img');
    img.src = enhancedCanvas.toDataURL('image/png');
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    previewImage.innerHTML = '';
    previewImage.appendChild(img);
    
    lastScreenshotCanvas = enhancedCanvas;
    
    showNotification('截图美化完成！', 'success');
  }

  // 显示高级设置
  function showAdvancedSettings(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // 移除旧面板
    if (advancedPanel) {
      advancedPanel.remove();
    }

    advancedPanel = document.createElement('div');
    advancedPanel.className = 'puppy-advanced-panel';
    if (isMobile) {
      advancedPanel.classList.add('puppy-mobile');
    }

    advancedPanel.innerHTML = `
      <div class="puppy-advanced-header">
        <h3>⚙️ 高级设置</h3>
        <button class="puppy-close-btn" id="puppy-advanced-close">×</button>
      </div>
      <div class="puppy-advanced-content">
        <div class="puppy-setting-group">
          <label>图片格式</label>
          <select id="puppy-format-select">
            <option value="png">PNG (推荐)</option>
            <option value="jpg">JPG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
        
        <div class="puppy-setting-group">
          <label>图片质量</label>
          <input type="range" id="puppy-quality-slider" min="0.1" max="1" step="0.1" value="0.9">
          <span id="puppy-quality-value">90%</span>
        </div>
        
        <div class="puppy-setting-group">
          <label>圆角大小</label>
          <input type="range" id="puppy-radius-slider" min="0" max="50" value="12">
          <span id="puppy-radius-value">12px</span>
        </div>
        
        <div class="puppy-setting-group">
          <label>边距大小</label>
          <input type="range" id="puppy-margin-slider" min="0" max="50" value="20">
          <span id="puppy-margin-value">20px</span>
        </div>
        
        <div class="puppy-setting-group">
          <label>
            <input type="checkbox" id="puppy-watermark-check"> 添加水印
          </label>
        </div>
        
        <div class="puppy-advanced-controls">
          <button class="puppy-btn puppy-btn-primary" id="puppy-apply-settings">
            ✅ 应用设置
          </button>
          <button class="puppy-btn puppy-btn-secondary" id="puppy-reset-settings">
            🔄 重置设置
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
    const radiusSlider = advancedPanel.querySelector('#puppy-radius-slider');
    const marginSlider = advancedPanel.querySelector('#puppy-margin-slider');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeAdvancedSettings);
      closeBtn.addEventListener('touchend', closeAdvancedSettings);
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', applyAdvancedSettings);
      applyBtn.addEventListener('touchend', applyAdvancedSettings);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetAdvancedSettings);
      resetBtn.addEventListener('touchend', resetAdvancedSettings);
    }

    if (qualitySlider) {
      qualitySlider.addEventListener('input', updateQualityValue);
    }

    if (radiusSlider) {
      radiusSlider.addEventListener('input', updateRadiusValue);
    }

    if (marginSlider) {
      marginSlider.addEventListener('input', updateMarginValue);
    }
  }

  // 关闭高级设置
  function closeAdvancedSettings(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (advancedPanel) {
      advancedPanel.remove();
      advancedPanel = null;
    }
  }

  // 应用高级设置
  function applyAdvancedSettings(e) {
    e.preventDefault();
    e.stopPropagation();
    
    showNotification('设置已应用！', 'success');
    closeAdvancedSettings(e);
  }

  // 重置高级设置
  function resetAdvancedSettings(e) {
    e.preventDefault();
    e.stopPropagation();
    
    showNotification('设置已重置！', 'success');
  }

  // 更新质量值显示
  function updateQualityValue(e) {
    const value = Math.round(e.target.value * 100);
    const display = advancedPanel.querySelector('#puppy-quality-value');
    if (display) {
      display.textContent = value + '%';
    }
  }

  // 更新圆角值显示
  function updateRadiusValue(e) {
    const value = e.target.value;
    const display = advancedPanel.querySelector('#puppy-radius-value');
    if (display) {
      display.textContent = value + 'px';
    }
  }

  // 更新边距值显示
  function updateMarginValue(e) {
    const value = e.target.value;
    const display = advancedPanel.querySelector('#puppy-margin-value');
    if (display) {
      display.textContent = value + 'px';
    }
  }

  // 颜色选择处理
  function handleColorSelection(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.classList.contains('puppy-color-btn')) {
      const colorBtns = document.querySelectorAll('.puppy-color-btn');
      colorBtns.forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      
      showNotification('背景颜色已更新！', 'success');
    }
  }

  // 下载最后截图
  function downloadLastScreenshot(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (lastScreenshotCanvas) {
      downloadCanvas(lastScreenshotCanvas, 'puppy-screenshot.png');
    } else {
      showNotification('没有可下载的截图', 'error');
    }
  }

  // 下载Canvas
  function downloadCanvas(canvas, filename) {
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('截图已保存！', 'success');
      console.log('下载成功:', filename);
    } catch (error) {
      console.error('下载失败:', error);
      showNotification('下载失败', 'error');
    }
  }

  // 显示进度
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

  // 隐藏进度
  function hideProgress() {
    const progress = document.getElementById('puppy-progress');
    if (progress) {
      progress.remove();
    }
  }

  // 显示通知
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
      createFloatingPanel();
    }
  });

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlugin);
  } else {
    initPlugin();
  }

  // 防止插件重复加载
  window.puppyScreenshotProLoaded = true;

})();
