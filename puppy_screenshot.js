// SillyTavern Plugin: Puppy Screenshot Pro 
// 🐶 强大的截图插件，支持AI海报生成、高级美化和智能布局编辑
// A powerful screenshot plugin with AI poster generation, advanced beautification, and smart layout editing

import { extension_settings, getContext, renderExtensionTemplateAsync } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';
import { callGenericPopup, POPUP_TYPE, POPUP_RESULT } from '../../../popup.js';
import { uuidv4 } from '../../../utils.js';

const PLUGIN_ID = 'puppy-screenshot-pro';
const PLUGIN_NAME = 'Puppy Screenshot Pro';

// 默认设置
const defaultSettings = {
  screenshotDelay: 500,
  scrollDelay: 100,
  autoInstallButtons: true,
  altButtonLocation: true,
  screenshotScale: 2.0,
  useForeignObjectRendering: false,
  letterRendering: true,
  imageTimeout: 5000,
  debugOverlay: false,
  imageFormat: 'png',
  enableOcr: false,
  aiPosterEnabled: false,
  cloudBackup: false,
  backgroundColors: ['#FF6B9D', '#4ECDC4', '#FFEAA7', '#A855F7', '#F59E0B', '#E74C3C'],
  borderRadius: 12,
  padding: 20,
  shadowIntensity: 15,
  watermark: false,
  imageQuality: 0.95,
  selectedBackground: 0,
  lastScreenshotData: null
};

// 插件状态
let floatingPanel = null;
let isMinimized = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentPosition = { x: 0, y: 0 };
let puppyMascot = null;
let lastCanvas = null;
let progressOverlay = null;

// 加载 html2canvas 库
let html2canvas = null;

// 初始化插件
jQuery(async () => {
  console.log('🐶 Puppy Screenshot Pro: 正在初始化插件...');
  
  // 初始化设置
  if (!extension_settings[PLUGIN_ID]) {
    extension_settings[PLUGIN_ID] = { ...defaultSettings };
  } else {
    // 合并新的默认设置
    extension_settings[PLUGIN_ID] = { ...defaultSettings, ...extension_settings[PLUGIN_ID] };
  }
  
  // 加载 html2canvas
  await loadHtml2Canvas();
  
  // 创建浮动面板
  createFloatingPanel();
  
  // 创建小狗吉祥物
  createPuppyMascot();
  
  // 如果启用，安装截图按钮
  if (extension_settings[PLUGIN_ID].autoInstallButtons) {
    installScreenshotButtons();
  }
  
  // 监听聊天事件
  eventSource.on(event_types.MESSAGE_RECEIVED, handleMessageReceived);
  eventSource.on(event_types.CHAT_CHANGED, handleChatChanged);
  
  console.log('🐶 Puppy Screenshot Pro: 插件加载成功！');
});

