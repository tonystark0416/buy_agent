#!/usr/bin/env python3
"""tab 图标重新着色为 iOS 风格（一次性脚本）：
- *-active.png → 全部不透明像素统一为 iOS 蓝 #007AFF（保留 alpha 形状）
- 其余（未选中）   → 统一为 iOS 灰 #8E8E93
用法: python3 recolor-tabbar-icons.py
"""
from PIL import Image
import os

BLUE = (0, 122, 255)   # iOS systemBlue
GRAY = (142, 142, 147) # iOS systemGray

BASE = os.path.join(os.path.dirname(__file__), '..', 'images', 'tabbar')

def tint(path, rgb):
    img = Image.open(path).convert('RGBA')
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0:
                px[x, y] = (rgb[0], rgb[1], rgb[2], a)
    img.save(path)
    print(f'{os.path.basename(path)} -> #{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X} ({w}x{h})')

for name in sorted(os.listdir(BASE)):
    if not name.endswith('.png'):
        continue
    path = os.path.join(BASE, name)
    if name.endswith('-active.png'):
        tint(path, BLUE)
    else:
        tint(path, GRAY)
