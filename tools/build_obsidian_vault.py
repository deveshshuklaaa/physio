"""Vault-only view: project code, re-clustered, coloured.

Reads graphify-out/graph.json, drops vendored third-party nodes, re-clusters
what's left, names the communities after the repo's own structure, and writes
an Obsidian vault. graph.json itself is never modified -- this is a filtered
view, not a prune.
"""
import json
import re
import shutil
from collections import Counter
from pathlib import Path

import networkx as nx
from networkx.readwrite import json_graph

from graphify.cluster import cluster, score_all
from graphify.export import to_obsidian

REPO = Path("/home/billa-dakait/Desktop/final_project")
OUT = REPO / "graphify-out" / "obsidian"

# Vendored third-party only. Legacy reference stays: it is this project's own
# history and D-phase notes still point at it.
EXCLUDE = ("frontend/src/vendor/", "frontend/src/assets/vendor/")

# Dominant source directory -> community name. First match wins, longest first.
NAMES = {
    "frontend/src/lib": "Live Geometry & Rules",
    "frontend/src/workers": "Pose Worker",
    "frontend/src/ws": "WS Client",
    "frontend/src/render": "Skeleton Rendering",
    "frontend/src/pages": "Live Session Page",
    "frontend/src/assets": "Frontend Assets",
    "frontend/app/src/components": "UI Components",
    "frontend/app/src/pages": "React Pages",
    "frontend/app/src": "React App Shell",
    "frontend/app": "Frontend Build Config",
    "frontend/tests": "Frontend Unit Tests",
    "frontend/tools": "Frontend Gate Harnesses",
    "backend/app/routes": "Backend Routes",
    "backend/app/services": "Backend Services",
    "backend/app/ws": "Session WebSocket",
    "backend/app/config": "Exercise Config Data",
    "backend/app": "Backend App Core",
    "backend/ml/exercise_extractors": "Per-Exercise Extractors",
    "backend/ml": "ML Ingestion & Features",
    "backend/tools": "Backend Gate Harnesses",
    "backend/_old_physio_reference": "Legacy Physio Reference",
    "emg-service/backend": "EMG Flask Service",
    "emg-service/website": "EMG Web Dashboard",
    "emg-service": "EMG Service Support",
    "docs": "Project Docs",
    "backend": "Backend Root",
    "frontend": "Frontend Root",
}
ORDERED = sorted(NAMES.items(), key=lambda kv: -len(kv[0]))

# 20 distinct hues, so neighbouring communities never share a colour the way
# they do when 167 communities cycle a 10-colour palette.
PALETTE = [
    "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
    "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC",
    "#1F77B4", "#D62728", "#2CA02C", "#9467BD", "#8C564B",
    "#E377C2", "#17BECF", "#BCBD22", "#7F7F7F", "#FF7F0E",
    "#00A0B0", "#CC333F", "#6A4A3C", "#A7C957",
]


def name_for(members, byid):
    dirs = Counter()
    for m in members:
        sf = byid.get(m, {}).get("source_file") or ""
        dirs["/".join(sf.split("/")[:-1]) or sf] += 1
    if not dirs:
        return None
    top, _ = dirs.most_common(1)[0]
    if "/" not in top:
        # A root-level file (docker-compose.yml, package.json, ...) has no
        # parent directory, so it names itself. Group them rather than letting
        # each become its own "Requirements.Txt" area.
        if not top or Path(top).suffix:
            return "Repo Root Config"
    for prefix, label in ORDERED:
        if top == prefix or top.startswith(prefix + "/"):
            return label
    return top.split("/")[-1].replace("_", " ").title() or None


def main():
    data = json.loads((REPO / "graphify-out" / "graph.json").read_text())
    G = json_graph.node_link_graph(data, edges="links")

    drop = [n for n, d in G.nodes(data=True)
            if (d.get("source_file") or "").startswith(EXCLUDE)]
    G.remove_nodes_from(drop)
    G.remove_nodes_from(list(nx.isolates(G)))
    print(f"dropped {len(drop)} vendored nodes -> {G.number_of_nodes()} nodes, "
          f"{G.number_of_edges()} edges")

    communities = cluster(G)
    cohesion = score_all(G, communities)
    byid = {n: d for n, d in G.nodes(data=True)}

    # Name communities, disambiguating repeats so two "Backend Routes" clusters
    # stay distinguishable instead of silently merging in the graph view.
    labels, used = {}, Counter()
    for cid, members in sorted(communities.items(), key=lambda kv: -len(kv[1])):
        base = name_for(members, byid) or f"Community {cid}"
        used[base] += 1
        labels[cid] = base if used[base] == 1 else f"{base} {used[base]}"

    if OUT.exists():
        shutil.rmtree(OUT)
    written = to_obsidian(G, communities, str(OUT), community_labels=labels,
                          cohesion=cohesion)

    # to_obsidian writes one colorGroup per community from a 10-colour palette,
    # so with this many communities the colours cycle and three unrelated
    # clusters share a hue. Colour by AREA instead: every community that came
    # from the same part of the repo ("Backend Routes", "Backend Routes 2", ...)
    # gets one colour, which is the distinction actually worth seeing.
    def tag_of(label):
        return re.sub(r"[^a-z0-9_]", "", label.lower().replace(" ", "_"))

    areas = {}
    for cid, members in sorted(communities.items(), key=lambda kv: -len(kv[1])):
        base = re.sub(r" \d+$", "", labels[cid])
        areas.setdefault(base, {"size": 0, "tags": []})
        areas[base]["size"] += len(members)
        areas[base]["tags"].append(tag_of(labels[cid]))

    ordered_areas = sorted(areas.items(), key=lambda kv: -kv[1]["size"])
    groups = [
        {"query": " OR ".join(f"tag:#community/{t}" for t in info["tags"]),
         "color": {"a": 1, "rgb": int(PALETTE[i % len(PALETTE)].lstrip("#"), 16)}}
        for i, (base, info) in enumerate(ordered_areas)
    ]

    cfg = {
        "collapse-filter": False, "search": "", "showTags": True,
        "showAttachments": False, "hideUnresolved": True, "showOrphans": False,
        "collapse-color-groups": False, "colorGroups": groups,
        "collapse-display": False, "showArrow": True, "textFadeMultiplier": -0.6,
        "nodeSizeMultiplier": 1.3, "lineSizeMultiplier": 0.9,
        "collapse-forces": False, "centerStrength": 0.45, "repelStrength": 12,
        "linkStrength": 0.6, "linkDistance": 190, "scale": 0.55,
        "close": False,
    }
    (OUT / ".obsidian").mkdir(parents=True, exist_ok=True)
    (OUT / ".obsidian" / "graph.json").write_text(json.dumps(cfg, indent=2))

    print(f"{written} notes, {len(communities)} communities, "
          f"{len(groups)} colour groups (one per area)")
    for base, info in ordered_areas:
        print(f"  {info['size']:4d}  {base}  ({len(info['tags'])} clusters)")


if __name__ == "__main__":
    main()
