# Climbing E2E DB Results

Generated from the current local Postgres database after the latest climbing pipeline run.

## Summary

| Area | Rows |
|---|---:|
| Source posts (`hikr_reports`) | 100 |
| Report base rows (`report_base_schema`) | 100 |
| Routes | 6 |
| Summits | 6 |
| Climbing tour base rows | 6 |
| Climbing garden base rows | 0 |

## Extracted Detail Tables

All 6 ready climbing tours currently have rows in each climbing tour detail table.

| Detail table | Rows |
|---|---:|
| `climbing_tour_ausruestung_schema` | 6 |
| `climbing_tour_zeitbedarf_schema` | 6 |
| `climbing_tour_absicherung_schema` | 6 |
| `climbing_tour_schuhwerk_schema` | 6 |
| `climbing_tour_gelaende_und_gefahren_schema` | 6 |
| `climbing_tour_klettern_schema` | 6 |
| `climbing_tour_anreise_schema` | 6 |
| `climbing_tour_zustieg_und_abstieg_schema` | 6 |
| `climbing_tour_besonderes_schema` | 6 |

## Status Breakdown

| Status | Activity | Sub-activity | Rows |
|---|---|---|---:|
| insufficient | Hochtour |  | 3 |
| insufficient | Klettern |  | 22 |
| insufficient |  |  | 3 |
| ready | Klettern | Klettertour | 6 |
| skipped | Hochtour |  | 8 |
| skipped | Klettern |  | 2 |
| skipped | Skihochtour |  | 5 |
| skipped | Wanderung |  | 47 |
| skipped |  |  | 4 |

## Reason Breakdown

| Reason | Rows |
|---|---:|
| `non_climbing_activity` | 60 |
| `description_too_short` | 28 |
| `unsupported_activity_scales` | 7 |
| `ready` | 6 |
| `no_climbing_preprocessor_agent_match` | 2 |

## Ready Climbing Tours

| Report ID | HIKR Post | Title | Canton | Region | Summit | Route | Time | Key extracted details |
|---:|---:|---|---|---|---|---|---|---|
| 22 | 200527 | Eulengrat / Ein Revival nach 14 Jahren | Solothurn |  | Weissenstein | Eulengrat | approach 45 min, climb 210 min | Cruxes present; difficulty felt harder; styles: wall, ridge. Hazards: polished/greasy rock, foliage. Notes mention new bolts, stands, a fixed rope, and a long descent. |
| 51 | 197770 | Brünnelistock via Gumper | Glarus |  | Brünnelistock | Gumperroute |  | Cruxes present; difficulty felt harder; styles: wall, dihedral, chimney, ridge. Hazards: snow, scree, slippery meadows. Seasonal note: recommended in autumn, with snow in upper limestone gullies. |
| 55 | 197768 | La cresta delle Rocce del Gridone | Tessin | Locarnese | Gridone | cresta delle Rocce del Gridone |  | Equipment: single rope, 30 m, 5 quickdraws. Protection rated good. Cruxes present; styles: wall, chimney, slab. Hazards include ice, exposed terrain, unstable rock, slippery leaves, and route finding. |
| 62 | 197460 | Gerstelgrat, zweiter Teil | Basel Land |  | Gerstelflue | Gerstelgrat | approach 30 min, climb 120 min, descent 40 min | Equipment: single rope. Protection rated medium. Cruxes present; difficulty as graded; styles: ridge, edge, wall, dihedral, crack, slab, chimney. Hazards: wetness, loose/brittle rock, exposure, rockfall. |
| 64 | 197418 | Fluebrig via NO-Rippe | Schwyz |  | Fluebrig | NO-Rippe |  | Cruxes present; difficulty felt harder; styles: ridge, wall. Protection notes mention blue points, a very thin wire rope, and bolts. Hazards: steep grass slope and exposure. Seasonal note: winter chains may be under snow. |
| 94 | 196751 | Hohgant Ostgrat & Drei Bären | Bern | Emmental | Hohgant | Ostgrat |  | Cruxes present; difficulty as graded; styles: ridge, wall, chimney. Protection notes mention individual bolts near the Gemsbödeli exit. Hazards: wet/feuchte terrain and cloud/fog. Seasonal note: terrain should be dry. |

## Query Scope

The result joins:

- `hikr_reports`
- `report_base_schema`
- `climbing_tour_base_schema`
- `routes`
- `summits`
- all `climbing_tour_*_schema` detail tables

This report reflects the current database state at query time; rerunning `just test-run-climbing ...` will purge and replace the rows.
