GEMINI — CITY VISUAL DIRECTIVE v1 — 2026-08-20
Visual layer only. Does not change canonical semantics, routing, authority, evidence, gates or write permissions. Same boundary rule as AI_STUDIO_DESIGN_DIRECTIVE.md / GROCER Design Lab.
CANONICAL DATA REMAINS CONTROLLING
Use operations_console.v0 (or whatever validated payload the upstream state layer produces) as the only source of what exists. This directive adds a top-down city renderer as an alternative/additional view. Any mismatch between payload and rendered city = PAYLOAD_DIVERGENCE, same as the existing console.
STACK — FREE, NO INSTALL REQUIRED BY OWNER
Engine: Phaser 3 (MIT license, free). Runs inside a React component via ; npm install only, no external service, no paid tier.
Tileset/sprite assets: Kenney.nl packs (CC0 — free for any use, no attribution required). Use an existing top-down RPG/city tile pack; do not commission or generate new art unless asked.
Map authoring: Tiled Map Editor (free, open-source) to lay out the city grid, export to JSON. Phaser consumes that JSON directly (official Phaser + Tiled integration, well documented).
No paid asset store, no proprietary engine, no cloud rendering service. If a free path is not found for some sub-need, report FREE_PATH_NOT_FOUND and keep searching — do not default to a paid option (per FREE-FIRST — OWNER RESOURCE POLICY in START HERE).
MAPPING RULE — CANONICAL ENTITY OR NOTHING
Every visual element must map to a real canonical entity or remain empty:
Building / district = an actual work_unit, mission, or capability domain present in the current payload. Building appearance (state color, size, activity) reflects that entity's real status field (DONE_VERIFIED, OWNER_GATE, BLOCKED, STALE, etc.) using the same semantic colors already defined in design-tokens.json (jade=DONE_VERIFIED, amber=OWNER_GATE, red=BLOCKED, violet=STALE, slate=UNKNOWN).
NPC / worker sprite = an actual agent present in payload.agents (OWNER, CHATGPT, CLAUDE, and GEMINI only once formally admitted per GEMINI_MISSION_CONTROL_ADMISSION_RECEIPT). No sprite may represent an agent absent from canonical state.
City gate / guardian checkpoint = decorative only until IDENTITY_GATE (proposed in HANDOFF_NEXT_SHIFT_2026-08-20.md) is actually implemented as a real mechanism. Until then, render it as CONCEPT_ONLY / not yet active — do not render it as a working gate.
If a payload field required for a visual element does not exist yet (e.g. no owner_gates entry, no evidence ref), the corresponding city element stays empty/unbuilt/greyed out. Never invent a building, NPC, road, or district "to make the city feel complete."
ANTI-INVENTION HARD RULES (same class as Society Runtime Guard hard-fail rules)
A. No invented buildings, NPCs, districts, roads, gates, or decorations representing entities absent from the canonical payload.
B. No promoting a building's visual state ahead of its canonical status (e.g. showing "verified/glowing" before payload says DONE_VERIFIED).
C. No animation implying live activity (workers walking, gates opening) unless backed by an actual current/recent event in canonical state; otherwise static/idle only.
D. If canonical payload is unavailable, render EMPTY_CITY / SOURCE_UNREACHABLE state — never a populated demo city standing in for real data.
E. Any new visual feature that would require inventing data must be logged as PROPOSED_ACTION, not built.
MINIMUM VIABLE SCENE (build this first, nothing broader)
One tilemap: simple grid, a handful of building placeholders, using a free Kenney city/RPG pack.
Buildings = current 13 work units from Mission Control, positioned arbitrarily but labeled with real titles, colored by real status.
One player-controllable sprite (arrow keys / WASD) that can walk between buildings — pure presentation, no gameplay logic tied to canonical mutation.
Clicking/approaching a building opens a panel with the real evidence/status text already defined in the existing Operations Console data contract v0 — reuse that contract, do not build a second one.
No gate/guardian mechanic yet — placeholder sprite only, labeled "not yet active."
ACCEPTANCE CHECK BEFORE CALLING THIS DONE
Every rendered building/NPC traces to a real payload ID (list the mapping).
No paid dependency was added.
Removing/hiding this view does not change canonical state (read-only, same as existing console).

A person unfamiliar with the project could look at the city and correctly infer real status without reading Drive docs.
STOP CONDITION
If this becomes more effort than the underlying stabilization work (GROCER_STABILIZATION_DIRECTIVE_v1.md) — pause this and finish that first. Visual work is not authorized to block or replace the core system work.
