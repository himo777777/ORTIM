import { PrismaClient } from '@prisma/client';
import { UserRole, BloomLevel } from '../src/types/prisma-types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { personnummer: '199001011234' },
    update: {},
    create: {
      personnummer: '199001011234',
      firstName: 'Admin',
      lastName: 'Testsson',
      email: 'admin@test.se',
      role: UserRole.ADMIN,
      workplace: 'Karolinska Universitetssjukhuset',
      speciality: 'Ortopedi',
    },
  });

  const instructorUser = await prisma.user.upsert({
    where: { personnummer: '198505152345' },
    update: {},
    create: {
      personnummer: '198505152345',
      firstName: 'Karin',
      lastName: 'Utbildare',
      email: 'karin.utbildare@test.se',
      role: UserRole.INSTRUCTOR,
      workplace: 'Sahlgrenska Universitetssjukhuset',
      speciality: 'Traumakirurgi',
    },
  });

  const participantUser = await prisma.user.upsert({
    where: { personnummer: '199203203456' },
    update: {},
    create: {
      personnummer: '199203203456',
      firstName: 'Erik',
      lastName: 'Deltagare',
      email: 'erik.deltagare@test.se',
      role: UserRole.PARTICIPANT,
      workplace: 'Akademiska sjukhuset',
      speciality: 'Akutsjukvård',
    },
  });

  console.log('✅ Users created');

  // Create course
  const course = await prisma.course.upsert({
    where: { code: 'B-ORTIM-2025' },
    update: {},
    create: {
      code: 'B-ORTIM-2025',
      name: 'B-ORTIM',
      fullName: 'Basic Orthopaedic Resuscitation and Trauma Initial Management',
      version: '1.0',
      description: 'Certifieringskurs för läkare inom ortopedisk traumavård. Fokus på tidskritiska tillstånd: massiv blödning, kärlskador, kompartmentsyndrom och öppna frakturer.',
      estimatedHours: 16,
      passingScore: 70,
      isActive: true,
    },
  });

  console.log('✅ Course created');

  // Create course parts
  const parts = [
    { partNumber: 1, title: 'Principer och systematik', description: 'Grundläggande principer för ortopedisk traumavård', sortOrder: 1 },
    { partNumber: 2, title: 'Specifika tillstånd', description: 'Detaljerad genomgång av tidskritiska ortopediska tillstånd', sortOrder: 2 },
    { partNumber: 3, title: 'Praktisk tillämpning', description: 'Klinisk tillämpning och examination', sortOrder: 3 },
  ];

  const createdParts = [];
  for (const part of parts) {
    const created = await prisma.coursePart.upsert({
      where: { courseId_partNumber: { courseId: course.id, partNumber: part.partNumber } },
      update: {},
      create: { ...part, courseId: course.id },
    });
    createdParts.push(created);
  }

  console.log('✅ Course parts created');

  // Create chapters
  const chapters = [
    // Part 1: Principer och systematik
    { partIndex: 0, chapterNumber: 1, title: 'Introduktion – Varför B-ORTIM?', slug: 'introduktion', estimatedMinutes: 20, content: getChapterContent(1) },
    { partIndex: 0, chapterNumber: 2, title: 'Den ortopediska primärundersökningen', slug: 'primarundersokning', estimatedMinutes: 30, content: getChapterContent(2) },
    { partIndex: 0, chapterNumber: 3, title: 'Extremitetsskador och prioritering', slug: 'prioritering', estimatedMinutes: 25, content: getChapterContent(3) },

    // Part 2: Specifika tillstånd
    { partIndex: 1, chapterNumber: 4, title: 'Massiv blödning från extremitet', slug: 'massiv-blodning', estimatedMinutes: 35, content: getChapterContent(4) },
    { partIndex: 1, chapterNumber: 5, title: 'Arteriella kärlskador', slug: 'karlskador', estimatedMinutes: 40, content: getChapterContent(5) },
    { partIndex: 1, chapterNumber: 6, title: 'Kompartmentsyndrom', slug: 'kompartmentsyndrom', estimatedMinutes: 45, content: getChapterContent(6) },
    { partIndex: 1, chapterNumber: 7, title: 'Öppna frakturer', slug: 'oppna-frakturer', estimatedMinutes: 40, content: getChapterContent(7) },
    { partIndex: 1, chapterNumber: 8, title: 'Bäckenringskador', slug: 'backenringskador', estimatedMinutes: 35, content: getChapterContent(8) },
    { partIndex: 1, chapterNumber: 9, title: 'Amputationsskador', slug: 'amputationer', estimatedMinutes: 30, content: getChapterContent(9) },
    { partIndex: 1, chapterNumber: 10, title: 'Extremitetstrauma hos barn', slug: 'barn', estimatedMinutes: 30, content: getChapterContent(10) },
    { partIndex: 1, chapterNumber: 11, title: 'Crush syndrome', slug: 'crush-syndrome', estimatedMinutes: 25, content: getChapterContent(11) },
    { partIndex: 1, chapterNumber: 12, title: 'Speciella populationer', slug: 'speciella-populationer', estimatedMinutes: 25, content: getChapterContent(12) },

    // Part 3: Praktisk tillämpning
    { partIndex: 2, chapterNumber: 13, title: 'Damage Control Orthopaedics', slug: 'damage-control', estimatedMinutes: 35, content: getChapterContent(13) },
    { partIndex: 2, chapterNumber: 14, title: 'Transport och överflyttning', slug: 'transport', estimatedMinutes: 25, content: getChapterContent(14) },
    { partIndex: 2, chapterNumber: 15, title: 'Dokumentation och juridik', slug: 'dokumentation', estimatedMinutes: 20, content: getChapterContent(15) },
    { partIndex: 2, chapterNumber: 16, title: 'Teamarbete och kommunikation', slug: 'teamarbete', estimatedMinutes: 25, content: getChapterContent(16) },
    { partIndex: 2, chapterNumber: 17, title: 'Fallbaserad examination', slug: 'examination', estimatedMinutes: 30, content: getChapterContent(17) },
  ];

  const createdChapters = [];
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]!;
    const part = createdParts[chapter.partIndex]!;
    const created = await prisma.chapter.upsert({
      where: { slug: chapter.slug },
      update: {},
      create: {
        partId: part.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        slug: chapter.slug,
        content: chapter.content,
        estimatedMinutes: chapter.estimatedMinutes,
        sortOrder: i + 1,
        isActive: true,
      },
    });
    createdChapters.push(created);
  }

  console.log('✅ Chapters created');

  // Create algorithms
  const algorithms = [
    { code: 'LIMB', title: 'LIMB-algoritmen', description: 'Systematisk bedömning av extremitetsskador', svg: getLIMBAlgorithmSVG() },
    { code: 'ABI-FLOW', title: 'ABI-flödesschema', description: 'Beslutsstöd för ankel-brachialindex', svg: getABIFlowSVG() },
    { code: 'COMPARTMENT', title: 'Kompartmentsyndrom', description: 'Diagnos och behandling av kompartmentsyndrom', svg: getCompartmentSVG() },
    { code: 'OPEN-FX', title: 'Öppna frakturer', description: 'Gustilo-Anderson klassifikation och handläggning', svg: getOpenFractureSVG() },
    { code: 'PELVIC', title: 'Bäckenringskador', description: 'Klassifikation och initial handläggning', svg: getPelvicSVG() },
    { code: 'DCO', title: 'DCO-beslutsträd', description: 'Damage Control Orthopaedics beslutsstöd', svg: getDCOSVG() },
  ];

  for (const algo of algorithms) {
    await prisma.algorithm.upsert({
      where: { code: algo.code },
      update: {},
      create: {
        code: algo.code,
        title: algo.title,
        description: algo.description,
        svgContent: algo.svg,
        isActive: true,
      },
    });
  }

  console.log('✅ Algorithms created');

  // Create quiz questions
  const questions = getQuizQuestions();
  for (const q of questions) {
    const chapter = createdChapters.find(c => c.chapterNumber === q.chapterNumber);

    await prisma.quizQuestion.upsert({
      where: { questionCode: q.code },
      update: {},
      create: {
        chapterId: chapter?.id,
        questionCode: q.code,
        bloomLevel: q.bloomLevel as BloomLevel,
        questionText: q.question,
        explanation: q.explanation,
        reference: q.reference,
        isActive: true,
        isExamQuestion: true,
        options: {
          create: q.options.map((opt, idx) => ({
            optionLabel: String.fromCharCode(65 + idx), // A, B, C, D, E
            optionText: opt.text,
            isCorrect: opt.correct,
            sortOrder: idx + 1,
          })),
        },
      },
    });
  }

  console.log('✅ Quiz questions created');

  // Create a cohort
  const cohort = await prisma.cohort.upsert({
    where: { id: 'test-cohort-1' },
    update: {},
    create: {
      id: 'test-cohort-1',
      courseId: course.id,
      instructorId: instructorUser.id,
      name: 'VT2025-Stockholm',
      description: 'Vårterminen 2025, Stockholm',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-06-15'),
      maxParticipants: 30,
      isActive: true,
    },
  });

  // Enroll participant
  await prisma.enrollment.upsert({
    where: { userId_cohortId: { userId: participantUser.id, cohortId: cohort.id } },
    update: {},
    create: {
      userId: participantUser.id,
      cohortId: cohort.id,
      status: 'active',
    },
  });

  console.log('✅ Cohort and enrollment created');

  // Create some chapter progress for the participant
  for (let i = 0; i < 5; i++) {
    const chapter = createdChapters[i]!;
    await prisma.chapterProgress.upsert({
      where: { userId_chapterId: { userId: participantUser.id, chapterId: chapter.id } },
      update: {},
      create: {
        userId: participantUser.id,
        chapterId: chapter.id,
        readProgress: i < 4 ? 100 : 45,
        quizPassed: i < 4,
        bestQuizScore: i < 4 ? 80 + Math.random() * 20 : null,
        completedAt: i < 4 ? new Date() : null,
      },
    });
  }

  console.log('✅ Chapter progress created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest accounts:');
  console.log('  Admin: 199001011234');
  console.log('  Instructor: 198505152345');
  console.log('  Participant: 199203203456');
}

