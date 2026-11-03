#!/usr/bin/env python3
"""Build the game from src/ into a playable page.

  python3 tools/build.py              index.html + spr.js at the repo root (the GitHub Pages site)
  python3 tools/build.py --single     also dist/game-single.html, sprites inlined (used by the tests)
  python3 tools/build.py --artifact   also dist/artifact.html + dist/spr.js (the claude.ai artifact)

Everything in src/js runs as one script, in the order listed in JS below,
so a later file can use anything an earlier file declared.
CSS files are cascade layers: later files override earlier ones.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CSS = ['1-base', '2-features', '3-pixel-theme', '4-parchment-theme', '5-latest']

# game content, shared with the balance sim (tools/sim.js)
DATA = ['data/data.js', 'data/relics.js', 'data/lore.js', 'data/story.js']

JS = [
    'portraits',   # canvas drawing of monsters and relic icons
    'sound',       # synthesized sound effects
    'core',        # globals, face types, glossary
    'save',        # records, meta progress, run save/resume
    'tips',        # first-time tips
    'helpers',     # small UI helpers (dice/relic cards, tooltips text)
    'chapters',    # chapter select
    'visuals',     # portraits on screen, fog, floating numbers
    'meta-shop',   # shard shop between runs, sound button
    'codex',       # forbidden notes (bestiary / relics / manuscript)
    'pages',       # manuscript story pages
    'run',         # run setup, stages, rest, choose-a-foe
    'battle',      # turns, rolling, resolve, enemy turn, win/lose
    'reward',      # summon a die after a win
    'events',      # random events
    'run-shop',    # merchant during a run
    'end',         # run end screen
    'coach',       # tutorial coach
    'render',      # battle screen rendering
    'input',       # button wiring
    'tooltips',    # hover / press-and-hold tips
]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700'
         '&family=Pixelify+Sans:wght@500;700&family=Sarabun:wght@400;500;700&display=swap">\n')


def src(p):
    with open(os.path.join(ROOT, 'src', p), encoding='utf-8') as f:
        return f.read()


def write(p, text):
    p = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)


def strip_node_export(js):
    """data files end with a module.exports line for the Node sim; the browser doesn't need it."""
    i = js.find("if (typeof module !== 'undefined')")
    return js[:i] if i >= 0 else js


def sprite_bundle():
    """Monster art + relic icons, loaded after the first screen so the game opens fast."""
    sprites = src('art/sprites.js')
    spr = (sprites.replace('var SPRITES = ', 'window.SPRITES = ', 1).rstrip().rstrip(';') + ';\n'
           + src('art/relic_art.js')
           + 'if (window.__spritesLoaded) window.__spritesLoaded();\n')
    # the splash creature is needed immediately, so it ships inside the page
    allspr = json.loads(re.search(r'var SPRITES = (\{.*?\});', sprites, re.S).group(1))
    first = {'cthulhu': allspr['cthulhu']}
    loader = ('var SPRITES = window.SPRITES || ' + json.dumps(first) + ';\n'
              'window.__spritesLoaded = function () { SPRITES = window.SPRITES; '
              "document.querySelectorAll('canvas.portrait, canvas.ricon').forEach(function (c) { c.removeAttribute('data-drawn'); }); };\n")
    return spr, loader


def build():
    spr, loader = sprite_bundle()
    css = '\n'.join(src('css/%s.css' % c).rstrip() for c in CSS)
    data = '\n'.join(strip_node_export(src(p)).rstrip() for p in DATA)
    game = '\n\n'.join(src('js/%s.js' % j).rstrip() for j in JS)
    body = (src('html/body.html').rstrip() + '\n\n<script>\n' + data + '\n' + loader + '</script>\n'
            '<script>\n' + game + '\n</script>\n<script src="spr.js" async></script>\n')
    head = src('html/head.html').rstrip() + '\n' + FONTS + '<style>\n' + css + '\n</style>\n'

    page = ('<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</head>\n<body>\n' + body + '</body>\n</html>\n')
    write('index.html', page)
    write('spr.js', spr)
    out = ['index.html (%d KB)' % (len(page.encode()) // 1024), 'spr.js (%d KB)' % (len(spr.encode()) // 1024)]

    if '--single' in sys.argv:
        write('dist/game-single.html', page.replace('<script src="spr.js" async></script>', '<script>' + spr + '</script>'))
        out.append('dist/game-single.html')
    if '--artifact' in sys.argv:
        # claude.ai wraps the page in its own document; it only needs head bits + body
        write('dist/artifact.html', '<meta name="claude:viewport-fit-sides" content="cover">\n' + head + body)
        write('dist/spr.js', spr)
        out.append('dist/artifact.html + dist/spr.js')
    print('built ' + ', '.join(out))


if __name__ == '__main__':
    build()
