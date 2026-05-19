# Prompt-Design

Ziel: Aus Tourenberichten strukturierte Attribute fuer alpine Klettertouren extrahieren. Die Ausgabe soll maschinenlesbar sein.

## Globale Regeln

- Jedes Blattattribut wird direkt als Wert ausgegeben.
- Wenn ein Wert nicht explizit erwaehnt wird, ist der Wert `null`.
- Bei Array-Feldern ist der leere Wert `[]` statt `null`.
- Nicht raten. Nur offensichtliche Normalisierungen sind erlaubt, z. B. `1 h 30` zu `90` Minuten.
- Bei widerspruechlichen Angaben die spezifischere oder aktuellere Textstelle bevorzugen. Wenn der Konflikt nicht aufloesbar ist, `null` ausgeben.
- Zahlen werden ohne Einheit gespeichert; die Einheit steht im Feldnamen, z. B. `laenge_m`, `dauer_min`.
- Ja/Nein-Felder verwenden `true`, `false` oder `null`.
- Enum-Werte werden kleingeschrieben.
- Arrays enthalten deduplizierte Werte.
- Der Abstieg beginnt ab Erreichen des Gipfels oder Routenausstiegs.

## Ausgabeformat

Die Tabellen unten beschreiben die erwarteten Blattattribute und deren direkte JSON-Werte.

```json
{
  "ausruestung": {},
  "zeitbedarf": {},
  "absicherung": {},
  "schuhwerk": {},
  "gelaende_und_gefahren": {},
  "klettern": {},
  "anreise": {},
  "zustieg_und_abstieg": {},
  "besonderes": {}
}
```

## Ausruestung


| Feld                                            | Typ / Werte                                                                | Beschreibung                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `ausruestung.seil.art`                          | `"halbseil", "zwillingsseil", "einfachseil", null`                         | Genannter Seiltyp.                                                        |
| `ausruestung.seil.laenge_m`                     | `number, null`                                                             | Laenge des mitgenommenen Seils in Metern.                                 |
| `ausruestung.mobile_absicherung.erforderlich`   | `true, false, null`                                                        | Ob mobile Absicherung notwendig ist.                                      |
| `ausruestung.mobile_absicherung.empfohlen`      | `true, false, null`                                                        | Ob mobile Absicherung empfohlen wird, obwohl die Route z. B. gebohrt ist. |
| `ausruestung.mobile_absicherung.verwendet`      | `true, false, null`                                                        | Ob im Bericht tatsaechlich mobil abgesichert wurde.                       |
| `ausruestung.mobile_absicherung.moeglichkeiten` | `string, null`                                                             | Wie gut und wie oft mobil abgesichert werden kann.                        |
| `ausruestung.mobile_absicherung.friends`        | `array<{ groesse: string/null, anzahl: number/null }>`                     | Mitgenommene Friends/Cams nach Groesse und Anzahl.                        |
| `ausruestung.mobile_absicherung.keile`          | `array<{ groesse: string/null, anzahl: number/null }>`                     | Mitgenommene Keile/Nuts nach Groesse und Anzahl.                          |
| `ausruestung.schlingen`                         | `array<{ typ: string/null, laenge_cm: number/null, anzahl: number/null }>` | Bandschlingen, Zackenschlingen oder andere Schlingen.                     |
| `ausruestung.expresskarabiner.anzahl`           | `number, null`                                                             | Anzahl mitgenommener Expresskarabiner.                                    |
| `ausruestung.zusaetzlich`                       | `string[]`                                                                 | Weitere ausdruecklich genannte Ausruestung.                               |


## Zeitbedarf


| Feld                               | Typ / Werte    | Beschreibung                                            |
| ---------------------------------- | -------------- | ------------------------------------------------------- |
| `zeitbedarf.zustieg_min`           | `number, null` | Dauer des Zustiegs in Minuten.                          |
| `zeitbedarf.reine_kletterzeit_min` | `number, null` | Reine Kletterzeit in Minuten, ohne Zustieg und Abstieg. |
| `zeitbedarf.abstieg_min`           | `number, null` | Dauer des Abstiegs in Minuten.                          |


## Absicherung


