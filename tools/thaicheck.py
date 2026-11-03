#!/usr/bin/env python3
"""Thai word check: split every Thai run in the game into words and list the ones
that are not in the PyThaiNLP dictionary (most hits are names and loanwords).

  pip install pythainlp
  python3 tools/thaicheck.py
"""
import collections, glob, os, re
from pythainlp.corpus import thai_words
from pythainlp.tokenize import word_tokenize

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')
FILES = ['html/body.html'] + sorted(glob.glob('data/*.js', root_dir=SRC)) + sorted(glob.glob('js/*.js', root_dir=SRC))

words = set(thai_words())
unknown, first_seen = collections.Counter(), {}
for f in FILES:
    with open(os.path.join(SRC, f), encoding='utf-8') as fh:
        for n, line in enumerate(fh, 1):
            for chunk in re.findall(r'[฀-๿]+', line):
                for w in word_tokenize(chunk, engine='newmm', keep_whitespace=False):
                    if len(w) > 1 and re.fullmatch(r'[฀-๿]+', w) and w not in words:
                        unknown[w] += 1
                        first_seen.setdefault(w, '%s:%d' % (f, n))

for w, c in unknown.most_common():
    print(c, w, first_seen[w])
