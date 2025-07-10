// SillyTavern Plugin: Puppy Screenshot Pro - Ultimate Version
// 全新架构设计，彻底解决所有问题

(function() {
  'use strict';

  // 插件配置
  const PLUGIN_CONFIG = {
    id: 'puppy-screenshot-pro',
    name: 'Puppy Screenshot Pro',
    version: '1.0.0',
    debug: true
  };

  // 全局变量
  let isPluginActive = false;
  let currentSettings = {
    format: 'png',
    quality: 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    watermark: true
  };

  // 日志系统
  const logger = {
    log: (message, type = 'info') => {
      if (PLUGIN_CONFIG.debug) {
        console.log(`[${PLUGIN_CONFIG.name}] ${message}`, type);
      }
    },
    error: (message, error) => {
      console.error(`[${PLUGIN_CONFIG.name}] ${message}`, error);
    }
  };

  // 等待DOM加载
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  // 加载html2canvas
  async function loadHtml2Canvas() {
    if (window.html2canvas) {
      logger.log('html2canvas already loaded');
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = () => {
        logger.log('html2canvas loaded successfully');
        resolve();
      };
      script.onerror = () => {
        logger.error('Failed to load html2canvas');
        reject(new Error('Failed to load html2canvas'));
      };
      document.head.appendChild(script);
    });
  }

  // 创建快速入口按钮（右下角悬浮）
  function createQuickAccessButton() {
    const button = document.createElement('div');
    button.id = 'puppy-quick-access';
    button.innerHTML = `
      <div class="puppy-quick-btn">
        <span class="puppy-quick-icon">📸</span>
        <span class="puppy-quick-text">Puppy</span>
      </div>
    `;
    
    // 添加点击事件
    button.addEventListener('click', toggleMainPanel);
    
    document.body.appendChild(button);
    logger.log('Quick access button created');
  }

  // 创建主面板
  function createMainPanel() {
    const panel = document.createElement('div');
    panel.id = 'puppy-main-panel';
    panel.innerHTML = `
      <div class="puppy-panel-header">
        <div class="puppy-panel-title">
          <span class="puppy-logo">🐶</span>
          <span>Puppy Screenshot Pro</span>
        </div>
        <div class="puppy-panel-controls">
          <button class="puppy-btn puppy-btn-minimize" onclick="minimizePanel()">−</button>
          <button class="puppy-btn puppy-btn-close" onclick="closePanel()">×</button>
        </div>
      </div>
      
      <div class="puppy-panel-content">
        <div class="puppy-section">
          <h3>快速截图</h3>
          <div class="puppy-buttons">
            <button class="puppy-btn puppy-btn-primary" onclick="takeFullScreenshot()">
              <span class="puppy-btn-icon">🖥️</span>
              全屏截图
            </button>
            <button class="puppy-btn puppy-btn-primary" onclick="takeLastMessageScreenshot()">
              <span class="puppy-btn-icon">💬</span>
              最新消息
            </button>
          </div>
        </div>
        
        <div class="puppy-section">
          <h3>美化选项</h3>
          <div class="puppy-color-grid">
            <div class="puppy-color-item" data-color="#FFFFFF" style="background:#FFFFFF"></div>
            <div class="puppy-color-item" data-color="#F8F9FA" style="background:#F8F9FA"></div>
            <div class="puppy-color-item" data-color="#E9ECEF" style="background:#E9ECEF"></div>
            <div class="puppy-color-item" data-color="#DEE2E6" style="background:#DEE2E6"></div>
            <div class="puppy-color-item" data-color="#CED4DA" style="background:#CED4DA"></div>
            <div class="puppy-color-item" data-color="#ADB5BD" style="background:#ADB5BD"></div>
          </div>
        </div>
        
        <div class="puppy-section">
          <div class="puppy-buttons">
            <button class="puppy-btn puppy-btn-secondary" onclick="openAdvancedSettings()">
              ⚙️ 高级设置
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 添加拖拽功能
    makeDraggable(panel);
    
    document.body.appendChild(panel);
    logger.log('Main panel created');
  }

  // 为每个消息添加相机图标
  function addCameraIcons() {
    const messages = document.querySelectorAll('.mes');
    
    messages.forEach((message, index) => {
      // 检查是否已经添加过图标
      if (message.querySelector('.puppy-camera-icon')) {
        return;
      }
      
      const cameraIcon = document.createElement('div');
      cameraIcon.className = 'puppy-camera-icon';
      cameraIcon.innerHTML = '📷';
      cameraIcon.title = '截图此消息';
      cameraIcon.setAttribute('data-message-index', index);
      
      // 添加点击事件
      cameraIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        screenshotMessage(message, index);
      });
      
      // 将图标插入到消息中
      const messageHeader = message.querySelector('.mes_header') || message.querySelector('.mes_text');
      if (messageHeader) {
        messageHeader.appendChild(cameraIcon);
      }
    });
    
    logger.log(`Added camera icons to ${messages.length} messages`);
  }

  // 截图指定消息
  async function screenshotMessage(messageElement, index) {
    logger.log(`Taking screenshot of message ${index}`);
    
    try {
      showProgress('正在截图消息...');
      
      const canvas = await html2canvas(messageElement, {
        backgroundColor: currentSettings.backgroundColor,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: false
      });
      
      hideProgress();
      showScreenshotPreview(canvas, `message-${index + 1}-screenshot`);
      
    } catch (error) {
      hideProgress();
      logger.error('Screenshot failed', error);
      showNotification('截图失败，请重试', 'error');
    }
  }

  // 全屏截图
  async function takeFullScreenshot() {
    logger.log('Taking full screenshot');
    
    try {
      showProgress('正在进行全屏截图...');
      
      const canvas = await html2canvas(document.body, {
        backgroundColor: currentSettings.backgroundColor,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      hideProgress();
      showScreenshotPreview(canvas, 'full-screenshot');
      
    } catch (error) {
      hideProgress();
      logger.error('Full screenshot failed', error);
      showNotification('全屏截图失败，请重试', 'error');
    }
  }

  // 最新消息截图
  async function takeLastMessageScreenshot() {
    logger.log('Taking last message screenshot');
    
    const messages = document.querySelectorAll('.mes');
    if (messages.length === 0) {
      showNotification('没有找到消息', 'warning');
      return;
    }
    
    const lastMessage = messages[messages.length - 1];
    await screenshotMessage(lastMessage, messages.length - 1);
  }

  // 显示截图预览
  function showScreenshotPreview(canvas, filename) {
    const preview = document.createElement('div');
    preview.id = 'puppy-screenshot-preview';
    preview.innerHTML = `
      <div class="puppy-preview-backdrop"></div>
      <div class="puppy-preview-container">
        <div class="puppy-preview-header">
          <h3>截图预览</h3>
          <button class="puppy-btn puppy-btn-close" onclick="closePreview()">×</button>
        </div>
        <div class="puppy-preview-content">
          <div class="puppy-preview-image">
            <canvas id="puppy-preview-canvas"></canvas>
          </div>
          <div class="puppy-preview-actions">
            <button class="puppy-btn puppy-btn-primary" onclick="downloadScreenshot('${filename}')">
              📥 下载截图
            </button>
            <button class="puppy-btn puppy-btn-secondary" onclick="enhanceScreenshot()">
              ✨ 美化处理
            </button>
            <button class="puppy-btn puppy-btn-secondary" onclick="closePreview()">
              取消
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(preview);
    
    // 复制canvas内容
    const previewCanvas = document.getElementById('puppy-preview-canvas');
    const ctx = previewCanvas.getContext('2d');
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    
    // 保存canvas引用
    window.currentScreenshotCanvas = canvas;
    window.currentScreenshotFilename = filename;
    
    logger.log('Screenshot preview shown');
  }

  // 高级设置面板
  function openAdvancedSettings() {
    const settings = document.createElement('div');
    settings.id = 'puppy-advanced-settings';
    settings.innerHTML = `
      <div class="puppy-settings-backdrop"></div>
      <div class="puppy-settings-container">
        <div class="puppy-settings-header">
          <h3>高级设置</h3>
          <button class="puppy-btn puppy-btn-close" onclick="closeAdvancedSettings()">×</button>
        </div>
        <div class="puppy-settings-content">
          <div class="puppy-setting-group">
            <label>图片格式</label>
            <select id="puppy-format-select">
              <option value="png">PNG (推荐)</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          
          <div class="puppy-setting-group">
            <label>图片质量</label>
            <div class="puppy-slider-container">
              <input type="range" id="puppy-quality-slider" min="0.1" max="1" step="0.1" value="0.9">
              <span id="puppy-quality-value">90%</span>
            </div>
          </div>
          
          <div class="puppy-setting-group">
            <label>圆角大小</label>
            <div class="puppy-slider-container">
              <input type="range" id="puppy-radius-slider" min="0" max="50" step="1" value="8">
              <span id="puppy-radius-value">8px</span>
            </div>
          </div>
          
          <div class="puppy-setting-group">
            <label>边距大小</label>
            <div class="puppy-slider-container">
              <input type="range" id="puppy-padding-slider" min="0" max="100" step="5" value="20">
              <span id="puppy-padding-value">20px</span>
            </div>
          </div>
          
          <div class="puppy-setting-group">
            <label>
              <input type="checkbox" id="puppy-watermark-checkbox" checked>
              添加水印
            </label>
          </div>
        </div>
        
        <div class="puppy-settings-actions">
          <button class="puppy-btn puppy-btn-primary" onclick="saveAdvancedSettings()">
            保存设置
          </button>
          <button class="puppy-btn puppy-btn-secondary" onclick="resetAdvancedSettings()">
            重置默认
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(settings);
    
    // 绑定滑块事件
    bindSettingsEvents();
    
    logger.log('Advanced settings opened');
  }

  // 绑定设置事件
  function bindSettingsEvents() {
    const qualitySlider = document.getElementById('puppy-quality-slider');
    const qualityValue = document.getElementById('puppy-quality-value');
    const radiusSlider = document.getElementById('puppy-radius-slider');
    const radiusValue = document.getElementById('puppy-radius-value');
    const paddingSlider = document.getElementById('puppy-padding-slider');
    const paddingValue = document.getElementById('puppy-padding-value');
    
    if (qualitySlider) {
      qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = Math.round(e.target.value * 100) + '%';
      });
    }
    
    if (radiusSlider) {
      radiusSlider.addEventListener('input', (e) => {
        radiusValue.textContent = e.target.value + 'px';
      });
    }
    
    if (paddingSlider) {
      paddingSlider.addEventListener('input', (e) => {
        paddingValue.textContent = e.target.value + 'px';
      });
    }
  }

  // 拖拽功能
  function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    const header = element.querySelector('.puppy-panel-header');
    if (!header) return;
    
    header.addEventListener('mousedown', startDrag);
    header.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
      isDragging = true;
      
      const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
      const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
      
      startX = clientX;
      startY = clientY;
      
      const rect = element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', drag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
      
      element.style.cursor = 'grabbing';
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      e.preventDefault();
      
      const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
      const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
      
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      // 边界检查
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));
      
      element.style.left = boundedX + 'px';
      element.style.top = boundedY + 'px';
    }
    
    function stopDrag() {
      isDragging = false;
      element.style.cursor = 'default';
      
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    }
  }

  // 显示进度
  function showProgress(message) {
    const progress = document.createElement('div');
    progress.id = 'puppy-progress';
    progress.innerHTML = `
      <div class="puppy-progress-backdrop"></div>
      <div class="puppy-progress-container">
        <div class="puppy-progress-spinner"></div>
        <div class="puppy-progress-text">${message}</div>
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
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `puppy-notification puppy-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 下载截图
  function downloadScreenshot(filename) {
    const canvas = window.currentScreenshotCanvas;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${filename}.${currentSettings.format}`;
    
    if (currentSettings.format === 'png') {
      link.href = canvas.toDataURL('image/png');
    } else if (currentSettings.format === 'jpeg') {
      link.href = canvas.toDataURL('image/jpeg', currentSettings.quality);
    } else if (currentSettings.format === 'webp') {
      link.href = canvas.toDataURL('image/webp', currentSettings.quality);
    }
    
    link.click();
    logger.log(`Downloaded screenshot: ${filename}`);
  }

  // 全局函数（供HTML调用）
  window.toggleMainPanel = function() {
    const panel = document.getElementById('puppy-main-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    } else {
      createMainPanel();
    }
  };

  window.minimizePanel = function() {
    const panel = document.getElementById('puppy-main-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  };

  window.closePanel = function() {
    const panel = document.getElementById('puppy-main-panel');
    if (panel) {
      panel.remove();
    }
  };

  window.takeFullScreenshot = takeFullScreenshot;
  window.takeLastMessageScreenshot = takeLastMessageScreenshot;
  window.openAdvancedSettings = openAdvancedSettings;

  window.closePreview = function() {
    const preview = document.getElementById('puppy-screenshot-preview');
    if (preview) {
      preview.remove();
    }
  };

  window.downloadScreenshot = downloadScreenshot;

  window.closeAdvancedSettings = function() {
    const settings = document.getElementById('puppy-advanced-settings');
    if (settings) {
      settings.remove();
    }
  };

  window.saveAdvancedSettings = function() {
    const formatSelect = document.getElementById('puppy-format-select');
    const qualitySlider = document.getElementById('puppy-quality-slider');
    const radiusSlider = document.getElementById('puppy-radius-slider');
    const paddingSlider = document.getElementById('puppy-padding-slider');
    const watermarkCheckbox = document.getElementById('puppy-watermark-checkbox');
    
    currentSettings = {
      format: formatSelect.value,
      quality: parseFloat(qualitySlider.value),
      borderRadius: parseInt(radiusSlider.value),
      padding: parseInt(paddingSlider.value),
      watermark: watermarkCheckbox.checked
    };
    
    localStorage.setItem('puppy-settings', JSON.stringify(currentSettings));
    showNotification('设置已保存', 'success');
    
    window.closeAdvancedSettings();
  };

  window.resetAdvancedSettings = function() {
    currentSettings = {
      format: 'png',
      quality: 0.9,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 20,
      watermark: true
    };
    
    localStorage.removeItem('puppy-settings');
    showNotification('设置已重置', 'success');
    
    window.closeAdvancedSettings();
  };

  // 初始化插件
  async function initializePlugin() {
    try {
      logger.log('Initializing plugin...');
      
      // 加载设置
      const savedSettings = localStorage.getItem('puppy-settings');
      if (savedSettings) {
        currentSettings = { ...currentSettings, ...JSON.parse(savedSettings) };
      }
      
      // 加载html2canvas
      await loadHtml2Canvas();
      
      // 等待页面加载完成
      await waitForElement('body');
      
      // 创建快速入口按钮
      createQuickAccessButton();
      
      // 监听页面变化，为新消息添加相机图标
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1 && (node.classList.contains('mes') || node.querySelector('.mes'))) {
                shouldUpdate = true;
              }
            });
          }
        });
        
        if (shouldUpdate) {
          setTimeout(addCameraIcons, 500);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // 初始添加相机图标
      setTimeout(addCameraIcons, 1000);
      
      isPluginActive = true;
      logger.log('Plugin initialized successfully');
      showNotification('🐶 Puppy Screenshot Pro 已启动', 'success');
      
    } catch (error) {
      logger.error('Plugin initialization failed', error);
      showNotification('插件初始化失败', 'error');
    }
  }

  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlugin);
  } else {
    initializePlugin();
  }

})();