// 加载 html2canvas 库
async function loadHtml2Canvas() {
  if (window.html2canvas) {
    html2canvas = window.html2canvas;
    return;
  }
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = () => {
      html2canvas = window.html2canvas;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 创建浮动面板
function createFloatingPanel() {
  if (floatingPanel) {
    floatingPanel.remove();
  }
  
  floatingPanel = $(`
    <div id="puppy-floating-panel" class="puppy-floating-panel">
      <div class="puppy-panel-header" id="puppy-panel-header">
        <div class="puppy-panel-title">
          <div class="puppy-icon">📸</div>
          <div>
            <div class="puppy-title">Screenshot Pro</div>
            <div class="puppy-subtitle">🐶 Puppy Edition</div>
          </div>
        </div>
        <button class="puppy-minimize-btn" id="puppy-minimize-btn">
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
      <div class="puppy-panel-content" id="puppy-panel-content">
        <div class="puppy-section">
          <h4 class="puppy-section-title">
            <span class="puppy-section-icon">⚡</span>
            快速操作
          </h4>
          <div class="puppy-button-grid">
            <button class="puppy-btn puppy-btn-primary" id="puppy-quick-screenshot">
              <i class="fas fa-camera"></i>
              全屏截图
            </button>
            <button class="puppy-btn puppy-btn-secondary" id="puppy-last-message">
              <i class="fas fa-comment"></i>
              最后回复
            </button>
          </div>
        </div>
        
        <div class="puppy-section">
          <h4 class="puppy-section-title">
            <i class="fas fa-palette"></i>
            美化选项
          </h4>
          <div class="puppy-color-grid" id="puppy-color-grid">
            <!-- 颜色按钮将在这里填充 -->
          </div>
          <div class="puppy-slider-row">
            <i class="fas fa-adjust"></i>
            <span>圆角:</span>
            <input type="range" id="puppy-border-radius" min="0" max="25" value="12">
            <span id="puppy-border-radius-value">12px</span>
          </div>
          <div class="puppy-slider-row">
            <i class="fas fa-expand"></i>
            <span>内边距:</span>
            <input type="range" id="puppy-padding" min="0" max="50" value="20">
            <span id="puppy-padding-value">20px</span>
          </div>
        </div>
        
        <div class="puppy-section">
          <h4 class="puppy-section-title">
            <i class="fas fa-download"></i>
            导出格式
          </h4>
          <div class="puppy-export-row">
            <select id="puppy-format-select">
              <option value="png">PNG (高质量)</option>
              <option value="jpg">JPG (压缩)</option>
              <option value="webp">WebP (现代格式)</option>
            </select>
            <button class="puppy-btn puppy-btn-success" id="puppy-download-btn" title="下载最后一张截图">
              <i class="fas fa-download"></i>
            </button>
          </div>
          <div class="puppy-checkbox-row">
            <label>
              <input type="checkbox" id="puppy-watermark" ${extension_settings[PLUGIN_ID].watermark ? 'checked' : ''}>
              添加水印
            </label>
          </div>
        </div>
        
        <button class="puppy-advanced-btn" id="puppy-advanced-btn">
          <i class="fas fa-cog"></i>
          高级设置
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `);
  
  $('body').append(floatingPanel);
  
  // 定位面板
  currentPosition = { x: window.innerWidth - 350, y: 50 };
  floatingPanel.css({
    left: currentPosition.x + 'px',
    top: currentPosition.y + 'px'
  });
  
  // 填充颜色网格
  populateColorGrid();
  
  // 绑定事件
  bindPanelEvents();
}

// 填充背景颜色网格
function populateColorGrid() {
  const colorGrid = $('#puppy-color-grid');
  const colors = extension_settings[PLUGIN_ID].backgroundColors;
  
  colorGrid.empty();
  colors.forEach((color, index) => {
    const isSelected = index === extension_settings[PLUGIN_ID].selectedBackground;
    const colorBtn = $(`
      <button class="puppy-color-btn ${isSelected ? 'active' : ''}" 
              data-color="${color}" 
              data-index="${index}" 
              style="background: ${color}" 
              title="背景颜色 ${index + 1}">
      </button>
    `);
    colorGrid.append(colorBtn);
  });
}

// 绑定面板事件
function bindPanelEvents() {
  // 拖拽功能
  $('#puppy-panel-header').off().on('mousedown', startDrag);
  $(document).off('.puppy-drag').on('mousemove.puppy-drag', drag).on('mouseup.puppy-drag', stopDrag);
  
  // 最小化/最大化
  $('#puppy-minimize-btn').off().on('click', toggleMinimize);
  
  // 截图按钮
  $('#puppy-quick-screenshot').off().on('click', takeQuickScreenshot);
  $('#puppy-last-message').off().on('click', takeLastMessageScreenshot);
  
  // 高级设置
  $('#puppy-advanced-btn').off().on('click', showAdvancedSettings);
  
  // 圆角滑块
  $('#puppy-border-radius').off().on('input', updateBorderRadius);
  
  // 内边距滑块
  $('#puppy-padding').off().on('input', updatePadding);
  
  // 颜色按钮
  $('#puppy-color-grid').off().on('click', '.puppy-color-btn', selectBackgroundColor);
  
  // 下载按钮
  $('#puppy-download-btn').off().on('click', downloadLastScreenshot);
  
  // 水印复选框
  $('#puppy-watermark').off().on('change', updateWatermarkSetting);
}

// 拖拽功能
function startDrag(e) {
  isDragging = true;
  const rect = floatingPanel[0].getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  floatingPanel.css('cursor', 'grabbing');
  e.preventDefault();
}

function drag(e) {
  if (!isDragging) return;
  
  const newX = e.clientX - dragOffset.x;
  const newY = e.clientY - dragOffset.y;
  
  // 保持面板在视口内
  const maxX = window.innerWidth - floatingPanel.outerWidth();
  const maxY = window.innerHeight - floatingPanel.outerHeight();
  
  currentPosition.x = Math.max(0, Math.min(newX, maxX));
  currentPosition.y = Math.max(0, Math.min(newY, maxY));
  
  floatingPanel.css({
    left: currentPosition.x + 'px',
    top: currentPosition.y + 'px'
  });
}

function stopDrag() {
  isDragging = false;
  floatingPanel.css('cursor', 'default');
}

// 切换最小化/最大化
function toggleMinimize() {
  isMinimized = !isMinimized;
  const content = $('#puppy-panel-content');
  const btn = $('#puppy-minimize-btn');
  
  if (isMinimized) {
    content.slideUp(200);
    btn.html('<i class="fas fa-chevron-up"></i>');
  } else {
    content.slideDown(200);
    btn.html('<i class="fas fa-chevron-down"></i>');
  }
}

// 快速截图
async function takeQuickScreenshot() {
  try {
    showProgress('正在截图...');
    
    const chatContainer = $('#chat');
    if (!chatContainer.length) {
      throw new Error('未找到聊天容器');
    }
    
    // 添加延迟
    if (extension_settings[PLUGIN_ID].screenshotDelay > 0) {
      await sleep(extension_settings[PLUGIN_ID].screenshotDelay);
    }
    
    const canvas = await html2canvas(chatContainer[0], {
      allowTaint: true,
      useCORS: true,
      backgroundColor: null,
      scale: extension_settings[PLUGIN_ID].screenshotScale,
      logging: extension_settings[PLUGIN_ID].debugOverlay,
      removeContainer: true,
      timeout: extension_settings[PLUGIN_ID].imageTimeout,
      useForeignObjectRendering: extension_settings[PLUGIN_ID].useForeignObjectRendering,
      letterRendering: extension_settings[PLUGIN_ID].letterRendering
    });
    
    lastCanvas = canvas;
    hideProgress();
    showScreenshotPreview(canvas);
    showNotification('截图成功！🐶', 'success');
    
  } catch (error) {
    hideProgress();
    showNotification('截图失败：' + error.message, 'error');
    console.error('截图错误:', error);
  }
}

// 截图最后一条消息
async function takeLastMessageScreenshot() {
  try {
    showProgress('正在截图最后一条消息...');
    
    const lastMessage = $('.mes.last_mes');
    if (!lastMessage.length) {
      throw new Error('未找到最后一条消息');
    }
    
    // 添加延迟
    if (extension_settings[PLUGIN_ID].screenshotDelay > 0) {
      await sleep(extension_settings[PLUGIN_ID].screenshotDelay);
    }
    
    const canvas = await html2canvas(lastMessage[0], {
      allowTaint: true,
      useCORS: true,
      backgroundColor: null,
      scale: extension_settings[PLUGIN_ID].screenshotScale,
      logging: extension_settings[PLUGIN_ID].debugOverlay,
      removeContainer: true,
      timeout: extension_settings[PLUGIN_ID].imageTimeout,
      useForeignObjectRendering: extension_settings[PLUGIN_ID].useForeignObjectRendering,
      letterRendering: extension_settings[PLUGIN_ID].letterRendering
    });
    
    lastCanvas = canvas;
    hideProgress();
    showScreenshotPreview(canvas);
    showNotification('最后一条消息截图成功！🐶', 'success');
    
  } catch (error) {
    hideProgress();
    showNotification('截图最后一条消息失败：' + error.message, 'error');
    console.error('最后消息截图错误:', error);
  }
}

// 显示高级设置
async function showAdvancedSettings() {
  const settings = extension_settings[PLUGIN_ID];
  
  const template = `
    <div class="puppy-advanced-modal">
      <div class="puppy-modal-content">
        <div class="puppy-settings-grid">
          <div class="puppy-settings-section">
            <h3><i class="fas fa-camera"></i> 截图设置</h3>
            <div class="puppy-setting-item">
              <label>截图延迟 (毫秒)</label>
              <input type="range" id="screenshot-delay" min="0" max="2000" value="${settings.screenshotDelay}">
              <span id="screenshot-delay-value">${settings.screenshotDelay}ms</span>
            </div>
            <div class="puppy-setting-item">
              <label>图像缩放</label>
              <input type="range" id="image-scale" min="0.5" max="4" step="0.1" value="${settings.screenshotScale}">
              <span id="image-scale-value">${settings.screenshotScale}x</span>
            </div>
            <div class="puppy-setting-item">
              <label>图像质量</label>
              <input type="range" id="image-quality" min="0.1" max="1" step="0.05" value="${settings.imageQuality}">
              <span id="image-quality-value">${Math.round(settings.imageQuality * 100)}%</span>
            </div>
            <div class="puppy-setting-item">
              <label>
                <input type="checkbox" id="auto-install" ${settings.autoInstallButtons ? 'checked' : ''}>
                自动安装截图按钮
              </label>
            </div>
            <div class="puppy-setting-item">
              <label>
                <input type="checkbox" id="debug-overlay" ${settings.debugOverlay ? 'checked' : ''}>
                显示调试信息
              </label>
            </div>
            <div class="puppy-setting-item">
              <label>
                <input type="checkbox" id="foreign-object" ${settings.useForeignObjectRendering ? 'checked' : ''}>
                使用外部对象渲染
              </label>
            </div>
          </div>
          
          <div class="puppy-settings-section">
            <h3><i class="fas fa-palette"></i> 美化设置</h3>
            <div class="puppy-setting-item">
              <label>自定义背景颜色</label>
              <div class="puppy-color-input-grid">
                ${settings.backgroundColors.map((color, index) => `
                  <input type="color" class="puppy-color-input" data-index="${index}" value="${color}">
                `).join('')}
              </div>
            </div>
            <div class="puppy-setting-item">
              <label>默认圆角 (px)</label>
              <input type="range" id="default-border-radius" min="0" max="50" value="${settings.borderRadius}">
              <span id="default-border-radius-value">${settings.borderRadius}px</span>
            </div>
            <div class="puppy-setting-item">
              <label>默认内边距 (px)</label>
              <input type="range" id="default-padding" min="0" max="100" value="${settings.padding}">
              <span id="default-padding-value">${settings.padding}px</span>
            </div>
            <div class="puppy-setting-item">
              <label>阴影强度</label>
              <input type="range" id="shadow-intensity" min="0" max="50" value="${settings.shadowIntensity}">
              <span id="shadow-intensity-value">${settings.shadowIntensity}px</span>
            </div>
          </div>
        </div>
        
        <div class="puppy-template-gallery">
          <h3><i class="fas fa-images"></i> 模板样式</h3>
          <div class="puppy-template-grid">
            <div class="puppy-template-item active" data-template="modern">
              <i class="fas fa-heart"></i>
              <span>现代风格</span>
            </div>
            <div class="puppy-template-item" data-template="minimal">
              <i class="fas fa-star"></i>
              <span>简约风格</span>
            </div>
            <div class="puppy-template-item" data-template="rounded">
              <i class="fas fa-circle"></i>
              <span>圆角风格</span>
            </div>
            <div class="puppy-template-item" data-template="shadow">
              <i class="fas fa-cube"></i>
              <span>阴影风格</span>
            </div>
          </div>
        </div>
      </div>
      <div class="puppy-modal-footer">
        <button class="puppy-btn puppy-btn-primary" id="save-settings">
          <i class="fas fa-save"></i>
          保存设置
        </button>
        <button class="puppy-btn puppy-btn-outline" id="reset-settings">
          <i class="fas fa-undo"></i>
          恢复默认
        </button>
      </div>
    </div>
  `;
  
  const popup = await callGenericPopup(template, POPUP_TYPE.CONFIRM, '', { 
    wide: true, 
    large: true,
    allowHorizontalScrolling: true 
  });
  
  // 绑定高级设置事件
  bindAdvancedSettingsEvents();
  
  if (popup === POPUP_RESULT.AFFIRMATIVE) {
    saveAdvancedSettings();
  }
}

// 绑定高级设置事件
function bindAdvancedSettingsEvents() {
  // 滑块实时更新
  $('#screenshot-delay').on('input', function() {
    $('#screenshot-delay-value').text($(this).val() + 'ms');
  });
  
  $('#image-scale').on('input', function() {
    $('#image-scale-value').text($(this).val() + 'x');
  });
  
  $('#image-quality').on('input', function() {
    $('#image-quality-value').text(Math.round($(this).val() * 100) + '%');
  });
  
  $('#default-border-radius').on('input', function() {
    $('#default-border-radius-value').text($(this).val() + 'px');
  });
  
  $('#default-padding').on('input', function() {
    $('#default-padding-value').text($(this).val() + 'px');
  });
  
  $('#shadow-intensity').on('input', function() {
    $('#shadow-intensity-value').text($(this).val() + 'px');
  });
  
  // 颜色输入
  $('.puppy-color-input').on('change', function() {
    const index = $(this).data('index');
    const color = $(this).val();
    extension_settings[PLUGIN_ID].backgroundColors[index] = color;
  });
  
  // 模板选择
  $('.puppy-template-item').on('click', function() {
    $('.puppy-template-item').removeClass('active');
    $(this).addClass('active');
    applyTemplate($(this).data('template'));
  });
  
  // 重置设置
  $('#reset-settings').on('click', function() {
    if (confirm('确定要恢复默认设置吗？')) {
      resetToDefaults();
    }
  });
}

// 应用模板
function applyTemplate(template) {
  switch(template) {
    case 'modern':
      $('#default-border-radius').val(12).trigger('input');
      $('#default-padding').val(20).trigger('input');
      $('#shadow-intensity').val(15).trigger('input');
      break;
    case 'minimal':
      $('#default-border-radius').val(4).trigger('input');
      $('#default-padding').val(10).trigger('input');
      $('#shadow-intensity').val(5).trigger('input');
      break;
    case 'rounded':
      $('#default-border-radius').val(25).trigger('input');
      $('#default-padding').val(25).trigger('input');
      $('#shadow-intensity').val(10).trigger('input');
      break;
    case 'shadow':
      $('#default-border-radius').val(8).trigger('input');
      $('#default-padding').val(15).trigger('input');
      $('#shadow-intensity').val(30).trigger('input');
      break;
  }
}

// 重置为默认设置
function resetToDefaults() {
  Object.assign(extension_settings[PLUGIN_ID], defaultSettings);
  // 更新UI
  $('#screenshot-delay').val(defaultSettings.screenshotDelay).trigger('input');
  $('#image-scale').val(defaultSettings.screenshotScale).trigger('input');
  $('#image-quality').val(defaultSettings.imageQuality).trigger('input');
  $('#default-border-radius').val(defaultSettings.borderRadius).trigger('input');
  $('#default-padding').val(defaultSettings.padding).trigger('input');
  $('#shadow-intensity').val(defaultSettings.shadowIntensity).trigger('input');
  $('#auto-install').prop('checked', defaultSettings.autoInstallButtons);
  $('#debug-overlay').prop('checked', defaultSettings.debugOverlay);
  $('#foreign-object').prop('checked', defaultSettings.useForeignObjectRendering);
  
  // 更新颜色输入
  $('.puppy-color-input').each(function(index) {
    $(this).val(defaultSettings.backgroundColors[index]);
  });
}

// 保存高级设置
function saveAdvancedSettings() {
  extension_settings[PLUGIN_ID] = {
    ...extension_settings[PLUGIN_ID],
    screenshotDelay: parseInt($('#screenshot-delay').val()),
    screenshotScale: parseFloat($('#image-scale').val()),
    imageQuality: parseFloat($('#image-quality').val()),
    borderRadius: parseInt($('#default-border-radius').val()),
    padding: parseInt($('#default-padding').val()),
    shadowIntensity: parseInt($('#shadow-intensity').val()),
    autoInstallButtons: $('#auto-install').prop('checked'),
    debugOverlay: $('#debug-overlay').prop('checked'),
    useForeignObjectRendering: $('#foreign-object').prop('checked')
  };
  
  saveSettingsDebounced();
  showNotification('设置保存成功！🐶', 'success');
  
  // 更新浮动面板
  populateColorGrid();
  updateSliderValues();
}

// 在聊天中安装截图按钮
function installScreenshotButtons() {
  // 为消息添加截图按钮
  $(document).off('mouseenter.puppy').on('mouseenter.puppy', '.mes', function() {
    const messageElement = $(this);
    if (messageElement.find('.puppy-screenshot-btn').length === 0) {
      const btn = $(`
        <button class="puppy-screenshot-btn" title="截图此消息">
          <i class="fas fa-camera"></i>
        </button>
      `);
      
      btn.on('click', function(e) {
        e.stopPropagation();
        screenshotMessage(messageElement);
      });
      
      const buttonsContainer = messageElement.find('.mes_buttons');
      if (buttonsContainer.length) {
        buttonsContainer.append(btn);
      } else {
        messageElement.append(btn);
      }
    }
  });
}

// 截图单个消息
async function screenshotMessage(messageElement) {
  try {
    showProgress('正在截图消息...');
    
    const canvas = await html2canvas(messageElement[0], {
      allowTaint: true,
      useCORS: true,
      backgroundColor: null,
      scale: extension_settings[PLUGIN_ID].screenshotScale,
      logging: extension_settings[PLUGIN_ID].debugOverlay,
      removeContainer: true,
      timeout: extension_settings[PLUGIN_ID].imageTimeout
    });
    
    lastCanvas = canvas;
    hideProgress();
    showScreenshotPreview(canvas);
    showNotification('消息截图成功！🐶', 'success');
    
  } catch (error) {
    hideProgress();
    showNotification('消息截图失败：' + error.message, 'error');
    console.error('消息截图错误:', error);
  }
}

// 显示截图预览
function showScreenshotPreview(canvas) {
  const settings = extension_settings[PLUGIN_ID];
  const backgroundColors = settings.backgroundColors;
  const selectedBg = backgroundColors[settings.selectedBackground] || backgroundColors[0];
  
  // 创建增强的画布
  const enhancedCanvas = createEnhancedCanvas(canvas, {
    backgroundColor: selectedBg,
    padding: settings.padding,
    borderRadius: settings.borderRadius,
    shadowIntensity: settings.shadowIntensity,
    watermark: settings.watermark
  });
  
  const dataUrl = enhancedCanvas.toDataURL('image/' + settings.imageFormat, settings.imageQuality);
  
  const template = `
    <div class="puppy-preview-modal">
      <div class="puppy-preview-content">
        <div class="puppy-preview-image">
          <img src="${dataUrl}" alt="截图预览" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
        </div>
        <div class="puppy-preview-controls">
          <div class="puppy-preview-section">
            <h3>🎨 美化选项</h3>
            <div class="puppy-preview-colors">
              ${backgroundColors.map((color, index) => `
                <button class="puppy-color-btn ${index === settings.selectedBackground ? 'active' : ''}" 
                        data-color="${color}" 
                        data-index="${index}" 
                        style="background: ${color}">
                </button>
              `).join('')}
            </div>
            <div class="puppy-preview-slider">
              <label>内边距 (<span id="preview-padding-value">${settings.padding}</span>px)</label>
              <input type="range" id="preview-padding" min="0" max="100" value="${settings.padding}">
            </div>
            <div class="puppy-preview-slider">
              <label>圆角 (<span id="preview-radius-value">${settings.borderRadius}</span>px)</label>
              <input type="range" id="preview-radius" min="0" max="50" value="${settings.borderRadius}">
            </div>
            <div class="puppy-preview-slider">
              <label>阴影 (<span id="preview-shadow-value">${settings.shadowIntensity}</span>px)</label>
              <input type="range" id="preview-shadow" min="0" max="50" value="${settings.shadowIntensity}">
            </div>
            <label style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
              <input type="checkbox" id="preview-watermark" ${settings.watermark ? 'checked' : ''}>
              添加水印
            </label>
          </div>
          
          <div class="puppy-preview-section">
            <h3>📥 下载选项</h3>
            <button class="puppy-btn puppy-btn-primary" onclick="downloadEnhancedImage()">
              <i class="fas fa-download"></i>
              下载图片
            </button>
            <button class="puppy-btn puppy-btn-secondary" onclick="copyToClipboard()">
              <i class="fas fa-copy"></i>
              复制到剪贴板
            </button>
            <select id="preview-format" style="width: 100%; margin-top: 8px; padding: 8px; border-radius: 6px;">
              <option value="png" ${settings.imageFormat === 'png' ? 'selected' : ''}>PNG (高质量)</option>
              <option value="jpg" ${settings.imageFormat === 'jpg' ? 'selected' : ''}>JPG (压缩)</option>
              <option value="webp" ${settings.imageFormat === 'webp' ? 'selected' : ''}>WebP (现代)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const popup = callGenericPopup(template, POPUP_TYPE.CONFIRM, '', { 
    wide: true, 
    large: true,
    allowHorizontalScrolling: true 
  });
  
  // 绑定预览事件
  bindPreviewEvents(canvas);
}

// 绑定预览事件
function bindPreviewEvents(originalCanvas) {
  let currentCanvas = originalCanvas;
  
  // 实时预览更新
  function updatePreview() {
    const settings = extension_settings[PLUGIN_ID];
    const enhancedCanvas = createEnhancedCanvas(currentCanvas, {
      backgroundColor: settings.backgroundColors[settings.selectedBackground],
      padding: parseInt($('#preview-padding').val()),
      borderRadius: parseInt($('#preview-radius').val()),
      shadowIntensity: parseInt($('#preview-shadow').val()),
      watermark: $('#preview-watermark').prop('checked')
    });
    
    const format = $('#preview-format').val();
    const dataUrl = enhancedCanvas.toDataURL('image/' + format, settings.imageQuality);
    $('.puppy-preview-image img').attr('src', dataUrl);
  }
  
  // 颜色选择
  $('.puppy-preview-colors').on('click', '.puppy-color-btn', function() {
    $('.puppy-color-btn').removeClass('active');
    $(this).addClass('active');
    extension_settings[PLUGIN_ID].selectedBackground = parseInt($(this).data('index'));
    updatePreview();
  });
  
  // 滑块
  $('#preview-padding').on('input', function() {
    $('#preview-padding-value').text($(this).val());
    updatePreview();
  });
  
  $('#preview-radius').on('input', function() {
    $('#preview-radius-value').text($(this).val());
    updatePreview();
  });
  
  $('#preview-shadow').on('input', function() {
    $('#preview-shadow-value').text($(this).val());
    updatePreview();
  });
  
  // 水印
  $('#preview-watermark').on('change', updatePreview);
  
  // 格式选择
  $('#preview-format').on('change', updatePreview);
  
  // 全局函数用于下载
  window.downloadEnhancedImage = function() {
    const settings = extension_settings[PLUGIN_ID];
    const enhancedCanvas = createEnhancedCanvas(currentCanvas, {
      backgroundColor: settings.backgroundColors[settings.selectedBackground],
      padding: parseInt($('#preview-padding').val()),
      borderRadius: parseInt($('#preview-radius').val()),
      shadowIntensity: parseInt($('#preview-shadow').val()),
      watermark: $('#preview-watermark').prop('checked')
    });
    
    const format = $('#preview-format').val();
    const link = document.createElement('a');
    link.href = enhancedCanvas.toDataURL('image/' + format, settings.imageQuality);
    link.download = `puppy-screenshot-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('图片下载成功！🐶', 'success');
  };
  
  // 复制到剪贴板
  window.copyToClipboard = function() {
    const settings = extension_settings[PLUGIN_ID];
    const enhancedCanvas = createEnhancedCanvas(currentCanvas, {
      backgroundColor: settings.backgroundColors[settings.selectedBackground],
      padding: parseInt($('#preview-padding').val()),
      borderRadius: parseInt($('#preview-radius').val()),
      shadowIntensity: parseInt($('#preview-shadow').val()),
      watermark: $('#preview-watermark').prop('checked')
    });
    
    enhancedCanvas.toBlob(function(blob) {
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          showNotification('已复制到剪贴板！🐶', 'success');
        }).catch(err => {
          showNotification('复制失败：' + err.message, 'error');
        });
      } else {
        showNotification('您的浏览器不支持剪贴板功能', 'error');
      }
    });
  };
}

