"""
SillyTavern截图插件API接口
用于与SillyTavern前端交互
"""

import json
from main import screenshot_plugin

class SillyTavernAPI:
    def __init__(self):
        self.plugin = screenshot_plugin
        
    def register_endpoints(self):
        """注册API端点"""
        return {
            "/screenshot/process": self.process_screenshot,
            "/screenshot/presets": self.get_presets,
            "/screenshot/info": self.get_plugin_info,
            "/screenshot/preview": self.preview_settings
        }
    
    def process_screenshot(self, request_data):
        """处理截图请求"""
        try:
            image_data = request_data.get("image")
            options = request_data.get("options", {})
            
            if not image_data:
                return {"error": "未提供图片数据", "code": 400}
            
            result = self.plugin.process_screenshot(image_data, options)
            
            return {
                "success": True,
                "processed_image": result,
                "options_used": options
            }
            
        except Exception as e:
            return {"error": f"处理失败: {str(e)}", "code": 500}
    
    def get_presets(self, request_data=None):
        """获取预设选项"""
        return {
            "backgrounds": self.plugin.background_presets,
            "layouts": self.plugin.layout_templates,
            "filters": list(self.plugin.filter_effects.keys())
        }
    
    def get_plugin_info(self, request_data=None):
        """获取插件信息"""
        return self.plugin.get_plugin_info()
    
    def preview_settings(self, request_data):
        """预览设置效果"""
        options = request_data.get("options", {})
        
        # 创建预览描述
        preview_info = {
            "background": {
                "name": options.get("background", "简约白"),
                "description": "背景颜色和纹理效果"
            },
            "layout": {
                "name": options.get("layout", "经典"),
                "description": "布局样式和边距设置"
            },
            "filter": {
                "name": options.get("filter", "无滤镜"),
                "description": "图像滤镜效果"
            },
            "enhancements": []
        }
        
        if options.get("auto_enhance"):
            preview_info["enhancements"].append("自动增强")
        if options.get("crop_ratio"):
            preview_info["enhancements"].append("智能裁剪")
        if options.get("watermark_position"):
            preview_info["enhancements"].append("水印")
            
        return preview_info

# 创建API实例
api = SillyTavernAPI()

# 导出给SillyTavern使用
def init_plugin():
    """插件初始化函数"""
    return {
        "name": "高级截图美化插件",
        "version": "1.0.0",
        "endpoints": api.register_endpoints(),
        "frontend_assets": {
            "css": "screenshot_plugin.css",
            "js": "screenshot_plugin.js"
        }
    }

if __name__ == "__main__":
    # 测试API
    test_request = {
        "options": {
            "background": "科技蓝",
            "layout": "现代",
            "filter": "柔光",
            "auto_enhance": True
        }
    }
    
    preview = api.preview_settings(test_request)
    print("预览设置:")
    print(json.dumps(preview, indent=2, ensure_ascii=False))