| Feld                                      | Typ / Werte                                     | Beschreibung                                                                                                      |
| ----------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `absicherung.hakenabstaende.bewertung`    | `"sehr_gut", "gut", "mittel", "schlecht", null` | Bewertung der Hakenabstaende im Vergleich zur Erwartung. Nur ausfuellen, wenn Haken vorhanden oder erwaehnt sind. |
| `absicherung.hakenabstaende.beschreibung` | `string, null`                                  | Begruendung oder Details zu den Hakenabstaenden.                                                                  |
| `absicherung.staende.gebohrt`             | `true, false, null`                             | Ob die Staende gebohrt/eingerichtet sind.                                                                         |
| `absicherung.staende.beschreibung`        | `string, null`                                  | Details zu Standplaetzen, z. B. Zustand, Material, Zuverlaessigkeit.                                              |
| `absicherung.hakenzustand.bewertung`      | `"gut", "mittel", "schlecht", null`             | Zustand der vorhandenen Haken.                                                                                    |
| `absicherung.hakenzustand.beschreibung`   | `string, null`                                  | Hinweise wie rostig, alt, Klebehaken, Bohrhaken, saniert.                                                         |


## Schuhwerk


| Feld                     | Typ / Werte                                             | Beschreibung                         |
| ------------------------ | ------------------------------------------------------- | ------------------------------------ |
| `schuhwerk.zustieg.typ`  | `"bergschuhe", "zustiegsschuhe", "turnschuhe", null`    | Schuhwerk fuer den Zustieg.          |
| `schuhwerk.klettern.typ` | `"kletterschuhe", "bergschuhe", "zustiegsschuhe", null` | Schuhwerk waehrend der Kletterroute. |
| `schuhwerk.abstieg.typ`  | `"bergschuhe", "zustiegsschuhe", "turnschuhe", null`    | Schuhwerk fuer den Abstieg.          |


## Gelaende und Gefahren


| Feld                                                | Typ / Werte                                         | Beschreibung                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `gelaende_und_gefahren.charakter.exposition`        | `string, null`                                      | Exposition der Route oder Wand, z. B. `SO`, `SW`, `N`.                                                            |
| `gelaende_und_gefahren.charakter.sonnig`            | `true, false, null`                                 | Ob eine sonnige Lage explizit erwaehnt wird.                                                                      |
| `gelaende_und_gefahren.charakter.schnell_trocknend` | `true, false, null`                                 | Ob der Fels nach Naesse schnell trocknet.                                                                         |
| `gelaende_und_gefahren.charakter.felsart`           | `"granit", "gneis", "kalk", "dolomit", "sandstein", "quarzit", "schiefer", "konglomerat", "nagelfluh", "serpentinit", "basalt", null` | Felsart. |
| `gelaende_und_gefahren.gefahren`                    | `array<{ typ: string, beschreibung: string/null }>` | Genannte Gefahren beim Zustieg, Klettern oder Abstieg, z. B. bruechiger Fels, Steinschlag, Gras, Nasse, Verhauer. |


## Klettern


| Feld                                           | Typ / Werte                                                                                                                                   | Beschreibung                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `klettern.schluesselstellen.vorhanden`         | `true, false, null`                                                                                                                           | Ob mindestens eine Schluesselstelle erwaehnt wird.                                     |
| `klettern.schluesselstellen.stellen`           | `array<{ wo: string/null, beschreibung: string/null }>`                                                                                       | Position und Beschreibung der Schluesselstellen.                                       |
| `klettern.schwierigkeit.verhaeltnis`           | `"leichter", "wie_bewertet", "schwerer", null`                                                                                                | Eindruck der Schwierigkeit im Vergleich zur offiziellen Bewertung.                     |
| `klettern.schwierigkeit.beschreibung`          | `string, null`                                                                                                                                | Begruendung des Schwierigkeitseindrucks.                                               |
| `klettern.abseilen.moeglich`                   | `true, false, null`                                                                                                                           | Ob Abseilen als Abstiegs- oder Rueckzugsmoeglichkeit erwaehnt wird.                    |
| `klettern.abseilen.anzahl`                     | `number, null`                                                                                                                                | Anzahl der notwendigen oder beschriebenen Abseilvorgaenge.                             |
| `klettern.abseilen.laengen_m`                  | `number[]`                                                                                                                                    | Einzelne Abseillaengen in Metern.                                                      |
| `klettern.abseilen.zum_einstieg`               | `true, false, null`                                                                                                                           | Ob direkt zum Einstieg abgeseilt werden kann.                                          |
| `klettern.abseilen.abseilpiste`                | `true, false, null`                                                                                                                           | Ob eine Abseilpiste existiert.                                                         |
| `klettern.charakter.kletterstil`               | `array<"platte", "riss", "grat", "kante", "wand", "verschneidung", "ueberhang", "dach", "pfeiler", "kamin">`                             | Kletterstil.                                                                          |
| `klettern.routenverlauf.routenfindung`         | `"einfach", "mittel", "schwierig", null`                                                                                                      | Schwierigkeit der Routenfindung.                                                       |
| `klettern.routenverlauf.beschreibung`          | `string, null`                                                                                                                                | Hinweise zum Verlauf, Orientierung und moeglichen Verhauern.                           |
| `klettern.routenverlauf.rueckzug_moeglich`     | `true, false, null`                                                                                                                           | Ob Rueckzug oder Fluchtmoeglichkeiten auf der Route erwaehnt werden.                   |
| `klettern.routenverlauf.rueckzug_beschreibung` | `string, null`                                                                                                                                | Wo und wie ein Rueckzug moeglich ist.                                                  |
| `klettern.seillaengen_verbinden.moeglich`      | `true, false, null`                                                                                                                           | Ob Seillaengen verbunden werden koennen.                                               |
| `klettern.seillaengen_verbinden.beschreibung`  | `string, null`                                                                                                                                | Welche Seillaengen verbunden werden koennen und unter welchen Bedingungen.             |
| `klettern.seillaengen`                         | `array<{ nummer: number/null, schwierigkeit: string/null, anzahl_bohrhaken: number/null, laenge_m: number/null, beschreibung: string/null }>` | Strukturierte Beschreibung einzelner Seillaengen.                                      |