// 创建增强画布
function createEnhancedCanvas(originalCanvas, options) {
  const { backgroundColor, padding, borderRadius, shadowIntensity, watermark } = options;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 计算新的画布尺寸
  const newWidth = originalCanvas.width + (padding * 2);
  const newHeight = originalCanvas.height + (padding * 2) + (watermark ? 30 : 0);
  
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  // 设置背景
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    if (borderRadius > 0) {
      drawRoundedRect(ctx, 0, 0, newWidth, newHeight, borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, newWidth, newHeight);
    }
  }
  
  // 添加阴影效果（简化版）
  if (shadowIntensity > 0) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = shadowIntensity;
    ctx.shadowOffsetX = shadowIntensity / 3;
    ctx.shadowOffsetY = shadowIntensity / 3;
  }
  
  // 绘制原始图片
  ctx.drawImage(originalCanvas, padding, padding);
  
  // 重置阴影
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // 添加水印
  if (watermark) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🐶 Screenshot Pro', newWidth - 10, newHeight - 10);
  }
  
  return canvas;
}

// 绘制圆角矩形
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 创建小狗吉祥物
function createPuppyMascot() {
  if (puppyMascot) {
    puppyMascot.remove();
  }
  
  puppyMascot = $(`
    <div class="puppy-mascot" id="puppy-mascot">
      <div class="puppy-mascot-face">🐶</div>
      <div class="puppy-mascot-tooltip">我是你的截图小助手！</div>
    </div>
  `);
  
  $('body').append(puppyMascot);
  
  // 点击显示对话
  puppyMascot.on('click', showPuppyDialog);
}

