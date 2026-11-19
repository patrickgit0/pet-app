"""Verifica textos da web sem tradução em inglês.
Uso: python scripts/i18n-check.py   (lista as chaves de t()/mensagens que faltam em apps/web/src/i18n/en.ts)
"""
import os, re, glob, json, sys
sys.stdout.reconfigure(encoding='utf-8')

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__))).replace(os.sep, '/') + '/'
files = [f.replace('\\', '/') for f in glob.glob(root + 'apps/web/src/**/*.ts*', recursive=True)]
files = [f for f in files if not f.endswith('/i18n/en.ts')] + [root + 'packages/shared/src/labels.ts', root + 'packages/shared/src/hours.ts']

SQ = r"'((?:[^'\\\n]|\\.)*)'"
DQ = r'"((?:[^"\\\n]|\\.)*)"'
lit = re.compile(SQ + '|' + DQ)

skip_class = re.compile(r'\b(flex|grid|text-|bg-|px-|py-|p-\d|rounded|font-|items-|gap-|border|ring|h-\d|w-\d|min-h|max-w|shadow|hover:|sm:|lg:|xl:|accent-|object-|truncate|divide|self-|order-|mx-|mt-|mb-)')
keys = {}
for f in files:
    s = open(f, encoding='utf-8').read()
    # ignora comentários de linha e de bloco
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    s = re.sub(r'(^|\s)//[^\n]*', r'\1', s)
    for m in lit.finditer(s):
        v = m.group(1) if m.group(1) is not None else m.group(2)
        if v is None:
            continue
        v = v.replace("\\'", "'").replace('\\"', '"')
        if not re.search(r'[A-Za-zÀ-ú]{2,}', v):
            continue
        if re.match(r'(@|\.|/|https?:|#|\?)', v) or re.fullmatch(r'[a-z0-9_.:-]+', v):
            continue
        if skip_class.search(v):
            continue
        if re.fullmatch(r'[A-Z_]+', v) or re.fullmatch(r'[a-z]+(_[a-z]+)+', v):
            continue
        if re.search(r'[(){}=<>]|!inner|\.eq\.|\.in\.', v) and not re.search(r'[À-ú ]', v):
            continue
        keys.setdefault(v, f.replace(root, ''))



en_src = open(root + 'apps/web/src/i18n/en.ts', encoding='utf-8').read()
en_keys = set()
for m in re.finditer(r"^\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|([A-Za-zÀ-ú]+)):", en_src, re.M):
    k = m.group(1) or m.group(2) or m.group(3)
    en_keys.add(k.replace("\\'", "'"))
# textos que não são de interface
noise = re.compile(r'^(next/|use (client|server)|Enums|Tables|Row|America/|image/|currentColor|Enter|en-US|pt-BR|%s|role, ngos|card overflow|maplibre|Idioma / Language|noopener|M\d|Not found|Cache-Control|Content-Disposition|AbortError|label first-letter|\d+ \d+ auto|\d+px|\*, |email desligado|peer sr-only|Content-Type|application/json|relative opacity|\]/g)|^[a-z_]+\(|^[a-z_]+, |profiles!|^\$\{')
missing = [k for k, f in keys.items() if k not in en_keys and not noise.search(k)]
# textos que já são em inglês (labels.ts tem as duas línguas)
missing = [k for k in missing if k not in ('Age unknown', '1 month', '1 year', 'less than 1 km', 'Idade não informada', '1 mês', '1 ano', 'menos de 1 km', 'ótima', 'difícil')]  # valores internos
print(len(en_keys), 'chaves no EN;', len(missing), 'faltando')
for k in missing:
    print(' -', repr(k), '<-', keys[k])