## Anreise


| Feld                                | Typ / Werte         | Beschreibung                                                   |
| ----------------------------------- | ------------------- | -------------------------------------------------------------- |
| `anreise.parkplatz.ort`             | `string, null`      | Ort oder Name des Parkplatzes.                                 |
| `anreise.parkplatz.kosten`          | `string, null`      | Kosten oder Hinweis auf Gebuehrenpflicht.                      |
| `anreise.parkplatz.besonderheiten`  | `string, null`      | Hinweise wie wenige Plaetze, enger Parkplatz, frueh voll.      |
| `anreise.oev.verkehrsmittel`        | `string[]`          | Genannte Verkehrsmittel, z. B. Zug, Bus, Rufbus, Luftseilbahn. |
| `anreise.oev.endstation`            | `string, null`      | Haltestelle oder Station fuer den Tourenausgangspunkt.         |
| `anreise.oev.luftseilbahn_moeglich` | `true, false, null` | Ob eine Luftseilbahn genutzt werden kann.                      |
| `anreise.oev.anmeldung_noetig`      | `true, false, null` | Ob eine Anmeldung oder Reservation noetig ist.                 |


## Zustieg und Abstieg


| Feld                                                   | Typ / Werte                           | Beschreibung                                                                                      |
| ------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `zustieg_und_abstieg.zustieg.einstiegsfindung`         | `"einfach", "mittel", "schwer", null` | Schwierigkeit, den Einstieg zu finden.                                                            |
| `zustieg_und_abstieg.zustieg.beschreibung`             | `string, null`                        | Wo sich der Einstieg befindet und wie er gefunden wird.                                           |
| `zustieg_und_abstieg.zustieg.schwierigkeit`            | `string, null`                        | Technische oder alpine Schwierigkeit des Zustiegs.                                                |
| `zustieg_und_abstieg.abstieg.fuehrt_zum_einstieg`      | `true, false, null`                   | Ob der Abstieg wieder am Einstieg vorbeifuehrt.                                                   |
| `zustieg_und_abstieg.abstieg.verpflegung_moeglich`     | `true, false, null`                   | Ob man an einer Huette, einem Restaurant oder einer anderen Verpflegungsmoeglichkeit vorbeikommt. |
| `zustieg_und_abstieg.abstieg.verpflegung_beschreibung` | `string, null`                        | Name oder Ort der Verpflegungsmoeglichkeit.                                                       |
| `zustieg_und_abstieg.abstieg.schwierigkeit`            | `string, null`                        | Schwierigkeit des Abstiegs und konkrete Herausforderungen.                                        |


## Besonderes


| Feld                       | Typ / Werte    | Beschreibung                                                                                                        |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `besonderes.saisonalitaet` | `string, null` | Hinweise auf besonders geeignete oder ungeeignete Jahreszeiten, z. B. Fruehling, Herbst, Winter, nach Regen meiden. |
| `besonderes.hinweise`      | `string[]`     | Sonstige relevante Hinweise, die in keine andere Kategorie passen.                                                  |


## Beispiel

```json
{
  "zeitbedarf": {
    "zustieg_min": 45
  },
  "klettern": {
    "abseilen": {
      "moeglich": true
    }
  }
}
```
