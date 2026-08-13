from PIL import ImageGrab

image = ImageGrab.grab()
image.save('/home/ubuntu/synapse-browser/demo/orion-panel.png')
print(image.size)
