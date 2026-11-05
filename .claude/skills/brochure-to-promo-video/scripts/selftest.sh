#!/usr/bin/env bash
# Quick sanity checks after editing the skill's scripts: syntax of every script and library, and that
# the environment report runs. Does not render anything.
#   selftest.sh
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; SKILL="$(dirname "$HERE")"; fail=0
for f in "$HERE"/*.sh; do bash -n "$f" && echo "ok   $(basename "$f")" || { echo "FAIL $(basename "$f")"; fail=1; }; done
for f in "$HERE"/*.py; do python3 -c "import ast,sys; ast.parse(open(sys.argv[1]).read())" "$f" && echo "ok   $(basename "$f")" || { echo "FAIL $(basename "$f")"; fail=1; }; done
for f in "$HERE"/*.mjs "$SKILL"/lib/*.mjs "$SKILL"/templates/*.mjs "$SKILL"/examples/zogreo/build.mjs; do node --check "$f" && echo "ok   ${f#$SKILL/}" || { echo "FAIL ${f#$SKILL/}"; fail=1; }; done
test "$(find "$SKILL" -name SKILL.md | wc -l)" -eq 1 && echo "ok   exactly one SKILL.md" || { echo "FAIL more than one SKILL.md (skill uploads reject nested ones)"; fail=1; }
bash "$HERE/setup_env.sh" check >/dev/null 2>&1 && echo "ok   setup_env.sh check runs" || { echo "FAIL setup_env.sh check"; fail=1; }
exit $fail
