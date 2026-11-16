"""Convert MuscleMap (MIT, Melih Colpan) Swift path data into Plumb TS modules.

Usage: python3 -I scripts/convert-musclemap.py <musclemap-clone> src/lib/plumb/body
Reads only the four Data/*Paths.swift files and BodyPathData.swift viewBoxes.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

# Sub-groups Plumb never draws: finer cuts of muscles it tints as a whole.
SKIP = {
    "upperChest", "lowerChest", "upperAbs", "lowerAbs",
    "innerQuad", "outerQuad", "frontDeltoid", "rearDeltoid",
}

BLOCK = re.compile(r"BodyPartPathData\((.*?)\n\s{8}\)", re.S)
SLUG = re.compile(r"slug:\s*\.(\w+)")
ARRAY = re.compile(r"(common|left|right):\s*\[(.*?)\]", re.S)
STR = re.compile(r'"([^"]*)"')
VIEWBOX = re.compile(
    r"static let (\w+) = BodyViewBox\(\s*origin: CGPoint\(x: ([\d.]+), y: ([\d.]+)\),"
    r"\s*size: CGSize\(width: ([\d.]+), height: ([\d.]+)\)", re.S)


def kebab(name: str) -> str:
    return re.sub(r"([A-Z])", lambda m: "-" + m.group(1).lower(), name)


def parse(path: Path):
    parts = []
    for block in BLOCK.findall(path.read_text()):
        slug = SLUG.search(block).group(1)
        if slug in SKIP:
            continue
        ds = []
        for _, body in ARRAY.findall(block):
            ds.extend(STR.findall(body))
        if ds:
            parts.append({"slug": kebab(slug), "d": ds})
    return parts


def main(repo: Path, out: Path) -> None:
    data = repo / "Sources/MuscleMap/Data"
    boxes = {m[0]: " ".join(m[1:]) for m in VIEWBOX.findall((data / "BodyPathData.swift").read_text())}
    commit = subprocess.run(["git", "-C", str(repo), "rev-parse", "--short", "HEAD"],
                            capture_output=True, text=True, check=True).stdout.strip()
    for gender, Gender in (("male", "Male"), ("female", "Female")):
        figure = {
            side: {"viewBox": boxes[f"{gender}{Side}"], "parts": parse(data / f"{Gender}{Side}Paths.swift")}
            for side, Side in (("front", "Front"), ("back", "Back"))
        }
        body = json.dumps(figure, indent=1)
        (out / f"paths-{gender}.ts").write_text(
            "// Generated from MuscleMap by Melih Colpan (MIT), commit "
            f"{commit}. See NOTICE.md.\n"
            "// Regenerate with the converter rather than editing by hand.\n"
            'import type { BodyFigure } from "./types";\n\n'
            f"const figure: BodyFigure = {body};\n\nexport default figure;\n"
        )
        print(gender, {s: len(v["parts"]) for s, v in figure.items()})


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
