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
    // B-ORTIM algorithms
    { code: 'LIMB', title: 'LIMB-algoritmen', description: 'Systematisk bedömning av extremitetsskador', svg: getLIMBAlgorithmSVG() },
    { code: 'ABI-FLOW', title: 'ABI-flödesschema', description: 'Beslutsstöd för ankel-brachialindex', svg: getABIFlowSVG() },
    { code: 'COMPARTMENT', title: 'Kompartmentsyndrom', description: 'Diagnos och behandling av kompartmentsyndrom', svg: getCompartmentSVG() },
    { code: 'OPEN-FX', title: 'Öppna frakturer', description: 'Gustilo-Anderson klassifikation och handläggning', svg: getOpenFractureSVG() },
    { code: 'PELVIC', title: 'Bäckenringskador', description: 'Klassifikation och initial handläggning', svg: getPelvicSVG() },
    { code: 'DCO', title: 'DCO-beslutsträd', description: 'Damage Control Orthopaedics beslutsstöd', svg: getDCOSVG() },
    // A-ORTIM algorithms
    { code: 'MESS', title: 'MESS Score', description: 'Mangled Extremity Severity Score för amputation vs limb salvage', svg: getMESSSVG() },
    { code: 'START-TRIAGE', title: 'START Triage', description: 'Simple Triage And Rapid Treatment vid masskada', svg: getSTARTTriageSVG() },
    { code: 'FASCIOTOMY', title: 'Fasciotomiguide', description: 'Incisioner och kompartment för underben', svg: getFasciotomySVG() },
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

  // Create B-ORTIM OSCE Stations (as reference data in chapter 17)
  const osceStations = getOSCEStations();
  console.log('✅ OSCE stations data prepared');

  // Create Learning Objectives for B-ORTIM
  const learningObjectives = getLearningObjectives();
  for (const obj of learningObjectives) {
    const chapter = createdChapters.find(c => c.chapterNumber === obj.chapterNumber);
    if (chapter) {
      await prisma.learningObjective.upsert({
        where: { id: `lo-${obj.code}` },
        update: {},
        create: {
          id: `lo-${obj.code}`,
          chapterId: chapter.id,
          code: obj.code,
          type: obj.type,
          description: obj.description,
          sortOrder: obj.sortOrder,
        },
      });
    }
  }

  console.log('✅ Learning objectives created');

  // ============================================
  // A-ORTIM (Advanced) Course
  // ============================================

  const advancedCourse = await prisma.course.upsert({
    where: { code: 'A-ORTIM-2025' },
    update: {},
    create: {
      code: 'A-ORTIM-2025',
      name: 'A-ORTIM',
      fullName: 'Advanced Orthopaedic Resuscitation and Trauma Initial Management',
      version: '1.0',
      description: 'Fördjupningskurs för läkare som genomfört B-ORTIM. Fokus på operativa tekniker, komplexa scenarion och traumateamledning.',
      estimatedHours: 24,
      passingScore: 75,
      isActive: true,
    },
  });

  console.log('✅ A-ORTIM course created');

  // A-ORTIM course parts
  const advancedParts = [
    { partNumber: 1, title: 'Fördjupad diagnostik', description: 'Avancerad bilddiagnostik och bedömning', sortOrder: 1 },
    { partNumber: 2, title: 'Operativa tekniker', description: 'Kirurgiska tekniker vid extremitetstrauma', sortOrder: 2 },
    { partNumber: 3, title: 'Komplexa scenarion', description: 'Multitrauma och svåra beslut', sortOrder: 3 },
    { partNumber: 4, title: 'Ledarskap och system', description: 'Teamledning och kvalitetsarbete', sortOrder: 4 },
  ];

  const createdAdvancedParts = [];
  for (const part of advancedParts) {
    const created = await prisma.coursePart.upsert({
      where: { courseId_partNumber: { courseId: advancedCourse.id, partNumber: part.partNumber } },
      update: {},
      create: { ...part, courseId: advancedCourse.id },
    });
    createdAdvancedParts.push(created);
  }

  console.log('✅ A-ORTIM parts created');

  // A-ORTIM chapters
  const advancedChapters = [
    // Del 1: Fördjupad diagnostik
    { partIndex: 0, chapterNumber: 1, title: 'Avancerad bilddiagnostik', slug: 'a-bilddiagnostik', estimatedMinutes: 45, content: getAdvancedChapterContent(1) },
    { partIndex: 0, chapterNumber: 2, title: 'Neurovaskulär bedömning', slug: 'a-neurovaskulär', estimatedMinutes: 40, content: getAdvancedChapterContent(2) },
    { partIndex: 0, chapterNumber: 3, title: 'Intraoperativ bedömning', slug: 'a-intraoperativ', estimatedMinutes: 35, content: getAdvancedChapterContent(3) },

    // Del 2: Operativa tekniker
    { partIndex: 1, chapterNumber: 4, title: 'Vaskulär reparation', slug: 'a-vaskular', estimatedMinutes: 50, content: getAdvancedChapterContent(4) },
    { partIndex: 1, chapterNumber: 5, title: 'Fasciotomitekniker', slug: 'a-fasciotomi', estimatedMinutes: 45, content: getAdvancedChapterContent(5) },
    { partIndex: 1, chapterNumber: 6, title: 'Extern fixation avancerat', slug: 'a-extern-fix', estimatedMinutes: 50, content: getAdvancedChapterContent(6) },
    { partIndex: 1, chapterNumber: 7, title: 'Mjukdelstäckning', slug: 'a-mjukdelar', estimatedMinutes: 45, content: getAdvancedChapterContent(7) },

    // Del 3: Komplexa scenarion
    { partIndex: 2, chapterNumber: 8, title: 'Multitrauma-koordinering', slug: 'a-multitrauma', estimatedMinutes: 55, content: getAdvancedChapterContent(8) },
    { partIndex: 2, chapterNumber: 9, title: 'Mangled Extremity', slug: 'a-mangled', estimatedMinutes: 50, content: getAdvancedChapterContent(9) },
    { partIndex: 2, chapterNumber: 10, title: 'Bäckentrauma avancerat', slug: 'a-backen', estimatedMinutes: 55, content: getAdvancedChapterContent(10) },
    { partIndex: 2, chapterNumber: 11, title: 'Pediatrisk polytrauma', slug: 'a-barn-poly', estimatedMinutes: 45, content: getAdvancedChapterContent(11) },

    // Del 4: Ledarskap och system
    { partIndex: 3, chapterNumber: 12, title: 'Traumateamledning', slug: 'a-teamledning', estimatedMinutes: 40, content: getAdvancedChapterContent(12) },
    { partIndex: 3, chapterNumber: 13, title: 'Masskadesituationer', slug: 'a-masskada', estimatedMinutes: 45, content: getAdvancedChapterContent(13) },
    { partIndex: 3, chapterNumber: 14, title: 'Kvalitet och förbättring', slug: 'a-kvalitet', estimatedMinutes: 35, content: getAdvancedChapterContent(14) },
  ];

  const createdAdvancedChapters = [];
  for (let i = 0; i < advancedChapters.length; i++) {
    const chapter = advancedChapters[i]!;
    const part = createdAdvancedParts[chapter.partIndex]!;
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
    createdAdvancedChapters.push(created);
  }

  console.log('✅ A-ORTIM chapters created');

  // A-ORTIM quiz questions
  const advancedQuestions = getAdvancedQuizQuestions();
  for (const q of advancedQuestions) {
    const chapter = createdAdvancedChapters.find(c => c.chapterNumber === q.chapterNumber);

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
            optionLabel: String.fromCharCode(65 + idx),
            optionText: opt.text,
            isCorrect: opt.correct,
            sortOrder: idx + 1,
          })),
        },
      },
    });
  }

  console.log('✅ A-ORTIM quiz questions created');

  // Create Learning Objectives for A-ORTIM
  const advancedLearningObjectives = getAdvancedLearningObjectives();
  for (const obj of advancedLearningObjectives) {
    const chapter = createdAdvancedChapters.find(c => c.chapterNumber === obj.chapterNumber);
    if (chapter) {
      await prisma.learningObjective.upsert({
        where: { id: `alo-${obj.code}` },
        update: {},
        create: {
          id: `alo-${obj.code}`,
          chapterId: chapter.id,
          code: obj.code,
          type: obj.type,
          description: obj.description,
          sortOrder: obj.sortOrder,
        },
      });
    }
  }

  console.log('✅ A-ORTIM learning objectives created');

  // Create A-ORTIM OSCE Stations (as reference data)
  const advancedOsceStations = getAdvancedOSCEStations();
  console.log(`✅ A-ORTIM OSCE stations data prepared (${advancedOsceStations.length} stations)`);

  // Create A-ORTIM cohort
  const advancedCohort = await prisma.cohort.upsert({
    where: { id: 'a-ortim-cohort-1' },
    update: {},
    create: {
      id: 'a-ortim-cohort-1',
      courseId: advancedCourse.id,
      instructorId: instructorUser.id,
      name: 'A-ORTIM HT2025-Stockholm',
      description: 'Höstterminen 2025, Stockholm - Fördjupningskurs',
      startDate: new Date('2025-08-15'),
      endDate: new Date('2025-12-15'),
      maxParticipants: 20,
      isActive: true,
    },
  });

  console.log('✅ A-ORTIM cohort created');

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

## Kliniskt fall

> **Fall 4.1:** En 28-årig man inkommer efter motorsågsolycka med djup laceration på vänster lår. Arteriell blödning. Prehospitalt applicerades tourniquet 14:32.
>
> **Åtgärd:** Direkt till operation. Tourniquet-tid dokumenterad. A. femoralis superficialis laceration - primärsutur. Total tourniquet-tid: 47 minuter. Postoperativt: övervakning för kompartmentsyndrom.

## Nyckelbudskap

✓ Direkt tryck först - tourniquet när otillräckligt
✓ Placera tourniquet 5-7 cm proximalt om skadan
✓ ALLTID dokumentera tid för applicering
✓ Lossa ALDRIG tourniquet prehospitalt
✓ Övervaka för kompartmentsyndrom efter reperfusion
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

## Kliniskt fall

> **Fall 5.1:** En 45-årig kvinna inkommer efter knäledsluxation som spontant reponerat. Foten är blek och kall. Kapillär återfyllnad > 4 sek. A. dorsalis pedis ej palpabel. ABI = 0.4.
>
> **Åtgärd:** Akut CT-angio visar ocklusion av a. poplitea. Kärlkirurg tillkallas. Trombektomi + shunt + fasciotomi. Definitiv kärlrekonstruktion efter stabilisering. Grad IIb ischemi - god prognos då åtgärd inom 4 timmar.

## Nyckelbudskap

✓ ABI < 0.9 = misstänkt kärlskada
✓ ABI < 0.5 = allvarlig ischemi - akut åtgärd
✓ "Golden 6 hours" för revaskularisering
✓ Knäledsluxation = hög risk för a. poplitea skada
✓ Fasciotomi vid revaskularisering efter längre ischemi
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

## Kliniskt fall

> **Fall 6.1:** En 32-årig man inkommer 6 timmar efter tibiafraktur. Ökande smärta trots morfin. Vaden spänd, svullen. Svår smärta vid passiv dorsalflexion av stortån. BT 130/80, kompartmenttryck 42 mmHg.
>
> **Analys:** Delta-tryck = 80 - 42 = 38 mmHg. Kliniska tecken tydliga.
>
> **Åtgärd:** Akut fasciotomi av alla fyra kompartment. Muskeln viabel vid inspektion. Sår lämnas öppna med VAC-förband. Sekundär stängning dag 4.

## Nyckelbudskap

✓ Smärta vid passiv töjning = MEST SENSITIVA tecknet
✓ Delta-tryck < 30 mmHg → fasciotomi
✓ Vänta INTE på sena tecken (paralys, pulslöshet)
✓ Alla kompartment måste öppnas
✓ Tibiafraktur = vanligaste orsaken
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

## Kliniskt fall

> **Fall 7.1:** En 19-årig MC-förare inkommer efter höghastighetsolycka. Öppen tibiafraktur med 8 cm sår, exponerat ben, kontaminerat med jord. Distal cirkulation intakt.
>
> **Klassifikation:** Gustilo-Anderson typ IIIA (stort sår, kontamination, men mjukdelstäckning möjlig).
>
> **Åtgärd:**
> 1. Foto av såret vid ankomst
> 2. Steril fuktig täckning
> 3. IV Cefuroxim + Gentamicin inom 45 min
> 4. Tetanusbooster
> 5. Till op inom 6h: debridering, extern fixation
> 6. Sekundär mjukdelstäckning dag 5

## Nyckelbudskap

✓ Antibiotika inom 1 timme - minskar infektionsrisk signifikant
✓ Fotografera före täckning
✓ Typ IIIC = kärlskada → kärlkirurg
✓ "6-timmarsregeln" för debridering
✓ Extern fixation ofta förstahandsval initialt
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

## Kliniskt fall

> **Fall 8.1:** En 55-årig man inkommer efter påkörning som fotgängare. BT 85/60, puls 120. Instabilt bäcken vid palpation. CT visar APC typ III ("open book") med > 5 cm symfyssprängning.
>
> **Åtgärd:**
> 1. Bäckenbälte appliceras omedelbart
> 2. Massiv transfusion initieras
> 3. CT-angio: aktiv blödning från a. iliaca interna
> 4. Angioembolisering
> 5. Extern fixation av bäckenringen
> 6. Patient stabiliseras - definitiv fixation dag 5

## Nyckelbudskap

✓ Bäckenbälte på ALLA misstänkta bäckenskador
✓ APC/VS = hög blödningsrisk
✓ Hemodynamisk instabilitet → angio eller packing
✓ Placera bälte över trochantrarna, inte crista
✓ Undvik överkompression vid LC-skador
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

## Kliniskt fall

> **Fall 13.1:** En 42-årig kvinna inkommer efter frontalolycka. GCS 10, BT 90/65. Bilateral femurfraktur, lungkontusion, mjältruptur. Temp 34.2°C, pH 7.18, laktat 6.1 mmol/L, INR 1.8.
>
> **Bedömning:** "Lethal triad" - hypotermi, acidos, koagulopati. ISS > 25.
>
> **DCO-beslut:**
> - Steg 1 (dag 0): Laparotomi + splenektomi, extern fixation båda femur. Op-tid 78 min.
> - Steg 2 (dag 1-3): IVA - uppvärmning, koagulationsfaktorer, laktatnormalisering.
> - Steg 3 (dag 4): Konvertering till märgspik bilateralt.
>
> **Utfall:** Patienten kunde mobiliseras dag 7, utskriven dag 14.

## Nyckelbudskap

