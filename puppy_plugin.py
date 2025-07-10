
import json
import base64
import io
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from PIL.ImageQt import ImageQt
import numpy as np
from datetime import datetime
import colorsys
import random

class ScreenshotPlugin:
    def __init__(self):
        self.name = "小狗截图美化插件"
        self.version = "1.0.0"
        self.description = "功能强大的截图美化工具，支持背景替换、滤镜、布局调整等"
        
        # 预设背景样式
        self.background_presets = {
            "简约白": {"color": "#FFFFFF", "texture": "smooth"},
            "优雅黑": {"color": "#1A1A1A", "texture": "smooth"},
            "温暖米": {"color": "#F5F5DC", "texture": "paper"},
            "科技蓝": {"color": "#0F172A", "texture": "grid"},
            "森林绿": {"color": "#064E3B", "texture": "organic"},
            "日落橙": {"color": "#EA580C", "texture": "gradient"},
            "薰衣草": {"color": "#8B5CF6", "texture": "cloud"},
            "玫瑰金": {"color": "#F59E0B", "texture": "metallic"}
        }
        
        # 布局模板
        self.layout_templates = {
            "经典": {"padding": 20, "border_radius": 10, "shadow": True},
            "现代": {"padding": 40, "border_radius": 20, "shadow": True, "border": True},
            "极简": {"padding": 15, "border_radius": 5, "shadow": False},
            "艺术": {"padding": 60, "border_radius": 30, "shadow": True, "frame": True},
            "商务": {"padding": 30, "border_radius": 8, "shadow": True, "watermark": True},
            "创意": {"padding": 50, "border_radius": 25, "shadow": True, "decoration": True}
        }
        
        # 滤镜效果
        self.filter_effects = {
            "无滤镜": None,
            "柔光": {"blur": 0.5, "brightness": 1.1, "contrast": 1.05},
            "锐化": {"sharpness": 1.5, "contrast": 1.1},
            "复古": {"sepia": True, "contrast": 1.2, "brightness": 0.9},
            "黑白": {"grayscale": True, "contrast": 1.3},
            "暖调": {"temperature": 200, "saturation": 1.2},
            "冷调": {"temperature": -200, "saturation": 1.1},
            "梦幻": {"blur": 0.8, "saturation": 1.3, "brightness": 1.1},
            "电影": {"vignette": True, "contrast": 1.4, "brightness": 0.95}
        }

    def create_gradient_background(self, width, height, color1, color2, direction="vertical"):
        """创建渐变背景"""
        img = Image.new('RGB', (width, height))
        draw = ImageDraw.Draw(img)
        
        if direction == "vertical":
            for y in range(height):
                ratio = y / height
                r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
                g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
                b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
                draw.line([(0, y), (width, y)], fill=(r, g, b))
        else:  # horizontal
            for x in range(width):
                ratio = x / width
                r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
                g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
                b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
                draw.line([(x, 0), (x, height)], fill=(r, g, b))
        
        return img

    def create_texture_background(self, width, height, base_color, texture_type):
        """创建纹理背景"""
        img = Image.new('RGB', (width, height), base_color)
        
        if texture_type == "paper":
            # 纸张纹理
            noise = np.random.normal(0, 10, (height, width, 3))
            img_array = np.array(img)
            img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
            img = Image.fromarray(img_array)
            
        elif texture_type == "grid":
            # 网格纹理
            draw = ImageDraw.Draw(img)
            grid_size = 20
            for x in range(0, width, grid_size):
                draw.line([(x, 0), (x, height)], fill=(255, 255, 255, 20))
            for y in range(0, height, grid_size):
                draw.line([(0, y), (width, y)], fill=(255, 255, 255, 20))
                
        elif texture_type == "organic":
            # 有机纹理
            for _ in range(100):
                x = random.randint(0, width)
                y = random.randint(0, height)
                r = random.randint(5, 20)
                draw = ImageDraw.Draw(img)
                draw.ellipse([x-r, y-r, x+r, y+r], fill=(255, 255, 255, 10))
                
        elif texture_type == "cloud":
            # 云朵纹理
            img = img.filter(ImageFilter.GaussianBlur(radius=2))
            
        return img

    def apply_filter_effects(self, img, filter_name):
        """应用滤镜效果"""
        if filter_name not in self.filter_effects or self.filter_effects[filter_name] is None:
            return img
            
        effect = self.filter_effects[filter_name]
        
        if effect.get("blur"):
            img = img.filter(ImageFilter.GaussianBlur(radius=effect["blur"]))
            
        if effect.get("brightness"):
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(effect["brightness"])
            
        if effect.get("contrast"):
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(effect["contrast"])
            
        if effect.get("sharpness"):
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(effect["sharpness"])
            
        if effect.get("saturation"):
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(effect["saturation"])
            
        if effect.get("grayscale"):
            img = img.convert('L').convert('RGB')
            
        if effect.get("sepia"):
            img = self.apply_sepia_filter(img)
            
        if effect.get("vignette"):
            img = self.apply_vignette_effect(img)
            
        return img

    def apply_sepia_filter(self, img):
        """应用复古滤镜"""
        pixels = img.load()
        for i in range(img.width):
            for j in range(img.height):
                r, g, b = pixels[i, j]
                tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                tb = int(0.272 * r + 0.534 * g + 0.131 * b)
                pixels[i, j] = (min(255, tr), min(255, tg), min(255, tb))
        return img

    def apply_vignette_effect(self, img):
        """应用暗角效果"""
        mask = Image.new('L', img.size, 0)
        draw = ImageDraw.Draw(mask)
        
        # 创建径向渐变
        center_x, center_y = img.size[0] // 2, img.size[1] // 2
        max_radius = min(center_x, center_y)
        
        for radius in range(max_radius, 0, -1):
            alpha = int(255 * (radius / max_radius))
            draw.ellipse([center_x - radius, center_y - radius, 
                         center_x + radius, center_y + radius], 
                        fill=alpha)
        
        # 应用蒙版
        img.putalpha(mask)
        return img

    def create_shadow_effect(self, img, offset=(5, 5), blur_radius=10, color=(0, 0, 0, 128)):
        """创建阴影效果"""
        shadow = Image.new('RGBA', 
                          (img.width + abs(offset[0]) + blur_radius * 2, 
                           img.height + abs(offset[1]) + blur_radius * 2), 
                          (0, 0, 0, 0))
        
        # 创建阴影
        shadow_img = Image.new('RGBA', img.size, color)
        shadow.paste(shadow_img, (blur_radius + offset[0], blur_radius + offset[1]))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        
        # 合并原图和阴影
        result = Image.new('RGBA', shadow.size, (0, 0, 0, 0))
        result.paste(shadow, (0, 0))
        result.paste(img, (blur_radius, blur_radius), img)
        
        return result

    def add_watermark(self, img, text="SillyTavern", position="bottom-right", opacity=0.5):
        """添加水印"""
        watermark = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(watermark)
        
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        if position == "bottom-right":
            x = img.width - text_width - 20
            y = img.height - text_height - 20
        elif position == "bottom-left":
            x = 20
            y = img.height - text_height - 20
        elif position == "top-right":
            x = img.width - text_width - 20
            y = 20
        else:  # top-left
            x = 20
            y = 20
        
        draw.text((x, y), text, fill=(255, 255, 255, int(255 * opacity)), font=font)
        
        return Image.alpha_composite(img.convert('RGBA'), watermark)

    def create_frame_border(self, img, border_width=10, border_color=(255, 255, 255)):
        """创建相框边框"""
        new_width = img.width + 2 * border_width
        new_height = img.height + 2 * border_width
        
        frame = Image.new('RGB', (new_width, new_height), border_color)
        frame.paste(img, (border_width, border_width))
        
        return frame

    def add_decorative_elements(self, img):
        """添加装饰元素"""
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # 添加角落装饰
        corner_size = 30
        
        # 左上角
        draw.polygon([(0, 0), (corner_size, 0), (0, corner_size)], 
                    fill=(255, 255, 255, 100))
        
        # 右上角
        draw.polygon([(img.width, 0), (img.width - corner_size, 0), 
                     (img.width, corner_size)], 
                    fill=(255, 255, 255, 100))
        
        # 左下角
        draw.polygon([(0, img.height), (corner_size, img.height), 
                     (0, img.height - corner_size)], 
                    fill=(255, 255, 255, 100))
        
        # 右下角
        draw.polygon([(img.width, img.height), (img.width - corner_size, img.height), 
                     (img.width, img.height - corner_size)], 
                    fill=(255, 255, 255, 100))
        
        return Image.alpha_composite(img.convert('RGBA'), overlay)

    def smart_crop(self, img, aspect_ratio=None, focus_point=None):
        """智能裁剪"""
        if aspect_ratio is None:
            return img
            
        target_width, target_height = aspect_ratio
        img_ratio = img.width / img.height
        target_ratio = target_width / target_height
        
        if img_ratio > target_ratio:
            # 图片太宽，需要裁剪宽度
            new_width = int(img.height * target_ratio)
            if focus_point:
                left = max(0, min(focus_point[0] - new_width // 2, img.width - new_width))
            else:
                left = (img.width - new_width) // 2
            crop_box = (left, 0, left + new_width, img.height)
        else:
            # 图片太高，需要裁剪高度
            new_height = int(img.width / target_ratio)
            if focus_point:
                top = max(0, min(focus_point[1] - new_height // 2, img.height - new_height))
            else:
                top = (img.height - new_height) // 2
            crop_box = (0, top, img.width, top + new_height)
        
        return img.crop(crop_box)

    def auto_enhance(self, img):
        """自动增强图片"""
        # 自动调整亮度
        brightness_enhancer = ImageEnhance.Brightness(img)
        img = brightness_enhancer.enhance(1.1)
        
        # 自动调整对比度
        contrast_enhancer = ImageEnhance.Contrast(img)
        img = contrast_enhancer.enhance(1.1)
        
        # 自动调整色彩饱和度
        color_enhancer = ImageEnhance.Color(img)
        img = color_enhancer.enhance(1.05)
        
        return img

    def process_screenshot(self, image_data, options=None):
        """处理截图的主函数"""
        if options is None:
            options = {}
        
        # 从base64解码图片
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))
        
        # 自动增强
        if options.get("auto_enhance", True):
            img = self.auto_enhance(img)
        
        # 智能裁剪
        if options.get("crop_ratio"):
            img = self.smart_crop(img, options["crop_ratio"], options.get("focus_point"))
        
        # 应用滤镜
        filter_name = options.get("filter", "无滤镜")
        img = self.apply_filter_effects(img, filter_name)
        
        # 选择布局
        layout = options.get("layout", "经典")
        layout_config = self.layout_templates[layout]
        
        # 创建背景
        background_style = options.get("background", "简约白")
        bg_config = self.background_presets[background_style]
        
        padding = layout_config["padding"]
        new_width = img.width + 2 * padding
        new_height = img.height + 2 * padding
        
        # 创建背景
        if bg_config["texture"] == "gradient":
            background = self.create_gradient_background(new_width, new_height, 
                                                       (234, 88, 12), (251, 146, 60))
        elif bg_config["texture"] != "smooth":
            background = self.create_texture_background(new_width, new_height, 
                                                      bg_config["color"], bg_config["texture"])
        else:
            background = Image.new('RGB', (new_width, new_height), bg_config["color"])
        
        # 创建圆角
        if layout_config["border_radius"] > 0:
            img = self.create_rounded_corners(img, layout_config["border_radius"])
        
        # 添加阴影
        if layout_config.get("shadow"):
            img = self.create_shadow_effect(img)
            # 调整背景大小以适应阴影
            shadow_padding = 20
            new_width += shadow_padding * 2
            new_height += shadow_padding * 2
            old_bg = background
            background = Image.new('RGB', (new_width, new_height), bg_config["color"])
            background.paste(old_bg, (shadow_padding, shadow_padding))
            padding += shadow_padding
        
        # 粘贴图片到背景
        if img.mode == 'RGBA':
            background = background.convert('RGBA')
            background.paste(img, (padding, padding), img)
        else:
            background.paste(img, (padding, padding))
        
        # 添加边框
        if layout_config.get("border"):
            background = self.create_frame_border(background, 5, (200, 200, 200))
        
        # 添加相框
        if layout_config.get("frame"):
            background = self.create_frame_border(background, 15, (139, 69, 19))
        
        # 添加装饰元素
        if layout_config.get("decoration"):
            background = self.add_decorative_elements(background)
        
        # 添加水印
        if layout_config.get("watermark"):
            background = self.add_watermark(background, "SillyTavern Pro", 
                                          options.get("watermark_position", "bottom-right"))
        
        # 转换为base64返回
        output_buffer = io.BytesIO()
        background.save(output_buffer, format='PNG')
        output_data = base64.b64encode(output_buffer.getvalue()).decode()
        
        return output_data

    def create_rounded_corners(self, img, radius):
        """创建圆角"""
        circle = Image.new('L', (radius * 2, radius * 2), 0)
        draw = ImageDraw.Draw(circle)
        draw.ellipse((0, 0, radius * 2, radius * 2), fill=255)
        
        alpha = Image.new('L', img.size, 255)
        w, h = img.size
        
        # 四个角
        alpha.paste(circle.crop((0, 0, radius, radius)), (0, 0))
        alpha.paste(circle.crop((0, radius, radius, radius * 2)), (0, h - radius))
        alpha.paste(circle.crop((radius, 0, radius * 2, radius)), (w - radius, 0))
        alpha.paste(circle.crop((radius, radius, radius * 2, radius * 2)), (w - radius, h - radius))
        
        img.putalpha(alpha)
        return img

    def get_plugin_info(self):
        """获取插件信息"""
        return {
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "background_presets": list(self.background_presets.keys()),
            "layout_templates": list(self.layout_templates.keys()),
            "filter_effects": list(self.filter_effects.keys())
        }

# 创建插件实例
screenshot_plugin = ScreenshotPlugin()

# 示例使用
if __name__ == "__main__":
    # 获取插件信息
    info = screenshot_plugin.get_plugin_info()
    print(f"插件名称: {info['name']}")
    print(f"版本: {info['version']}")
    print(f"描述: {info['description']}")
    print(f"可用背景: {', '.join(info['background_presets'])}")
    print(f"可用布局: {', '.join(info['layout_templates'])}")
    print(f"可用滤镜: {', '.join(info['filter_effects'])}")
    
    # 示例处理选项
    example_options = {
        "background": "科技蓝",
        "layout": "现代",
        "filter": "柔光",
        "auto_enhance": True,
        "crop_ratio": (16, 9),
        "watermark_position": "bottom-right"
    }
    
    print("\n示例处理选项:")
    for key, value in example_options.items():
        print(f"  {key}: {value}")
