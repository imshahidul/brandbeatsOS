#!/usr/bin/env python3
"""
Auto Hanger Detection & Normalization System
=============================================
When a merchant uploads a product photo WITH a hanger, this system automatically:
1. Removes the background
2. Detects the hanger hook tip (the point that goes over the rail)
3. Normalizes the image to 700x1000 with hook tip at (350, 10)
4. Outputs a rail-ready image

MATH (not physics — this is pure geometry):
- Hook tip detection: topmost opaque pixel cluster (computer vision)
- Normalization: affine translation T = (cx - x_tip, ty - y_tip)
- Rail placement: perspective scale s = base / (1 + k*dd), hook tip pinned to rail point

No physics simulation needed — the photo already captures natural hanging.
We just do coordinate geometry to position it correctly.

Usage:
    python auto_hanger.py input.jpg -o output.png
    python auto_hanger.py input.jpg -o output.png --no-bg-remove (if already transparent)
"""

import argparse
import os
import sys
from PIL import Image


def remove_background(input_path):
    """Remove background using rembg. Returns PIL Image with alpha."""
    try:
        from rembg import remove
    except ImportError:
        print("ERROR: rembg not installed. Install with: pip install rembg", file=sys.stderr)
        sys.exit(1)
    
    img = Image.open(input_path).convert("RGBA")
    # rembg works best on RGB
    rgb = Image.new("RGB", img.size, (255, 255, 255))
    rgb.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
    result = remove(rgb)
    if isinstance(result, bytes):
        from io import BytesIO
        result = Image.open(BytesIO(result))
    return result.convert("RGBA")


def detect_hook_tip(img, min_cluster=3):
    """
    Detect the hanger hook tip.
    
    MATH: Scan rows top-down (y=0 to h). For each row, count opaque pixels.
    The hook tip is the first row with >= min_cluster opaque pixels within
    a narrow x-band (hooks are narrow at the tip).
    
    Returns (x_tip, y_tip) — center x of the tip cluster, y of the row.
    """
    w, h = img.size
    alpha = img.split()[3]
    px = alpha.load()
    
    for y in range(h):
        # Find all opaque runs in this row
        runs = []
        run_start = None
        for x in range(w):
            if px[x, y] > 128:
                if run_start is None:
                    run_start = x
            else:
                if run_start is not None:
                    runs.append((run_start, x - 1))
                    run_start = None
        if run_start is not None:
            runs.append((run_start, w - 1))
        
        # Look for a narrow cluster (hook tip is ~5-20px wide)
        for (x0, x1) in runs:
            width = x1 - x0 + 1
            if min_cluster <= width <= 30:
                x_tip = (x0 + x1) // 2
                return (x_tip, y)
    
    # Fallback: topmost opaque pixel
    for y in range(h):
        for x in range(w):
            if px[x, y] > 128:
                return (x, y)
    return None


def normalize_hanger(img, tip, target_size=(700, 1000), target_tip=(350, 10)):
    """
    Normalize image so hook tip is at target_tip in target_size canvas.
    
    MATH: Affine translation.
    - If image is not target_size, scale it first (preserve aspect, fit width).
    - Translation vector: T = (tx - x_tip, ty - y_tip)
    - New position: (x', y') = (x + Tx, y + Ty)
    """
    tw, th = target_size
    tx, ty = target_tip
    x_tip, y_tip = tip
    
    w, h = img.size
    
    # Scale to fit target width (700), preserve aspect
    scale = tw / w
    new_w = tw
    new_h = int(h * scale)
    img_scaled = img.resize((new_w, new_h), Image.LANCZOS)
    
    # Adjust tip coordinates for scale
    x_tip_s = int(x_tip * scale)
    y_tip_s = int(y_tip * scale)
    
    # Translation to move tip to target
    dx = tx - x_tip_s
    dy = ty - y_tip_s
    
    # Create canvas and paste
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    # Calculate paste position (top-left of scaled image on canvas)
    paste_x = dx
    paste_y = dy
    
    # Paste (PIL handles out-of-bounds by clipping)
    canvas.paste(img_scaled, (paste_x, paste_y), img_scaled)
    
    return canvas


def process(input_path, output_path, bg_remove=True):
    """Full pipeline: bg remove -> detect tip -> normalize -> save."""
    print(f"Processing: {input_path}")
    
    # Step 1: Background removal
    if bg_remove:
        print("  [1/3] Removing background...")
        img = remove_background(input_path)
    else:
        print("  [1/3] Skipping bg removal (already transparent)...")
        img = Image.open(input_path).convert("RGBA")
    
    # Step 2: Hook tip detection
    print("  [2/3] Detecting hanger hook tip...")
    tip = detect_hook_tip(img)
    if tip is None:
        print("  ERROR: No opaque pixels found!", file=sys.stderr)
        sys.exit(1)
    print(f"        Tip found at: {tip}")
    
    # Step 3: Normalization
    print("  [3/3] Normalizing to 700x1000 (tip at 350,10)...")
    result = normalize_hanger(img, tip)
    
    result.save(output_path)
    print(f"  Saved: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Auto-detect hanger and normalize for rail display")
    parser.add_argument("input", help="Input image path (with hanger)")
    parser.add_argument("-o", "--output", required=True, help="Output PNG path")
    parser.add_argument("--no-bg-remove", action="store_true", help="Skip background removal")
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"ERROR: Input not found: {args.input}", file=sys.stderr)
        sys.exit(1)
    
    process(args.input, args.output, bg_remove=not args.no_bg_remove)


if __name__ == "__main__":
    main()
