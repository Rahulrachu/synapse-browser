from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parents[1] / "public" / "icon.png"
out.parent.mkdir(parents=True, exist_ok=True)
size = 1024
scale = size / 256
image = Image.new("RGBA", (size, size), (10, 16, 31, 255))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((8 * scale, 8 * scale, size - 8 * scale, size - 8 * scale), radius=48 * scale, fill=(14, 30, 58, 255), outline=(68, 211, 255, 255), width=round(6 * scale))
# Bold cyan S-shaped mark, kept simple for Windows taskbar scaling.
points = [(round(x * scale), round(y * scale)) for x, y in [(178, 62), (155, 48), (108, 48), (78, 62), (65, 84), (70, 105), (93, 120), (151, 137), (166, 149), (164, 164), (148, 177), (104, 178), (77, 164)]]
draw.line(points, fill=(89, 224, 255, 255), width=round(26 * scale), joint="curve")
draw.line(points, fill=(9, 20, 39, 255), width=round(9 * scale), joint="curve")
image.save(out, format="PNG", optimize=True)
print(out)