// Helper functions for content
function getChapterContent(chapterNumber: number): string {
  const contents: Record<number, string> = {
    1: `# Introduktion – Varför B-ORTIM?

## Bakgrund

Extremitetstrauma utgör en betydande del av traumavården i Sverige. Varje år behandlas tusentals patienter med allvarliga skador på armar och ben. Dessa skador kan vara livshotande genom massiv blödning, eller leda till permanent funktionsnedsättning om de inte handläggs korrekt.

## Tidskritiska tillstånd

B-ORTIM fokuserar på fyra tidskritiska ortopediska tillstånd:

1. **Massiv blödning** - Kräver omedelbar kontroll
2. **Kärlskador** - "Golden hour" för revaskularisering
3. **Kompartmentsyndrom** - Progressivt tillstånd med kort tidsram
4. **Öppna frakturer** - Infektionsrisk ökar med tid

## Lärandemål

Efter detta kapitel ska du kunna:

- Förklara varför strukturerad handläggning av extremitetstrauma är viktig
- Identifiera de fyra tidskritiska tillstånden
- Förstå konsekvenserna av försenad behandling

## Klinisk relevans

> "Den första timmen är avgörande för patientens långsiktiga utfall vid allvarligt extremitetstrauma."

Studier visar att strukturerad handläggning enligt etablerade protokoll minskar:
- Mortalitet med upp till 20%
- Amputationsfrekvens med 15%
- Komplikationer med 30%
`,
    2: `# Den ortopediska primärundersökningen

## LIMB-protokollet

LIMB är en strukturerad metod för bedömning av extremitetsskador:

- **L** - Look (Inspektion)
- **I** - Ischemia (Cirkulation)
- **M** - Movement (Rörlighet)
- **B** - Bones & soft tissue (Ben och mjukdelar)

## Look - Inspektion

Vid inspektion bedöms:
- Felställning och deformitet
- Svullnad
- Hudskador och sår
- Blödning
- Färgförändringar

## Ischemia - Cirkulation

Cirkulationsbedömning inkluderar:
- Kapillär återfyllnad (< 2 sekunder normalt)
- Perifera pulsar
- Hudfärg och temperatur
- ABI (Ankle-Brachial Index) vid misstanke om kärlskada

## Movement - Rörlighet

Bedöm:
- Aktiv rörlighet
- Passiv rörlighet
- Smärta vid passiv töjning (kompartmenttecken)
- Neurologisk funktion

## Bones & Soft Tissue

Undersök:
- Stabilitet
- Krepitationer
- Mjukdelsskador
- Öppna skador
`,
    3: `# Extremitetsskador och prioritering

## Prioriteringsprinciper

Vid multipla skador måste extremitetsskador prioriteras i relation till:
1. Livshotande skador (ABCDE)
2. Extremitetshotande skador
3. Övriga skador

## Extremitetshotande tillstånd

Dessa tillstånd kräver omedelbar åtgärd:

### Massiv blödning
- Direkt tryck
- Tourniquet vid behov
- Prioritet: OMEDELBAR

### Kärlskada med ischemi
- Tid till revaskularisering kritisk
- Prioritet: < 6 timmar

### Kompartmentsyndrom
- Progressivt tillstånd
- Prioritet: < 6 timmar

### Öppen fraktur
- Infektionsrisk
- Prioritet: < 6-8 timmar

## Dokumentation

Noggrann dokumentation av:
- Tidpunkt för skada
- Tidpunkt för undersökning
- Fynd vid primärundersökning
- Vidtagna åtgärder
`,
    4: `# Massiv blödning från extremitet

## Definition

Massiv blödning definieras som:
- Blödning som hotar livet
- Blodförlust > 1500 ml
- Blödning som kräver blodtransfusion

## Omedelbart omhändertagande

### Steg 1: Direkt tryck
Applicera direkt tryck över blödningskällan med:
- Steril kompress
- Tryckförband
- Manuellt tryck

### Steg 2: Tourniquet

**Indikationer:**
- Direkt tryck otillräckligt
- Multipla blödningskällor
- Behov av fria händer

**Applicering:**
1. Placera 5-7 cm proximalt om skadan
2. Dra åt tills blödning upphör
3. Dokumentera tid för applicering
4. ALDRIG lossa på prehospitalt

### Steg 3: Hemostatika

Vid behov, komplettera med:
- Hemostatisk gas
- Tranexamsyra (TXA)

## Komplikationer

- Nervskada vid långvarig tourniquet
- Reperfusionsskada
- Kompartmentsyndrom
`,
    5: `# Arteriella kärlskador

## Klassifikation

Kärlskador klassificeras enligt:

### Typ av skada
- Kontusion
- Laceration
- Transsektion
- Pseudoaneurysm
- AV-fistel

### Grad av ischemi

| Grad | Kapillär återfyllnad | Motorik | Sensorik |
|------|---------------------|---------|----------|
| I    | Normal              | Normal  | Normal   |
| IIa  | Förlångsammad       | Normal  | Nedsatt  |
| IIb  | Förlångsammad       | Nedsatt | Nedsatt  |
| III  | Utsläckt            | Paralys | Anestesi |

## Diagnostik

### Klinisk undersökning
- Pulsstatus
- Kapillär återfyllnad
- Hudfärg och temperatur
- Expanding hematom

### Ankel-Brachial Index (ABI)
- Normal: 0.9-1.3
- < 0.9: Misstänkt kärlskada
- < 0.5: Allvarlig ischemi

### Bilddiagnostik
- CT-angiografi (förstahandsval)
- Konventionell angiografi

## Behandling

### Tidsgräns
- Varm ischemi: 6 timmar
- Kall ischemi: 12 timmar

### Temporära åtgärder
- Shunting
- Fasciotomi vid behov
`,
    6: `# Kompartmentsyndrom

## Patofysiologi

Kompartmentsyndrom uppstår när trycket i ett slutet muskelkompartment ökar till nivåer som komprometterar vävnadsperfusionen.

## De 6 P:na

Klassiska tecken (i ordning av uppträdande):

1. **Pain** - Smärta oproportionerlig till skadan
2. **Pain on passive stretch** - Smärta vid passiv töjning
3. **Pressure** - Spänt kompartment
4. **Paresthesia** - Stickningar, domningar
5. **Paralysis** - Förlamning (sent tecken)
6. **Pulselessness** - Pulslöshet (mycket sent tecken)

## Diagnostik

### Klinisk bedömning
- Smärta vid passiv töjning är MEST SENSITIVA tecknet
- Spänt, ömt kompartment
- Neurologiska symtom

### Tryckmätning
- Normalt kompartmenttryck: < 10 mmHg
- Delta-tryck (diastoliskt - kompartment):
  - < 30 mmHg indikerar behov av fasciotomi

## Behandling

### Fasciotomi
- Enda definitiva behandlingen
- Utförs akut vid klinisk diagnos
- Alla kompartment måste öppnas
- Såren lämnas öppna

### Underbenet
Fyra kompartment:
1. Anteriort
2. Lateralt
3. Ytligt posteriort
4. Djupt posteriort
`,
    7: `# Öppna frakturer

## Definition

En öppen fraktur föreligger när det finns en kommunikation mellan frakturen och den yttre miljön.

## Gustilo-Anderson klassifikation

### Typ I
- Sår < 1 cm
- Ren skada
- Minimal mjukdelsskada

### Typ II
- Sår 1-10 cm
- Måttlig mjukdelsskada
- Ingen omfattande skada

### Typ III
- Omfattande mjukdelsskada
- Delas in i:

| Subtyp | Beskrivning |
|--------|-------------|
| IIIA   | Adekvat mjukdelstäckning möjlig |
| IIIB   | Kräver mjukdelsrekonstruktion |
| IIIC   | Associerad kärlskada som kräver reparation |

## Initial handläggning

### De första 6 timmarna

1. **Fotodokumentation** av såret
2. **Steril täckning** - Fuktig kompress
3. **Antibiotika** - Inom 1 timme
4. **Tetanusprofylax**
5. **Smärtlindring**
6. **Stabilisering** - Gips eller extern fixation

### Antibiotikaval

| Typ | Antibiotika |
|-----|-------------|
| I-II | Cefuroxim |
| III | Cefuroxim + Aminoglykosid |
| Kontaminerad | + Penicillin (Klostridier) |

## Definitiv behandling

- Sårrevision på operation
- Debridering av devitaliserad vävnad
- Stabilisering av fraktur
- Mjukdelstäckning
`,
    8: `# Bäckenringskador

## Anatomi och biomekanik

Bäckenringen består av:
- Os sacrum
- Två ossa coxae
- Symfysen
- SI-lederna

## Klassifikation (Young-Burgess)

### LC (Lateral Compression)
- Vanligaste typen
- Intern rotation av hemibäckenet
- Låg blödningsrisk

### APC (Anterior-Posterior Compression)
- "Open book" skada
- Extern rotation
- HÖG blödningsrisk

### VS (Vertical Shear)
- Vertikal instabilitet
- Mycket hög blödningsrisk

## Initial handläggning

### Stabilisering
1. **Bäckenbälte** - Appliceras på alla misstänkta bäckenskador
2. Placering: Över trochantrarna
3. Undvik överkompression vid LC-skador

### Blödningskontroll
- Bäckenbälte
- Preperitonal packing vid behov
- Angioembolisering

## Varningssignaler

- Hemodynamisk instabilitet
- Blod vid meatus
- Skrotalhematom
- Proximal femurfraktur
- Neurologiska bortfall
`,
    9: `# Amputationsskador

## Klassifikation

### Total amputation
- Fullständig avskiljning

### Subtotal amputation
- Viss vävnadsbro kvar
- Ofta bättre prognos

## Initial handläggning

### Stumsidan
1. Stoppa blödning (tryck/tourniquet)
2. Steril täckning
3. Elevation

### Amputatet
1. **Skölj** försiktigt med koksalt
2. **Linda in** i fuktig kompress
3. **Placera** i plastpåse
4. **Kyl** - plastpåsen i isbad
5. **ALDRIG** direkt kontakt med is

## Replantationsindikationer

### Absoluta indikationer
- Tumme
- Flera fingrar
- Hand/handled
- Barn (alla nivåer)

### Relativa indikationer
- Enstaka finger (distalt om FDS)
- Proximala amputationer vuxna

### Kontraindikationer
- Multitrauma med instabilitet
- Svår krossamputation
- Lång varm ischemitid
- Allvarlig komorbiditet
`,
    10: `# Extremitetstrauma hos barn

## Särskilda överväganden

### Anatomiska skillnader
- Tillväxtzonerna (fyser) är sårbarare än ligament
- Periost är tjockare och starkare
- Ben är mer porösa och plastiska

### Frakturtyperna
- Greenstick-frakturer
- Buckle-frakturer (torus)
- Fyseolys (Salter-Harris)

## Salter-Harris klassifikation

| Typ | Beskrivning | Prognos |
|-----|-------------|---------|
| I   | Genom fysen | God |
| II  | Genom fys + metafys | God |
| III | Genom fys + epifys | Risk tillväxtrubbning |
| IV  | Genom alla tre | Hög risk |
| V   | Kompression av fysen | Hög risk |

## Handläggning

### Akut
- Immobilisering
- Smärtlindring (ofta underskattat hos barn)
- Cirkulationsbedömning

### Specifika överväganden
- Lägre tröskel för operation vid ledengagemang
- Noggrann uppföljning av fysskador
- Remodelingpotential högre hos yngre barn
`,
    11: `# Crush syndrome

## Definition

Crush syndrome är systemiska manifestationer av muskelskada vid prolongerad kompression, framför allt vid friläggning.

## Patofysiologi

Vid kompression:
1. Muskelischemi → cellskada
2. Frisättning av myoglobin, kalium, fosfat
3. Vid reperfusion → systemisk spridning

## Klinisk bild

### Lokala tecken
- Svullnad
- Smärta
- Paralys
- Pulslöshet

### Systemiska manifestationer
- **Hyperkalemi** - Arytmirisk
- **Myoglobinuri** - Njursvikt
- **Metabol acidos**
- **Hypovolemi**

## Behandling

### Pre-release (INNAN friläggning)
1. IV-access
2. Aggressiv vätskebehandling (1-1.5 L/timme)
3. EKG-övervakning
4. Bikarbonat vid acidos

### Post-release
- Fortsatt vätsketerapi
- Alkalinisering av urin
- Forcerad diures
- Dialysberedskap
- Monitorering av elektrolyter
`,
    12: `# Speciella populationer

## Äldre patienter

### Särskilda överväganden
- Polyfarmaci (antikoagulantia!)
- Nedsatt fysiologisk reserv
- Atypisk presentation
- Underliggande osteoporos

### Handläggning
- Reversering av antikoagulation
- Lägre tröskel för intensivvård
- Tidig mobilisering när möjligt
- Nutrition

## Gravida

### Fysiologiska förändringar
- Ökad blodvolym
- Ökad hjärtminutvolym
- Kompression av vena cava

### Handläggning
- Vänstersidesläge
- Fostret prioriteras genom att behandla modern
- Tetanus säkert
- Röntgen när indicerat (med skydd)

## Immunsupprimerade

### Risker
- Ökad infektionsrisk
- Fördröjd läkning
- Atypiska infektioner

### Handläggning
- Lägre tröskel för antibiotika
- Tätare uppföljning
- Samråd med infektionsspecialist
`,
    13: `# Damage Control Orthopaedics (DCO)

## Princip

DCO innebär temporär stabilisering av frakturer hos fysiologiskt instabila patienter, med definitiv behandling efter stabilisering.

## Indikationer för DCO

### Fysiologiska parametrar
- pH < 7.25
- Temperatur < 35°C
- Koagulopati
- Laktat > 4 mmol/L

### Skadefaktorer
- ISS > 20
- Bilateral femurfraktur
- Multitrauma med thorax/buk-skada
- Svår skallskada

## Damage Control Surgery steg

### Steg 1: Akut fas (0-24h)
- Blödningskontroll
- Extern fixation av frakturer
- Minimal operationstid

### Steg 2: Intensivvård (24-72h)
- Korrigering av:
  - Hypotermi
  - Koagulopati
  - Acidos
- Optimering av fysiologi

### Steg 3: Definitiv kirurgi (>72h)
- Konvertering till intern fixation
- Mjukdelsrekonstruktion
- Sekundära procedurer

## Extern fixation

### Fördelar
- Snabbt
- Minimal blödning
- Möjliggör mjukdelsövervakning
- Kan konverteras senare
`,
    14: `# Transport och överflyttning

## Principer för säker transport

### Före transport
1. **Stabilisering** - Frakturer immobiliserade
2. **Dokumentation** - Komplett överföring
3. **Kommunikation** - Förvarning mottagande enhet
4. **Monitorering** - Plan för övervakning under transport

## Immobilisering

### Frakturimmobilisering
- Immobilisera led ovan och nedan frakturen
- Dokumentera neurovaskulär status före och efter
- Använd rätt storlek

### Specifika hjälpmedel
| Skada | Hjälpmedel |
|-------|------------|
| Halskotpelare | Halskrage + spinalboard |
| Bäcken | Bäckenbälte |
| Lårben | Traktion/Thomas-skena |
| Underben | Gipsskena |

## MIST-rapport

Vid överrapportering:
- **M** - Mechanism (skademekanism)
- **I** - Injuries (skador)
- **S** - Signs (vitalparametrar)
- **T** - Treatment (given behandling)

## Transportprioritering

### Behov av traumacenter
- Multipla frakturer
- Kärlskada
- Öppen fraktur typ III
- Bäckeninstabilitet
`,
    15: `# Dokumentation och juridik

## Dokumentationskrav

### Initial dokumentation
- Tidpunkt för ankomst
- Skademekanism
- Fynd vid undersökning
- Neurovaskulär status
- Given behandling
- Tidpunkter för åtgärder

### Fotografering
- Öppna sår före täckning
- Deformiteter
- Hudstatus

## Juridiska aspekter

### Informerat samtycke
- Patient ska informeras om:
  - Diagnos
  - Behandlingsalternativ
  - Risker och komplikationer
  - Prognos

### Nödsituationer
- Nödrätt vid livs- eller extremitetshotande tillstånd
- Dokumentera att samtycke ej kunde inhämtas

## Kvalitetsregister

### SweTrau
- Nationellt traumaregister
- Rapportering av allvarliga skador

### Kvalitetsindikatorer
- Tid till operation
- Komplikationsfrekvens
- Mortalitet
`,
    16: `# Teamarbete och kommunikation

## Traumateam

### Roller
- **Teamledare** - Överblick, beslut
- **Airway** - Luftväg
- **Circulation** - Cirkulation, IV-access
- **Ortopedi** - Extremitetsbedömning
- **Dokumentatör** - Tidpunkter, åtgärder

## Kommunikation

### Closed-loop kommunikation
1. Teamledare ger order
2. Mottagare bekräftar
3. Utför uppgift
4. Rapporterar genomfört

### SBAR

Vid överrapportering:
- **S** - Situation
- **B** - Background
- **A** - Assessment
- **R** - Recommendation

## CRM-principer

### Crisis Resource Management
- Använd all tillgänglig information
- Fördela uppmärksamhet klokt
- Kommunicera effektivt
- Kalla på hjälp tidigt
- Utnyttja teamets resurser

## Debriefing

### Efter varje fall
- Vad gick bra?
- Vad kan förbättras?
- Handlingsplan för förbättring
`,
    17: `# Fallbaserad examination

## Examinationsformat

B-ORTIM-examinationen består av:
1. Teoretiskt prov (MCQ)
2. Praktiska stationer (OSCE)

### MCQ-prov
- 60 frågor
- 70% för godkänt
- 60 minuter

### OSCE-stationer
1. Tourniquet-applikation
2. ABI-mätning
3. Bäckenbälte
4. Passiv töjningstest
5. LIMB-bedömning
6. SBAR-kommunikation

## Förberedelse

### Teoretisk kunskap
- Läs alla kapitel
- Gör övningsquiz
- Använd spaced repetition

### Praktiska färdigheter
- Öva på docka
- Parträning
- Video-resurser

## Certifiering

### Krav för certifikat
- Godkänd teori (≥70%)
- Godkända OSCE-stationer
- LIPUS-utvärdering genomförd

### Giltighetstid
- Certifikatet gäller i 4 år
- Möjlighet till recertifiering
`,
  };

  return contents[chapterNumber] || `# Kapitel ${chapterNumber}\n\nInnehåll kommer snart...`;
}

