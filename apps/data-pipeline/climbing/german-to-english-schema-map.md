# German to English Climbing Schema Map

This map documents how the previous flat German Prisma fields map to the new English category schemas in `schema.prisma`.

Reference fields were intentionally removed. Any previous field ending in `Referenz` and any previous database column ending in `_ref` has no new field.

## Model map

| Previous model | New model | Notes |
|---|---|---|
| `HikrReportCategorization` | `ClimbingTourBaseSchema` | Root model for one extracted climbing tour. |

## Root fields

| Previous field | New field | New model |
|---|---|---|
| `postId` | `postId` | `ClimbingTourBaseSchema` |
| `schemaVersion` | `schemaVersion` | `ClimbingTourBaseSchema` |
| `model` | `extractionModel` | `ClimbingTourBaseSchema` |
| `data` | `sourceData` | `ClimbingTourBaseSchema` |
| none | `routeName` | `ClimbingTourBaseSchema` |
| none | `summit` | `ClimbingTourBaseSchema` |
| `createdAt` | `createdAt` | `ClimbingTourBaseSchema` |
| `updatedAt` | `updatedAt` | `ClimbingTourBaseSchema` |

## Category map

| Previous German prefix | New root relation | New category model |
|---|---|---|
| `ausruestung` | `equipment` | `ClimbingTourEquipmentSchema` |
| `zeitbedarf` | `timeRequirement` | `ClimbingTourTimeRequirementSchema` |
| `absicherung` | `protection` | `ClimbingTourProtectionSchema` |
| `schuhwerk` | `footwear` | `ClimbingTourFootwearSchema` |
| `gelaende` | `terrain` | `ClimbingTourTerrainSchema` |
| `klettern` | `climbing` | `ClimbingTourClimbingSchema` |
| `anreise` | `access` | `ClimbingTourAccessSchema` |
| `zustiegAbstieg` | `approachDescent` | `ClimbingTourApproachDescentSchema` |
| `besonderes` | `specialNotes` | `ClimbingTourSpecialNotesSchema` |

## Equipment

| Previous field | New field | New model |
|---|---|---|
| `ausruestungSeilArtWert` | `ropeTypeValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungSeilLaengeMeterWert` | `ropeLengthMetersValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileNoetigWert` | `mobileProtectionRequiredValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileFriendsAnzahlProGroesseWert` | `mobileFriendsCountPerSizeValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileFriendsGroessenWert` | `mobileFriendsSizesValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileKeileAnzahlProGroesseWert` | `mobileNutsCountPerSizeValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileKeileGroessenWert` | `mobileNutsSizesValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileBandschlingenLaengenWert` | `mobileSlingsLengthsValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileBandschlingenAnzahlProLaengeWert` | `mobileSlingsCountPerLengthValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileExpresskarabinerAnzahlWert` | `mobileQuickdrawsCountValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungMobileMoeglichkeitenWert` | `mobileProtectionOptionsValue` | `ClimbingTourEquipmentSchema` |
| `ausruestungZusaetzlicheAusruestungWert` | `additionalEquipmentValue` | `ClimbingTourEquipmentSchema` |

## Time Requirement

| Previous field | New field | New model |
|---|---|---|
| `zeitbedarfReineKletterzeitMinutenWert` | `pureClimbingTimeMinutesValue` | `ClimbingTourTimeRequirementSchema` |
| `zeitbedarfAbstiegMinutenWert` | `descentMinutesValue` | `ClimbingTourTimeRequirementSchema` |
| `zeitbedarfZustiegMinutenWert` | `approachMinutesValue` | `ClimbingTourTimeRequirementSchema` |

## Protection

| Previous field | New field | New model |
|---|---|---|
| `absicherungHakenabstaendeArtWert` | `boltSpacingTypeValue` | `ClimbingTourProtectionSchema` |
| `absicherungStaendeWert` | `belayStationsValue` | `ClimbingTourProtectionSchema` |
| `absicherungHakenzustandArtWert` | `boltConditionTypeValue` | `ClimbingTourProtectionSchema` |
| `absicherungHakenzustandBeschreibungWert` | `boltConditionDescriptionValue` | `ClimbingTourProtectionSchema` |

## Footwear

| Previous field | New field | New model |
|---|---|---|
| `schuhwerkZustiegTypWert` | `approachFootwearTypeValue` | `ClimbingTourFootwearSchema` |
| `schuhwerkKletternTypWert` | `climbingFootwearTypeValue` | `ClimbingTourFootwearSchema` |
| `schuhwerkAbstiegTypWert` | `descentFootwearTypeValue` | `ClimbingTourFootwearSchema` |

## Terrain

| Previous field | New field | New model |
|---|---|---|
| `gelaendeCharakterRoutenArtWert` | `routeTypeValue` | `ClimbingTourTerrainSchema` |
| `gelaendeCharakterKlettergartenWert` | `climbingGardenValue` | `ClimbingTourTerrainSchema` |
| `gelaendeCharakterExpositionWert` | `exposureValue` | `ClimbingTourTerrainSchema` |
| `gelaendeCharakterSonneWert` | `sunValue` | `ClimbingTourTerrainSchema` |
| `gelaendeCharakterSchnellTrocknendWert` | `driesQuicklyValue` | `ClimbingTourTerrainSchema` |
| `gelaendeCharakterFelsWert` | `rockTypeValue` | `ClimbingTourTerrainSchema` |
| `gelaendeGefahren` | `hazards` | `ClimbingTourTerrainSchema` |

## Climbing

