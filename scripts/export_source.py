"""Create a relocatable Atlas Deva source distribution using Python's standard library."""
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo
import re

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'public' / 'assets' / 'Atlas-Deva.zip'
ROOT_FILES = (
    'package.json', 'package-lock.json', 'index.html', 'vite.config.ts',
    'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js',
    'vercel.json', '.vercelignore', '.gitignore', '.env.example', 'README.md', 'CONFIGURARE.md',
)


def source_files():
    for name in ROOT_FILES:
        yield ROOT / name
    for directory in ('src', 'api', 'public', 'scripts'):
        for p in sorted((ROOT / directory).rglob('*')):
            if (not p.is_file() or p.is_symlink() or p == TARGET or p.name.startswith('.')
                    or any(part in ('__pycache__', 'node_modules', '.git') for part in p.parts)
                    or p.suffix.lower() in ('.zip', '.pyc', '.pem', '.key', '.sqlite', '.log')):
                continue
            yield p


def content(p):
    data = p.read_bytes()
    if p.name == 'index.html' and p.parent == ROOT:
        # Drop only the hosting environment's injected recorder, view counter and editor.
        data = re.sub(rb'<script\b[^>]*\bdata-(?:arena-recording|arena-views|element-picker)\b[^>]*>[\s\S]*?</script\s*>', b'', data, flags=re.I)
    if p == ROOT / 'vite.config.ts':
        # A standalone publication does not need the preview-only source-location plugin.
        data = re.sub(rb'  try \{\s*// @ts-expect-error[^\n]*\n\s*const m = await import\(\'\./\.vite-source-tags\.js\'\);\s*plugins\.push\(m\.sourceTags\(\)\);\s*\} catch \{[^\n]*\}\s*\n', b'\n', data, count=1)
    return data


def write_entry(archive, name, data):
    entry = ZipInfo('Atlas-Deva/' + name, (1980, 1, 1, 0, 0, 0))
    entry.create_system = 3
    entry.external_attr = 0o100644 << 16
    archive.writestr(entry, data, compress_type=ZIP_DEFLATED, compresslevel=6)


if __name__ == '__main__':
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=TARGET.parent, prefix='.atlas-export-', delete=False) as out:
        temporary = Path(out.name)
    try:
        with ZipFile(temporary, 'w') as archive:
            for p in source_files():
                write_entry(archive, p.relative_to(ROOT).as_posix(), content(p))
            write_entry(archive, 'PUBLICARE.txt', '''ATLAS DEVA — DISTRIBUȚIE SURSĂ

1. Extrage directorul Atlas-Deva și deschide un terminal în el.
2. Folosește Node.js 22.13+ sau 24 și execută: npm ci
3. Pentru a oferi și arhiva descărcabilă pe propria instalare, execută:
   python3 scripts/export_source.py
4. Compilează: npm run build
5. Pentru Vercel, importă directorul proiectului, cu presetarea Vite,
   comanda npm run build și directorul de ieșire dist.
   API-ul din api/ este necesar pentru publicare și moderare.

README.md descrie aplicația. CONFIGURARE.md și .env.example descriu
configurarea stocării și autentificării. Nu pune secrete în public/.
Harta, ghidurile, fotografiile, fonturile și datele de bază sunt incluse.
Nu sunt incluse date private de producție, credențiale, node_modules,
fișiere de compilare sau instrumentele gazdei pentru înregistrarea
și editarea previzualizării. Nu este necesară regenerarea hărții.
'''.encode('utf-8'))
        with ZipFile(temporary) as archive:
            if archive.testzip() is not None:
                raise RuntimeError('Verificarea integrității arhivei a eșuat.')
        temporary.replace(TARGET)
        TARGET.chmod(0o644)
        print(f'{TARGET.relative_to(ROOT)}: {TARGET.stat().st_size:,} bytes, CRC verified')
    finally:
        temporary.unlink(missing_ok=True)