function getQuizQuestions() {
  return [
    {
      code: '1.1',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de fyra tidskritiska ortopediska tillstånden som B-ORTIM fokuserar på?',
      options: [
        { text: 'Massiv blödning, kärlskador, kompartmentsyndrom, öppna frakturer', correct: true },
        { text: 'Frakturer, luxationer, ligamentskador, senskador', correct: false },
        { text: 'Ryggmärgsskador, skalltrauma, thoraxskador, buktrauma', correct: false },
        { text: 'Brännskador, köldskador, etsningsskador, tryckskador', correct: false },
      ],
      explanation: 'B-ORTIM fokuserar på fyra tidskritiska tillstånd: massiv blödning, kärlskador (arteriella), kompartmentsyndrom och öppna frakturer.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '2.1',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står akronymen LIMB för i den ortopediska primärundersökningen?',
      options: [
        { text: 'Look, Ischemia, Movement, Bones & soft tissue', correct: true },
        { text: 'Location, Injury, Mechanism, Bleeding', correct: false },
        { text: 'Level, Immobilization, Monitoring, Bandaging', correct: false },
        { text: 'Limb, Inspection, Manipulation, Blood supply', correct: false },
      ],
      explanation: 'LIMB står för Look (inspektion), Ischemia (cirkulation), Movement (rörlighet), Bones & soft tissue (ben och mjukdelar).',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '4.1',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'En patient inkommer med massiv blödning från låret efter en trafikolycka. Direkt tryck stoppar inte blödningen. Vad är nästa steg?',
      options: [
        { text: 'Applicera tourniquet 5-7 cm proximalt om skadan', correct: true },
        { text: 'Ge ytterligare kompresser och vänta', correct: false },
        { text: 'Lägga patienten i Trendelenburgläge', correct: false },
        { text: 'Applicera tourniquet direkt över såret', correct: false },
      ],
      explanation: 'När direkt tryck är otillräckligt vid massiv extremitetsblödning ska tourniquet appliceras 5-7 cm proximalt om skadan.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '5.1',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilket ABI-värde (Ankle-Brachial Index) indikerar misstänkt kärlskada?',
      options: [
        { text: '< 0.9', correct: true },
        { text: '< 1.3', correct: false },
        { text: '> 1.0', correct: false },
        { text: '> 0.9', correct: false },
      ],
      explanation: 'Ett ABI < 0.9 tyder på nedsatt cirkulation och misstänkt kärlskada. Normalt ABI är 0.9-1.3.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '6.1',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket är det MEST sensitiva kliniska tecknet på kompartmentsyndrom?',
      options: [
        { text: 'Smärta vid passiv töjning av musklerna i kompartmentet', correct: true },
        { text: 'Pulslöshet distalt', correct: false },
        { text: 'Paralys av musklerna', correct: false },
        { text: 'Parestesier i foten', correct: false },
      ],
      explanation: 'Smärta vid passiv töjning ("pain on passive stretch") är det mest sensitiva och tidigaste tecknet på kompartmentsyndrom.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.2',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'En patient med underbensfraktur utvecklar tilltagande smärta trots adekvat smärtlindring. Vaden är spänd och smärtar vid passiv dorsalflexion av tårna. Kompartmenttrycket mäts till 35 mmHg vid diastoliskt tryck 70 mmHg. Vad är rätt åtgärd?',
      options: [
        { text: 'Akut fasciotomi', correct: true },
        { text: 'Fortsatt observation', correct: false },
        { text: 'Höjning av benet', correct: false },
        { text: 'Ny tryckmätning om 2 timmar', correct: false },
      ],
      explanation: 'Delta-trycket (diastoliskt - kompartmenttryck) är 35 mmHg, vilket indikerar behov av fasciotomi när det är < 30 mmHg. Med kliniska tecken är akut fasciotomi indicerat.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '7.1',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken Gustilo-Anderson typ innebär associerad kärlskada som kräver reparation?',
      options: [
        { text: 'Typ IIIC', correct: true },
        { text: 'Typ IIIA', correct: false },
        { text: 'Typ IIIB', correct: false },
        { text: 'Typ II', correct: false },
      ],
      explanation: 'Gustilo-Anderson typ IIIC definieras av associerad kärlskada som kräver vaskulär reparation.',
      reference: 'B-ORTIM Kursbok, Kapitel 7',
    },
    {
      code: '7.2',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'När ska antibiotika ges vid öppen fraktur?',
      options: [
        { text: 'Inom 1 timme från ankomst', correct: true },
        { text: 'Vid ankomst till operationssal', correct: false },
        { text: 'Inom 6 timmar', correct: false },
        { text: 'Endast vid typ III-skador', correct: false },
      ],
      explanation: 'Antibiotika ska ges så snart som möjligt, helst inom 1 timme, vid alla öppna frakturer för att minska infektionsrisken.',
      reference: 'B-ORTIM Kursbok, Kapitel 7',
    },
    {
      code: '8.1',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken typ av bäckenringskada har högst blödningsrisk?',
      options: [
        { text: 'APC (Anterior-Posterior Compression)', correct: true },
        { text: 'LC (Lateral Compression)', correct: false },
        { text: 'Symysfruptur', correct: false },
        { text: 'Isolated sacral fracture', correct: false },
      ],
      explanation: 'APC-skador ("open book") öppnar bäckenringen och ger stor volym för blödning, därmed högst blödningsrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 8',
    },
    {
      code: '13.1',
      chapterNumber: 13,
      bloomLevel: 'ANALYSIS',
      question: 'En 35-årig man inkommer med bilateral femurfraktur, lungkontusion och hypotermi (34.5°C). pH 7.20, laktat 5.2 mmol/L. Vilken behandlingsstrategi är lämpligast?',
      options: [
        { text: 'Damage Control Orthopaedics med extern fixation', correct: true },
        { text: 'Primär märgspik av båda femurfrakturerna', correct: false },
        { text: 'Plattfixation av frakturerna', correct: false },
        { text: 'Konservativ behandling med sträckbehandling', correct: false },
      ],
      explanation: 'Patienten uppfyller kriterier för DCO: bilateral femurfraktur, lungskada, hypotermi, acidos och förhöjt laktat. Extern fixation med definitiv kirurgi efter fysiologisk stabilisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 13',
    },
  ];
}

