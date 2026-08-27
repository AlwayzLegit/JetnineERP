#!/usr/bin/env python3
"""
Build docs/erp-inventory/sections/*.md from the STORIS Help Center API.

Produces, with positions and counts matching 99-source-index.md:

    01-fulfillments.md            27 articles
    02-inventory.md               44 articles
    03a-views-reports-part1.md    52 articles (positions 0-51)
    03b-views-reports-part2.md    51 articles (positions 52-102)
    04-transfers.md               22 articles

Usage:  python3 build-sections.py [--out .] [--check]
        --check  re-pull and report drift against 99-source-index.md without writing

No auth required. Pure stdlib.
"""
from __future__ import annotations

import argparse
import html
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

BASE = "https://storis.zendesk.com/api/v2/help_center/en-us"
ARTICLE_URL = "https://storis.zendesk.com/hc/en-us/articles/{}"

# (filename, section_id, position_slice) — slice is None for whole-section files
TARGETS = [
    ("01-fulfillments.md",           "Fulfillments",                 51664106444308, None),
    ("02-inventory.md",              "Inventory",                    15185835400852, None),
    ("03a-views-reports-part1.md",   "Inventory Views and Reports",  51935514726164, slice(0, 52)),
    ("03b-views-reports-part2.md",   "Inventory Views and Reports",  51935514726164, slice(52, None)),
    ("04-transfers.md",              "Transfers",                    15172923725332, None),
]
EXPECTED = {
    "01-fulfillments.md": 27,
    "02-inventory.md": 44,
    "03a-views-reports-part1.md": 52,
    "03b-views-reports-part2.md": 51,
    "04-transfers.md": 22,
}

# --------------------------------------------------------------------------- fetch

def get(url: str, tries: int = 4):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "erp-inventory-pack/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt == tries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))
            print(f"  retry {attempt + 1}: {e}", file=sys.stderr)


_sections_cache: dict[int, list] = {}

def section_articles(section_id: int) -> list:
    """All articles in a section, in position order. Cached per run."""
    if section_id in _sections_cache:
        return _sections_cache[section_id]
    out, page = [], 1
    while True:
        j = get(f"{BASE}/sections/{section_id}/articles.json"
                f"?per_page=100&page={page}&sort_by=position")
        out += j["articles"]
        if not j.get("next_page"):
            break
        page += 1
        time.sleep(0.2)
    _sections_cache[section_id] = out
    return out

# ------------------------------------------------------------------- html -> md

CDATA = re.compile(r"//\s*<!\[CDATA\[.*?\]\]>", re.S)
SCRIPTISH = re.compile(r"<(script|style)\b.*?</\1>", re.S | re.I)
POPUP = re.compile(r"TextPopupInit\([^)]*\);?")
TAG = re.compile(r"<[^>]+>")
# STORIS authoring tool emits the field label twice: "Send Output to Send Output to"
DUPE_LABEL = re.compile(r"\b([A-Z][\w /()'-]{2,60}?) \1\b")


def to_markdown(body: str) -> str:
    s = SCRIPTISH.sub("", body or "")
    s = CDATA.sub("", s)
    s = POPUP.sub("", s)

    # headings
    for lvl in range(1, 7):
        s = re.sub(rf"<h{lvl}[^>]*>(.*?)</h{lvl}>", rf"\n\n{'#' * (lvl + 2)} \1\n\n", s, flags=re.S | re.I)
    # emphasis
    s = re.sub(r"</?(strong|b)>", "**", s, flags=re.I)
    s = re.sub(r"</?(em|i)>", "_", s, flags=re.I)
    # lists
    s = re.sub(r"<li[^>]*>", "\n- ", s, flags=re.I)
    s = re.sub(r"</li>", "", s, flags=re.I)
    s = re.sub(r"</?(ul|ol)[^>]*>", "\n", s, flags=re.I)
    # tables -> pipe rows (crude but readable; source tables are small)
    s = re.sub(r"<t[dh][^>]*>", " | ", s, flags=re.I)
    s = re.sub(r"</tr>", " |\n", s, flags=re.I)
    s = re.sub(r"</?(table|thead|tbody|tr)[^>]*>", "\n", s, flags=re.I)
    # blocks
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</(p|div)>", "\n\n", s, flags=re.I)

    s = html.unescape(TAG.sub("", s))
    s = DUPE_LABEL.sub(r"\1", s)
    s = "\n".join(line.rstrip() for line in s.splitlines())
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


ACCESS = re.compile(r"^Access\s*\n+(.+?)(?=\n\n)", re.S)

def split_access(md: str) -> tuple[str, str]:
    """Pull the leading 'Access' menu-path block out of the body, if present."""
    m = ACCESS.match(md)
    if not m:
        return "", md
    paths = [p.strip() for p in m.group(1).splitlines() if p.strip()]
    return "\n".join(f"- `{p}`" for p in paths), md[m.end():].lstrip()

# ------------------------------------------------------------------------ render

def render(fname: str, section_name: str, articles: list, offset: int) -> str:
    head = [
        f"# {fname.removesuffix('.md')}",
        "",
        f"Source section: **{section_name}** · {len(articles)} articles "
        f"(positions {offset}–{offset + len(articles) - 1})",
        "",
        "Converted from the STORIS Help Center. Provenance and the full position table live in "
        "`../99-source-index.md`. Regenerate with `build-sections.py`.",
        "",
        "---",
        "",
    ]
    parts = []
    for i, a in enumerate(articles):
        pos = offset + i
        md = to_markdown(a["body"])
        access, rest = split_access(md)
        block = [f"## {pos}. {a['title']}", ""]
        block.append(f"`{a['id']}` · <{ARTICLE_URL.format(a['id'])}>")
        block.append("")
        if access:
            block += ["**Access**", "", access, ""]
        block += [rest, "", "---", ""]
        parts.append("\n".join(block))
    return "\n".join(head) + "\n".join(parts)

# -------------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=".", help="output directory (default: cwd)")
    ap.add_argument("--check", action="store_true", help="report drift, write nothing")
    args = ap.parse_args()

    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    drift = 0

    for fname, sec_name, sec_id, sl in TARGETS:
        allarts = section_articles(sec_id)
        arts = allarts[sl] if sl else allarts
        offset = sl.start if sl else 0
        want = EXPECTED[fname]

        if len(arts) != want:
            drift += 1
            print(f"DRIFT {fname}: expected {want} articles, upstream now has {len(arts)}",
                  file=sys.stderr)

        if args.check:
            print(f"{fname}: {len(arts)} articles (expected {want})")
            continue

        text = render(fname, sec_name, arts, offset)
        (out / fname).write_text(text, encoding="utf-8")
        print(f"{fname}: {len(arts)} articles, {text.count(chr(10)) + 1} lines")

    if drift:
        print(f"\n{drift} file(s) drifted from 99-source-index.md — "
              f"re-pull the index before trusting the pack.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
