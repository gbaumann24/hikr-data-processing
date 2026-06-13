import { describe, expect, test } from 'bun:test';
import {
  HIKR_DIFFICULTY_SCALE,
  MIN_DESCRIPTION_LENGTH,
  PREPROCESSOR_STATUS,
  prepareBaseLayer,
  type HikrOrgPostBaseLayerInput,
} from '../src/mastra/workflows/baselayer';

const longDescription = 'Baselayer Bericht '.repeat(150);
const chliBielenhornClassicReportDescription =
  'Region:World » Switzerland » Uri Date of the hike:27 July 2021 Hiking grading:T4 High level Alpine hike Climbing grading:IV (UIAA Grading System) Waypoints: Furkapass Hotel Furkablick 2427 m 7961 ft. (78) Sidelenhütte 2708 m 8882 ft. (148) Nixen 2849 m 9345 ft. (7) Schildkrötengrat 2888 m 9473 ft. (4) Chli Bielenhorn 2940 m 9643 ft. (98) Untere Bielenlücke 2893 m 9489 ft. (63) Geo Tags: CH UR Time:1 days Anche queste "classica" era un po\' che mi ronzava nel cervello. Me né parlo per la prima volta il fisioterapista mentre mi torturava qualche anno fa... Il tempo purtroppo non è dei migliori e così per evitare le gocce d\'acqua del pomeriggio partiamo di buon ora facendoci tutta la Surselva e i due passi. Alle 8.30 siamo già alla capanna dove ci scaldiamo con un caffè. È frescolino ma non terribile. Mentre risaliamo il nevaio vediamo all\'attacco della cresta altri scalatori. Purtroppo per noi sono tre cordate germaniche alle prime armi che per pochi minuti non riusciamo a superare. La roccia è un po\' umida ma poi avanzando diventa sempre meglio. Mentre aspettiamo che i ragazzi davanti a noi superano il primo tiro decidiamo di fare la punta Nixen di cui avevo visto il topo poco prima in capanna. È una bella torre con una cima piatta. Si sale dall\'intaglio con l\'aiuto di alcune lame e grazie a delle buone maniglie. Poco sotto la cima c\'è un terrazzino attrezzato per una doppia piuttosta esposta ma molto power di circa 24 m. Ripresa la cresta si alza anche un po\' il vento. Vane si maledirà tutto il giorno per aver dimenticato gli scarponi sulla soglia di casa ma per fortuna ha con se le pedule d\'arrampicata. Fa fresco, spesso siamo fermi nelle soste ad aspettare quelli davanti a noi. Volendo protremmo uscire sulla sinistra con una calata o due ma la cresta è bella e vogliamo farla tutta. Gli ultimi tiri sono più facili e quindi di procede un po\' più veloci. Una volta in cima ci concediamo un meritato pranzo. Ci piacerebbe fare anche il cammello ma il cielo non ispira molto. Vabbè sarà per la prossima. Hasta luego.';

function baseInput(
  overrides: Partial<HikrOrgPostBaseLayerInput> = {},
): HikrOrgPostBaseLayerInput {
  return {
    id: 42n,
    title: null,
    regionPathCsv: 'Welt, Schweiz, Obwalden, Melchtal',
    tourDate: null,
    description: longDescription,
    reportWaypoints: [],
    hikingDifficulty: null,
    alpineTourDifficulty: null,
    climbingDifficulty: null,
    snowshoeTourDifficulty: null,
    viaFerrataDifficulty: null,
    skiDifficulty: null,
    iceClimbingDifficulty: null,
    mountainBikeDifficulty: null,
    ...overrides,
  };
}

function climbingGrade(climbingDifficulty: string | null): string | undefined {
  return prepareBaseLayer(baseInput({ climbingDifficulty })).difficultyScales.valuesByScale[
    HIKR_DIFFICULTY_SCALE.CLIMBING
  ];
}

describe('baselayer preprocessor', () => {
  test('converts UIAA climbing grades to French grades', () => {
    expect(climbingGrade('III (UIAA-Skala)')).toBe('3');
    expect(climbingGrade('V (UIAA-Skala)')).toBe('4c');
    expect(climbingGrade('VI+ (UIAA-Skala)')).toBe('6a');
    expect(climbingGrade('XI+ (UIAA-Skala)')).toBe('9a+');
    expect(climbingGrade('vi')).toBe('5c');
  });

  test('keeps existing French climbing grades unchanged', () => {
    expect(climbingGrade('5a')).toBe('5a');
    expect(climbingGrade('6b+')).toBe('6b+');
  });

  test('does not convert UIAA-like values on non-climbing scales', () => {
    const result = prepareBaseLayer(
      baseInput({
        alpineTourDifficulty: 'VI+',
        climbingDifficulty: null,
      }),
    );

    expect(result.difficultyScales.valuesByScale[HIKR_DIFFICULTY_SCALE.ALPINE_TOUR]).toBe('VI+');
  });

  test('requires descriptions longer than the short Chli Bielenhorn classic report', () => {
    const result = prepareBaseLayer(
      baseInput({
        description: chliBielenhornClassicReportDescription,
      }),
    );

    expect(chliBielenhornClassicReportDescription.length).toBe(2044);
    expect(MIN_DESCRIPTION_LENGTH).toBeGreaterThan(chliBielenhornClassicReportDescription.length);
    expect(result.base.status).toBe(PREPROCESSOR_STATUS.INSUFFICIENT);
    expect(result.reasons).toContain('description_too_short');
  });
});