// SVG functions for algorithms
function getLIMBAlgorithmSVG(): string {
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 24px sans-serif; fill: #1a5276; }
    .header { font: bold 16px sans-serif; fill: white; }
    .text { font: 14px sans-serif; fill: #333; }
    .box { rx: 8; ry: 8; }
  </style>

  <text x="400" y="40" text-anchor="middle" class="title">LIMB - Ortopedisk Primärundersökning</text>

  <!-- L - Look -->
  <rect x="50" y="80" width="160" height="120" fill="#3498db" class="box"/>
  <text x="130" y="110" text-anchor="middle" class="header">L - LOOK</text>
  <text x="60" y="135" class="text" fill="white">• Deformitet</text>
  <text x="60" y="155" class="text" fill="white">• Svullnad</text>
  <text x="60" y="175" class="text" fill="white">• Hudskador</text>
  <text x="60" y="195" class="text" fill="white">• Blödning</text>

  <!-- I - Ischemia -->
  <rect x="230" y="80" width="160" height="120" fill="#e74c3c" class="box"/>
  <text x="310" y="110" text-anchor="middle" class="header">I - ISCHEMIA</text>
  <text x="240" y="135" class="text" fill="white">• Kapillär återfyllnad</text>
  <text x="240" y="155" class="text" fill="white">• Pulsar</text>
  <text x="240" y="175" class="text" fill="white">• Hudfärg</text>
  <text x="240" y="195" class="text" fill="white">• ABI vid behov</text>

  <!-- M - Movement -->
  <rect x="410" y="80" width="160" height="120" fill="#27ae60" class="box"/>
  <text x="490" y="110" text-anchor="middle" class="header">M - MOVEMENT</text>
  <text x="420" y="135" class="text" fill="white">• Aktiv rörlighet</text>
  <text x="420" y="155" class="text" fill="white">• Passiv rörlighet</text>
  <text x="420" y="175" class="text" fill="white">• Passiv töjning</text>
  <text x="420" y="195" class="text" fill="white">• Neurologi</text>

  <!-- B - Bones -->
  <rect x="590" y="80" width="160" height="120" fill="#9b59b6" class="box"/>
  <text x="670" y="110" text-anchor="middle" class="header">B - BONES</text>
  <text x="600" y="135" class="text" fill="white">• Stabilitet</text>
  <text x="600" y="155" class="text" fill="white">• Krepitationer</text>
  <text x="600" y="175" class="text" fill="white">• Mjukdelsskador</text>
  <text x="600" y="195" class="text" fill="white">• Öppna skador</text>

  <!-- Warning signs -->
  <rect x="150" y="250" width="500" height="150" fill="#f39c12" class="box"/>
  <text x="400" y="280" text-anchor="middle" class="header">VARNINGSSIGNALER</text>
  <text x="170" y="310" class="text" fill="white">⚠ Pulslöshet → Akut kärlskada</text>
  <text x="170" y="335" class="text" fill="white">⚠ Smärta vid passiv töjning → Kompartmentsyndrom</text>
  <text x="170" y="360" class="text" fill="white">⚠ Öppen skada med benexposition → Öppen fraktur</text>
  <text x="170" y="385" class="text" fill="white">⚠ Massiv blödning → Omedelbar kontroll</text>

  <!-- Action box -->
  <rect x="150" y="430" width="500" height="80" fill="#1a5276" class="box"/>
  <text x="400" y="460" text-anchor="middle" class="header">DOKUMENTERA</text>
  <text x="170" y="490" class="text" fill="white">Tidpunkt • Fynd • Neurovaskulär status • Åtgärder</text>
</svg>`;
}

function getABIFlowSVG(): string {
  return `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .box-text { font: 14px sans-serif; fill: white; }
    .value { font: bold 16px sans-serif; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">ABI - Ankel-Brachial Index</text>

  <!-- Start -->
  <rect x="300" y="50" width="200" height="50" fill="#3498db" rx="8"/>
  <text x="400" y="82" text-anchor="middle" class="box-text">Mät ABI</text>

  <!-- Arrow -->
  <line x1="400" y1="100" x2="400" y2="130" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Decision -->
  <polygon points="400,140 500,190 400,240 300,190" fill="#f39c12"/>
  <text x="400" y="195" text-anchor="middle" class="value">ABI värde?</text>

  <!-- Normal -->
  <line x1="500" y1="190" x2="600" y2="190" stroke="#333" stroke-width="2"/>
  <rect x="600" y="160" width="150" height="60" fill="#27ae60" rx="8"/>
  <text x="675" y="185" text-anchor="middle" class="box-text">0.9 - 1.3</text>
  <text x="675" y="205" text-anchor="middle" class="box-text">NORMAL</text>

  <!-- Abnormal low -->
  <line x1="400" y1="240" x2="400" y2="280" stroke="#333" stroke-width="2"/>
  <rect x="250" y="280" width="150" height="60" fill="#e74c3c" rx="8"/>
  <text x="325" y="305" text-anchor="middle" class="box-text">&lt; 0.9</text>
  <text x="325" y="325" text-anchor="middle" class="box-text">Misstänkt kärlskada</text>

  <!-- Severe -->
  <rect x="425" y="280" width="150" height="60" fill="#c0392b" rx="8"/>
  <text x="500" y="305" text-anchor="middle" class="box-text">&lt; 0.5</text>
  <text x="500" y="325" text-anchor="middle" class="box-text">Allvarlig ischemi</text>

  <!-- Actions -->
  <rect x="200" y="380" width="180" height="80" fill="#1a5276" rx="8"/>
  <text x="290" y="410" text-anchor="middle" class="box-text">CT-angiografi</text>
  <text x="290" y="435" text-anchor="middle" class="box-text">Kärlkirurgkonsult</text>

  <rect x="420" y="380" width="180" height="80" fill="#8e44ad" rx="8"/>
  <text x="510" y="410" text-anchor="middle" class="box-text">AKUT åtgärd</text>
  <text x="510" y="435" text-anchor="middle" class="box-text">Revaskularisering</text>

  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#333"/>
    </marker>
  </defs>
</svg>`;
}

function getCompartmentSVG(): string {
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: white; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">Kompartmentsyndrom - De 6 P:na</text>

  <!-- Timeline -->
  <line x1="100" y1="100" x2="700" y2="100" stroke="#1a5276" stroke-width="3"/>
  <text x="100" y="85" class="text" fill="#333">TIDIGT</text>
  <text x="650" y="85" class="text" fill="#333">SENT</text>

  <!-- P1: Pain -->
  <rect x="80" y="120" width="100" height="80" fill="#27ae60" rx="8"/>
  <text x="130" y="145" text-anchor="middle" class="header">Pain</text>
  <text x="130" y="165" text-anchor="middle" class="text">Smärta</text>
  <text x="130" y="185" text-anchor="middle" class="text">oproportionerlig</text>

  <!-- P2: Pain on stretch -->
  <rect x="200" y="120" width="100" height="80" fill="#2ecc71" rx="8"/>
  <text x="250" y="145" text-anchor="middle" class="header">Stretch</text>
  <text x="250" y="165" text-anchor="middle" class="text">Smärta vid</text>
  <text x="250" y="185" text-anchor="middle" class="text">passiv töjning</text>

  <!-- P3: Pressure -->
  <rect x="320" y="120" width="100" height="80" fill="#f39c12" rx="8"/>
  <text x="370" y="145" text-anchor="middle" class="header">Pressure</text>
  <text x="370" y="165" text-anchor="middle" class="text">Spänt</text>
  <text x="370" y="185" text-anchor="middle" class="text">kompartment</text>

  <!-- P4: Paresthesia -->
  <rect x="440" y="120" width="100" height="80" fill="#e67e22" rx="8"/>
  <text x="490" y="145" text-anchor="middle" class="header">Paresthesia</text>
  <text x="490" y="165" text-anchor="middle" class="text">Stickningar</text>
  <text x="490" y="185" text-anchor="middle" class="text">Domningar</text>

  <!-- P5: Paralysis -->
  <rect x="560" y="120" width="100" height="80" fill="#e74c3c" rx="8"/>
  <text x="610" y="145" text-anchor="middle" class="header">Paralysis</text>
  <text x="610" y="165" text-anchor="middle" class="text">Förlamning</text>
  <text x="610" y="185" text-anchor="middle" class="text">(SENT)</text>

  <!-- P6: Pulselessness -->
  <rect x="680" y="120" width="100" height="80" fill="#c0392b" rx="8"/>
  <text x="730" y="145" text-anchor="middle" class="header">Pulseless</text>
  <text x="730" y="165" text-anchor="middle" class="text">Pulslös</text>
  <text x="730" y="185" text-anchor="middle" class="text">(MYCKET SENT)</text>

  <!-- Key message -->
  <rect x="150" y="250" width="500" height="60" fill="#e74c3c" rx="8"/>
  <text x="400" y="280" text-anchor="middle" class="header">VÄNTA INTE PÅ SENA TECKEN!</text>
  <text x="400" y="300" text-anchor="middle" class="text">Smärta vid passiv töjning är mest sensitiva tecknet</text>

  <!-- Treatment -->
  <rect x="150" y="350" width="500" height="100" fill="#1a5276" rx="8"/>
  <text x="400" y="380" text-anchor="middle" class="header">BEHANDLING: FASCIOTOMI</text>
  <text x="170" y="410" class="text">• Enda definitiva behandlingen</text>
  <text x="170" y="430" class="text">• Alla kompartment måste öppnas</text>
  <text x="400" y="410" class="text">• Sår lämnas öppna</text>
  <text x="400" y="430" class="text">• Sekundär stängning efter 48-72h</text>
</svg>`;
}

function getOpenFractureSVG(): string {
  return `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">Öppna Frakturer - Gustilo-Anderson</text>

  <!-- Type I -->
  <rect x="50" y="60" width="200" height="120" fill="#27ae60" rx="8"/>
  <text x="150" y="90" text-anchor="middle" class="header">TYP I</text>
  <text x="60" y="115" class="text" fill="white">• Sår &lt; 1 cm</text>
  <text x="60" y="135" class="text" fill="white">• Ren skada</text>
  <text x="60" y="155" class="text" fill="white">• Minimal mjukdelsskada</text>

  <!-- Type II -->
  <rect x="300" y="60" width="200" height="120" fill="#f39c12" rx="8"/>
  <text x="400" y="90" text-anchor="middle" class="header">TYP II</text>
  <text x="310" y="115" class="text" fill="white">• Sår 1-10 cm</text>
  <text x="310" y="135" class="text" fill="white">• Måttlig mjukdelsskada</text>
  <text x="310" y="155" class="text" fill="white">• Ingen omfattande skada</text>

  <!-- Type III header -->
  <rect x="550" y="60" width="200" height="40" fill="#e74c3c" rx="8"/>
  <text x="650" y="88" text-anchor="middle" class="header">TYP III</text>

  <!-- Type IIIA -->
  <rect x="550" y="110" width="200" height="80" fill="#c0392b" rx="8"/>
  <text x="650" y="135" text-anchor="middle" class="header">IIIA</text>
  <text x="560" y="160" class="text" fill="white">Mjukdelstäckning möjlig</text>

  <!-- Type IIIB -->
  <rect x="550" y="200" width="200" height="80" fill="#922b21" rx="8"/>
  <text x="650" y="225" text-anchor="middle" class="header">IIIB</text>
  <text x="560" y="250" class="text" fill="white">Kräver rekonstruktion</text>

  <!-- Type IIIC -->
  <rect x="550" y="290" width="200" height="80" fill="#641e16" rx="8"/>
  <text x="650" y="315" text-anchor="middle" class="header">IIIC</text>
  <text x="560" y="340" class="text" fill="white">Kärlskada kräver repair</text>

  <!-- Treatment timeline -->
  <rect x="50" y="400" width="700" height="80" fill="#1a5276" rx="8"/>
  <text x="400" y="425" text-anchor="middle" class="header">INITIAL HANDLÄGGNING - Inom 6 timmar</text>
  <text x="70" y="455" class="text" fill="white">1. Fotodokumentation</text>
  <text x="220" y="455" class="text" fill="white">2. Steril täckning</text>
  <text x="370" y="455" class="text" fill="white">3. Antibiotika (&lt;1h)</text>
  <text x="520" y="455" class="text" fill="white">4. Tetanus</text>
  <text x="620" y="455" class="text" fill="white">5. Stabilisering</text>
</svg>`;
}

function getPelvicSVG(): string {
  return `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: white; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">Bäckenringskador - Young-Burgess</text>

  <!-- LC -->
  <rect x="50" y="60" width="220" height="140" fill="#27ae60" rx="8"/>
  <text x="160" y="90" text-anchor="middle" class="header">LC - Lateral Compression</text>
  <text x="60" y="120" class="text">• Intern rotation hemibäcken</text>
  <text x="60" y="145" class="text">• Vanligaste typen</text>
  <text x="60" y="170" class="text">• LÅG blödningsrisk</text>

  <!-- APC -->
  <rect x="290" y="60" width="220" height="140" fill="#e74c3c" rx="8"/>
  <text x="400" y="90" text-anchor="middle" class="header">APC - Anterior-Posterior</text>
  <text x="300" y="120" class="text">• "Open book" skada</text>
  <text x="300" y="145" class="text">• Extern rotation</text>
  <text x="300" y="170" class="text">• HÖG blödningsrisk</text>

  <!-- VS -->
  <rect x="530" y="60" width="220" height="140" fill="#8e44ad" rx="8"/>
  <text x="640" y="90" text-anchor="middle" class="header">VS - Vertical Shear</text>
  <text x="540" y="120" class="text">• Vertikal instabilitet</text>
  <text x="540" y="145" class="text">• Kraniell förskjutning</text>
  <text x="540" y="170" class="text">• MYCKET HÖG blödningsrisk</text>

  <!-- Treatment -->
  <rect x="100" y="240" width="600" height="130" fill="#1a5276" rx="8"/>
  <text x="400" y="270" text-anchor="middle" class="header">INITIAL HANDLÄGGNING</text>
  <text x="120" y="300" class="text">1. BÄCKENBÄLTE - Alla misstänkta bäckenskador</text>
  <text x="120" y="325" class="text">2. Placering: Över trochantrarna</text>
  <text x="120" y="350" class="text">3. Vid hemodynamisk instabilitet: Preperitonal packing / Angioembolisering</text>
</svg>`;
}

function getDCOSVG(): string {
  return `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: white; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">DCO - Damage Control Orthopaedics</text>

  <!-- Criteria -->
  <rect x="50" y="60" width="300" height="180" fill="#e74c3c" rx="8"/>
  <text x="200" y="90" text-anchor="middle" class="header">INDIKATIONER FÖR DCO</text>
  <text x="60" y="120" class="text">Fysiologiska:</text>
  <text x="70" y="140" class="text">• pH &lt; 7.25</text>
  <text x="70" y="160" class="text">• Temp &lt; 35°C</text>
  <text x="70" y="180" class="text">• Koagulopati</text>
  <text x="70" y="200" class="text">• Laktat &gt; 4 mmol/L</text>
  <text x="200" y="120" class="text">Skadefaktorer:</text>
  <text x="210" y="140" class="text">• ISS &gt; 20</text>
  <text x="210" y="160" class="text">• Bilateral femur-fx</text>
  <text x="210" y="180" class="text">• Thorax/buk-skada</text>
  <text x="210" y="200" class="text">• Svår skallskada</text>

  <!-- Phase 1 -->
  <rect x="400" y="60" width="350" height="100" fill="#3498db" rx="8"/>
  <text x="575" y="90" text-anchor="middle" class="header">STEG 1: AKUT FAS (0-24h)</text>
  <text x="410" y="115" class="text">• Blödningskontroll</text>
  <text x="410" y="135" class="text">• Extern fixation av frakturer</text>
  <text x="410" y="155" class="text">• Minimal operationstid</text>

  <!-- Phase 2 -->
  <rect x="400" y="180" width="350" height="100" fill="#f39c12" rx="8"/>
  <text x="575" y="210" text-anchor="middle" class="header">STEG 2: INTENSIVVÅRD (24-72h)</text>
  <text x="410" y="235" class="text">• Korrigera hypotermi</text>
  <text x="410" y="255" class="text">• Korrigera koagulopati</text>
  <text x="410" y="275" class="text">• Korrigera acidos</text>

  <!-- Phase 3 -->
  <rect x="400" y="300" width="350" height="100" fill="#27ae60" rx="8"/>
  <text x="575" y="330" text-anchor="middle" class="header">STEG 3: DEFINITIV KIRURGI (&gt;72h)</text>
  <text x="410" y="355" class="text">• Konvertering till intern fixation</text>
  <text x="410" y="375" class="text">• Mjukdelsrekonstruktion</text>
  <text x="410" y="395" class="text">• Sekundära procedurer</text>

  <!-- Key message -->
  <rect x="50" y="420" width="700" height="50" fill="#1a5276" rx="8"/>
  <text x="400" y="450" text-anchor="middle" class="header">"Life over limb" - Patientens fysiologi styr behandlingsval</text>
</svg>`;
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
