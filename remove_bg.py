"""
Simple background removal script for SkuggleAI image.
Requires: pip install pillow rembg

Usage: python remove_bg.py
"""

try:
    from rembg import remove
    from PIL import Image
    
    input_path = r"c:\Skuggle\figma\skuggleAi_.png"
    output_path = r"c:\Skuggle\src\assets\images\skuggle-mascot-transparent.png"
    
    print("Loading image...")
    input_img = Image.open(input_path)
    
    print("Removing background (this may take a moment)...")
    output_img = remove(input_img)
    
    print("Saving result...")
    output_img.save(output_path)
    
    print(f"✓ Background removed successfully!")
    print(f"Output saved to: {output_path}")
    
except ImportError:
    print("Error: Required libraries not installed.")
    print("Please install them with: pip install pillow rembg")
    print("\nAlternatively, use an online tool:")
    print("1. Visit https://remove.bg")
    print("2. Upload: c:\\Skuggle\\figma\\SkuggleAI.png")
    print("3. Download the result")
    print("4. Save as: c:\\Skuggle\\public\\skuggle-ai-login-new.png")
except Exception as e:
    print(f"Error: {e}")
