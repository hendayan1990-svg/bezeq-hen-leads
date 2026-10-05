from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

OUT = Path(__file__).parent / 'assets'
OUT.mkdir(exist_ok=True)
S = 1024

def gradient_bg(size=S):
    img = Image.new('RGB', (size,size), '#06101D')
    px = img.load()
    for y in range(size):
        t=y/(size-1)
        r=int(3+(7-3)*t); g=int(16+(34-16)*t); b=int(29+(58-29)*t)
        for x in range(size): px[x,y]=(r,g,b)
    return img

def logo_layer(size=S, transparent=False):
    base = Image.new('RGBA',(size,size),(0,0,0,0) if transparent else (6,16,29,255))
    glow = Image.new('RGBA',(size,size),(0,0,0,0)); gd=ImageDraw.Draw(glow)
    gd.ellipse((190,160,834,804),fill=(0,145,255,90)); glow=glow.filter(ImageFilter.GaussianBlur(90)); base.alpha_composite(glow)
    d=ImageDraw.Draw(base)
    # outer rounded shield / drop
    d.rounded_rectangle((130,100,894,924), radius=220, fill=(5,24,42,245), outline=(44,182,255,210), width=10)
    # heart body
    heart=[(512,760),(360,642),(280,548),(278,456),(320,386),(388,358),(452,374),(512,438),(572,374),(636,358),(704,386),(746,456),(744,548),(664,642)]
    d.polygon(heart, fill=(8,124,255,255))
    # inner cyan overlay
    d.ellipse((404,348,620,564), fill=(35,201,255,255))
    d.ellipse((307,300,437,430), fill=(118,226,255,255))
    d.ellipse((587,300,717,430), fill=(55,175,255,255))
    d.ellipse((446,205,578,337), fill=(172,240,255,255))
    # cover lower halves of heads to create integrated family mark
    d.pieslice((352,374,672,734),180,360,fill=(24,171,255,255))
    d.pieslice((246,418,492,690),180,360,fill=(7,112,238,255))
    d.pieslice((532,418,778,690),180,360,fill=(8,130,250,255))
    return base

icon=gradient_bg().convert('RGBA')
mark=logo_layer(1024, True)
icon.alpha_composite(mark)
icon.save(OUT/'icon.png')

fg=logo_layer(1024, True)
fg.save(OUT/'android-icon-foreground.png')

bg=gradient_bg().convert('RGBA'); bg.save(OUT/'android-icon-background.png')
mono=Image.new('RGBA',(1024,1024),(0,0,0,0)); md=ImageDraw.Draw(mono); md.ellipse((330,210,694,574), fill=(255,255,255,255)); md.polygon([(512,800),(290,570),(300,430),(410,380),(512,470),(614,380),(724,430),(734,570)], fill=(255,255,255,255)); mono.save(OUT/'android-icon-monochrome.png')

splash=gradient_bg(1024).convert('RGBA'); mark_small=logo_layer(1024,True).resize((620,620), Image.Resampling.LANCZOS); splash.alpha_composite(mark_small,((1024-620)//2,(1024-620)//2)); splash.save(OUT/'splash-icon.png')
icon.resize((256,256), Image.Resampling.LANCZOS).save(OUT/'favicon.png')
print('AGAM brand assets generated')
