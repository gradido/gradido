#!/usr/bin/env python3
"""Verify every *_skipped.yml companion still mirrors its real workflow.

Option B (a companion workflow with an inverted path filter) only keeps required
checks from hanging as long as the two files agree. Nothing in GitHub enforces
that, so this script does - see the comment header in any *_skipped.yml.
"""

import glob
import os
import sys

import yaml

WORKFLOWS = os.path.join(os.path.dirname(__file__), "..", "workflows")


def triggers(doc):
    # PyYAML parses the unquoted key `on:` as the boolean True.
    return doc[True] if True in doc else doc["on"]


def jobs(doc):
    return [(jid, j.get("name", jid)) for jid, j in doc["jobs"].items()]


errors = []
companions = sorted(glob.glob(os.path.join(WORKFLOWS, "*_skipped.yml")))
if not companions:
    sys.exit("no *_skipped.yml found - did the files move?")

for companion in companions:
    real = companion.replace("_skipped.yml", ".yml")
    label = os.path.basename(companion)
    if not os.path.exists(real):
        errors.append(f"{label}: real workflow {os.path.basename(real)} is missing")
        continue

    cdoc = yaml.safe_load(open(companion))
    rdoc = yaml.safe_load(open(real))

    want = triggers(rdoc).get("push", {}).get("paths")
    got = triggers(cdoc).get("push", {}).get("paths-ignore")
    if want != got:
        errors.append(
            f"{label}: paths-ignore does not mirror {os.path.basename(real)} paths\n"
            f"    real   : {want}\n"
            f"    skipped: {got}"
        )

    if jobs(rdoc) != jobs(cdoc):
        errors.append(
            f"{label}: job ids/names differ from {os.path.basename(real)}\n"
            f"    real   : {jobs(rdoc)}\n"
            f"    skipped: {jobs(cdoc)}"
        )

    for jid, _ in jobs(cdoc):
        steps = cdoc["jobs"][jid]["steps"]
        if any("uses" in s or "turbo" in str(s.get("run", "")) for s in steps):
            errors.append(f"{label}: job '{jid}' must stay a no-op, but it does real work")

if errors:
    print("Companion workflows are out of sync:\n")
    print("\n\n".join(errors))
    sys.exit(1)

print(f"ok - {len(companions)} companion workflows mirror their real counterpart")
