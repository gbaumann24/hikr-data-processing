# Climbing Pipeline Workflow Overview

This is the current end-to-end flow for a HIKR post through the base layer and climbing pipeline.

```mermaid
flowchart TD
  A["Raw HIKR post"] --> B["baseLayerStep<br/>prepareBaseLayer"]

  B --> B1["Normalize description<br/>Parse canton + region<br/>Extract difficulty scales"]
  B1 --> B2{"Too short<br/>or missing canton?"}

  B2 -- yes --> B3["Base output<br/>status = insufficient<br/>activity = null"]
  B2 -- no --> B4["Base output<br/>status = skipped<br/>activity = null"]

  B4 --> C["climbingPreprocessorStep"]

  C --> C1["classifyActivity(difficultyScales)"]
  C1 --> C2{"Unsupported scales<br/>or bad combination?"}
  C2 -- yes --> C3["Skipped<br/>activity = null or classified activity<br/>reason = unsupported_*"]

  C2 -- no --> C4{"Activity from scales<br/>is Klettern?"}
  C4 -- no --> C5["Skipped<br/>activity = Skitour / Hochtour / Wanderung / etc.<br/>reason = non_climbing_activity"]

  C4 -- yes --> C6["Call climbing-preprocessor-agent<br/>title + description + canton + difficulty values"]

  C6 --> C7{"Agent returns<br/>activity = Wanderung?"}
  C7 -- yes --> C8["Skipped<br/>activity = Wanderung<br/>subActivity = null<br/>no route/summit extraction"]

  C7 -- no --> C9{"Agent returns<br/>subActivity?"}
  C9 -- null --> C10["Skipped<br/>activity = Klettern<br/>reason = no_climbing_preprocessor_agent_match"]

  C9 -- Klettergarten --> C11["Ready<br/>activity = Klettern<br/>subActivity = Klettergarten<br/>climbingGardenBase.name"]
  C9 -- Klettertour --> C12["Ready<br/>activity = Klettern<br/>subActivity = Klettertour<br/>climbingTourBase.routeName + summit"]

  C11 --> D["climbingExtractionStep"]
  C12 --> D
  C3 --> D
  C5 --> D
  C8 --> D
  C10 --> D
  B3 --> D

  D --> D1{"status = ready?"}
  D1 -- no --> D2["Return unchanged"]
  D1 -- yes --> D3["Call climbing-extraction-agent"]

  D2 --> E["climbingPostProcessingStep<br/>currently pass-through"]
  D3 --> E

  E --> F["Workflow result"]
```

## Persistence

Persistence happens outside the workflow, in the climbing pipeline service.

```mermaid
flowchart TD
  A["Workflow result"] --> B["upsertReportBase(climbing.base)"]

  B --> C{"base.status = ready?"}

  C -- no --> D["Only report_base_schema is written<br/>No climbing child rows written"]

  C -- yes --> E{"Has climbingTourBase?"}
  E -- yes --> F["upsertClimbingTourBase"]
  E -- no --> G{"Has climbingGardenBase?"}

  F --> G
  G -- yes --> H["upsertClimbingGardenBase"]
  G -- no --> I["Done"]
  H --> I
```

## Hiking Override

When the climbing preprocessor agent decides that hiking outweighs climbing, the climbing preprocessor returns early:

```ts
if (agentOutput.activity === ACTIVITY.HIKING) {
  return buildOutput({
    base: {
      ...base,
      activity: ACTIVITY.HIKING,
      status: PREPROCESSOR_STATUS.SKIPPED,
      subActivity: null,
    },
    reasons: ['non_climbing_activity'],
  });
}
```

The persisted `report_base_schema` row becomes:

```ts
status: 'skipped'
activity: 'Wanderung'
subActivity: null
reasons: ['non_climbing_activity']
```

Because `status !== ready`, the service does not write `climbing_tour_base_schema` or `climbing_garden_base_schema`.