✓ "Lethal triad" = hypotermi + acidos + koagulopati
✓ Fysiologi före anatomi - stabilisera patienten först
✓ Extern fixation = "brygga" till definitiv behandling
✓ Konvertering till intern fixation efter 72h om stabil
✓ "Life over limb" - rädda livet först
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
    // Kapitel 3: Prioritering
    {
      code: '3.1',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken tidsgräns gäller generellt för revaskularisering vid kärlskada med ischemi?',
      options: [
        { text: '< 6 timmar', correct: true },
        { text: '< 12 timmar', correct: false },
        { text: '< 24 timmar', correct: false },
        { text: '< 2 timmar', correct: false },
      ],
      explanation: 'Vid kärlskada med ischemi är tidsgränsen för revaskularisering generellt < 6 timmar för varm ischemi för att undvika irreversibel vävnadsskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.2',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En multitraumapatient har en öppen femurfraktur och en instabil bäckenskada med pågående blödning. Vilken skada prioriteras först?',
      options: [
        { text: 'Bäckenskadan - livshotande blödning prioriteras', correct: true },
        { text: 'Femurfrakturen - öppna frakturer kräver omedelbar åtgärd', correct: false },
        { text: 'Båda behandlas samtidigt', correct: false },
        { text: 'Det beror på patientens ålder', correct: false },
      ],
      explanation: 'Livshotande tillstånd (ABCDE) prioriteras alltid före extremitetshotande tillstånd. Bäckenblödning kan vara livshotande.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    // Kapitel 9: Amputationer
    {
      code: '9.1',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur ska ett amputat förvaras för optimal preservation?',
      options: [
        { text: 'I fuktig kompress, plastpåse, sedan i isbad - aldrig direkt kontakt med is', correct: true },
        { text: 'Direkt på is för maximal kylning', correct: false },
        { text: 'I rumstemperatur för att undvika köldskada', correct: false },
        { text: 'Nedsänkt i koksaltlösning', correct: false },
      ],
      explanation: 'Amputatet ska lindas i fuktig kompress, läggas i plastpåse och sedan kylas i isbad. Direkt kontakt med is orsakar köldskada på vävnaden.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.2',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken amputation har ALLTID replantationsindikation oavsett nivå?',
      options: [
        { text: 'Amputationer hos barn', correct: true },
        { text: 'Amputationer hos vuxna', correct: false },
        { text: 'Amputationer proximalt om handleden', correct: false },
        { text: 'Rena snittyamputationer', correct: false },
      ],
      explanation: 'Hos barn finns alltid replantationsindikation oavsett nivå på grund av den överlägsna läkningskapaciteten.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    // Kapitel 10: Barn
    {
      code: '10.1',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken Salter-Harris typ har HÖGST risk för tillväxtrubbning?',
      options: [
        { text: 'Typ IV och V', correct: true },
        { text: 'Typ I', correct: false },
        { text: 'Typ II', correct: false },
        { text: 'Typ III', correct: false },
      ],
      explanation: 'Salter-Harris typ IV (genom alla tre: fys, epifys, metafys) och typ V (kompressionsskada av fysen) har högst risk för tillväxtrubbning.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.2',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är fysens skador vanligare än ligamentskador hos barn?',
      options: [
        { text: 'Tillväxtzonerna (fyserna) är sårbarare än ligament hos barn', correct: true },
        { text: 'Barn har starkare ligament', correct: false },
        { text: 'Barn har sämre koordination', correct: false },
        { text: 'Det beror på vitamin D-brist', correct: false },
      ],
      explanation: 'Hos barn är tillväxtzonerna (fyserna) den svagaste länken i det muskuloskeletala systemet, svagare än ligament.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    // Kapitel 11: Crush syndrome
    {
      code: '11.1',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den mest akuta livshotande komplikationen vid crush syndrome?',
      options: [
        { text: 'Hyperkalemi med risk för hjärtarytmi', correct: true },
        { text: 'Myoglobinuri', correct: false },
        { text: 'Metabol acidos', correct: false },
        { text: 'Hypovolemi', correct: false },
      ],
      explanation: 'Hyperkalemi är den mest akut livshotande komplikationen vid crush syndrome då den kan orsaka fatala hjärtarytmier.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.2',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'En person har varit fastklämd under rasmassorna i 4 timmar. Vilken åtgärd ska påbörjas INNAN friläggning?',
      options: [
        { text: 'IV-access och aggressiv vätskebehandling', correct: true },
        { text: 'Omedelbar friläggning', correct: false },
        { text: 'Avvakta ambulans', correct: false },
        { text: 'Ge smärtstillande först', correct: false },
      ],
      explanation: 'Före friläggning vid prolongerad kompression ska IV-access etableras och aggressiv vätskebehandling påbörjas för att motverka reperfusionsskadan.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    // Kapitel 12: Speciella populationer
    {
      code: '12.1',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken åtgärd är speciellt viktig vid extremitetstrauma hos äldre patienter på antikoagulantia?',
      options: [
        { text: 'Reversering av antikoagulation vid aktiv blödning', correct: true },
        { text: 'Avvakta med behandling tills INR normaliserats spontant', correct: false },
        { text: 'Undvika all kirurgi', correct: false },
        { text: 'Ge dubbel dos smärtlindring', correct: false },
      ],
      explanation: 'Vid aktiv blödning hos antikoagulerade patienter är reversering av antikoagulationen en viktig åtgärd för blödningskontroll.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.2',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'En gravid kvinna i tredje trimestern inkommer med femurfraktur. Vilken position ska hon ligga i under undersökning?',
      options: [
        { text: 'Vänstersidesläge för att undvika vena cava-kompression', correct: true },
        { text: 'Ryggläge med benen höjda', correct: false },
        { text: 'Högersidesläge', correct: false },
        { text: 'Sittande position', correct: false },
      ],
      explanation: 'Gravida i tredje trimestern ska ligga i vänstersidesläge för att undvika kompression av vena cava från uterus, vilket annars kan ge cirkulatorisk påverkan.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    // Kapitel 14: Transport
    {
      code: '14.1',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står MIST för vid överrapportering av traumapatienter?',
      options: [
        { text: 'Mechanism, Injuries, Signs, Treatment', correct: true },
        { text: 'Monitor, Intubate, Stabilize, Transport', correct: false },
        { text: 'Major, Intermediate, Secondary, Tertiary', correct: false },
        { text: 'Medical, Immediate, Surgical, Therapeutic', correct: false },
      ],
      explanation: 'MIST är en strukturerad överrapportering: Mechanism (skademekanism), Injuries (skador), Signs (vitalparametrar), Treatment (given behandling).',
      reference: 'B-ORTIM Kursbok, Kapitel 14',
    },
    {
      code: '14.2',
      chapterNumber: 14,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken regel gäller vid frakturimmobilisering för transport?',
      options: [
        { text: 'Immobilisera leden ovan och nedan frakturen', correct: true },
        { text: 'Endast immobilisera frakturstället', correct: false },
        { text: 'Immobilisera hela extremiteten', correct: false },
        { text: 'Använd alltid gips', correct: false },
      ],
      explanation: 'Grundprincipen vid frakturimmobilisering är att immobilisera leden ovan och nedan frakturen för att förhindra rörelse i frakturområdet.',
      reference: 'B-ORTIM Kursbok, Kapitel 14',
    },
    // Kapitel 15: Dokumentation och juridik
    {
      code: '15.1',
      chapterNumber: 15,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad ska dokumenteras vid initial bedömning av extremitetsskada?',
      options: [
        { text: 'Tidpunkt, skademekanism, fynd, neurovaskulär status, åtgärder', correct: true },
        { text: 'Endast diagnos och behandling', correct: false },
        { text: 'Endast patientens symtom', correct: false },
        { text: 'Endast röntgenfynd', correct: false },
      ],
      explanation: 'Komplett initial dokumentation inkluderar tidpunkt för ankomst, skademekanism, fynd vid undersökning, neurovaskulär status och given behandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 15',
    },
    {
      code: '15.2',
      chapterNumber: 15,
      bloomLevel: 'APPLICATION',
      question: 'En medvetslös patient behöver akut fasciotomi för misstänkt kompartmentsyndrom. Samtycke kan inte inhämtas. Vad gäller?',
      options: [
        { text: 'Nödrätten tillåter behandling vid livs- eller extremitetshotande tillstånd', correct: true },
        { text: 'Man måste vänta tills patienten vaknar', correct: false },
        { text: 'Endast anhöriga kan ge samtycke', correct: false },
        { text: 'Etisk kommitté måste kontaktas först', correct: false },
      ],
      explanation: 'Vid livs- eller extremitetshotande tillstånd där samtycke inte kan inhämtas gäller nödrätten. Dokumentera att samtycke inte kunde inhämtas.',
      reference: 'B-ORTIM Kursbok, Kapitel 15',
    },
    // Kapitel 16: Teamarbete
    {
      code: '16.1',
      chapterNumber: 16,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "closed-loop kommunikation"?',
      options: [
        { text: 'Order ges, bekräftas, utförs, och slutförande rapporteras tillbaka', correct: true },
        { text: 'Endast teamledaren talar', correct: false },
        { text: 'Kommunikation sker via mellanhänder', correct: false },
        { text: 'Information dokumenteras skriftligt', correct: false },
      ],
      explanation: 'Closed-loop kommunikation innebär: order ges av teamledare, mottagaren bekräftar, utför uppgiften, och rapporterar att den är genomförd.',
      reference: 'B-ORTIM Kursbok, Kapitel 16',
    },
    {
      code: '16.2',
      chapterNumber: 16,
      bloomLevel: 'APPLICATION',
      question: 'Under ett traumaomhändertagande blir situationen kaotisk. Enligt CRM-principerna, vad bör du göra?',
      options: [
        { text: 'Kalla på hjälp tidigt och utnyttja teamets resurser', correct: true },
        { text: 'Arbeta snabbare för att lösa situationen', correct: false },
        { text: 'Ta över alla uppgifter själv', correct: false },
        { text: 'Avvakta och se om situationen löser sig', correct: false },
      ],
      explanation: 'Enligt CRM-principerna (Crisis Resource Management) ska man kalla på hjälp tidigt och utnyttja teamets resurser effektivt.',
      reference: 'B-ORTIM Kursbok, Kapitel 16',
    },
    // Kapitel 17: Examination
    {
      code: '17.1',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka praktiska moment ingår i B-ORTIM OSCE-examinationen?',
      options: [
        { text: 'Tourniquet, ABI-mätning, bäckenbälte, passiv töjningstest, LIMB, SBAR', correct: true },
        { text: 'Endast teoretiska frågor', correct: false },
        { text: 'Endast kirurgiska ingrepp', correct: false },
        { text: 'Endast anamnestagning', correct: false },
      ],
      explanation: 'OSCE-stationerna inkluderar tourniquet-applikation, ABI-mätning, bäckenbälte, passiv töjningstest, LIMB-bedömning och SBAR-kommunikation.',
      reference: 'B-ORTIM Kursbok, Kapitel 17',
    },
    {
      code: '17.2',
      chapterNumber: 17,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur länge gäller B-ORTIM certifikatet?',
      options: [
        { text: '4 år', correct: true },
        { text: '1 år', correct: false },
        { text: '2 år', correct: false },
        { text: 'Livstid', correct: false },
      ],
      explanation: 'B-ORTIM certifikatet gäller i 4 år, varefter recertifiering krävs.',
      reference: 'B-ORTIM Kursbok, Kapitel 17',
    },
  ];
}

// OSCE Stations for B-ORTIM
function getOSCEStations() {
  return [
    {
      stationNumber: 1,
      stationName: 'Tourniquet-applikation',
      duration: 5,
      passingScore: 80,
      checklist: [
        { item: 'Identifierar indikation för tourniquet', points: 10, critical: true },
        { item: 'Väljer korrekt placering (5-7 cm proximalt)', points: 15, critical: true },
        { item: 'Applicerar över bar hud eller tunt tyg', points: 10, critical: false },
        { item: 'Drar åt tills blödning upphör', points: 15, critical: true },
        { item: 'Verifierar att distal puls försvinner', points: 10, critical: false },
        { item: 'Säkrar tourniquet', points: 10, critical: false },
        { item: 'Dokumenterar tid för applikation', points: 15, critical: true },
        { item: 'Markerar "TK" + tid på patientens panna', points: 10, critical: false },
        { item: 'Kommunicerar korrekt med team', points: 5, critical: false },
      ],
    },
    {
      stationNumber: 2,
      stationName: 'ABI-mätning',
      duration: 8,
      passingScore: 75,
      checklist: [
        { item: 'Förklarar proceduren för patienten', points: 5, critical: false },
        { item: 'Placerar patienten i ryggläge', points: 5, critical: false },
        { item: 'Applicerar blodtrycksmanschett korrekt på arm', points: 10, critical: false },
        { item: 'Mäter systoliskt tryck i a. brachialis med doppler', points: 15, critical: true },
        { item: 'Applicerar manschett korrekt på underben', points: 10, critical: false },
        { item: 'Mäter tryck i a. dorsalis pedis', points: 15, critical: true },
        { item: 'Mäter tryck i a. tibialis posterior', points: 15, critical: true },
        { item: 'Beräknar ABI korrekt (ankel/arm)', points: 15, critical: true },
        { item: 'Tolkar resultatet korrekt (<0.9 = misstänkt kärlskada)', points: 10, critical: true },
      ],
    },
    {
      stationNumber: 3,
      stationName: 'Bäckenbälte',
      duration: 4,
      passingScore: 80,
      checklist: [
        { item: 'Identifierar instabilt bäcken som indikation', points: 10, critical: true },
        { item: 'Väljer rätt storlek på bälte', points: 5, critical: false },
        { item: 'Placerar bältet i korrekt höjd (över trochanter)', points: 20, critical: true },
        { item: 'Centrerar bältet posteriort', points: 10, critical: false },
        { item: 'Drar åt med adekvat kraft', points: 15, critical: true },
        { item: 'Låser bältet korrekt', points: 10, critical: false },
        { item: 'Undviker överkompression vid LC-skada', points: 15, critical: true },
        { item: 'Dokumenterar tid för applikation', points: 10, critical: false },
        { item: 'Reviderar inte bältet i onödan', points: 5, critical: false },
      ],
    },
    {
      stationNumber: 4,
      stationName: 'Passiv töjningstest',
      duration: 5,
      passingScore: 75,
      checklist: [
        { item: 'Förklarar testet för patienten', points: 5, critical: false },
        { item: 'Identifierar relevant kompartment att testa', points: 15, critical: true },
        { item: 'Utför passiv dorsalflexion av tår/fot korrekt', points: 20, critical: true },
        { item: 'Observerar smärtreaktion', points: 15, critical: true },
        { item: 'Palperar kompartmentets spänning', points: 15, critical: true },
        { item: 'Jämför med frisk sida', points: 10, critical: false },
        { item: 'Tolkar fynd korrekt (smärta = pos test)', points: 15, critical: true },
        { item: 'Kommunicerar fynd till team', points: 5, critical: false },
      ],
    },
    {
      stationNumber: 5,
      stationName: 'LIMB-bedömning',
      duration: 8,
      passingScore: 75,
      checklist: [
        { item: 'Följer LIMB-strukturen systematiskt', points: 10, critical: true },
        { item: 'L: Inspekterar deformitet, svullnad, sår', points: 15, critical: true },
        { item: 'I: Bedömer kapillär återfyllnad', points: 10, critical: true },
        { item: 'I: Palperar perifera pulsar', points: 10, critical: true },
        { item: 'I: Bedömer hudfärg och temperatur', points: 5, critical: false },
        { item: 'M: Testar aktiv och passiv rörlighet', points: 10, critical: true },
        { item: 'M: Utför passiv töjningstest', points: 10, critical: true },
        { item: 'M: Bedömer sensorik och motorik', points: 10, critical: true },
        { item: 'B: Bedömer stabilitet och krepitationer', points: 10, critical: true },
        { item: 'Dokumenterar alla fynd', points: 10, critical: false },
      ],
    },
    {
      stationNumber: 6,
      stationName: 'SBAR-kommunikation',
      duration: 5,
      passingScore: 80,
      checklist: [
        { item: 'Presenterar sig och roll', points: 5, critical: false },
        { item: 'S: Beskriver situation tydligt', points: 20, critical: true },
        { item: 'B: Ger relevant bakgrund', points: 20, critical: true },
        { item: 'A: Presenterar bedömning/misstanke', points: 20, critical: true },
        { item: 'R: Ger tydlig rekommendation', points: 20, critical: true },
        { item: 'Använder closed-loop kommunikation', points: 10, critical: false },
        { item: 'Bekräftar att mottagaren förstått', points: 5, critical: false },
      ],
    },
  ];
}

// OSCE Stations for A-ORTIM (Advanced)
function getAdvancedOSCEStations() {
  return [
    {
      stationNumber: 1,
      stationName: 'Fasciotomi dubbelincision',
      duration: 15,
      passingScore: 80,
      checklist: [
        { item: 'Identifierar korrekt indikation för fasciotomi', points: 5, critical: true },
        { item: 'Markerar fibulahuvud och laterala malleol', points: 5, critical: false },
        { item: 'Utför lateral incision 1 cm framför fibula', points: 10, critical: true },
        { item: 'Öppnar anteriora kompartmentet först', points: 10, critical: true },
        { item: 'Identifierar intermuskulära septum', points: 5, critical: false },
        { item: 'Öppnar laterala kompartmentet', points: 10, critical: true },
        { item: 'Utför medial incision 2 cm posteriort om tibiakant', points: 10, critical: true },
        { item: 'Öppnar ytliga posteriora kompartmentet', points: 10, critical: true },
        { item: 'Inciderar genom soleus-fascia', points: 5, critical: false },
        { item: 'Öppnar djupa posteriora kompartmentet', points: 10, critical: true },
        { item: 'Verifierar att alla 4 kompartment är öppnade', points: 15, critical: true },
        { item: 'Applicerar korrekt förband (fuktigt/VAC)', points: 5, critical: false },
      ],
    },
    {
      stationNumber: 2,
      stationName: 'MESS-beräkning och beslut',
      duration: 10,
      passingScore: 75,
      checklist: [
        { item: 'Bedömer skelett/mjukdelsskada korrekt (1-4p)', points: 15, critical: true },
        { item: 'Bedömer ischemigrad korrekt', points: 15, critical: true },
        { item: 'Identifierar ischemitid och dubblar poäng om >6h', points: 10, critical: true },
        { item: 'Bedömer chockgrad korrekt (0-2p)', points: 10, critical: true },
        { item: 'Inkluderar ålder i beräkningen', points: 5, critical: false },
        { item: 'Summerar MESS-score korrekt', points: 10, critical: true },
        { item: 'Tolkar score (<7 vs ≥7) korrekt', points: 10, critical: true },
        { item: 'Bedömer n. tibialis posterior-funktion', points: 10, critical: true },
        { item: 'Kommunicerar beslutsunderlag till patient/anhöriga', points: 10, critical: false },
        { item: 'Dokumenterar MESS-score och beslut', points: 5, critical: false },
      ],
    },
    {
      stationNumber: 3,
      stationName: 'Traumateamledning',
      duration: 15,
      passingScore: 75,
      checklist: [
        { item: 'Tar emot MIST-rapport och sammanfattar för teamet', points: 10, critical: true },
        { item: 'Fördelar tydliga roller innan patient anländer', points: 10, critical: true },
        { item: 'Positionerar sig vid fotändan för överblick', points: 5, critical: false },
        { item: 'Leder ABCDE-genomgång strukturerat', points: 15, critical: true },
        { item: 'Delegerar uppgifter istället för att utföra själv', points: 10, critical: true },
        { item: 'Använder closed-loop kommunikation konsekvent', points: 10, critical: true },
        { item: 'Efterfrågar input från teammedlemmar', points: 5, critical: false },
        { item: 'Sammanfattar regelbundet ("Så just nu har vi...")', points: 10, critical: true },
        { item: 'Fattar tydliga beslut och kommunicerar plan', points: 15, critical: true },
        { item: 'Hanterar avvikelser/konflikter professionellt', points: 10, critical: false },
      ],
    },
    {
      stationNumber: 4,
      stationName: 'START-triage masskada',
      duration: 10,
      passingScore: 80,
      checklist: [
        { item: 'Ber gående patienter förflytta sig (→ GRÖN)', points: 10, critical: true },
        { item: 'Kontrollerar andning hos icke-gående', points: 10, critical: true },
        { item: 'Frigör luftväg om ej spontan andning', points: 10, critical: true },
        { item: 'Klassificerar som SVART om ej andning efter friläggning', points: 10, critical: true },
        { item: 'Bedömer andningsfrekvens (>30 → RÖD)', points: 10, critical: true },
        { item: 'Bedömer kapillär återfyllnad (>2s → RÖD)', points: 10, critical: true },
        { item: 'Testar om patient följer uppmaningar', points: 10, critical: true },
        { item: 'Klassificerar korrekt som GUL vid normala parametrar', points: 10, critical: true },
        { item: 'Markerar patient tydligt med färgkod', points: 10, critical: false },
        { item: 'Fortsätter till nästa patient utan dröjsmål', points: 10, critical: true },
      ],
    },
    {
      stationNumber: 5,
      stationName: 'Neurovaskulär undersökning',
      duration: 12,
      passingScore: 75,
      checklist: [
        { item: 'Inspekterar extremitet (färg, svullnad, deformitet)', points: 5, critical: false },
        { item: 'Palperar a. dorsalis pedis', points: 10, critical: true },
        { item: 'Palperar a. tibialis posterior', points: 10, critical: true },
        { item: 'Bedömer kapillär återfyllnad', points: 10, critical: true },
        { item: 'Testar n. peroneus profundus (dorsalflexion stortå)', points: 10, critical: true },
        { item: 'Testar n. peroneus superficialis (eversion)', points: 10, critical: true },
        { item: 'Testar n. tibialis (plantarflexion, sensorik fotsula)', points: 10, critical: true },
        { item: 'Testar n. suralis (sensorik lateral fotrygg)', points: 5, critical: false },
        { item: 'Jämför med kontralateral sida', points: 10, critical: false },
        { item: 'Dokumenterar fynd systematiskt', points: 10, critical: false },
        { item: 'Drar korrekt slutsats om nervskada', points: 10, critical: true },
      ],
    },
    {
      stationNumber: 6,
      stationName: 'DCO-beslutsfattande',
      duration: 10,
      passingScore: 75,
      checklist: [
        { item: 'Identifierar fysiologiska DCO-kriterier (pH, temp, koag)', points: 15, critical: true },
        { item: 'Bedömer skadefaktorer (ISS, bilateral femur, etc)', points: 10, critical: true },
        { item: 'Bedömer laktat och base excess', points: 10, critical: true },
        { item: 'Fattar korrekt beslut ETC vs DCO', points: 15, critical: true },
        { item: 'Planerar akut fas (blödningskontroll, ex-fix)', points: 10, critical: true },
        { item: 'Kommunicerar plan till traumateam', points: 10, critical: true },
        { item: 'Planerar intensivvårdsfas (korrigera triad)', points: 10, critical: false },
        { item: 'Sätter mål för definitiv kirurgi (>72h)', points: 10, critical: false },
        { item: 'Dokumenterar beslutsunderlag', points: 10, critical: false },
      ],
    },
  ];
}

// Learning Objectives for B-ORTIM
function getLearningObjectives() {
  return [
    // Kapitel 1
    { chapterNumber: 1, code: 'LO1.1', type: 'knowledge', description: 'Identifiera de fyra tidskritiska ortopediska tillstånden', sortOrder: 1 },
    { chapterNumber: 1, code: 'LO1.2', type: 'comprehension', description: 'Förklara varför strukturerad handläggning minskar mortalitet och komplikationer', sortOrder: 2 },
    { chapterNumber: 1, code: 'LO1.3', type: 'comprehension', description: 'Beskriva konsekvenserna av försenad behandling vid varje tillstånd', sortOrder: 3 },

    // Kapitel 2
    { chapterNumber: 2, code: 'LO2.1', type: 'knowledge', description: 'Beskriva LIMB-protokollets alla komponenter', sortOrder: 1 },
    { chapterNumber: 2, code: 'LO2.2', type: 'skill', description: 'Utföra en systematisk LIMB-undersökning', sortOrder: 2 },
    { chapterNumber: 2, code: 'LO2.3', type: 'application', description: 'Identifiera varningssignaler som kräver omedelbar åtgärd', sortOrder: 3 },

    // Kapitel 3
    { chapterNumber: 3, code: 'LO3.1', type: 'comprehension', description: 'Förklara prioriteringsprinciper vid multipla skador', sortOrder: 1 },
    { chapterNumber: 3, code: 'LO3.2', type: 'application', description: 'Tillämpa tidsgränser för behandling av olika tillstånd', sortOrder: 2 },

    // Kapitel 4
    { chapterNumber: 4, code: 'LO4.1', type: 'skill', description: 'Demonstrera korrekt tourniquet-applikation', sortOrder: 1 },
    { chapterNumber: 4, code: 'LO4.2', type: 'knowledge', description: 'Beskriva indikationer och kontraindikationer för tourniquet', sortOrder: 2 },
    { chapterNumber: 4, code: 'LO4.3', type: 'comprehension', description: 'Förklara komplikationer vid långvarig tourniquet-användning', sortOrder: 3 },

    // Kapitel 5
    { chapterNumber: 5, code: 'LO5.1', type: 'skill', description: 'Utföra och tolka ABI-mätning', sortOrder: 1 },
    { chapterNumber: 5, code: 'LO5.2', type: 'knowledge', description: 'Klassificera kärlskador enligt klinisk gradering', sortOrder: 2 },
    { chapterNumber: 5, code: 'LO5.3', type: 'application', description: 'Besluta om vidare utredning baserat på ABI-värde', sortOrder: 3 },

    // Kapitel 6
    { chapterNumber: 6, code: 'LO6.1', type: 'knowledge', description: 'Beskriva de 6 P:na vid kompartmentsyndrom', sortOrder: 1 },
    { chapterNumber: 6, code: 'LO6.2', type: 'skill', description: 'Utföra passiv töjningstest', sortOrder: 2 },
    { chapterNumber: 6, code: 'LO6.3', type: 'application', description: 'Tolka delta-tryck och besluta om fasciotomi', sortOrder: 3 },

    // Kapitel 7
    { chapterNumber: 7, code: 'LO7.1', type: 'knowledge', description: 'Klassificera öppna frakturer enligt Gustilo-Anderson', sortOrder: 1 },
    { chapterNumber: 7, code: 'LO7.2', type: 'application', description: 'Välja rätt antibiotikaprofylax baserat på frakturtyp', sortOrder: 2 },
    { chapterNumber: 7, code: 'LO7.3', type: 'skill', description: 'Demonstrera korrekt initial sårhantering', sortOrder: 3 },

    // Kapitel 8
    { chapterNumber: 8, code: 'LO8.1', type: 'knowledge', description: 'Klassificera bäckenringskador enligt Young-Burgess', sortOrder: 1 },
    { chapterNumber: 8, code: 'LO8.2', type: 'skill', description: 'Demonstrera korrekt bäckenbälte-applikation', sortOrder: 2 },
    { chapterNumber: 8, code: 'LO8.3', type: 'application', description: 'Identifiera patienter med hög blödningsrisk', sortOrder: 3 },

    // Kapitel 9
    { chapterNumber: 9, code: 'LO9.1', type: 'knowledge', description: 'Beskriva indikationer för replantation', sortOrder: 1 },
    { chapterNumber: 9, code: 'LO9.2', type: 'skill', description: 'Demonstrera korrekt hantering av amputat', sortOrder: 2 },

    // Kapitel 10
    { chapterNumber: 10, code: 'LO10.1', type: 'knowledge', description: 'Beskriva Salter-Harris klassifikationen', sortOrder: 1 },
    { chapterNumber: 10, code: 'LO10.2', type: 'comprehension', description: 'Förklara anatomiska skillnader hos barn', sortOrder: 2 },

    // Kapitel 11
    { chapterNumber: 11, code: 'LO11.1', type: 'knowledge', description: 'Beskriva patofysiologin vid crush syndrome', sortOrder: 1 },
    { chapterNumber: 11, code: 'LO11.2', type: 'application', description: 'Planera behandling före och efter friläggning', sortOrder: 2 },

    // Kapitel 12
    { chapterNumber: 12, code: 'LO12.1', type: 'comprehension', description: 'Beskriva särskilda överväganden vid trauma hos äldre', sortOrder: 1 },
    { chapterNumber: 12, code: 'LO12.2', type: 'application', description: 'Anpassa handläggning för gravida traumapatienter', sortOrder: 2 },

    // Kapitel 13
    { chapterNumber: 13, code: 'LO13.1', type: 'knowledge', description: 'Beskriva DCO-kriterier och indikationer', sortOrder: 1 },
    { chapterNumber: 13, code: 'LO13.2', type: 'application', description: 'Besluta om ETC vs DCO baserat på patientens fysiologi', sortOrder: 2 },

    // Kapitel 14
    { chapterNumber: 14, code: 'LO14.1', type: 'skill', description: 'Utföra MIST-rapport', sortOrder: 1 },
    { chapterNumber: 14, code: 'LO14.2', type: 'knowledge', description: 'Beskriva principer för frakturimmobilisering', sortOrder: 2 },

    // Kapitel 15
    { chapterNumber: 15, code: 'LO15.1', type: 'knowledge', description: 'Identifiera dokumentationskrav vid extremitetstrauma', sortOrder: 1 },
    { chapterNumber: 15, code: 'LO15.2', type: 'comprehension', description: 'Förklara nödrätten vid akuta tillstånd', sortOrder: 2 },

    // Kapitel 16
    { chapterNumber: 16, code: 'LO16.1', type: 'skill', description: 'Demonstrera SBAR-kommunikation', sortOrder: 1 },
    { chapterNumber: 16, code: 'LO16.2', type: 'skill', description: 'Tillämpa closed-loop kommunikation', sortOrder: 2 },
    { chapterNumber: 16, code: 'LO16.3', type: 'comprehension', description: 'Beskriva CRM-principer', sortOrder: 3 },

    // Kapitel 17
    { chapterNumber: 17, code: 'LO17.1', type: 'knowledge', description: 'Beskriva examinationsformatet för B-ORTIM', sortOrder: 1 },
    { chapterNumber: 17, code: 'LO17.2', type: 'application', description: 'Förbereda sig för OSCE-stationer', sortOrder: 2 },
  ];
}

// Learning Objectives for A-ORTIM
function getAdvancedLearningObjectives() {
  return [
    // Kapitel 1: Avancerad bilddiagnostik
    { chapterNumber: 1, code: 'ALO1.1', type: 'knowledge', description: 'Beskriva indikationer för CT-angiografi vid extremitetstrauma', sortOrder: 1 },
    { chapterNumber: 1, code: 'ALO1.2', type: 'comprehension', description: 'Tolka direkta och indirekta tecken på kärlskada på CT-angio', sortOrder: 2 },
    { chapterNumber: 1, code: 'ALO1.3', type: 'application', description: 'Välja rätt bilddiagnostisk modalitet för olika skadetyper', sortOrder: 3 },

    // Kapitel 2: Neurovaskulär bedömning
    { chapterNumber: 2, code: 'ALO2.1', type: 'skill', description: 'Utföra komplett neurovaskulär undersökning av extremitet', sortOrder: 1 },
    { chapterNumber: 2, code: 'ALO2.2', type: 'knowledge', description: 'Identifiera nervskadesymptom för alla större extremitetsnerver', sortOrder: 2 },
    { chapterNumber: 2, code: 'ALO2.3', type: 'application', description: 'Bedöma indikation för kirurgisk exploration baserat på undersökningsfynd', sortOrder: 3 },

    // Kapitel 3: Intraoperativ bedömning
    { chapterNumber: 3, code: 'ALO3.1', type: 'knowledge', description: 'Beskriva principer för intraoperativ angiografi och on-table bedömning', sortOrder: 1 },
    { chapterNumber: 3, code: 'ALO3.2', type: 'skill', description: 'Demonstrera bedömning av vävnadsviabilitet intraoperativt', sortOrder: 2 },

    // Kapitel 4: Vaskulär reparation
    { chapterNumber: 4, code: 'ALO4.1', type: 'knowledge', description: 'Beskriva val av kärlgraft och reparationsmetod', sortOrder: 1 },
    { chapterNumber: 4, code: 'ALO4.2', type: 'comprehension', description: 'Förklara indikationer för tillfällig kärlshunt', sortOrder: 2 },
    { chapterNumber: 4, code: 'ALO4.3', type: 'skill', description: 'Demonstrera grundläggande kärlsuturteknik', sortOrder: 3 },

    // Kapitel 5: Fasciotomitekniker
    { chapterNumber: 5, code: 'ALO5.1', type: 'skill', description: 'Utföra dubbelincision fasciotomi av underbenet', sortOrder: 1 },
    { chapterNumber: 5, code: 'ALO5.2', type: 'knowledge', description: 'Identifiera alla fyra underbenens kompartment', sortOrder: 2 },
    { chapterNumber: 5, code: 'ALO5.3', type: 'application', description: 'Hantera postoperativ vård av fasciotomisår', sortOrder: 3 },

    // Kapitel 6: Extern fixation avancerat
    { chapterNumber: 6, code: 'ALO6.1', type: 'skill', description: 'Applicera uniplanar och multiplanar extern fixation', sortOrder: 1 },
    { chapterNumber: 6, code: 'ALO6.2', type: 'comprehension', description: 'Förklara principer för säker pinplacering', sortOrder: 2 },
    { chapterNumber: 6, code: 'ALO6.3', type: 'application', description: 'Planera konvertering från extern till intern fixation', sortOrder: 3 },

    // Kapitel 7: Mjukdelstäckning
    { chapterNumber: 7, code: 'ALO7.1', type: 'knowledge', description: 'Beskriva fix and flap-konceptet', sortOrder: 1 },
    { chapterNumber: 7, code: 'ALO7.2', type: 'comprehension', description: 'Förklara indikationer för olika rekonstruktionsalternativ', sortOrder: 2 },
    { chapterNumber: 7, code: 'ALO7.3', type: 'application', description: 'Välja rätt täckningsmetod baserat på defektens storlek och lokalisation', sortOrder: 3 },

    // Kapitel 8: Multitrauma-koordinering
    { chapterNumber: 8, code: 'ALO8.1', type: 'knowledge', description: 'Beskriva DCO-kriterier och indikationer', sortOrder: 1 },
    { chapterNumber: 8, code: 'ALO8.2', type: 'application', description: 'Prioritera ortopediska skador vid multitrauma', sortOrder: 2 },
    { chapterNumber: 8, code: 'ALO8.3', type: 'analysis', description: 'Besluta om ETC vs DCO baserat på fysiologiska parametrar', sortOrder: 3 },

    // Kapitel 9: Mangled Extremity
    { chapterNumber: 9, code: 'ALO9.1', type: 'skill', description: 'Beräkna och tolka MESS-score', sortOrder: 1 },
    { chapterNumber: 9, code: 'ALO9.2', type: 'analysis', description: 'Väga för- och nackdelar med limb salvage vs amputation', sortOrder: 2 },
    { chapterNumber: 9, code: 'ALO9.3', type: 'application', description: 'Kommunicera med patient och anhöriga vid svåra beslut', sortOrder: 3 },

    // Kapitel 10: Bäckentrauma avancerat
    { chapterNumber: 10, code: 'ALO10.1', type: 'knowledge', description: 'Beskriva blödningskällor vid bäckentrauma', sortOrder: 1 },
    { chapterNumber: 10, code: 'ALO10.2', type: 'comprehension', description: 'Förklara indikationer för preperitonal packing', sortOrder: 2 },
    { chapterNumber: 10, code: 'ALO10.3', type: 'application', description: 'Koordinera multidisciplinär handläggning vid instabilt bäcken', sortOrder: 3 },

    // Kapitel 11: Pediatrisk polytrauma
    { chapterNumber: 11, code: 'ALO11.1', type: 'knowledge', description: 'Beskriva fysiologiska skillnader hos barn vid trauma', sortOrder: 1 },
    { chapterNumber: 11, code: 'ALO11.2', type: 'application', description: 'Anpassa vätske- och blodbehandling för barn', sortOrder: 2 },
    { chapterNumber: 11, code: 'ALO11.3', type: 'comprehension', description: 'Identifiera tecken på icke-accidentellt trauma', sortOrder: 3 },

    // Kapitel 12: Traumateamledning
    { chapterNumber: 12, code: 'ALO12.1', type: 'skill', description: 'Demonstrera effektiv traumateamledning', sortOrder: 1 },
    { chapterNumber: 12, code: 'ALO12.2', type: 'knowledge', description: 'Beskriva icke-tekniska färdigheter (NTS)', sortOrder: 2 },
    { chapterNumber: 12, code: 'ALO12.3', type: 'application', description: 'Genomföra strukturerad debriefing', sortOrder: 3 },

    // Kapitel 13: Masskadesituationer
    { chapterNumber: 13, code: 'ALO13.1', type: 'skill', description: 'Utföra START-triage', sortOrder: 1 },
    { chapterNumber: 13, code: 'ALO13.2', type: 'application', description: 'Anpassa ortopedisk handläggning vid resursbegränsning', sortOrder: 2 },
    { chapterNumber: 13, code: 'ALO13.3', type: 'comprehension', description: 'Förklara principer för sjukhuskapacitet vid masskada', sortOrder: 3 },

    // Kapitel 14: Kvalitet och förbättring
    { chapterNumber: 14, code: 'ALO14.1', type: 'knowledge', description: 'Beskriva trauma-kvalitetsregister och indikatorer', sortOrder: 1 },
    { chapterNumber: 14, code: 'ALO14.2', type: 'application', description: 'Genomföra M&M-konferens enligt strukturerad modell', sortOrder: 2 },
    { chapterNumber: 14, code: 'ALO14.3', type: 'analysis', description: 'Identifiera förbättringsområden med PDSA-cykel', sortOrder: 3 },
  ];
}

// A-ORTIM Advanced Chapter Content
function getAdvancedChapterContent(chapterNumber: number): string {
  const contents: Record<number, string> = {
    1: `# Avancerad bilddiagnostik

## CT-angiografi vid extremitetstrauma

### Indikationer
- Misstänkt kärlskada vid normal ABI men klinisk misstanke
- Penetrerande trauma nära kärlstrukturer
- Komplexa frakturer med kärlnärhet
- Preoperativ planering vid vaskulär rekonstruktion

### Tolkning av CT-angio

#### Direkta tecken på kärlskada
- **Extravasering** - Kontrastläckage utanför kärlet
- **Pseudoaneurysm** - Fokalt utbuktande med kontrastfyllnad
- **AV-fistel** - Tidig venfyllnad
- **Ocklusion** - Abrupt kontrastuppehåll
- **Intimaskada** - Intimal flap, lumeninskränkning

#### Indirekta tecken
- Hematom kring kärl
- Benförskjutning mot kärlstrukturer
- Mjukdelssvullnad

### MR vid mjukdelsskador

#### Indikationer
- Plexusskador
- Muskelsenskador
- Ligamentskador vid luxationer
- Nervrotsskador

## Interventionell radiologi

### Endovaskulära tekniker
- **Embolisering** - Vid pågående blödning
- **Stentgraft** - Vid pseudoaneurysm eller AV-fistel
- **Trombektomi** - Vid akut ocklusion

### Samarbete med IR-avdelningen
- Tidig kontakt vid bäckentrauma
- Ha patient redo för angio vid instabilitet
- Kommunicera tidsramar tydligt

## Nyckelbudskap

✓ CT-angio är förstahandsval vid misstänkt kärlskada
✓ Kan göras utan fördröjning vid stabil patient
✓ Interventionell radiologi är ett alternativ till öppen kirurgi
✓ Koordinera med kärl-/IR-jour tidigt
`,
    2: `# Neurovaskulär bedömning

## Nervskador vid extremitetstrauma

### Anatomisk översikt

#### Övre extremitet
| Nerv | Typisk skada | Motoriskt bortfall | Sensoriskt bortfall |
|------|--------------|-------------------|---------------------|
| N. radialis | Humerusfraktur | Handleds-/fingerextension | Dorsalt hand (1:a interosseum) |
| N. medianus | Armbågsluxation, handledsfrx | Tumopposition, flexion dig II-III | Volart dig I-III |
| N. ulnaris | Armbågstrauma | Fingerabduktion, dig IV-V flexion | Dig IV-V |

#### Nedre extremitet
| Nerv | Typisk skada | Motoriskt bortfall | Sensoriskt bortfall |
|------|--------------|-------------------|---------------------|
| N. peroneus | Fibulahals-frx, knälux | Fotdorsalflex, eversion | Fotrygg, lateralt underben |
| N. tibialis | Knäledsluxation | Plantarflexion, tåflexion | Fotsula |
| N. ischiadicus | Höftluxation, bäckenfrx | Beroende på nivå | Nedanför knä |

### Plexus brachialis-skador

#### Klassifikation
- **Supraklavikulära** (rotskador) - Allvarligare prognos
- **Infraklavikulära** (trunkus/fasciklar) - Bättre prognos

#### Kliniska mönster
- **Erb-Duchenne (C5-C6)** - "Porter's tip" position
- **Klumpke (C8-T1)** - Handledens och fingrarnas flexorer
- **Total plexusskada** - Komplett arm-förlamning

### Mikrovaskulär anatomi

#### Perfusionszoner
- Muskel är mest känslig för ischemi (4-6h)
- Nerv något mer tålig (6-8h)
- Hud och ben tåligast (8-12h)

## Kliniskt fall

> **Fall A2.1:** En 25-årig man inkommer efter MC-olycka. Kraftig axelsmärta, armen hänger slapt. Kan ej lyfta armen, ej böja armbågen. Sensorik bevarad ulnart men nedsatt radialt.
>
> **Bedömning:** Supraklavikulär plexusskada C5-C6 (Erb-Duchenne-mönster).
>
> **Utredning:** MR plexus, EMG efter 3-4 veckor. Tidig kontakt handkirurg.

## Nyckelbudskap

✓ Dokumentera neurologisk status FÖRE sövning/åtgärd
✓ N. peroneus är den vanligaste nervskadan vid trauma
✓ Plexusskador kräver MR och specialist-uppföljning
✓ Tidigt EMG (3-4v) för prognosbedömning
`,
    3: `# Intraoperativ bedömning

## Vävnadsviabilitet

### Kliniska tecken på viabelt vävnad

#### Muskel - "De 4 C:na"
- **Color** - Röd, ej gråblek
- **Consistency** - Fast, ej mosig
- **Contractility** - Kontraherar vid stimulering
- **Capacity to bleed** - Blöder vid incision

#### Hud
- Kapillär återfyllnad
- Dermalt blödning
- Färg och temperatur

### Fluorescein-angiografi

#### Metod
1. IV injektion av fluorescein (10-15 mg/kg)
2. Belysning med Wood's lampa
3. Bedöm fluorescens i vävnaden

#### Tolkning
- Stark fluorescens = god perfusion
- Ingen/svag fluorescens = hotad vävnad
- Användbart vid lambåkirurgi och amputationsnivå

### Indocyaningrön (ICG) angiografi

#### Fördelar över fluorescein
- Snabbare metabolism
- Kan upprepas
- Tydligare kontrast
- Near-infrared visualisering

### Intraoperativa beslut

#### Debridering - "När i tvivel, ta bort mer"
- Osäker vävnad revideras om 24-48h ("second look")
- Var generös med debridering initialt
- Infekterad/nekrotisk vävnad = värre än defekt

#### Nervreparation
- Primär repair om skarp transsektion
- Grafting vid defekt > 2 cm
- Tidig märkning för senare rekonstruktion

## Kliniskt fall

> **Fall A3.1:** Under operation av öppen tibiafraktur typ IIIB ser du att m. tibialis anterior har gråblek färg och kontraherar inte vid elektrisk stimulering.
>
> **Åtgärd:** Muskeln är icke-viabel. Debridera tills blödande, kontraktil vävnad nås. Dokumentera omfattningen. Planera för second-look om 48h.

## Nyckelbudskap

✓ "De 4 C:na" för muskelbedömning
✓ ICG-angio är bättre än fluorescein men dyrare
✓ Vid tveksamhet: second-look operation
✓ Generös debridering minskar infektionsrisk
`,
    4: `# Vaskulär reparation

## Temporär shunting

### Indikationer
- Kombinerad kärl- och skelettskada
- Instabil patient (DCO)
- Lång transporttid till kärlkirurg

### Teknik

#### Carotid shunt (Argyle/Javid)
1. Exponera kärlstumpar proximalt och distalt
2. Spola med hepariniserad koksalt
3. Inserera shunten, fixera med silkesligaturer
4. Kontrollera backflow och distalt flöde

#### Improvisation
- Infusionsslang med adaptrar
- Nasogastrisk sond
- Thoraxdrän (mindre diameter)

### Tidsramar
- Shunt kan sitta 6-24 timmar
- Dokumentera tid för insertion
- Monitorera distalt kontinuerligt

## Definitiv vaskulär rekonstruktion

### Primär repair
- Indikation: Ren transsektion, ingen spänning
- Teknik: 6-0 prolene, everterade suturer
- Komplett debridering av kärlkanter först

### Interpositionsgraft

#### Autolog ven
- V. saphena magna (förstahandsval)
- V. cephalica/basilica
- Reverseras eller använd som "non-reversed" med valvotom

#### Syntetiskt
- PTFE (polytetrafluoroetylen)
- Dacron
- Används vid kontaminerade sår med försiktighet

### Postoperativ monitorering
- Doppler var 2:a timme första dygnet
- Kontrollera distala pulsar
- Observera för kompartmentsyndrom

## Fasciotomi vid revaskularisering

### Profylaktisk fasciotomi
**Indikationer:**
- Ischemitid > 4-6 timmar
- Kombinerad artär + venskada
- Massiv mjukdelsskada
- Hypotension under ischemiperioden

## Kliniskt fall

> **Fall A4.1:** Patient med suprakondylär humerusfraktur och avsaknad a. brachialis-puls. Du planerar ORIF + kärlrekonstruktion.
>
> **Operationsplan:**
> 1. Först: reducera fraktur, temporär K-wire fixation
> 2. Exponera a. brachialis - segmentell skada 3 cm
> 3. V. saphena graft från kontralateralt ben
> 4. End-to-end anastomos med 6-0 prolene
> 5. Definitiv plattfixation
> 6. Fasciotomi av underarmen profylaktiskt

## Nyckelbudskap

✓ "Stabilisera sedan revaskularisera" - eller shunta först
✓ Shunt köper tid för skelettfixation
✓ Autolog ven > syntetiskt material
✓ Profylaktisk fasciotomi vid >4-6h ischemi
`,
    5: `# Fasciotomitekniker

## Underbenets kompartment

### Dubbelincisionsteknik (standard)

#### Lateral incision
1. Markera fibulahuvud och laterala malleol
2. Incision 1 cm framför fibula, hel längden
3. Öppna anteriora kompartmentet först
4. Identifiera intermuskulära septumet
5. Öppna laterala kompartmentet

#### Medial incision
1. 2 cm posteriort om tibiakanten
2. Incision hel underbenslängden
3. Öppna ytliga posteriora kompartmentet
4. Incision djupt genom soleus-fascia
5. Öppna djupa posteriora kompartmentet

### Enkelincisionsteknik (sällsynt)
- Fibulektomi med åtkomst till alla 4 kompartment
- Används vid svårt skadad fibula

## Underarmens kompartment

### Volar dekompression
1. Börja proximalt om armbågsvecket
2. Kors armbågen snett (undvik nerv)
3. Fortsätt till handleden (kan förlänga till karpaltunnel)
4. Öppna lacertus fibrosus
5. Öppna djupa flexorfascian

### Dorsal dekompression
- Ofta ej nödvändig om volar gjorts
- Rak incision dorsalt vid behov
- Öppna mobila wad

## Lår och höft

### Lårets kompartment
- Anteriort, posteriort, medialt
- Lateral incision från trochanter major till laterala femurkondylen
- Rak medial incision för adduktorerna

### Glutealregionen
- Sällan nödvändigt
- Tänk på vid bäckentrauma med gluteal hematom

## Hand

### Intrinsic muscles
- 2 dorsala incisioner över metakarpale II och IV
- Öppnar alla interosseuskompartment

## Postoperativ vård

### Sårbehandling
- Låt såren ligga öppna
- Fuktiga förband eller VAC
- Second-look efter 48-72h
- Sekundär stängning eller hudtransplant

### Komplikationer
- Infektion
- Nervskada (vid incision)
- Blödning
- Adherenser

## Nyckelbudskap

✓ Dubbelincision på underben = säkrast
✓ ALLA kompartment måste öppnas
✓ Låt såren ligga öppna - aldrig primärstäng
✓ Second-look är regel, inte undantag
`,
    6: `# Extern fixation avancerat

## Frame-konstruktion

### Principer
- **Monotube/monolateral** - Enklast, snabbast
- **Bilateral/biplanar** - Starkare, använd vid instabila frakturer
- **Ringfixatorer** - Maximal stabilitet, komplexa rekonstruktioner

### Pinplacering

#### Säkra zoner
| Region | Säker zon | Riskstrukturer |
|--------|-----------|----------------|
| Proximala femur | Lateral | N. ischiadicus |
| Distala femur | Lateral | Popliteakärl |
| Proximala tibia | Medial, anteromedial | N. peroneus |
| Distala tibia | Anteromedial | Ingen större |

#### Teknik
1. Incision genom hud, ej "stab"
2. Trubbig dissektion till ben
3. Förborra med skarp borr (kylning!)
4. Handkraft sista 1 cm
5. Bicortikal fixation

### Frame-konfiguration

#### Femurfraktur
- Minst 2 pins proximal och 2 distal
- 30° offset mellan pins
- Röret anteriort eller lateralt

#### Tibiafraktur
- Anteromedial pinplacering
- Röret medialt
- Ankel-spanning vid distal fraktur

## Spanning extern fixator

### Knäspanning
- Proximala tibiapins + distala femurpins
- Fixatorrör över knäledens lateralsida
- Knäet i 10-20° flexion

### Armbågsspanning
- Humeruspins + ulnapins
- Flexion 90°

## Konvertering till intern fixation

### Timing
- Mjukdelarna måste läka först (7-14 dagar)
- Inga tecken på pin-site infektion
- Patient fysiologiskt stabil

### Infektionsrisk
- Ökar efter 2 veckor med extern fix
- Pin-site odling före konvertering
- Antibiotika perioperativt

## Kliniskt fall

> **Fall A6.1:** 35-årig man med öppen tibiafraktur typ IIIB och stort mjukdelsdefekt. Du planerar extern fixation.
>
> **Frame-design:**
> - 2 pins i proximala tibia (anteromedial)
> - 2 pins i distala tibia (anteromedial)
> - Monolateral frame
> - Planera second-look dag 2, lambå dag 5-7

## Nyckelbudskap

✓ Pins i säkra zoner - känn anatomin
✓ Bicortikal, ej genom mjukdelar
✓ Konvertering till intern fix inom 2 veckor
✓ Externa fixatorer är "bryggor" - inte definitivt
`,
    7: `# Mjukdelstäckning

## Behandlingstrappa

### Nivå 1: Primärslutning
- Sällan möjligt vid typ III öppna frakturer
- Endast vid rent sår, ingen spänning
- Aldrig vid tveksam viabilitet

### Nivå 2: Sekundärslutning
- Efter några dagars VAC/fuktiga förband
- När såret är rent och granulerar
- Ofta med hudtransplantat

### Nivå 3: Hudtransplantat (SSG)
- Split-skin graft (delhudstransplantat)
- Kräver granulationsbädd
- Tar ej på exponerat ben/sena utan periost

### Nivå 4: Lokala lambåer
- Rotationslambåer
- Transpositionslambåer
- Behåller egen blodförsörjning

### Nivå 5: Fria lambåer (mikrokirurgi)
- Latissimus dorsi (stora defekter)
- Gracilis (mindre defekter)
- ALT (anterolateral thigh)
- Kräver mikrovaskulär anastomos

## VAC-terapi

### Indikationer
- Sår som ej kan stängas primärt
- Främja granulationsvävnad
- Minska ödem
- Skydda medan man väntar på lambå

### Inställningar
- Kontinuerligt: -125 mmHg
- Intermittent: -75 till -125 mmHg (främjar granulation)
- Byt förband var 2-3:e dag

## Timing av mjukdelstäckning

### "Fix and flap" konceptet
- Definitiv skelettfixation + lambå inom 72-96h
- Minskar infektionsrisk signifikant
- Kräver tillgång till plastikkirurg

### Klinisk verklighet
- Ofta staged approach i Sverige
- Första op: debridering + extern fix
- Dag 2-5: re-debridering
- Dag 5-10: lambå/SSG

## Kliniskt fall

> **Fall A7.1:** Öppen tibiafraktur typ IIIB med 10x8 cm mjukdelsdefekt över tibiakanten. Exponerat ben utan periost.
>
> **Plan:**
> 1. Dag 0: Debridering, extern fix, VAC
> 2. Dag 2: Second-look, ytterligare debridering
> 3. Dag 5: Plastikkirurg bedömer - fri latissimus dorsi lambå
> 4. Dag 5-7: Mikrovaskulär lambåoperation
> 5. SSG över muskel dag 10

## Nyckelbudskap

✓ "Fix and flap" inom 72-96h är målet
✓ VAC är bro till definitiv täckning
✓ Exponerat ben utan periost = kräver lambå
✓ Tidig plastikkirurgisk kontakt
`,
    8: `# Multitrauma-koordinering

## Prioritering vid konkurrerande skador

### Primary survey först - ALLTID
A - Airway
B - Breathing
C - Circulation (inkl. massiv blödning)
D - Disability
E - Exposure

### Ortopedins plats i prioriteringen

#### Omedelbart (C-problem)
- Massiv extremitetsblödning
- Instabil bäckenring med blödning
- Traumatisk amputation

#### Brådskande (timmar)
- Kärlskada med ischemi (<6h)
- Öppen fraktur (antibiotika <1h, debrid <6h)
- Kompartmentsyndrom

#### Elektiv akut (inom dygn)
- Slutna frakturer
- Luxationer (efter reposition)

## Parallell handläggning

### "Damage control resuscitation"
- Permissiv hypotension (MAP >65)
- Begränsa kristalloider
- Tidig blodprodukter (1:1:1)
- TXA inom 3h

### Samtidiga åtgärder
- Thoraxdrän + bäckenbälte samtidigt
- Ex-fix kan göras på IVA/trauma-rummet
- Kommunikation mellan team essentiellt

## Operationsordning vid multitrauma

### Principen "Life > Limb > Function"

#### Exempel: Buk + bäcken + femur
1. Laparotomi för bukblödning
2. Preperitonal packing vid bäcken
3. Extern fixation bäcken
4. Extern fixation femur
5. ICU för resuscitering
6. Relook/definitiv kirurgi dag 2-4

### Timing av ortopedisk fixation
- **ETC** (Early Total Care): Allt i en seans - stabil patient
- **DCO** (Damage Control): Staged - instabil patient

## Kommunikation

### Traumateam-möte
- Kort briefing: vem gör vad
- Regelbunden uppdatering var 15 min
- Tydlig teamledare

### SBAR vid konsultation
- Situation: "Multitrauma med bäcken + femur"
- Background: "55-årig man, trafikolycka"
- Assessment: "Instabil bäcken APC-III, öppen femurfraktur"
- Recommendation: "Behöver ex-fix av bäcken nu"

## Nyckelbudskap

✓ ABCDE först - ortopedi är del av C
✓ Parallella team sparar tid
✓ DCO vid instabil patient, ETC vid stabil
✓ Kommunicera, kommunicera, kommunicera
`,
    9: `# Mangled Extremity

## Definition
En extremitet med kombinerad skada på minst 3 av:
- Ben
- Mjukdelar
- Kärl
- Nerver

## MESS Score

### Mangled Extremity Severity Score

| Komponent | Poäng |
|-----------|-------|
| **Skelett/mjukdelar** | |
| Låg energi | 1 |
| Medel energi | 2 |
| Hög energi | 3 |
| Mycket hög (crush) | 4 |
| **Ischemi** | |
| Puls reducerad/avsaknad | 1* |
| Pulslös, parestetisk | 2* |
| Kall, paralytisk | 3* |
| **Chock** | |
| BT >90 konsistent | 0 |
| Transient hypotension | 1 |
| Persistent hypotension | 2 |
| **Ålder** | |
| <30 år | 0 |
| 30-50 år | 1 |
| >50 år | 2 |

*Dubblas om ischemi >6h

### Tolkning
- MESS ≥7: Hög sannolikhet för amputation
- MESS <7: Limb salvage ofta möjlig
- **OBS:** Används som vägledning, ej ensamt beslutsunderlag

## Andra scoringsystem

### NISSSA
- Nerve injury, Ischemia, Soft tissue, Skeletal, Shock, Age
- Mer komplex, inkluderar nervstatus

### LSI (Limb Salvage Index)
- Inkluderar djup venös skada
- Bättre prediktion i vissa studier

## Amputation vs limb salvage

### Faktorer som talar för amputation
- MESS ≥7
- Total tibialis posterior-skada
- Varm ischemitid >6-8h
- Crush-skada med utbredd muskelskada
- Äldre patient med komorbiditeter
- Patientens önskemål

### Faktorer som talar för salvage
- Barn/ungdom
- Partiell nervfunktion bevarad
- Kort ischemitid
- Ren traumamekanism
- God allmänhälsa

## Det svåra samtalet

### Information till patient/anhörig
- Ärlig prognos
- Beskriva alternativen
- Tid för beslut om möjligt
- Respektera patientens autonomi

### Psykologiska aspekter
- Tidig kontakt kurator/psykolog
- Protetkontakt tidigt vid amputation
- Långsiktig uppföljning

## Kliniskt fall

> **Fall A9.1:** 28-årig man, MC-olycka. Öppen tibiafraktur med 15 cm defekt, popliteaocklusion, total peroneuspares. Ischemitid 5h. MESS = 8.
>
> **Diskussion:** MESS talar för amputation, men patient är ung. Diskutera med patient och anhöriga. Överväg revaskularisering + extern fix + lambå som ett försök. Tydlig plan om amputation om limb salvage misslyckas.

## Nyckelbudskap

✓ MESS är vägledning, ej absolut gräns
✓ N. tibialis posterior-funktion är nyckel för gång
✓ Involvera patient i beslutet
✓ Amputation är ej misslyckande - kan vara bästa utfallet
`,
    10: `# Bäckentrauma avancerat

## Hemodynamisk instabilitet

### Definition
- BT <90 systoliskt trots 2L kristalloid
- Behov av vasopressor
- Pågående transfusionsbehov

### Blödningskällor vid bäckentrauma
1. Venös plexus (vanligast) - 80%
2. Cancellöst ben
3. Arteriell (a. iliaca interna grenar) - 20%

## Prehospital stabilisering

### Bäckenbälte
- Appliceras på alla misstänkta bäckenskador
- Över trochantranterna
- Kontrollera att det sitter rätt

### Circumferential sheet
- Alternativ om bälte saknas
- Lakan runt bäckenet, knut anteriort

## Algoritm för instabil bäckenskada

### Hemodynamiskt instabil patient

1. **Traumarummet**
   - ABCDE
   - Bäckenbälte
   - MTP (massiv transfusion)

2. **Beslutspunkt: Röntgen/FAST**
   - FAST positiv → Laparotomi + packing
   - FAST negativ → Bäckenorsakad blödning trolig

3. **Blödningskontroll bäcken**
   - Preperitonal packing (snabb, effektiv för venös blödning)
   - ELLER angioembolisering (för arteriell blödning)
   - ELLER REBOA (temporär)

4. **Mekanisk stabilisering**
   - Extern fixation
   - C-clamp vid posterior instabilitet

## Preperitonal packing

### Teknik
1. Nedre medellinjeincision
2. Öppna ENDAST preperitonealt (gå ej in i buken)
3. Packa med 3-5 dukar per sida
4. Temporärstäng buken
5. Relook efter 24-48h

### Fördelar
- Snabbt (15-20 min)
- Kontrollerar venös blödning effektivt
- Kan göras av ortoped/traumakirurg

## Extern fixation av bäcken

### Indikationer
- "Open book" (APC) skador
- Mekanisk instabilitet
- Del av DCO

### Anterior frame
- Pins i crista iliaca ELLER supraacetabulärt
- Enkelt, snabbt
- Stabiliserar främre ringen

### C-clamp
- Vid bakre instabilitet (SI-led)
- Komprimerar bakre ringen
- Kräver erfarenhet - risk för nervskada

## Kliniskt fall

> **Fall A10.1:** 45-årig kvinna, fotgängare påkörd. BT 70/40 trots 2L Ringer. CT visar APC-III med aktiv blödning från v. iliaca interna-grenar.
>
> **Åtgärd:**
> 1. MTP igång
> 2. Till op - preperitonal packing (20 min)
> 3. Extern fixation anteriort
> 4. Till IVA
> 5. Relook + ev. angio dag 2

## Nyckelbudskap

✓ Bäckenblödning = ofta venös (packing effektivt)
✓ Preperitonal packing kan göras av ortoped
✓ Angio vid arteriell blödning (kontrast-blush på CT)
✓ Anterior ex-fix stabiliserar "open book"
`,
    11: `# Pediatrisk polytrauma

## Fysiologiska skillnader

### Kardiovaskulärt
- Högre hjärtfrekvens normalt
- Bibehåller BT längre (kompenserar)
- När BT faller = mycket allvarligt (>30% blodförlust)
- Tachykardi är tidigt tecken

### Anatomi
- Stort huvud = högre cervikalskaderisk
- Eftergivlig thorax = lungkontusion utan revbensfraktur
- Stor mjälte/lever = högre risk för bukskada

### Normal vitalparametrar
| Ålder | HF | BT systoliskt | AF |
|-------|-----|---------------|-----|
| Spädbarn | 120-160 | 70-90 | 30-40 |
| 1-5 år | 100-130 | 80-100 | 20-30 |
| 6-12 år | 80-110 | 90-110 | 16-24 |

## Ortopediska säröverväganden

### Frakturmönster
- Greenstick och torus-frakturer
- Fysiolysis (Salter-Harris)
- Suprakondylär humerusfraktur = vanlig + kärlskaderisk
- Femurfraktur = misstänk barnmisshandel hos <3 år

### Icke-accidentellt trauma (NAI)
**Varningssignaler:**
- Frakturer hos icke-mobilt barn
- Multipla frakturer i olika läkningsstadier
- Metafysära "bucket handle" frakturer
- Oförklarlig skademekanism

### Handläggning vid NAI-misstanke
1. Behandla skadorna
2. Anmäl till socialtjänsten (lagkrav)
3. Dokumentera noggrant
4. Skelettröntgen (skeletal survey)

## Vätske- och blodbehandling

### Volym
- Bolus: 20 ml/kg Ringer
- Upprepa x2 vid behov
- Om fortsatt instabil: blodtransfusion

### Blodprodukter
- 10-20 ml/kg erytrocyter
- Tidig TXA (15 mg/kg)
- MTP-protokoll anpassat för barn

## Damage control hos barn

### Samma principer som vuxna
- Extern fixation
- Temporär stabilisering
- Definitiv kirurgi efter stabilisering

### Skillnader
- Barn tål hypotermi sämre
- Snabbare förlust av temperatur
- Aktiv uppvärmning prioriteras

## Kliniskt fall

> **Fall A11.1:** 8-årig pojke påkörd av bil. GCS 13, HR 140, BT 85/55. Femurfraktur dx, bäckensmärta, bukspänning.
>
> **Bedömning:** Kompenserad chock (tachykardi, lågt normalt BT).
>
> **Åtgärd:**
> 1. 20 ml/kg Ringer x2
> 2. FAST: Fri vätska
> 3. Till op: Laparotomi (mjältruptur)
> 4. Extern fixation femur
> 5. Bäcken stabil - konservativ

## Nyckelbudskap

✓ Barn kompenserar länge - tachykardi är varningstecken
✓ Suprakondylär humerusfraktur = kolla kärl (a. brachialis)
✓ NAI måste övervägas - anmälningsplikt
✓ Aktiv uppvärmning är kritiskt
`,
    12: `# Traumateamledning

## Teamledarens roll

### Före patientens ankomst
- Samla information (MIST)
- Fördela roller
- Briefing: "Förväntad patient, roller, första åtgärder"
- Säkerställ utrustning

### Under mottagandet
- Stå "vid fotändan" - överblick
- ABCDE-ordning
- Delegera - utför ej själv
- Closed-loop kommunikation
- Regelbunden sammanfattning

### Beslutsfattande
- Strukturerat: ABCDE → Undersökning → Plan
- Högt tänkande: "Jag tänker att... vad säger ni?"
- Efterfråga input från teamet

## Icke-tekniska färdigheter (NTS)

### Situationsmedvetenhet
- Perception: Vad händer?
- Comprehension: Vad betyder det?
- Projection: Vad kommer hända?

### Beslutsfattande
- Recognize-primed decisions (erfarenhet)
- Rule-based decisions (protokoll)
- Analytiska beslut (vid tid)

### Teamwork
- Informationsdelning
- Stöd till teammedlemmar
- Konflikthantering

### Uppgiftshantering
- Prioritering
- Resursutnyttjande
- Tidshantering

## Kommunikation

### Closed-loop
1. Order: "Ge 1g Cyklokapron"
2. Bekräftelse: "1g Cyklokapron"
3. Utförande
4. Rapport: "Cyklokapron given"

### Check-back
"Så vi har en 35-årig man med bäckenfraktur och fri vätska på FAST. BT är nu 90. Planen är laparotomi följt av extern fixation. Stämmer det?"

### Speak up
Alla i teamet har rätt och skyldighet att påtala fel eller säkerhetsrisker

## Debriefing

### Hot debrief (direkt efter)
- 5 minuter
- Vad gick bra?
- Vad kan förbättras?
- Emotionell ventilering

### Cold debrief (senare)
- Strukturerad genomgång
- Systemförbättringar
- Utbildningsbehov

## Kliniskt fall

> **Fall A12.1:** Du är traumaledare. Patient ankommer, teamet verkar okoordinerat, flera pratar samtidigt.
>
> **Åtgärd:**
> 1. "STOPP - jag är teamledare"
> 2. "Vi börjar om. ABCDE"
> 3. Fördela tydliga roller
> 4. "Rapportera till mig innan ni gör något"
> 5. Fortsätt strukturerat

## Nyckelbudskap

✓ Teamledare leder - utför ej
✓ Closed-loop kommunikation alltid
✓ "Speak up" - alla är säkerhetsbarriärer
✓ Debriefing efter varje fall
`,
    13: `# Masskadesituationer

## Definition och aktivering

### Masskada
Situation där antalet skadade överstiger tillgängliga resurser med normala rutiner

### Aktivering
- Prehospital information: ≥5 allvarligt skadade
- Kommando etableras
- Personalförstärkning
- Materialanskaffning

## Triage

### START (Simple Triage And Rapid Treatment)

#### Steg 1: Kan gå?
- JA → GRÖN (kan vänta)
- NEJ → Fortsätt

#### Steg 2: Andas?
- NEJ efter friläggning av luftväg → SVART (avliden)
- JA → Fortsätt

#### Steg 3: Andningsfrekvens
- >30/min → RÖD (omedelbar)
- <30 → Fortsätt

#### Steg 4: Kapillär återfyllnad
- >2 sek → RÖD (omedelbar)
- <2 sek → Fortsätt

#### Steg 5: Följer uppmaningar?
- NEJ → RÖD (omedelbar)
- JA → GUL (kan vänta något)

### Retriaging
- Kontinuerlig omvärdering
- Patienter kan försämras/förbättras
- Dokumentera varje triagering

## Ortopediska prioriteringar vid masskada

### Omedelbart (RÖD)
- Tourniquet vid massiv blödning
- Bäckenbälte vid instabilt bäcken
- Reposition av felställd fraktur med kärlpåverkan

### Brådskande (GUL)
- Fasciotomi vid kompartment
- Öppna frakturer (antibiotika ges, debridering väntar)
- Extern fixation som temporär stabilisering

### Kan vänta (GRÖN)
- Slutna frakturer
- Gipsning
- Mjukdelsskador

## Resursprioritering

### Personal
- Ortoped till triage av extremitetsskador
- Erfarna till de rödaste patienterna
- Dokumentatör per patient

### Material
- Tourniquets
- Bäckenbälten
- Extern fixationsutrustning
- Gips

### Lokaler
- Traumarum för RÖD
- Observation för GUL
- Väntrum för GRÖN

## Kommunikation

### Kommandostruktur
- Sjukvårdsledare (medicinskt ansvarig)
- Sektionsledare (akuten, operation, IVA)
- Teamledare (per patient)

### Rapportering
- Regelbunden lägesrapport
- Antal patienter per kategori
- Resursstatus

## Kliniskt fall

> **Fall A13.1:** Bussolycka med 20 skadade. Du är ortoped på plats.
>
> **Åtgärd:**
> 1. Rapportera till sjukvårdsledare
> 2. Triage av extremitetsskador
> 3. Tourniquet/bäckenbälte på RÖD
> 4. Delegera gipsning av GRÖNA till yngre kollega
> 5. Assistera vid operationer enligt prioritet

## Nyckelbudskap

✓ Triage räddar flest liv vid begränsade resurser
✓ "Gör mest gott för flest" - ej individuell optimering
✓ Retriaging är kritiskt - tillstånd förändras
✓ Kommunikation via kommandokedjan
`,
    14: `# Kvalitet och förbättring

## Kvalitetsregister

### SweTrau (Svenska Traumaregistret)
- Nationellt register för svårt skadade
- ISS ≥9 inkluderas
- Data för kvalitetsförbättring
- Benchmarking mellan sjukhus

### Variabler som registreras
- Demografi
- Skademekanism
- ISS, NISS
- Vitalparametrar
- Tidsintervall (skada → op)
- Mortalitet, komplikationer

### Svenska Höftprotesregistret / Frakturregister
- Ortopedspecifika register
- Implantatöverlevnad
- Komplikationer

## Mortality & Morbidity (M&M)

### Syfte
- Lärande från komplikationer
- Systemförbättring
- Ej skuldbeläggning

### Struktur
1. Fallpresentation
2. Tidslinje
3. Identifiering av avvikelser
4. Rotorsaksanalys
5. Förbättringsförslag
6. Uppföljning av åtgärder

### Rotorsaksanalys
- Human factors (trötthet, stress)
- Utrustning (saknas, fel)
- Kommunikation
- Organisation/system
- Utbildning

## Evidensbaserad praktik

### Litteratursökning
- PubMed, Cochrane
- Fokusera på RCT och meta-analyser
- Kritisk granskning

### GRADE-systemet
- Kvalitet på evidens: Hög/Måttlig/Låg/Mycket låg
- Styrka på rekommendation: Stark/Svag

### Implementering av ny kunskap
- Lokala riktlinjer
- Utbildning
- Uppföljning av efterlevnad

## Simulering och träning

### Typer
- Tabletop exercises
- Procedurträning (kadaver, modeller)
- Fullskalig simulering

### Feedback
- Strukturerad debriefing
- Videoanalys
- Checklistor

## Kontinuerligt förbättringsarbete

### PDSA-cykel
1. **Plan** - Identifiera förbättringsområde
2. **Do** - Testa förändring i liten skala
3. **Study** - Analysera resultat
4. **Act** - Implementera eller justera

### Exempel på förbättringsprojekt
- Tid till antibiotika vid öppen fraktur
- Andel dokumenterade neurovaskulära status
- Tid till fasciotomi vid kompartment

## Nyckelbudskap

✓ Registerdata möjliggör förbättring
✓ M&M är lärande, ej bestraffning
✓ PDSA-cykler för kontinuerlig förbättring
✓ Simulering bygger kompetens utan patientrisk
`,
  };

  return contents[chapterNumber] || `# Kapitel ${chapterNumber}\n\nInnehåll under utveckling...`;
}

// A-ORTIM Quiz Questions
function getAdvancedQuizQuestions() {
  return [
    // Kapitel 1: Avancerad bilddiagnostik
    {
      code: 'A1.1',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka är direkta tecken på kärlskada vid CT-angiografi?',
      options: [
        { text: 'Extravasering, pseudoaneurysm, AV-fistel, ocklusion, intimaskada', correct: true },
        { text: 'Hematom, svullnad, fraktur', correct: false },
        { text: 'Ökad kontrastuppladdning i mjukdelar', correct: false },
        { text: 'Benförlust och periostreaktion', correct: false },
      ],
      explanation: 'Direkta tecken på kärlskada vid CT-angio inkluderar extravasering, pseudoaneurysm, AV-fistel, ocklusion och intimaskada.',
      reference: 'A-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: 'A1.2',
      chapterNumber: 1,
      bloomLevel: 'APPLICATION',
      question: 'Patient med misstänkt kärlskada men normalt ABI (0.95). Vad är nästa steg?',
      options: [
        { text: 'CT-angiografi vid fortsatt klinisk misstanke', correct: true },
        { text: 'Ingen ytterligare utredning behövs', correct: false },
        { text: 'Direkt till operation', correct: false },
        { text: 'Upprepa ABI om 24 timmar', correct: false },
      ],
      explanation: 'Normalt ABI utesluter inte kärlskada helt. Vid klinisk misstanke bör CT-angiografi utföras.',
      reference: 'A-ORTIM Kursbok, Kapitel 1',
    },
    // Kapitel 4: Vaskulär reparation
    {
      code: 'A4.1',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Du ska utföra vaskulär rekonstruktion efter 5 timmars ischemi. Vilken åtgärd bör göras profylaktiskt?',
      options: [
        { text: 'Fasciotomi av alla kompartment', correct: true },
        { text: 'Antibiotika endast', correct: false },
        { text: 'Ingen profylax behövs', correct: false },
        { text: 'Kylning av extremiteten', correct: false },
      ],
      explanation: 'Vid ischemitid >4-6 timmar bör profylaktisk fasciotomi utföras för att förebygga kompartmentsyndrom vid reperfusion.',
      reference: 'A-ORTIM Kursbok, Kapitel 4',
    },
    // Kapitel 5: Fasciotomi
    {
      code: 'A5.1',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken teknik är standard för fasciotomi av underbenet?',
      options: [
        { text: 'Dubbelincision - lateral och medial', correct: true },
        { text: 'Enkelincision anteriort', correct: false },
        { text: 'Endast lateral incision', correct: false },
        { text: 'Perkutan teknik', correct: false },
      ],
      explanation: 'Dubbelincisionsteknik med lateral och medial incision är standard för att nå alla fyra kompartment på underbenet.',
      reference: 'A-ORTIM Kursbok, Kapitel 5',
    },
    // Kapitel 6: Extern fixation
    {
      code: 'A6.1',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Var är den säkra zonen för pinplacering i proximala tibia?',
      options: [
        { text: 'Medialt och anteromedialt', correct: true },
        { text: 'Lateralt', correct: false },
        { text: 'Posteriort', correct: false },
        { text: 'Anterolateralt', correct: false },
      ],
      explanation: 'Medial och anteromedial pinplacering i proximala tibia undviker risk för skada på n. peroneus.',
      reference: 'A-ORTIM Kursbok, Kapitel 6',
    },
    // Kapitel 9: Mangled extremity
    {
      code: 'A9.1',
      chapterNumber: 9,
      bloomLevel: 'ANALYSIS',
      question: 'Patient med MESS-score 8. Vilken är den korrekta tolkningen?',
      options: [
        { text: 'Hög sannolikhet för amputation, men MESS är vägledning - diskutera med patient', correct: true },
        { text: 'Amputation är obligatorisk', correct: false },
        { text: 'Limb salvage är alltid möjlig', correct: false },
        { text: 'MESS-score är irrelevant för beslut', correct: false },
      ],
      explanation: 'MESS ≥7 indikerar hög sannolikhet för amputation men är en vägledning. Patientens önskemål och individuella faktorer måste beaktas.',
      reference: 'A-ORTIM Kursbok, Kapitel 9',
    },
    // Kapitel 10: Bäckentrauma
    {
      code: 'A10.1',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Hemodynamiskt instabil patient med bäckentrauma och negativ FAST. Vad är nästa steg?',
      options: [
        { text: 'Preperitonal packing och/eller angioembolisering', correct: true },
        { text: 'Laparotomi', correct: false },
        { text: 'Avvakta och ge mer vätska', correct: false },
        { text: 'Endast extern fixation', correct: false },
      ],
      explanation: 'Vid negativ FAST och instabilt bäcken är bäckenet trolig blödningskälla. Preperitonal packing (venös) eller angio (arteriell) är indicerat.',
      reference: 'A-ORTIM Kursbok, Kapitel 10',
    },
    // Kapitel 12: Teamledning
    {
      code: 'A12.1',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Som traumaledare noterar du att teamet arbetar okoordinerat. Vad gör du?',
      options: [
        { text: 'Stoppa, återta ledarskapet, fördela roller tydligt och fortsätt strukturerat', correct: true },
        { text: 'Ta över alla uppgifter själv', correct: false },
        { text: 'Låt teamet fortsätta och korrigera efteråt', correct: false },
        { text: 'Byt ut teammedlemmar', correct: false },
      ],
      explanation: 'Teamledaren ska vid oordning stoppa, tydliggöra roller och återuppta strukturerat arbete enligt ABCDE.',
      reference: 'A-ORTIM Kursbok, Kapitel 12',
    },
    // Kapitel 13: Masskada
    {
      code: 'A13.1',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Enligt START-triage, vilken patient klassas som RÖD (omedelbar)?',
      options: [
        { text: 'Patient som inte kan gå, andas >30/min eller kapillär återfyllnad >2 sek', correct: true },
        { text: 'Patient som kan gå själv', correct: false },
        { text: 'Patient som inte andas efter friläggning av luftväg', correct: false },
        { text: 'Patient med isolerad armfraktur', correct: false },
      ],
      explanation: 'START-triage: RÖD = kan ej gå + AF >30 eller kapillär återfyllnad >2 sek eller följer ej uppmaningar.',
      reference: 'A-ORTIM Kursbok, Kapitel 13',
    },
    // Kapitel 14: Kvalitet
    {
      code: 'A14.1',
      chapterNumber: 14,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är syftet med M&M-konferenser?',
      options: [
        { text: 'Lärande från komplikationer och systemförbättring - ej skuldbeläggning', correct: true },
        { text: 'Identifiera skyldiga för komplikationer', correct: false },
        { text: 'Juridisk dokumentation', correct: false },
        { text: 'Bedöma individuella läkares kompetens', correct: false },
      ],
      explanation: 'M&M-konferenser syftar till lärande och systemförbättring, inte skuldbeläggning av individer.',
      reference: 'A-ORTIM Kursbok, Kapitel 14',
    },
    // Kapitel 2: Neurovaskulär bedömning
    {
      code: 'A2.1',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv skadas vanligast vid fibulahals-fraktur?',
      options: [
        { text: 'N. peroneus communis', correct: true },
        { text: 'N. tibialis', correct: false },
        { text: 'N. femoralis', correct: false },
        { text: 'N. saphenus', correct: false },
      ],
      explanation: 'N. peroneus communis löper ytligt runt fibulahalsen och är mycket sårbar vid fraktur i detta område.',
      reference: 'A-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: 'A2.2',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Patient efter MC-olycka kan ej lyfta armen eller böja armbågen. Sensorik bevarad ulnart men nedsatt radialt. Vilken skada misstänks?',
      options: [
        { text: 'Supraklavikulär plexusskada C5-C6 (Erb-Duchenne)', correct: true },
        { text: 'Axillarisnervskada', correct: false },
        { text: 'Karpaltunnelsyndrom', correct: false },
        { text: 'Distal radialisskada', correct: false },
      ],
      explanation: 'Erb-Duchenne (C5-C6) ger bortfall av skulder-abduktion och armbågsflexion med sensoriskt bortfall i radialis-utbredning.',
      reference: 'A-ORTIM Kursbok, Kapitel 2',
    },
    // Kapitel 3: Intraoperativ bedömning
    {
      code: 'A3.1',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är "de 4 C:na" för bedömning av muskelviabilitet?',
      options: [
        { text: 'Color, Consistency, Contractility, Capacity to bleed', correct: true },
        { text: 'Circulation, Capillary refill, Cyanosis, Cold', correct: false },
        { text: 'Cut, Clean, Cover, Close', correct: false },
        { text: 'Compression, Compartment, Contusion, Crush', correct: false },
      ],
      explanation: 'De 4 C:na för muskelviabilitet: Color (färg), Consistency (konsistens), Contractility (kontraktilitet), Capacity to bleed (blödningsförmåga).',
      reference: 'A-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: 'A3.2',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Under operation ser du gråblek muskel som inte kontraherar vid stimulering. Vad gör du?',
      options: [
        { text: 'Debridera tills viabel vävnad nås, planera second-look om 48h', correct: true },
        { text: 'Lämna muskeln och stäng såret', correct: false },
        { text: 'Vänta och se om färgen förbättras', correct: false },
        { text: 'Endast ta ytliga prover för odling', correct: false },
      ],
      explanation: 'Icke-viabel muskel (gråblek, ej kontraktil) ska debrideras. Second-look operation efter 48h är standard vid tveksamma fall.',
      reference: 'A-ORTIM Kursbok, Kapitel 3',
    },
    // Kapitel 4: Vaskulär reparation - extra fråga
    {
      code: 'A4.2',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket graftmaterial är förstahandsval vid vaskulär rekonstruktion?',
      options: [
        { text: 'Autolog ven (v. saphena magna)', correct: true },
        { text: 'PTFE (syntetiskt)', correct: false },
        { text: 'Dacron', correct: false },
        { text: 'Bovint perikard', correct: false },
      ],
      explanation: 'Autolog ven (särskilt v. saphena magna) är förstahandsval pga lägre infektions- och trombosrisk.',
      reference: 'A-ORTIM Kursbok, Kapitel 4',
    },
    // Kapitel 5: Fasciotomi - extra fråga
    {
      code: 'A5.2',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Efter fasciotomi av underbenet, hur hanteras såren?',
      options: [
        { text: 'Lämnas öppna med fuktiga förband eller VAC, sekundär stängning efter 48-72h', correct: true },
        { text: 'Primärstängs direkt', correct: false },
        { text: 'Hudtransplantat samma dag', correct: false },
        { text: 'Daglig debridering i 1 vecka', correct: false },
      ],
      explanation: 'Fasciotomisår ska aldrig primärstängas. De lämnas öppna och stängs sekundärt eller med hudtransplantat efter 48-72h.',
      reference: 'A-ORTIM Kursbok, Kapitel 5',
    },
    // Kapitel 6: Extern fixation - extra fråga
    {
      code: 'A6.2',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur lång tid efter extern fixation bör man konvertera till intern fixation för att minimera infektionsrisk?',
      options: [
        { text: 'Inom 2 veckor', correct: true },
        { text: 'Inom 24 timmar', correct: false },
        { text: 'Efter 4 veckor', correct: false },
        { text: 'Tidpunkten spelar ingen roll', correct: false },
      ],
      explanation: 'Risken för djup infektion ökar efter 2 veckors extern fixation. Konvertering bör ske inom denna tid om möjligt.',
      reference: 'A-ORTIM Kursbok, Kapitel 6',
    },
    // Kapitel 7: Mjukdelstäckning
    {
      code: 'A7.1',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "fix and flap"-konceptet?',
      options: [
        { text: 'Definitiv skelettfixation + lambåtäckning inom 72-96 timmar', correct: true },
        { text: 'Fixation följt av lambå efter 2 veckor', correct: false },
        { text: 'Endast extern fixation utan mjukdelstäckning', correct: false },
        { text: 'Fixation och flap i separata operationer med 1 veckas mellanrum', correct: false },
      ],
      explanation: '"Fix and flap" innebär definitiv skelettfixation + mjukdelstäckning inom 72-96h, vilket minskar infektionsrisk signifikant.',
      reference: 'A-ORTIM Kursbok, Kapitel 7',
    },
    {
      code: 'A7.2',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Öppen tibiafraktur med exponerat ben utan periost. Vilket täckningsalternativ krävs?',
      options: [
        { text: 'Lambå (lokal eller fri) - hudtransplantat tar ej på ben utan periost', correct: true },
        { text: 'Delhudstransplantat (SSG)', correct: false },
        { text: 'Sekundärläkning', correct: false },
        { text: 'Primärslutning', correct: false },
      ],
      explanation: 'Exponerat ben utan periost kräver lambåtäckning - hudtransplantat tar endast på vaskulariserad bädd.',
      reference: 'A-ORTIM Kursbok, Kapitel 7',
    },
    // Kapitel 8: Multitrauma
    {
      code: 'A8.1',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "DCO" (Damage Control Orthopaedics)?',
      options: [
        { text: 'Temporär stabilisering hos instabil patient, definitiv kirurgi efter fysiologisk stabilisering', correct: true },
        { text: 'Definitiv operation direkt oavsett patientens tillstånd', correct: false },
        { text: 'Konservativ behandling utan kirurgi', correct: false },
        { text: 'Endast smärtlindring och observation', correct: false },
      ],
      explanation: 'DCO innebär att man gör minimal kirurgi (t.ex. extern fixation) hos instabil patient och väntar med definitiv behandling till efter fysiologisk stabilisering.',
      reference: 'A-ORTIM Kursbok, Kapitel 8',
    },
    {
      code: 'A8.2',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Multitraumapatient med öppen femurfraktur och instabil bäckenblödning. Vilken skada prioriteras först?',
      options: [
        { text: 'Bäckenblödningen - livshotande blödning går före extremitetshotande', correct: true },
        { text: 'Femurfrakturen - öppna frakturer kräver omedelbar åtgärd', correct: false },
        { text: 'Båda samtidigt', correct: false },
        { text: 'Femurfrakturen för att minska smärta', correct: false },
      ],
      explanation: 'Livshotande tillstånd (C-problem) prioriteras alltid före extremitetshotande. Bäckenblödning kan vara livshotande.',
      reference: 'A-ORTIM Kursbok, Kapitel 8',
    },
    // Kapitel 9: Mangled extremity - extra fråga
    {
      code: 'A9.2',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nervfunktion är mest avgörande för gångförmåga och talar MOT limb salvage om den är helt förlorad?',
      options: [
        { text: 'N. tibialis posterior', correct: true },
        { text: 'N. peroneus profundus', correct: false },
        { text: 'N. suralis', correct: false },
        { text: 'N. saphenus', correct: false },
      ],
      explanation: 'N. tibialis posterior innerverar fotsulans sensation och plantarflexorerna. Total skada ger anestesi i fotsulan vilket kraftigt försämrar gångfunktion.',
      reference: 'A-ORTIM Kursbok, Kapitel 9',
    },
    // Kapitel 10: Bäckentrauma - extra fråga
    {
      code: 'A10.2',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste blödningskällan vid bäckentrauma?',
      options: [
        { text: 'Venös plexus (80%)', correct: true },
        { text: 'Arteriell (a. iliaca interna grenar)', correct: false },
        { text: 'Mjälte och lever', correct: false },
        { text: 'Urinblåsa', correct: false },
      ],
      explanation: 'Venös blödning från bäckenplexus står för ca 80% av bäckenblödningar. Preperitonal packing är effektivt mot denna.',
      reference: 'A-ORTIM Kursbok, Kapitel 10',
    },
    // Kapitel 11: Pediatrisk polytrauma
    {
      code: 'A11.1',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket vitalparametertecken är ett TIDIGT varningssignal på chock hos barn?',
      options: [
        { text: 'Takykardi', correct: true },
        { text: 'Hypotension', correct: false },
        { text: 'Bradykardi', correct: false },
        { text: 'Hypertension', correct: false },
      ],
      explanation: 'Barn kompenserar blodförlust med takykardi länge innan blodtrycket faller. Hypotension är ett SENT tecken (>30% blodförlust).',
      reference: 'A-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: 'A11.2',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Vid femurfraktur hos ett barn under 3 år utan adekvat trauma, vad bör övervägas?',
      options: [
        { text: 'Icke-accidentellt trauma (barnmisshandel) - anmälningsplikt', correct: true },
        { text: 'Endast behandla frakturen', correct: false },
        { text: 'Vänta på föräldrarnas förklaring', correct: false },
        { text: 'Kontakta ortopedisk bakjour först', correct: false },
      ],
      explanation: 'Frakturer hos icke-mobila barn utan adekvat trauma ska väcka misstanke om NAI. Anmälan till socialtjänst är lagstadgad skyldighet.',
      reference: 'A-ORTIM Kursbok, Kapitel 11',
    },
    // Kapitel 12: Teamledning - extra fråga
    {
      code: 'A12.2',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de fyra huvudkomponenterna i icke-tekniska färdigheter (NTS) för traumateam?',
      options: [
        { text: 'Situationsmedvetenhet, beslutsfattande, teamwork, uppgiftshantering', correct: true },
        { text: 'Kirurgisk teknik, anatomi, fysiologi, farmakologi', correct: false },
        { text: 'Kommunikation, dokumentation, transport, övervakning', correct: false },
        { text: 'Triage, behandling, uppföljning, utvärdering', correct: false },
      ],
      explanation: 'NTS består av situationsmedvetenhet, beslutsfattande, teamwork och uppgiftshantering.',
      reference: 'A-ORTIM Kursbok, Kapitel 12',
    },
    // Kapitel 13: Masskada - extra fråga
    {
      code: 'A13.2',
      chapterNumber: 13,
      bloomLevel: 'APPLICATION',
      question: 'Vid START-triage: patient som inte andas efter att luftvägen frilagts. Vilken kategori?',
      options: [
        { text: 'SVART (avliden) - gå vidare till nästa patient', correct: true },
        { text: 'RÖD - påbörja HLR', correct: false },
        { text: 'GUL - övervaka', correct: false },
        { text: 'GRÖN - kan vänta', correct: false },
      ],
      explanation: 'Vid masskada: om patienten ej andas efter friläggning av luftväg klassas den som SVART (avliden). HLR prioriteras ej vid begränsade resurser.',
      reference: 'A-ORTIM Kursbok, Kapitel 13',
    },
    // Kapitel 14: Kvalitet - extra fråga
    {
      code: 'A14.2',
      chapterNumber: 14,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad står PDSA för i förbättringsarbete?',
      options: [
        { text: 'Plan, Do, Study, Act', correct: true },
        { text: 'Problem, Diagnose, Solve, Analyze', correct: false },
        { text: 'Prepare, Document, Share, Audit', correct: false },
        { text: 'Primary, Definitive, Secondary, Adjunct', correct: false },
      ],
      explanation: 'PDSA-cykeln: Plan (planera), Do (genomför), Study (analysera), Act (implementera eller justera).',
      reference: 'A-ORTIM Kursbok, Kapitel 14',
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

// A-ORTIM Algorithms
function getMESSSVG(): string {
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 22px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: #333; }
    .score { font: bold 16px sans-serif; fill: #e74c3c; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">MESS - Mangled Extremity Severity Score</text>

  <!-- Skelett/mjukdelar -->
  <rect x="30" y="60" width="180" height="130" fill="#3498db" rx="8"/>
  <text x="120" y="85" text-anchor="middle" class="header">SKELETT/MJUKDELAR</text>
  <text x="40" y="110" class="text" fill="white">Låg energi: 1p</text>
  <text x="40" y="130" class="text" fill="white">Medel energi: 2p</text>
  <text x="40" y="150" class="text" fill="white">Hög energi: 3p</text>
  <text x="40" y="170" class="text" fill="white">Mycket hög (crush): 4p</text>

  <!-- Ischemi -->
  <rect x="220" y="60" width="180" height="130" fill="#e74c3c" rx="8"/>
  <text x="310" y="85" text-anchor="middle" class="header">ISCHEMI*</text>
  <text x="230" y="110" class="text" fill="white">Puls reducerad: 1p</text>
  <text x="230" y="130" class="text" fill="white">Pulslös, parestetisk: 2p</text>
  <text x="230" y="150" class="text" fill="white">Kall, paralytisk: 3p</text>
  <text x="230" y="175" class="text" fill="white">*Dubblas om &gt;6h ischemi</text>

  <!-- Chock -->
  <rect x="410" y="60" width="180" height="130" fill="#f39c12" rx="8"/>
  <text x="500" y="85" text-anchor="middle" class="header">CHOCK</text>
  <text x="420" y="110" class="text" fill="white">BT &gt;90 konsistent: 0p</text>
  <text x="420" y="130" class="text" fill="white">Transient hypotension: 1p</text>
  <text x="420" y="150" class="text" fill="white">Persistent hypotension: 2p</text>

  <!-- Ålder -->
  <rect x="600" y="60" width="170" height="130" fill="#9b59b6" rx="8"/>
  <text x="685" y="85" text-anchor="middle" class="header">ÅLDER</text>
  <text x="610" y="110" class="text" fill="white">&lt;30 år: 0p</text>
  <text x="610" y="130" class="text" fill="white">30-50 år: 1p</text>
  <text x="610" y="150" class="text" fill="white">&gt;50 år: 2p</text>

  <!-- Tolkning -->
  <rect x="100" y="220" width="280" height="100" fill="#27ae60" rx="8"/>
  <text x="240" y="250" text-anchor="middle" class="header">MESS &lt; 7</text>
  <text x="110" y="280" class="text" fill="white">Limb salvage ofta möjlig</text>
  <text x="110" y="300" class="text" fill="white">Överväg rekonstruktion</text>

  <rect x="420" y="220" width="280" height="100" fill="#c0392b" rx="8"/>
  <text x="560" y="250" text-anchor="middle" class="header">MESS ≥ 7</text>
  <text x="430" y="280" class="text" fill="white">Hög sannolikhet för amputation</text>
  <text x="430" y="300" class="text" fill="white">Diskutera med patient</text>

  <!-- Viktigt meddelande -->
  <rect x="100" y="350" width="600" height="80" fill="#1a5276" rx="8"/>
  <text x="400" y="380" text-anchor="middle" class="header">VIKTIGT</text>
  <text x="120" y="410" class="text" fill="white">MESS är VÄGLEDNING - ej absolut gräns. Patientens önskemål och N. tibialis posterior-funktion väger tungt.</text>
</svg>`;
}

function getSTARTTriageSVG(): string {
  return `<svg viewBox="0 0 800 650" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; }
    .decision { font: bold 12px sans-serif; fill: #333; }
  </style>

  <text x="400" y="25" text-anchor="middle" class="title">START Triage - Simple Triage And Rapid Treatment</text>

  <!-- Steg 1: Kan gå? -->
  <rect x="300" y="45" width="200" height="40" fill="#3498db" rx="8"/>
  <text x="400" y="72" text-anchor="middle" class="header">Kan patienten GÅ?</text>

  <line x1="400" y1="85" x2="400" y2="105" stroke="#333" stroke-width="2"/>
  <line x1="500" y1="65" x2="600" y2="65" stroke="#333" stroke-width="2"/>
  <text x="540" y="58" class="decision">JA</text>

  <!-- GRÖN -->
  <rect x="600" y="45" width="120" height="40" fill="#27ae60" rx="8"/>
  <text x="660" y="72" text-anchor="middle" class="header">GRÖN</text>

  <!-- Steg 2: Andas? -->
  <text x="350" y="100" class="decision">NEJ</text>
  <rect x="300" y="105" width="200" height="40" fill="#3498db" rx="8"/>
  <text x="400" y="132" text-anchor="middle" class="header">Andas patienten?</text>

  <line x1="300" y1="125" x2="200" y2="125" stroke="#333" stroke-width="2"/>
  <line x1="200" y1="125" x2="200" y2="160" stroke="#333" stroke-width="2"/>
  <text x="240" y="120" class="decision">NEJ</text>

  <!-- Frigör luftväg -->
  <rect x="120" y="160" width="160" height="50" fill="#f39c12" rx="8"/>
  <text x="200" y="182" text-anchor="middle" class="header">Frigör luftväg</text>
  <text x="200" y="200" text-anchor="middle" class="text" fill="white">Andas nu?</text>

  <line x1="120" y1="185" x2="50" y2="185" stroke="#333" stroke-width="2"/>
  <text x="75" y="178" class="decision">NEJ</text>

  <!-- SVART -->
  <rect x="0" y="165" width="50" height="40" fill="#333" rx="8"/>
  <text x="25" y="190" text-anchor="middle" class="header">SVART</text>

  <!-- Steg 3: AF -->
  <line x1="400" y1="145" x2="400" y2="170" stroke="#333" stroke-width="2"/>
  <text x="450" y="160" class="decision">JA</text>
  <rect x="300" y="170" width="200" height="40" fill="#3498db" rx="8"/>
  <text x="400" y="197" text-anchor="middle" class="header">Andningsfrekvens?</text>

  <line x1="500" y1="190" x2="600" y2="190" stroke="#333" stroke-width="2"/>
  <text x="540" y="183" class="decision">&gt;30/min</text>

  <!-- RÖD 1 -->
  <rect x="600" y="170" width="120" height="40" fill="#e74c3c" rx="8"/>
  <text x="660" y="197" text-anchor="middle" class="header">RÖD</text>

  <!-- Steg 4: Kapillär återfyllnad -->
  <line x1="400" y1="210" x2="400" y2="240" stroke="#333" stroke-width="2"/>
  <text x="450" y="228" class="decision">&lt;30/min</text>
  <rect x="300" y="240" width="200" height="40" fill="#3498db" rx="8"/>
  <text x="400" y="267" text-anchor="middle" class="header">Kapillär återfyllnad?</text>

  <line x1="500" y1="260" x2="600" y2="260" stroke="#333" stroke-width="2"/>
  <text x="540" y="253" class="decision">&gt;2 sek</text>

  <!-- RÖD 2 -->
  <rect x="600" y="240" width="120" height="40" fill="#e74c3c" rx="8"/>
  <text x="660" y="267" text-anchor="middle" class="header">RÖD</text>

  <!-- Steg 5: Följer uppmaningar -->
  <line x1="400" y1="280" x2="400" y2="310" stroke="#333" stroke-width="2"/>
  <text x="450" y="298" class="decision">&lt;2 sek</text>
  <rect x="300" y="310" width="200" height="40" fill="#3498db" rx="8"/>
  <text x="400" y="337" text-anchor="middle" class="header">Följer uppmaningar?</text>

  <line x1="300" y1="330" x2="200" y2="330" stroke="#333" stroke-width="2"/>
  <text x="240" y="323" class="decision">NEJ</text>

  <!-- RÖD 3 -->
  <rect x="80" y="310" width="120" height="40" fill="#e74c3c" rx="8"/>
  <text x="140" y="337" text-anchor="middle" class="header">RÖD</text>

  <line x1="400" y1="350" x2="400" y2="380" stroke="#333" stroke-width="2"/>
  <text x="450" y="368" class="decision">JA</text>

  <!-- GUL -->
  <rect x="340" y="380" width="120" height="40" fill="#f1c40f" rx="8"/>
  <text x="400" y="407" text-anchor="middle" class="header">GUL</text>

  <!-- Förklaring -->
  <rect x="50" y="450" width="700" height="120" fill="#1a5276" rx="8"/>
  <text x="400" y="480" text-anchor="middle" class="header">KATEGORIER</text>
  <text x="70" y="510" class="text" fill="white">RÖD: Omedelbar - livshotande men räddningsbar</text>
  <text x="70" y="530" class="text" fill="white">GUL: Fördröjd - allvarligt skadad men kan vänta</text>
  <text x="400" y="510" class="text" fill="white">GRÖN: Lindrig - kan vänta längre</text>
  <text x="400" y="530" class="text" fill="white">SVART: Avliden/ej räddningsbar</text>
  <text x="70" y="555" class="text" fill="white">⚠ Retriagering kontinuerligt - tillstånd förändras!</text>
</svg>`;
}

function getFasciotomySVG(): string {
  return `<svg viewBox="0 0 800 550" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: #333; }
    .compartment { font: bold 11px sans-serif; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">Fasciotomi Underben - Dubbelincisionsteknik</text>

  <!-- Tvärsnittsvy -->
  <ellipse cx="200" cy="200" rx="130" ry="100" fill="#f5f5f5" stroke="#333" stroke-width="2"/>

  <!-- Tibia -->
  <ellipse cx="160" cy="180" rx="35" ry="40" fill="#e0e0e0" stroke="#333" stroke-width="2"/>
  <text x="160" y="185" text-anchor="middle" class="compartment">TIBIA</text>

  <!-- Fibula -->
  <ellipse cx="280" cy="200" rx="15" ry="20" fill="#e0e0e0" stroke="#333" stroke-width="2"/>
  <text x="280" y="205" text-anchor="middle" class="compartment" style="font-size:9px">FIB</text>

  <!-- Kompartment - Anteriort -->
  <path d="M 130 120 Q 200 100 270 140" fill="#3498db" fill-opacity="0.5" stroke="#2980b9" stroke-width="2"/>
  <text x="200" y="125" text-anchor="middle" class="compartment" fill="#2980b9">ANTERIORT</text>

  <!-- Kompartment - Lateralt -->
  <path d="M 280 150 Q 320 200 280 250" fill="#27ae60" fill-opacity="0.5" stroke="#1e8449" stroke-width="2"/>
  <text x="310" y="200" class="compartment" fill="#1e8449">LAT</text>

  <!-- Kompartment - Ytligt posteriort -->
  <path d="M 130 280 Q 200 320 270 280" fill="#9b59b6" fill-opacity="0.5" stroke="#7d3c98" stroke-width="2"/>
  <text x="200" y="300" text-anchor="middle" class="compartment" fill="#7d3c98">YT. POST</text>

  <!-- Kompartment - Djupt posteriort -->
  <path d="M 130 220 Q 180 260 130 280" fill="#e74c3c" fill-opacity="0.5" stroke="#c0392b" stroke-width="2"/>
  <text x="110" y="260" class="compartment" fill="#c0392b">DJ.</text>

  <!-- Incision markör lateral -->
  <line x1="320" y1="150" x2="350" y2="130" stroke="#e74c3c" stroke-width="3"/>
  <text x="360" y="135" class="text" fill="#e74c3c">LATERAL INCISION</text>

  <!-- Incision markör medial -->
  <line x1="80" y1="230" x2="50" y2="250" stroke="#e74c3c" stroke-width="3"/>
  <text x="20" y="270" class="text" fill="#e74c3c">MEDIAL</text>

  <!-- Instruktioner -->
  <rect x="420" y="80" width="350" height="180" fill="#3498db" rx="8"/>
  <text x="595" y="105" text-anchor="middle" class="header">LATERAL INCISION</text>
  <text x="430" y="130" class="text" fill="white">1. Markera fibulahuvud + laterala malleol</text>
  <text x="430" y="150" class="text" fill="white">2. Incision 1 cm framför fibula</text>
  <text x="430" y="170" class="text" fill="white">3. Öppna ANTERIORT först</text>
  <text x="430" y="190" class="text" fill="white">4. Identifiera intermuskulära septum</text>
  <text x="430" y="210" class="text" fill="white">5. Öppna LATERALT</text>
  <text x="430" y="240" class="text" fill="white">→ Når 2 kompartment</text>

  <rect x="420" y="280" width="350" height="160" fill="#9b59b6" rx="8"/>
  <text x="595" y="305" text-anchor="middle" class="header">MEDIAL INCISION</text>
  <text x="430" y="330" class="text" fill="white">1. 2 cm posteriort om tibiakanten</text>
  <text x="430" y="350" class="text" fill="white">2. Incision hel underbenslängden</text>
  <text x="430" y="370" class="text" fill="white">3. Öppna YTLIGT POSTERIORT</text>
  <text x="430" y="390" class="text" fill="white">4. Incision djupt genom soleus-fascia</text>
  <text x="430" y="410" class="text" fill="white">5. Öppna DJUPT POSTERIORT</text>
  <text x="430" y="435" class="text" fill="white">→ Når 2 kompartment</text>

  <!-- Nyckelbudskap -->
  <rect x="50" y="460" width="700" height="60" fill="#e74c3c" rx="8"/>
  <text x="400" y="485" text-anchor="middle" class="header">KRITISKT: Alla 4 kompartment MÅSTE öppnas!</text>
  <text x="400" y="505" text-anchor="middle" class="text" fill="white">Lämna sår öppna • VAC-förband • Second-look 48-72h • Aldrig primärstäng</text>
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
