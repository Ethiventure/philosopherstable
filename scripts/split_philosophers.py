"""One-off migration: split src/data/philosophers.ts into src/philosophers/{slug}.ts.

Each existing profile block is moved verbatim (no fields deleted). A `style_essence`
import + property is appended so the essence can live in its own file per thinker.
Run from the project root:  python3 scripts/split_philosophers.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "philosophers.ts"
OUT = ROOT / "src" / "philosophers"
OUT.mkdir(exist_ok=True)

text = SRC.read_text()

# Entries are top-level array items indented by two spaces: "  {\n ... \n  },"
entries = re.findall(r"^  \{\n(.*?)^  \},?\n", text, flags=re.S | re.M)
assert len(entries) == 9, f"expected 9 entries, found {len(entries)}"

for body in entries:
    slug = re.search(r"slug: '([a-z]+)'", body).group(1)
    # Drop seat_order — the index derives it from birth year.
    body = re.sub(r"^    seat_order: \d+,\n", "", body, flags=re.M)
    # De-indent from 4 spaces to 2 for a top-level object literal.
    body = "\n".join(line[2:] if line.startswith("  ") else line for line in body.splitlines())
    out = (
        "import type { PhilosopherDefinition } from '@/types';\n"
        f"import {{ {slug.upper()}_STYLE }} from './{slug}.style';\n\n"
        f"export const {slug.upper()}: PhilosopherDefinition = {{\n"
        f"{body}\n"
        f"  style_essence: {slug.upper()}_STYLE,\n"
        "};\n"
    )
    (OUT / f"{slug}.ts").write_text(out)
    print("wrote", slug)
