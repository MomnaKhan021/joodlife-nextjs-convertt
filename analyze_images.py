import json
import sys

# Load image map
with open('.figma_images_map.json', 'r', encoding='utf-8') as f:
    images = json.load(f)

print(f"Total images available: {len(images)}")
print("\nSample image URLs (first 10):")
print("=" * 100)

img_list = list(images.items())
for i, (img_id, url) in enumerate(img_list[:10], 1):
    # Extract the key part of the URL
    url_parts = url.split('?')[0].split('/')[-2:]
    short_url = '/'.join(url_parts) if len(url_parts) > 1 else 'unknown'
    print(f"{i:2d}. {img_id[:16]:<16} → {short_url}")

# For Hero component - need a large background image
# Let's look for images that might be the hero background
print("\n\nLooking for background-sized images...")
hero_candidate = img_list[0][1]  # First image is likely to be large
print(f"Hero background candidate: {hero_candidate[:150]}...")