| Previous field | New field | New model |
|---|---|---|
| `kletternSchluesselstelleVorhandenWert` | `cruxPresentValue` | `ClimbingTourClimbingSchema` |
| `kletternSchluesselstelleWoWert` | `cruxLocationValue` | `ClimbingTourClimbingSchema` |
| `kletternSchluesselstelleAnspruchWert` | `cruxDifficultyValue` | `ClimbingTourClimbingSchema` |
| `kletternKletterschwierigkeitVerhaeltnisWert` | `climbingDifficultyRelationValue` | `ClimbingTourClimbingSchema` |
| `kletternKletterschwierigkeitBegruendungWert` | `climbingDifficultyReasonValue` | `ClimbingTourClimbingSchema` |
| `kletternAbseilenMoeglichWert` | `rappellingPossibleValue` | `ClimbingTourClimbingSchema` |
| `kletternAbseilenAnzahlWert` | `rappelCountValue` | `ClimbingTourClimbingSchema` |
| `kletternAbseilenAbseillaengenWert` | `rappelLengthsValue` | `ClimbingTourClimbingSchema` |
| `kletternAbseilenZumEinstiegWert` | `rappelToStartValue` | `ClimbingTourClimbingSchema` |
| `kletternAbseilenAbseilpisteWert` | `rappelRouteValue` | `ClimbingTourClimbingSchema` |
| `kletternCharakterKletterstilWert` | `climbingStyleValue` | `ClimbingTourClimbingSchema` |
| `kletternRoutenverlaufRoutenfindungWert` | `routeFindingValue` | `ClimbingTourClimbingSchema` |
| `kletternRoutenverlaufRoutenfindungBeschreibungWert` | `routeFindingDescriptionValue` | `ClimbingTourClimbingSchema` |
| `kletternRoutenverlaufAusstiegsmoeglichkeitenWert` | `exitOptionsValue` | `ClimbingTourClimbingSchema` |
| `kletternRoutenverlaufAusstiegsBeschreibungWert` | `exitDescriptionValue` | `ClimbingTourClimbingSchema` |
| `kletternSeillaengenVerbindungMoeglichWert` | `pitchLinkingPossibleValue` | `ClimbingTourClimbingSchema` |
| `kletternSeillaengenVerbindungBeschreibungWert` | `pitchLinkingDescriptionValue` | `ClimbingTourClimbingSchema` |
| `kletternSeillaengenbeschreibung` | `pitchDescription` | `ClimbingTourClimbingSchema` |

## Access

| Previous field | New field | New model |
|---|---|---|
| `anreiseParkplaetzeWoWert` | `parkingLocationValue` | `ClimbingTourAccessSchema` |
| `anreiseParkplaetzeKostenWert` | `parkingCostsValue` | `ClimbingTourAccessSchema` |
| `anreiseParkplaetzeBesonderheitWert` | `parkingSpecialFeaturesValue` | `ClimbingTourAccessSchema` |
| `anreiseOeffentlicherVerkehrTypWert` | `publicTransportTypeValue` | `ClimbingTourAccessSchema` |
| `anreiseOeffentlicherVerkehrStationWert` | `publicTransportStationValue` | `ClimbingTourAccessSchema` |
| `anreiseOeffentlicherVerkehrLuftseilbahnWert` | `publicTransportCableCarValue` | `ClimbingTourAccessSchema` |
| `anreiseOeffentlicherVerkehrAnmeldungWert` | `publicTransportRegistrationValue` | `ClimbingTourAccessSchema` |

## Approach Descent

| Previous field | New field | New model |
|---|---|---|
| `zustiegAbstiegAbstiegGipfelhoeheMeterWert` | `descentSummitElevationMetersValue` | `ClimbingTourApproachDescentSchema` |
| `zustiegAbstiegAbstiegGleichEinstiegWert` | `descentSameAsApproachValue` | `ClimbingTourApproachDescentSchema` |
| `zustiegAbstiegAbstiegVerpflegungWert` | `descentRefreshmentValue` | `ClimbingTourApproachDescentSchema` |
| `zustiegAbstiegAbstiegVerpflegungBeschreibungWert` | `descentRefreshmentDescriptionValue` | `ClimbingTourApproachDescentSchema` |
| `zustiegAbstiegAbstiegSchwierigkeitWert` | `descentDifficultyValue` | `ClimbingTourApproachDescentSchema` |
| `zustiegAbstiegZustiegAusgangshoeheMeterWert` | `approachStartElevationMetersValue` | `ClimbingTourApproachDescentSchema` |
| `zustiegAbstiegZustiegEinstiegsfindungWert` | `approachRouteFindingValue` | `ClimbingTourApproachDescentSchema` |
| `zustiegAbstiegZustiegBeschreibungWert` | `approachDescriptionValue` | `ClimbingTourApproachDescentSchema` |
| `zustiegAbstiegZustiegSchwierigkeitWert` | `approachDifficultyValue` | `ClimbingTourApproachDescentSchema` |

## Special Notes

| Previous field | New field | New model |
|---|---|---|
| `besonderesSaisonalitaetWert` | `seasonalityValue` | `ClimbingTourSpecialNotesSchema` |

## Relation fields

These fields are new structural fields and do not have a previous German equivalent.

| New field | New model | Purpose |
|---|---|---|
| `baseId` | all category models | Primary key and foreign key back to `ClimbingTourBaseSchema.postId`. |
| `base` | all category models | Prisma relation back to `ClimbingTourBaseSchema`. |
| `equipment` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourEquipmentSchema`. |
| `timeRequirement` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourTimeRequirementSchema`. |
| `protection` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourProtectionSchema`. |
| `footwear` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourFootwearSchema`. |
| `terrain` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourTerrainSchema`. |
| `climbing` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourClimbingSchema`. |
| `access` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourAccessSchema`. |
| `approachDescent` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourApproachDescentSchema`. |
| `specialNotes` | `ClimbingTourBaseSchema` | One-to-one relation to `ClimbingTourSpecialNotesSchema`. |