// 显示小狗对话
async function showPuppyDialog() {
  const messages = [
    "汪汪！需要帮助吗？🐶",
    "你好！我是截图专家小狗狗！",
    "想要美美的截图吗？让我来帮你！",
    "记得试试高级设置哦～",
    "你的截图很棒呢！继续加油！"
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  showNotification(randomMessage, 'info');
}

// 显示进度覆盖层
function showProgress(message) {
  if (progressOverlay) {
    progressOverlay.remove();
  }
  
  progressOverlay = $(`
    <div class="puppy-progress-overlay">
      <div class="puppy-progress-content">
        <div class="puppy-progress-icon">📸</div>
        <h3>${message}</h3>
        <p>🐶 请稍等，正在处理中...</p>
        <div class="puppy-progress-bar">
          <div class="puppy-progress-fill"></div>
        </div>
      </div>
    </div>
  `);
  
  $('body').append(progressOverlay);
}

// 隐藏进度覆盖层
function hideProgress() {
  if (progressOverlay) {
    progressOverlay.fadeOut(200, function() {
      $(this).remove();
    });
    progressOverlay = null;
  }
}

// 显示通知
function showNotification(message, type = 'success') {
  const notificationClass = type === 'success' ? 'puppy-notification-success' : 
                           type === 'error' ? 'puppy-notification-error' : 
                           'puppy-notification-info';
  
  const notification = $(`
    <div class="puppy-notification ${notificationClass}">
      <div class="puppy-notification-content">
        <span>${message}</span>
        <button class="puppy-notification-close">&times;</button>
      </div>
    </div>
  `);
  
  $('body').append(notification);
  
  // 自动隐藏
  setTimeout(() => {
    notification.fadeOut(200, function() {
      $(this).remove();
    });
  }, 3000);
  
  // 点击关闭
  notification.find('.puppy-notification-close').on('click', function() {
    notification.fadeOut(200, function() {
      $(this).remove();
    });
  });
}

// 下载最后一张截图
function downloadLastScreenshot() {
  if (!lastCanvas) {
    showNotification('没有可下载的截图', 'error');
    return;
  }
  
  const settings = extension_settings[PLUGIN_ID];
  const format = $('#puppy-format-select').val();
  
  const enhancedCanvas = createEnhancedCanvas(lastCanvas, {
    backgroundColor: settings.backgroundColors[settings.selectedBackground],
    padding: settings.padding,
    borderRadius: settings.borderRadius,
    shadowIntensity: settings.shadowIntensity,
    watermark: settings.watermark
  });
  
  const link = document.createElement('a');
  link.href = enhancedCanvas.toDataURL('image/' + format, settings.imageQuality);
  link.download = `puppy-screenshot-${Date.now()}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('截图下载成功！🐶', 'success');
}

// 更新圆角设置
function updateBorderRadius() {
  const value = $('#puppy-border-radius').val();
  $('#puppy-border-radius-value').text(value + 'px');
  extension_settings[PLUGIN_ID].borderRadius = parseInt(value);
  saveSettingsDebounced();
}

// 更新内边距设置
function updatePadding() {
  const value = $('#puppy-padding').val();
  $('#puppy-padding-value').text(value + 'px');
  extension_settings[PLUGIN_ID].padding = parseInt(value);
  saveSettingsDebounced();
}

// 选择背景颜色
function selectBackgroundColor() {
  const index = parseInt($(this).data('index'));
  extension_settings[PLUGIN_ID].selectedBackground = index;
  
  $('.puppy-color-btn').removeClass('active');
  $(this).addClass('active');
  
  saveSettingsDebounced();
  showNotification('背景颜色已更新！🐶', 'success');
}

// 更新水印设置
function updateWatermarkSetting() {
  extension_settings[PLUGIN_ID].watermark = $(this).prop('checked');
  saveSettingsDebounced();
}

// 更新滑块值
function updateSliderValues() {
  $('#puppy-border-radius').val(extension_settings[PLUGIN_ID].borderRadius);
  $('#puppy-border-radius-value').text(extension_settings[PLUGIN_ID].borderRadius + 'px');
  $('#puppy-padding').val(extension_settings[PLUGIN_ID].padding);
  $('#puppy-padding-value').text(extension_settings[PLUGIN_ID].padding + 'px');
}

// 处理消息接收事件
function handleMessageReceived(data) {
  // 可以在这里添加自动截图逻辑
  if (extension_settings[PLUGIN_ID].debugOverlay) {
    console.log('🐶 Puppy Screenshot Pro: 收到新消息', data);
  }
}

// 处理聊天切换事件
function handleChatChanged(data) {
  // 可以在这里添加聊天切换时的逻辑
  if (extension_settings[PLUGIN_ID].debugOverlay) {
    console.log('🐶 Puppy Screenshot Pro: 聊天已切换', data);
  }
}

// 工具函数：睡眠
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 工具函数：获取当前时间戳
function getCurrentTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

console.log('🐶 Puppy Screenshot Pro: 脚本加载完成！');
