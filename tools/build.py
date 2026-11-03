#!/usr/bin/env python3
"""Build the game from src/ into index.html + spr.js at the repo root.

  python3 tools/build.py            -> index.html (standalone web page) + spr.js
  python3 tools/build.py --single   -> also dist/game-single.html with sprites inlined (for local tests)
"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = lambda p: open(os.path.join(ROOT, 'src', p), encoding='utf-8').read()
CSS = ['css/extra.css', 'css/ui5.css', 'css/ui6.css', 'css/ui7.css']

def strip_module(js):
    i = js.find("if (typeof module !== 'undefined')")
    return js[:i] if i >= 0 else js

def build():
    sprites_js = S('sprites.js')
    # big art loads after the first screen; only the splash creature is inlined
    spr = sprites_js.replace('var SPRITES = ', 'window.SPRITES = ', 1).rstrip().rstrip(';') + ';\n' + S('relic_art.js') + 'if (window.__spritesLoaded) window.__spritesLoaded();\n'
    all_sprites = json.loads(re.search(r'var SPRITES = (\{.*?\});', sprites_js, re.S).group(1))
    first = {k: v for k, v in all_sprites.items() if k == 'cthulhu'}
    loader = ("var SPRITES = window.SPRITES || " + json.dumps(first) + ";\n"
              "window.__spritesLoaded = function () { SPRITES = window.SPRITES; document.querySelectorAll('canvas.portrait, canvas.ricon').forEach(function (c) { c.removeAttribute('data-drawn'); }); };\n")
    data = '\n'.join([strip_module(S('data.js')), strip_module(S('relics.js')), S('lore.js'), S('story.js'), loader, S('portraits.js'), S('sound.js')])
    body = S('game.html').replace('/*DATA*/', data)
    head = S('head.html').replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
    page = ('<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<meta name="description" content="เกมทอยเต๋าแนว roguelike จากตำนานของ H.P. Lovecraft">\n'
            '<meta name="theme-color" content="#0f0a08">\n'
            + head + ''.join(S(c) for c in CSS) + '</style>\n</head>\n<body>\n' + body.rstrip()
            + '\n<script src="spr.js" async></script>\n</body>\n</html>\n')
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(page)
    open(os.path.join(ROOT, 'spr.js'), 'w', encoding='utf-8').write(spr)
    if '--single' in sys.argv:
        os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
        open(os.path.join(ROOT, 'dist', 'game-single.html'), 'w', encoding='utf-8').write(
            page.replace('<script src="spr.js" async></script>', '<script>' + spr + '</script>'))
    print('built index.html (%d KB) + spr.js (%d KB)' % (len(page.encode()) // 1024, len(spr.encode()) // 1024))

if __name__ == '__main__':
    build()
