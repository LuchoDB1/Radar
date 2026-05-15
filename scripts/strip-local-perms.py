#!/usr/bin/env python3
"""
TEMPLATE: strip-local-perms.py — copiado por /new-project y /adopt a
`scripts/strip-local-perms.py` del proyecto. Pre-commit hook lo invoca.

Strip session-local permissions from .claude/settings.json (project-scope).

Why: Claude Code writes "Always allow" grants to .claude/settings.json by
default (hardcoded behavior as of v2.1.137; no setting redirects to
settings.local.json). These permissions are machine/session-specific and
should NOT be versioned — they belong in .claude/settings.local.json
(gitignored per global ~/.config/git/ignore convention).

What it strips: permissions.allow, permissions.ask, permissions.deny lists +
permissions.additionalDirectories (all machine/session-specific).

What it preserves: autoMode rules, hooks, _comment, other top-level keys, and
config-style permission fields (defaultMode, disableBypassPermissionsMode).

Behavior: if it modifies the file, writes back + exits 1 (pre-commit hook
fails). User re-stages the cleaned file and re-commits. Idempotent on
already-clean input (returns 0).

Captured 2026-05-15 during PIR-7 (SDD repo) — observed Claude Code
auto-writing session grants to the freshly-versioned .claude/settings.json,
contaminating the shared file. See SDD repo docs/knowledge/automode-trial-protocol.md
"Findings" section for full context.
"""
from __future__ import annotations

import json
import pathlib
import sys

TARGET = pathlib.Path(".claude/settings.json")
STRIPPABLE_KEYS = ("allow", "ask", "deny", "additionalDirectories")


def main() -> int:
    if not TARGET.exists():
        return 0

    try:
        with TARGET.open(encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        print(f"[strip-local-perms] {TARGET} is not valid JSON: {exc}", file=sys.stderr)
        return 1

    if not isinstance(data, dict):
        return 0

    perms = data.get("permissions")
    if not isinstance(perms, dict):
        return 0

    modified = False
    for key in STRIPPABLE_KEYS:
        if key in perms:
            del perms[key]
            modified = True

    if perms == {}:
        del data["permissions"]
        modified = True

    if not modified:
        return 0

    with TARGET.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[strip-local-perms] removed local permission lists from {TARGET}")
    print("[strip-local-perms] those grants belong in .claude/settings.local.json")
    print("[strip-local-perms] re-stage the cleaned file: git add .claude/settings.json")
    return 1


if __name__ == "__main__":
    sys.exit(main())
