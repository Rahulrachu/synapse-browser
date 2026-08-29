from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'public' / 'icon.png').convert('RGBA')
source.save(root / 'public' / 'icon.ico', format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
print(root / 'public' / 'icon.ico')
