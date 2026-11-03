# Thai spell/word check: tokenize every Thai run in the game and list words that are not in the dictionary
import re, collections
from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_words
import os; d=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'src')+'/'
DICT=set(thai_words())
unk=collections.Counter(); where={}
for f in ['game.html','data.js','relics.js','lore.js','story.js']:
    for i,l in enumerate(open(d+f,encoding='utf-8').read().split('\n'),1):
        for run in re.findall(r'[฀-๿]+',l):
            for w in word_tokenize(run, engine='newmm', keep_whitespace=False):
                if re.fullmatch(r'[฀-๿]+',w) and w not in DICT and len(w)>1:
                    unk[w]+=1; where.setdefault(w,f'{f}:{i}')
for w,c in sorted(unk.items(), key=lambda x:-x[1]):
    print(c, w, where[w])
