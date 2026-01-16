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
    // Evidence-based A-ORTIM algorithms
    { code: 'VASCULAR-INJURY', title: 'Kärlskadealgoritm', description: 'Strukturerad utredning vid misstänkt kärlskada med hard/soft signs', svg: getVascularInjuryAlgorithmSVG() },
    { code: 'DCO-ETC', title: 'DCO vs ETC', description: 'Beslutsstöd för Damage Control vs Early Total Care', svg: getDCOvsETCAlgorithmSVG() },
    { code: 'OPEN-FX-ADV', title: 'Öppen fraktur avancerad', description: 'BOA/BAPRAS guidelines för öppna frakturer', svg: getOpenFractureAlgorithmSVG() },
    { code: 'PELVIC-HEMORRHAGE', title: 'Bäckenblödning', description: 'Algoritm för hemodynamiskt instabil bäckenfraktur', svg: getPelvicHemorrhageAlgorithmSVG() },
    // Quick Reference Cards - Snabbreferenskort för tidskritiska tillstånd
    { code: 'QRC-TOURNIQUET', title: 'Tourniquet Snabbkort', description: 'Indikation, applicering och tidsgränser', svg: getQRCTourniquetSVG() },
    { code: 'QRC-COMPARTMENT', title: 'Kompartment Snabbkort', description: '6 P och tryckmätning', svg: getQRCCompartmentSVG() },
    { code: 'QRC-AMPUTATION', title: 'Traumatisk Amputation', description: 'Stump och amputat hantering', svg: getQRCAmputationSVG() },
    { code: 'QRC-OPEN-FX', title: 'Öppen Fraktur Snabbkort', description: 'Klassifikation och initial åtgärd', svg: getQRCOpenFxSVG() },
    { code: 'QRC-PELVIC', title: 'Bäckenblödning Snabbkort', description: 'Bäckenbälte och blödningskontroll', svg: getQRCPelvicSVG() },
    { code: 'QRC-VASCULAR', title: 'Kärlskada Snabbkort', description: 'Hard signs, soft signs och ABI', svg: getQRCVascularSVG() },
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

  // Create Pre-Course Assessment Questions (förkunskapstest)
  const preCourseQuestions = getPreCourseAssessmentQuestions();
  for (const q of preCourseQuestions) {
    await prisma.quizQuestion.upsert({
      where: { questionCode: q.code },
      update: {},
      create: {
        chapterId: null, // Pre-course questions are not chapter-specific
        questionCode: q.code,
        bloomLevel: q.bloomLevel as BloomLevel,
        questionText: q.question,
        explanation: q.explanation,
        reference: q.reference,
        isActive: true,
        isExamQuestion: false, // Not an exam question, assessment only
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

  console.log('✅ Pre-course assessment questions created');

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
    {
      code: '12.3',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka fysiologiska förändringar hos äldre ökar risken vid extremitetstrauma?',
      options: [
        { text: 'Osteoporos, minskad kardiopulmonell reserv, polyfarmaci', correct: true },
        { text: 'Ökad benstyrka', correct: false },
        { text: 'Förbättrad läkningsförmåga', correct: false },
        { text: 'Bättre smärttolerans', correct: false },
      ],
      explanation: 'Äldre har skörare skelett, minskad fysiologisk reserv och ofta flera läkemedel som komplicerar traumabehandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.4',
      chapterNumber: 12,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är höftfraktur hos äldre så allvarligt?',
      options: [
        { text: '1-årsmortalitet 20-30%, hög komplikationsrisk, funktionsförlust', correct: true },
        { text: 'Läker aldrig', correct: false },
        { text: 'Alltid operationskrävande', correct: false },
        { text: 'Endast kosmetiskt problem', correct: false },
      ],
      explanation: 'Höftfraktur hos äldre har hög mortalitet (20-30% inom ett år) och risk för bestående funktionsnedsättning.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.5',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "geriatric trauma triad"?',
      options: [
        { text: 'Fall, antikoagulation, polyfarmaci', correct: true },
        { text: 'Fraktur, blödning, infektion', correct: false },
        { text: 'Hypotension, hypotermi, koagulopati', correct: false },
        { text: 'Smärta, svullnad, funktionsnedsättning', correct: false },
      ],
      explanation: 'Geriatric trauma triad avser vanliga komplicerande faktorer: falltendens, antikoagulantia och multipla läkemedel.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.6',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Äldre patient på Waran med INR 3.5 och aktivt blödande tibiafraktur. Åtgärd?',
      options: [
        { text: 'Reversera med K-vitamin + protrombinkomplex (PCC), lokal hemostas', correct: true },
        { text: 'Avvakta tills INR sjunker spontant', correct: false },
        { text: 'Endast kompression', correct: false },
        { text: 'Ge mer Waran', correct: false },
      ],
      explanation: 'Aktiv blödning + högt INR kräver snabb reversering med K-vitamin och PCC för omedelbar effekt.',
      reference: 'B-ORTIM Kursbok, Kapitel 12; ATLS 10th ed',
    },
    {
      code: '12.7',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur reverseras DOAK (apixaban, rivaroxaban) vid livshotande blödning?',
      options: [
        { text: 'Andexanet alfa (om tillgängligt) eller PCC, tranexamsyra', correct: true },
        { text: 'K-vitamin', correct: false },
        { text: 'Endast FFP', correct: false },
        { text: 'Kan ej reverseras', correct: false },
      ],
      explanation: 'DOAK kan reverseras med specifik antidot (andexanet, idarucizumab för dabigatran) eller PCC vid brist på antidot.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.8',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur reverseras dabigatran vid akut blödning?',
      options: [
        { text: 'Idarucizumab (Praxbind) - specifik antidot', correct: true },
        { text: 'K-vitamin', correct: false },
        { text: 'Protaminsulfat', correct: false },
        { text: 'Kan ej reverseras', correct: false },
      ],
      explanation: 'Dabigatran har specifik antidot idarucizumab (Praxbind) som ger omedelbar reversering.',
      reference: 'B-ORTIM Kursbok, Kapitel 12; Pollack CV NEJM 2015',
    },
    {
      code: '12.9',
      chapterNumber: 12,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är trombocythämmande läkemedel problematiska vid trauma?',
      options: [
        { text: 'Irreversibel trombocythämning ökar blödningsrisk i 7-10 dagar', correct: true },
        { text: 'Ökar infektionsrisk', correct: false },
        { text: 'Påverkar inte kirurgi', correct: false },
        { text: 'Ger koagulopati', correct: false },
      ],
      explanation: 'ASA och klopidogrel hämmar trombocyter irreversibelt - effekten kvarstår tills nya trombocyter bildas (7-10 dagar).',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.10',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Hur hanteras pågående blödning hos patient på dubbel trombocythämning (ASA + ticagrelor)?',
      options: [
        { text: 'Trombocyttransfusion, tranexamsyra, lokal hemostas', correct: true },
        { text: 'K-vitamin', correct: false },
        { text: 'Avvakta', correct: false },
        { text: 'Ge mer trombocythämmare', correct: false },
      ],
      explanation: 'Vid blödning hos patient på dubbel trombocythämning ges trombocyter och TXA. Ticagrelor kan reverseras med PB2452 (om tillgänglig).',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.11',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka speciella hänsyn gäller vid trauma hos gravida?',
      options: [
        { text: 'Undvik vena cava-kompression, två patienter att behandla, ökad blodvolym', correct: true },
        { text: 'Samma som icke-gravida', correct: false },
        { text: 'Undvik all röntgen', correct: false },
        { text: 'Gravida tål trauma bättre', correct: false },
      ],
      explanation: 'Gravida: större blodvolym (kan dölja hypovolemi), fostrets välfärd, undvik vena cava-kompression i ryggläge.',
      reference: 'B-ORTIM Kursbok, Kapitel 12; ATLS 10th ed',
    },
    {
      code: '12.12',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Varför kan gravida dölja tecken på hypovolemi längre?',
      options: [
        { text: 'Blodvolymen är ökad med 40-50% under graviditet', correct: true },
        { text: 'Gravida blöder mindre', correct: false },
        { text: 'Pulsen stiger ej vid blödning', correct: false },
        { text: 'De döljer det aktivt', correct: false },
      ],
      explanation: 'Graviditetens fysiologiska hypervolemi (40-50% ökning) innebär att betydande blodförlust kan ske innan chocktecken.',
      reference: 'B-ORTIM Kursbok, Kapitel 12; ATLS 10th ed',
    },
    {
      code: '12.13',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Gravid i vecka 32 med bäckenfraktur och hypotension. Första åtgärd?',
      options: [
        { text: 'Manuell livmoderdislokation eller vänstersidesläge + resurscitation', correct: true },
        { text: 'Endast vätska i ryggläge', correct: false },
        { text: 'Akut kejsarsnitt', correct: false },
        { text: 'CT-undersökning', correct: false },
      ],
      explanation: 'Först: häv aortocaval kompression genom manuell livmoderdislokation eller 15-30° vänsterlutning, sedan ABCDE-resuscitation.',
      reference: 'B-ORTIM Kursbok, Kapitel 12; ATLS 10th ed',
    },
    {
      code: '12.14',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka röntgenundersökningar är säkra under graviditet?',
      options: [
        { text: 'Extremitetsröntgen med blyförkläde - låg stråldos till fostret', correct: true },
        { text: 'Ingen röntgen är säker', correct: false },
        { text: 'Endast MR', correct: false },
        { text: 'CT är helt säkert', correct: false },
      ],
      explanation: 'Extremitetsröntgen med bukhölje/blyförkläde ger minimal fostrisk. Nödvändig diagnostik ska ej undanhållas.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.15',
      chapterNumber: 12,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad händer med fostret vid maternell chock?',
      options: [
        { text: 'Moderns cirkulation prioriteras över placenta - fosterasfyxi', correct: true },
        { text: 'Fostret skyddas automatiskt', correct: false },
        { text: 'Ingen effekt på fostret', correct: false },
        { text: 'Fostret tar moderns blod', correct: false },
      ],
      explanation: 'Vid maternell chock shuntas blod bort från livmoder/placenta - fosterasfyxi kan uppstå innan modern visar tydliga tecken.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.16',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'När ska fetalt hjärtljud och CTG monitoreras efter trauma hos gravid?',
      options: [
        { text: 'Alltid efter >20-23 gestationsveckor vid signifikant trauma', correct: true },
        { text: 'Aldrig vid trauma', correct: false },
        { text: 'Endast vid buktrauma', correct: false },
        { text: 'Först efter 48 timmar', correct: false },
      ],
      explanation: 'Efter viabilitetsgränsen (~22-23v) ska fostret monitoreras med hjärtljud/CTG vid signifikant maternellt trauma.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.17',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är placentaavlossning och hur relaterar det till trauma?',
      options: [
        { text: 'Tidig separation av placenta - kan orsakas av trubbigt buktrauma', correct: true },
        { text: 'Endast vid direkt skada', correct: false },
        { text: 'Förekommer ej vid trauma', correct: false },
        { text: 'Alltid synlig blödning', correct: false },
      ],
      explanation: 'Placentaavlossning kan orsakas av trubbigt buktrauma (inkl bältesskador) och ger allvarlig risk för fostret.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.18',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka läkemedel bör undvikas vid extremitetstrauma hos gravida?',
      options: [
        { text: 'NSAID (tredje trimester), vissa antibiotika (tetracykliner, kinoloner)', correct: true },
        { text: 'Alla smärtstillande', correct: false },
        { text: 'Paracetamol', correct: false },
        { text: 'Lokalanestetika', correct: false },
      ],
      explanation: 'NSAID undviks sent i graviditet (ductus arteriosus), tetracykliner och fluorokinoloner är kontraindicerade.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.19',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka speciella överväganden gäller för diabetiker vid trauma?',
      options: [
        { text: 'Ökad infektionsrisk, försenad sårläkning, hyperglykemi vid stress', correct: true },
        { text: 'Samma som icke-diabetiker', correct: false },
        { text: 'Läker snabbare', correct: false },
        { text: 'Lägre smärtkänslighet är fördelaktigt', correct: false },
      ],
      explanation: 'Diabetiker har ökad infektionsrisk, försämrad sårläkning och kan ha neuropati som döljer symtom.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.20',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Diabetiker med öppen fraktur. Speciell hänsyn?',
      options: [
        { text: 'Noggrann glukoskontroll, låg tröskel för antibiotika, täta sårkontroller', correct: true },
        { text: 'Behandlas likadant', correct: false },
        { text: 'Utsätt diabetesläkemedel', correct: false },
        { text: 'Vänta med operation', correct: false },
      ],
      explanation: 'Diabetiker kräver god metabol kontroll för läkning, har ökad infektionsrisk och kan behöva tätare uppföljning.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.21',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur påverkar njursvikt handläggning av extremitetstrauma?',
      options: [
        { text: 'Läkemedelsdosjustering, elektrolytrubbningar, ökad blödningsrisk', correct: true },
        { text: 'Ingen skillnad', correct: false },
        { text: 'Snabbare läkning', correct: false },
        { text: 'Undvik all kirurgi', correct: false },
      ],
      explanation: 'Njursvikt kräver dosjustering (smärtstillande, antibiotika), risk för hyperkalemi och uremisk koagulopati.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.22',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Patient med kronisk njursvikt får crush injury. Särskild risk?',
      options: [
        { text: 'Redan nedsatt njurfunktion gör myoglobin-nefrotoxicitet mer kritisk', correct: true },
        { text: 'Lägre risk än normala', correct: false },
        { text: 'Dialys skyddar helt', correct: false },
        { text: 'Ingen speciell risk', correct: false },
      ],
      explanation: 'Redan nedsatt njurfunktion ger sämre marginal - myoglobinbelastning kan snabbt ge dialysbehov.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.23',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka hänsyn gäller vid trauma hos immunsupprimerade?',
      options: [
        { text: 'Ökad infektionsrisk, atypiska symtom, försenad läkning', correct: true },
        { text: 'Samma som friska', correct: false },
        { text: 'Lägre infektionsrisk', correct: false },
        { text: 'Snabbare läkning', correct: false },
      ],
      explanation: 'Immunsuppression (transplanterade, HIV, cytostatika) ger ökad infektionsrisk och svagare inflammatoriskt svar.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.24',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur påverkar obesitas traumavård?',
      options: [
        { text: 'Svårare undersökning, ökad DVT-risk, komplicerad anestesi, sårläkningsproblem', correct: true },
        { text: 'Skyddas av fettvävnad', correct: false },
        { text: 'Lättare att stabilisera frakturer', correct: false },
        { text: 'Ingen påverkan', correct: false },
      ],
      explanation: 'Obesitas försvårar fysikalisk undersökning, ökar trombosrisk och ger mer sår- och andningskomplikationer.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.25',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Obese patient med tibiafraktur. Speciella överväganden?',
      options: [
        { text: 'Trombosprofylax, lämplig fixationsmetod för vikt, postop mobilisering', correct: true },
        { text: 'Samma behandling som normalviktiga', correct: false },
        { text: 'Undvik kirurgi', correct: false },
        { text: 'Mindre vikt på trombosprofylax', correct: false },
      ],
      explanation: 'Obesitas kräver dosanpassad trombosprofylax, stabilare fixation och fokus på tidig mobilisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.26',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka särskilda hänsyn gäller vid trauma hos personer med funktionsnedsättning?',
      options: [
        { text: 'Kommunikationsanpassning, hjälpmedel, stöd i rehabilitering', correct: true },
        { text: 'Samma som alla andra', correct: false },
        { text: 'Undvik behandling', correct: false },
        { text: 'Lägre prioritet', correct: false },
      ],
      explanation: 'Anpassa kommunikation, bevara hjälpmedel (proteser, rullstol) och planera individualiserad rehabilitering.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.27',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur påverkar ryggmärgsskada svaret på extremitetstrauma?',
      options: [
        { text: 'Autonom dysreflexi, förändrad smärta, osteoporos under skadanivån', correct: true },
        { text: 'Ingen speciell påverkan', correct: false },
        { text: 'Bättre läkning', correct: false },
        { text: 'Mindre blödning', correct: false },
      ],
      explanation: 'Ryggmärgsskadade har osteoporosrisk under skadenivån, atypisk smärtbild och risk för autonom dysreflexi.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.28',
      chapterNumber: 12,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är autonom dysreflexi och varför är det relevant vid trauma?',
      options: [
        { text: 'Livshotande hypertension utlöst av smärta/distension under skadenivån', correct: true },
        { text: 'Lågt blodtryck', correct: false },
        { text: 'Muskelspasm', correct: false },
        { text: 'Irrelevant vid extremitetstrauma', correct: false },
      ],
      explanation: 'Autonom dysreflexi hos patienter med ryggmärgsskada >T6 ger extrem hypertension vid stimuli (smärta, blåsutspänning) - kan ge stroke.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.29',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka hänsyn gäller vid trauma hos kroniska smärtpatienter?',
      options: [
        { text: 'Opioidtolerans kräver högre doser, multimodal smärtbehandling', correct: true },
        { text: 'Kräver mindre smärtstillande', correct: false },
        { text: 'Undvik alla opioider', correct: false },
        { text: 'Samma behandling som övriga', correct: false },
      ],
      explanation: 'Kroniska smärtpatienter har ofta opioidtolerans och kräver individualiserad, ofta multimodal smärtbehandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.30',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Patient med opioidberoende och tibiafraktur. Smärtstrategi?',
      options: [
        { text: 'Behåll basopioider + akut smärtbehandling ovanpå, använd adjuvanter', correct: true },
        { text: 'Sätt ut alla opioider', correct: false },
        { text: 'Endast paracetamol', correct: false },
        { text: 'Dubblera vanlig opioiddos', correct: false },
      ],
      explanation: 'Behåll underhållsdosen för att undvika abstinens och lägg till akut smärtbehandling. Använd adjuvanter (nervblockad, ketamin).',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.31',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka överväganden gäller vid trauma hos intoxikerade patienter?',
      options: [
        { text: 'Svårbedömd neurologi, ökad blödningsrisk, interaktioner, aspirationsrisk', correct: true },
        { text: 'Lättare att hantera', correct: false },
        { text: 'Alkohol skyddar vid trauma', correct: false },
        { text: 'Samma som nyktra', correct: false },
      ],
      explanation: 'Intoxikation försvårar neurologisk bedömning, ökar blödningsrisk och ger interaktionsrisker.',
      reference: 'B-ORTIM Kursbok, Kapitel 12; ATLS 10th ed',
    },
    {
      code: '12.32',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Starkt berusad patient med dislocerad axelfraktur. Åtgärd?',
      options: [
        { text: 'Fullständig traumabedömning, sänkt medvetande kan maskera andra skador', correct: true },
        { text: 'Behandla endast axeln', correct: false },
        { text: 'Vänta tills patienten är nykter', correct: false },
        { text: 'Släpp hem', correct: false },
      ],
      explanation: 'Intoxikation kan maskera skador - fullständig undersökning krävs. Sänkt medvetande kan inte tillskrivas alkohol utan utredning.',
      reference: 'B-ORTIM Kursbok, Kapitel 12; ATLS 10th ed',
    },
    {
      code: '12.33',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är abstinensrisk hos trauma patienter?',
      options: [
        { text: 'Alkohol/bensodiazepin-abstinens kan ge kramper, delirium inom dagar', correct: true },
        { text: 'Abstinens är ej kliniskt relevant', correct: false },
        { text: 'Förekommer endast vid kirurgi', correct: false },
        { text: 'Abstinens påverkar ej läkning', correct: false },
      ],
      explanation: 'Alkohol- och bensodiazepinabstinens kan ge livshotande kramper och delirium - profylax vid misstanke.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.34',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur påverkar demens traumabedömning?',
      options: [
        { text: 'Svårt få anamnes, atypisk smärtpresentation, komplianceprobelm', correct: true },
        { text: 'Lättare hantering', correct: false },
        { text: 'Demens påverkar inte trauma', correct: false },
        { text: 'Undvik behandling', correct: false },
      ],
      explanation: 'Dementa patienter kan inte ge tillförlitlig anamnes, kan ha atypisk smärtpresentation och svårighet följa instruktioner.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.35',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Dement patient hittad på golvet med smärta i höft. Viktig åtgärd?',
      options: [
        { text: 'Röntga även vid vag symtombild - dessa patienter underrapporterar', correct: true },
        { text: 'Om patienten inte klagar är det ok', correct: false },
        { text: 'Vänta till nästa dag', correct: false },
        { text: 'Endast klinisk bedömning räcker', correct: false },
      ],
      explanation: 'Dementa patienter underrapporterar smärta - låg tröskel för bilddiagnostik vid trauma och ospecifika symtom.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.36',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka hänsyn gäller för psykiatriska patienter vid trauma?',
      options: [
        { text: 'Medicininteraktioner, samarbetsproblem, suicidriskbedömning', correct: true },
        { text: 'Samma som övriga', correct: false },
        { text: 'Undvik smärtstillande', correct: false },
        { text: 'Prioritera lägre', correct: false },
      ],
      explanation: 'Psykiatriska patienter kan ha medicininteraktioner, samarbetssvårigheter och risk för avsiktligt självskadande.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.37',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur påverkar hjärtsvikt traumavård?',
      options: [
        { text: 'Begränsad vätsketolerans, antikoagulation vanlig, svårare operation', correct: true },
        { text: 'Ingen påverkan', correct: false },
        { text: 'Kan ge mer vätska', correct: false },
        { text: 'Bättre prognos', correct: false },
      ],
      explanation: 'Hjärtsvikt innebär begränsad volymtolerans, ofta antikoagulation och ökad operationsrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.38',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Patient med pacemaker och femurfraktur. Speciell hänsyn vid operation?',
      options: [
        { text: 'Kontrollera pacemaker, undvik diatermi nära generatorn, kardiologkonsult', correct: true },
        { text: 'Ingen speciell hänsyn', correct: false },
        { text: 'Undvik operation', correct: false },
        { text: 'Alltid MR för fraktur', correct: false },
      ],
      explanation: 'Pacemakerpatienter kräver preop kontroll, försiktighet med diatermi (kan störa) och ibland omprogrammering.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.39',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur påverkar KOL/lungsjukdom traumabedömning?',
      options: [
        { text: 'Ökad risk för andningssvikt, pneumoni postoperativt, syrgaskänslighet', correct: true },
        { text: 'Ingen speciell risk', correct: false },
        { text: 'Behöver mindre syrgas', correct: false },
        { text: 'Bättre prognos', correct: false },
      ],
      explanation: 'Lungsjuka har ökad risk för postop pneumoni och andningssvikt. Var försiktig med syrgas vid CO2-retention.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.40',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka kulturella aspekter kan påverka traumavård?',
      options: [
        { text: 'Språkbarriärer, kulturella normer kring smärta, religiösa hänsyn', correct: true },
        { text: 'Kultur påverkar inte medicin', correct: false },
        { text: 'Alla behandlas exakt lika', correct: false },
        { text: 'Endast tolk behövs', correct: false },
      ],
      explanation: 'Kulturell kompetens inkluderar språkstöd, förståelse för olika smärtuttryck och respekt för religiösa/kulturella normer.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.41',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Patient som inte talar svenska med misstänkt fraktur. Åtgärd?',
      options: [
        { text: 'Anlita professionell tolk, undvik familjemedlemmar för medicinska samtal', correct: true },
        { text: 'Be familj tolka', correct: false },
        { text: 'Använd Google Translate', correct: false },
        { text: 'Behandla utan samtycke', correct: false },
      ],
      explanation: 'Professionell tolk krävs för korrekt anamnes och informerat samtycke. Familjetolkning kan vara opålitlig och olämplig.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.42',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur påverkar malnutrition sårläkning vid extremitetstrauma?',
      options: [
        { text: 'Försenad läkning, ökad infektionsrisk, sämre frakturläkning', correct: true },
        { text: 'Ingen påverkan', correct: false },
        { text: 'Snabbare läkning', correct: false },
        { text: 'Endast kosmetisk påverkan', correct: false },
      ],
      explanation: 'Malnutrition (protein, vitaminer, spårelement) försämrar sårläkning, immunförsvar och benläkning.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.43',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka hänsyn gäller vid extremitetstrauma hos tävlingsidrottare?',
      options: [
        { text: 'Snabb diagnos, optimal behandling för återgång, dopingregler för läkemedel', correct: true },
        { text: 'Samma som alla', correct: false },
        { text: 'Kan vänta med behandling', correct: false },
        { text: 'Undvik all kirurgi', correct: false },
      ],
      explanation: 'Idrottare kräver optimal behandling för maximal återhämtning och hänsyn till dopingregler vid medicinering.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.44',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur påverkar steroidbehandling traumavård?',
      options: [
        { text: 'Ökad infektionsrisk, försenad läkning, risk för binjurebarkssvikt vid stress', correct: true },
        { text: 'Ingen påverkan', correct: false },
        { text: 'Bättre läkning', correct: false },
        { text: 'Minskad smärta', correct: false },
      ],
      explanation: 'Kronisk steroidbehandling ger immunsuppression, hudatrofi, osteoporos och risk för binjurebarkssvikt vid kirurgi.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.45',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Patient på 10 mg prednisolon dagligen ska opereras för ankelfraktur. Åtgärd?',
      options: [
        { text: 'Överväg stressdos hydrokortison perioperativt', correct: true },
        { text: 'Sätt ut prednisolon', correct: false },
        { text: 'Ingen speciell åtgärd', correct: false },
        { text: 'Dubblera prednisolondos', correct: false },
      ],
      explanation: 'Kronisk steroidbehandling (>5mg prednison i >3 veckor) kan ge HPA-axel suppression - ge stressdos vid kirurgi.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.46',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär principen "treat the patient, not the disease"?',
      options: [
        { text: 'Individualisera behandling baserat på patientens helhetssituation', correct: true },
        { text: 'Ignorera diagnosen', correct: false },
        { text: 'Behandla alla lika', correct: false },
        { text: 'Fokusera endast på labprover', correct: false },
      ],
      explanation: 'Behandling ska anpassas efter patientens komorbiditet, önskemål, sociala situation och funktionsnivå.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.47',
      chapterNumber: 12,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är multidisciplinärt team viktigt för speciella populationer?',
      options: [
        { text: 'Komplex samsjuklighet kräver expertis från flera specialiteter', correct: true },
        { text: 'Det är enklare administrativt', correct: false },
        { text: 'Minskar ansvar för enskild läkare', correct: false },
        { text: 'Inte nödvändigt', correct: false },
      ],
      explanation: 'Komplexa patienter (äldre, multisjuka) gynnas av samverkan: geriatriker, ortoped, fysioterapeut, arbetsterapeut.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.48',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är orthogeriatric co-management?',
      options: [
        { text: 'Samarbete ortoped-geriatriker för optimerad vård av äldre med frakturer', correct: true },
        { text: 'Endast geriatrisk rehabilitering', correct: false },
        { text: 'Ortopeden sköter allt', correct: false },
        { text: 'Äldre opereras inte', correct: false },
      ],
      explanation: 'Orthogeriatric co-management ger förbättrade utfall för äldre höftfrakturpatienter genom samarbete mellan specialiteter.',
      reference: 'B-ORTIM Kursbok, Kapitel 12; Kammerlander C Injury 2010',
    },
    {
      code: '12.49',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Vilka faktorer ska vägas in i behandlingsbeslut hos multisjuk äldre med fraktur?',
      options: [
        { text: 'Funktionsnivå före skada, förväntad livslängd, patientens önskemål', correct: true },
        { text: 'Endast ålder', correct: false },
        { text: 'Endast frakturtyp', correct: false },
        { text: 'Endast läkarens preferens', correct: false },
      ],
      explanation: 'Behandlingsbeslut hos äldre baseras på pre-fraktur funktion, komorbiditet, förväntad prognos och patientens mål.',
      reference: 'B-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: '12.50',
      chapterNumber: 12,
      bloomLevel: 'ANALYSIS',
      question: 'Vad är viktigast för utfallet hos speciella populationer med extremitetstrauma?',
      options: [
        { text: 'Tidig identifiering av riskfaktorer och individualiserad behandling', correct: true },
        { text: 'Standardiserad behandling för alla', correct: false },
        { text: 'Endast kirurgisk teknik', correct: false },
        { text: 'Patientens ålder', correct: false },
      ],
      explanation: 'Bästa utfall uppnås genom att identifiera patientspecifika risker och anpassa behandling därefter.',
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
    // ============================================
    // YTTERLIGARE FRÅGOR FÖR FULLSTÄNDIG TÄCKNING
    // ============================================

    // Kapitel 1: Extra frågor
    {
      code: '1.3',
      chapterNumber: 1,
      bloomLevel: 'APPLICATION',
      question: 'En patient med tibiafraktur har kraftig smärta som inte lindras av morfin, samt smärta vid passiv tåextension. Vilken diagnos misstänker du?',
      options: [
        { text: 'Kompartmentsyndrom', correct: true },
        { text: 'Djup ventrombos', correct: false },
        { text: 'Nervskada', correct: false },
        { text: 'Frakturkomplikation', correct: false },
      ],
      explanation: 'Smärta oproportionerlig till skadan och smärta vid passiv töjning är klassiska tecken på kompartmentsyndrom - ett tidskritiskt tillstånd.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.4',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är tidig identifiering av de fyra tidskritiska tillstånden så viktig?',
      options: [
        { text: 'Försenad behandling leder till irreversibel vävnadsskada eller död', correct: true },
        { text: 'Det sparar sjukhusresurser', correct: false },
        { text: 'Patienten får mindre ont', correct: false },
        { text: 'Det förenklar dokumentationen', correct: false },
      ],
      explanation: 'De tidskritiska tillstånden (kärlskada, kompartmentsyndrom, öppen fraktur, instabilt bäcken) kräver snabb behandling för att undvika amputation, organsvikt eller död.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.5',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den rekommenderade ischemitiden innan irreversibel muskelskada uppstår?',
      options: [
        { text: '6 timmar', correct: true },
        { text: '2 timmar', correct: false },
        { text: '12 timmar', correct: false },
        { text: '24 timmar', correct: false },
      ],
      explanation: 'Efter 6 timmars ischemi börjar irreversibel muskelskada uppstå. Detta kallas "golden hour" för kärlskador.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Feliciano DV J Trauma 2011',
    },
    {
      code: '1.6',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står B-ORTIM för?',
      options: [
        { text: 'Basic Orthopaedic Resuscitation and Trauma Initial Management', correct: true },
        { text: 'Basic Orthopaedic Rehabilitation and Trauma Injury Management', correct: false },
        { text: 'Basic Operating Room Trauma Initial Management', correct: false },
        { text: 'Basic Orthopaedic Response to Trauma and Injury Management', correct: false },
      ],
      explanation: 'B-ORTIM är en akronym för Basic Orthopaedic Resuscitation and Trauma Initial Management.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.7',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför kallas de fyra B-ORTIM-tillstånden för "tidskritiska"?',
      options: [
        { text: 'Fördröjd behandling leder till permanent funktionsnedsättning eller amputation', correct: true },
        { text: 'De kräver operation inom 24 timmar', correct: false },
        { text: 'De är vanliga på akutmottagningen', correct: false },
        { text: 'De kräver specialistbedömning', correct: false },
      ],
      explanation: 'Tidskritiska tillstånd kräver snabb intervention för att undvika irreversibel skada som muskelischemi, nervskada eller amputation.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.8',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken procentandel av alla traumapatienter har extremitetsskador?',
      options: [
        { text: 'Cirka 60-70%', correct: true },
        { text: 'Cirka 20-30%', correct: false },
        { text: 'Cirka 10-15%', correct: false },
        { text: 'Cirka 90%', correct: false },
      ],
      explanation: 'Extremitetsskador förekommer hos 60-70% av alla traumapatienter, vilket gör dem till de vanligaste traumaskadorna.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; ATLS 10th Edition',
    },
    {
      code: '1.9',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur förhåller sig B-ORTIM till ATLS?',
      options: [
        { text: 'B-ORTIM kompletterar ATLS med fördjupad kunskap om extremitetstrauma', correct: true },
        { text: 'B-ORTIM ersätter ATLS för ortopeder', correct: false },
        { text: 'B-ORTIM och ATLS är samma kurs', correct: false },
        { text: 'B-ORTIM föregår ATLS-utbildning', correct: false },
      ],
      explanation: 'B-ORTIM bygger vidare på ATLS-principerna och ger fördjupad kompetens inom tidskritiska extremitetsskador.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.10',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken bokstav i ATLS primärundersökning adresserar extremitetsskador?',
      options: [
        { text: 'C - Circulation (blödning från extremitet)', correct: true },
        { text: 'E - Exposure', correct: false },
        { text: 'D - Disability', correct: false },
        { text: 'B - Breathing', correct: false },
      ],
      explanation: 'C (Circulation) inkluderar blödningskontroll, inklusive massiv blödning från extremiteter som är del av MARCH/xABCDE.',
      reference: 'ATLS 10th Edition; TCCC Guidelines',
    },
    {
      code: '1.11',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär konceptet "limb salvage"?',
      options: [
        { text: 'Att bevara extremiteten genom tidig intervention istället för amputation', correct: true },
        { text: 'Att amputera för att rädda patientens liv', correct: false },
        { text: 'Rehabilitering efter amputation', correct: false },
        { text: 'Konservativ behandling av frakturer', correct: false },
      ],
      explanation: 'Limb salvage innebär att bevara en skadad extremitet genom tidig kärlrekonstruktion, fasciotomi och frakturstabilisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.12',
      chapterNumber: 1,
      bloomLevel: 'ANALYSIS',
      question: 'Varför är kunskap om tidskritiska tillstånd särskilt viktig för icke-ortopeder?',
      options: [
        { text: 'Första läkaren som ser patienten avgör ofta utfallet', correct: true },
        { text: 'Ortopeder är sällan tillgängliga', correct: false },
        { text: 'Icke-ortopeder opererar oftare extremitetsskador', correct: false },
        { text: 'Det är ett myndighetskrav', correct: false },
      ],
      explanation: 'Initial bedömning och behandling sker ofta av akutläkare eller anestesiologer. Tidig identifiering av tidskritiska tillstånd förbättrar prognosen.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.13',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste orsaken till preventivbar död efter trauma?',
      options: [
        { text: 'Blödning', correct: true },
        { text: 'Luftvägsproblem', correct: false },
        { text: 'Skallskada', correct: false },
        { text: 'Infektion', correct: false },
      ],
      explanation: 'Blödning är den vanligaste orsaken till preventivbar traumadöd. Tidig blödningskontroll är därför avgörande.',
      reference: 'ATLS 10th Edition; Kauvar DS et al. J Trauma 2006',
    },
    {
      code: '1.14',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär "damage control resuscitation"?',
      options: [
        { text: 'Begränsad kirurgi med fokus på blödningskontroll och senare definitiv behandling', correct: true },
        { text: 'Fullständig kirurgisk behandling direkt', correct: false },
        { text: 'Enbart konservativ behandling', correct: false },
        { text: 'Avstå från behandling vid dålig prognos', correct: false },
      ],
      explanation: 'Damage control innebär snabb blödningskontroll och kontaminationskontroll, följt av intensivvård och senare definitiv kirurgi.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Rotondo MF J Trauma 1993',
    },
    {
      code: '1.15',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur stor andel av amputationer efter trauma anses kunna undvikas med optimal tidig vård?',
      options: [
        { text: 'Upp till 50%', correct: true },
        { text: 'Cirka 10%', correct: false },
        { text: 'Cirka 80%', correct: false },
        { text: 'Inga, alla är oundvikliga', correct: false },
      ],
      explanation: 'Studier visar att upp till hälften av traumatiska amputationer potentiellt kunde undvikas med optimal tidig behandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.16',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken typ av skada är kompartmentsyndrom?',
      options: [
        { text: 'Ischemisk muskelskada på grund av förhöjt tryck i en sluten muskeloge', correct: true },
        { text: 'Infektion i en led', correct: false },
        { text: 'Fraktur genom hela benet', correct: false },
        { text: 'Avslitning av en muskel', correct: false },
      ],
      explanation: 'Kompartmentsyndrom uppstår när trycket i en sluten muskeloge överstiger perfusionstrycket och orsakar ischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Matsen FA Clin Orthop 1975',
    },
    {
      code: '1.17',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är tibiafrakturer högriskskador för kompartmentsyndrom?',
      options: [
        { text: 'Underbenet har fyra välavgränsade fasta kompartment', correct: true },
        { text: 'Tibia har dålig blodförsörjning', correct: false },
        { text: 'Tibia frakturer är alltid öppna', correct: false },
        { text: 'Patienterna är ofta äldre', correct: false },
      ],
      explanation: 'Underbenets fyra fasta kompartment med begränsad expansionsmöjlighet gör det särskilt känsligt för kompartmentsyndrom.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.18',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den viktigaste riskfaktorn för infektion vid öppen fraktur?',
      options: [
        { text: 'Graden av mjukdelsskada och kontamination', correct: true },
        { text: 'Patientens ålder', correct: false },
        { text: 'Frakturtyp (spiral vs tvär)', correct: false },
        { text: 'Tidpunkt på dygnet för skadan', correct: false },
      ],
      explanation: 'Mjukdelsskadans omfattning enligt Gustilo-Anderson-klassifikationen är den viktigaste prognostiska faktorn för infektion.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Gustilo RB JBJS 1976',
    },
    {
      code: '1.19',
      chapterNumber: 1,
      bloomLevel: 'ANALYSIS',
      question: 'En patient med femurfraktur blöder. Varför kan blödningen vara mer omfattande än vad som syns?',
      options: [
        { text: 'Låret har stor mjukdelsvolym som kan dölja 1-2 liter blod', correct: true },
        { text: 'Femurfrakturer blöder alltid externt', correct: false },
        { text: 'Blödningen syns alltid på huden', correct: false },
        { text: 'Femur har liten benmärg', correct: false },
      ],
      explanation: 'Lårets stora mjukdelsvolym kan dölja upp till 1-2 liter blod vid sluten femurfraktur, vilket ofta underskattas.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; ATLS 10th Edition',
    },
    {
      code: '1.20',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur mycket blod kan förloras i bäckenet vid en instabil bäckenfraktur?',
      options: [
        { text: 'Över 3-4 liter', correct: true },
        { text: 'Maximalt 500 ml', correct: false },
        { text: 'Cirka 1 liter', correct: false },
        { text: 'Cirka 2 liter', correct: false },
      ],
      explanation: 'Bäckenet kan rymma stora mängder blod (>3-4 liter) och instabila bäckenfrakturer har hög mortalitet på grund av blödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Tile M Clin Orthop 1996',
    },
    {
      code: '1.21',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär "the lethal triad" vid trauma?',
      options: [
        { text: 'Hypotermi, acidos och koagulopati', correct: true },
        { text: 'Hypotension, takykardi och medvetandepåverkan', correct: false },
        { text: 'Blödning, infektion och sepsis', correct: false },
        { text: 'Chock, organsvikt och död', correct: false },
      ],
      explanation: 'Den letala triaden (hypotermi, acidos, koagulopati) är en ond cirkel som måste brytas för att förhindra dödsfall.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; ATLS 10th Edition',
    },
    {
      code: '1.22',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken temperatur definierar hypotermi vid trauma?',
      options: [
        { text: '<35°C', correct: true },
        { text: '<37°C', correct: false },
        { text: '<32°C', correct: false },
        { text: '<36.5°C', correct: false },
      ],
      explanation: 'Hypotermi vid trauma definieras som kärntemperatur <35°C. Redan mild hypotermi påverkar koagulationen negativt.',
      reference: 'ATLS 10th Edition',
    },
    {
      code: '1.23',
      chapterNumber: 1,
      bloomLevel: 'APPLICATION',
      question: 'En traumapatient har temperatur 34°C, pH 7.15 och INR 2.5. Vad är prioriteten?',
      options: [
        { text: 'Värma patienten, korrigera acidos och ge blodprodukter/tranexamsyra', correct: true },
        { text: 'Direkt till operation för frakturfixation', correct: false },
        { text: 'Avvakta för att se om tillståndet förbättras', correct: false },
        { text: 'CT-undersökning av hela kroppen', correct: false },
      ],
      explanation: 'Patienten har "the lethal triad". Prioritet är att bryta cykeln med uppvärmning, acidos-korrigering och koagulationsstöd.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; ATLS 10th Edition',
    },
    {
      code: '1.24',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den primära målgruppen för B-ORTIM-kursen?',
      options: [
        { text: 'Läkare som handlägger traumapatienter (akutläkare, ortopeder, kirurger)', correct: true },
        { text: 'Enbart ortopeder', correct: false },
        { text: 'Enbart sjuksköterskor', correct: false },
        { text: 'Enbart ambulanspersonal', correct: false },
      ],
      explanation: 'B-ORTIM riktar sig till alla läkare som kan vara först att bedöma traumapatienter med extremitetsskador.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.25',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står akronymen MARCH för inom militär traumavård?',
      options: [
        { text: 'Massive hemorrhage, Airway, Respiration, Circulation, Hypothermia', correct: true },
        { text: 'Medical Assessment and Resuscitation in Combat Health', correct: false },
        { text: 'Military Advanced Resuscitation and Critical Healthcare', correct: false },
        { text: 'Monitoring, Assessment, Recovery, Care, Health', correct: false },
      ],
      explanation: 'MARCH prioriterar massiv blödning först (före airway), vilket reflekterar lärdomar från militär traumavård.',
      reference: 'TCCC Guidelines; B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.26',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför har MARCH ändrat ordningen från traditionell ABC?',
      options: [
        { text: 'Blödning är den vanligaste orsaken till preventivbar död', correct: true },
        { text: 'Det är lättare att komma ihåg', correct: false },
        { text: 'Luftvägsproblem är ovanliga vid trauma', correct: false },
        { text: 'Det är en tillfällig förändring', correct: false },
      ],
      explanation: 'Erfarenheter från militära konflikter visade att okontrollerad blödning var vanligaste preventivbara dödsorsaken.',
      reference: 'TCCC Guidelines; Eastridge BJ J Trauma 2012',
    },
    {
      code: '1.27',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "golden hour" inom traumavård?',
      options: [
        { text: 'Den kritiska första timmen där tidig intervention kan vara livsavgörande', correct: true },
        { text: 'Arbetstiden klockan 08-09', correct: false },
        { text: 'Tiden då ortopeden anländer', correct: false },
        { text: 'Tiden för att genomföra en operation', correct: false },
      ],
      explanation: 'Golden hour-konceptet betonar vikten av snabb initial behandling för att förbättra överlevnad vid allvarligt trauma.',
      reference: 'Cowley RA J Trauma 1976; ATLS 10th Edition',
    },
    {
      code: '1.28',
      chapterNumber: 1,
      bloomLevel: 'ANALYSIS',
      question: 'En multitraumapatient har både hemothorax och femurfraktur med pågående blödning. Vad prioriteras?',
      options: [
        { text: 'Behandla båda samtidigt enligt ATLS-principer med teamarbete', correct: true },
        { text: 'Alltid thorax först', correct: false },
        { text: 'Alltid extremiteten först', correct: false },
        { text: 'Invänta ortopedkonsult', correct: false },
      ],
      explanation: 'Vid multitrauma behandlas livshotande tillstånd parallellt av traumateamet enligt ATLS-principer.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; ATLS 10th Edition',
    },
    {
      code: '1.29',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket tillstånd av de fyra B-ORTIM-tillstånden kräver vanligen snabbast intervention?',
      options: [
        { text: 'Massiv blödning (minuter)', correct: true },
        { text: 'Öppen fraktur (6 timmar)', correct: false },
        { text: 'Kompartmentsyndrom (24 timmar)', correct: false },
        { text: 'Alla har samma tidsgräns', correct: false },
      ],
      explanation: 'Massiv blödning kräver intervention inom minuter, medan andra tillstånd har tidsfönster på timmar.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.30',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är relationen mellan öppen fraktur och kärlskada?',
      options: [
        { text: 'Öppna frakturer kan ha associerad kärlskada (Gustilo IIIC)', correct: true },
        { text: 'De är helt separata tillstånd', correct: false },
        { text: 'Kärlskada utesluter öppen fraktur', correct: false },
        { text: 'Öppen fraktur innebär alltid kärlskada', correct: false },
      ],
      explanation: 'Gustilo IIIC definieras av öppen fraktur med associerad kärlskada som kräver reparation.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Gustilo RB JBJS 1984',
    },
    {
      code: '1.31',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket är det vanligaste blodkärlet som skadas vid extremitetstrauma?',
      options: [
        { text: 'Arteria poplitea', correct: true },
        { text: 'Arteria femoralis', correct: false },
        { text: 'Arteria brachialis', correct: false },
        { text: 'Arteria subclavia', correct: false },
      ],
      explanation: 'A. poplitea är det vanligast skadade kärlet vid extremitetstrauma, särskilt vid knäledsluxation och proximala tibiafrakturer.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Mills WJ JBJS 2004',
    },
    {
      code: '1.32',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är A. poplitea särskilt utsatt vid knätrauma?',
      options: [
        { text: 'Den är fixerad proximalt och distalt och löper nära leden', correct: true },
        { text: 'Den är det tunnaste kärlet i benet', correct: false },
        { text: 'Den har inget kollateralt flöde', correct: false },
        { text: 'Den löper ytligt', correct: false },
      ],
      explanation: 'A. poplitea är fixerad vid adduktorhiatus och när den passerar soleus, vilket gör den vulnerabel för sträckning vid knäluxation.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.33',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket procenttal av knäluxationer har associerad popliteakärlskada?',
      options: [
        { text: '30-50%', correct: true },
        { text: '5-10%', correct: false },
        { text: '70-80%', correct: false },
        { text: 'Under 1%', correct: false },
      ],
      explanation: 'Knäluxation har 30-50% risk för popliteakärlskada, varför alla kräver kärlutredning.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Wascher DC JAAOS 2000',
    },
    {
      code: '1.34',
      chapterNumber: 1,
      bloomLevel: 'APPLICATION',
      question: 'En patient med knäluxation har palpabel fotpuls. Utesluter detta kärlskada?',
      options: [
        { text: 'Nej, kärlskada kan finnas trots palpabel puls', correct: true },
        { text: 'Ja, palpabel puls utesluter skada', correct: false },
        { text: 'Ja, om pulsen är stark', correct: false },
        { text: 'Det beror på patientens ålder', correct: false },
      ],
      explanation: 'Intimaskada kan ge normal puls initialt men leda till trombos och ischemi senare. ABI eller angiografi krävs.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Mills WJ JBJS 2004',
    },
    {
      code: '1.35',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är mortaliteten vid obehandlad massiv extremitetsblödning?',
      options: [
        { text: 'Nära 100% om blödningen inte kontrolleras', correct: true },
        { text: 'Cirka 10%', correct: false },
        { text: 'Cirka 50%', correct: false },
        { text: 'Låg om patienten är ung', correct: false },
      ],
      explanation: 'Okontrollerad massiv blödning leder till exsanguination och död inom minuter om ingen intervention sker.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; TCCC Guidelines',
    },
    {
      code: '1.36',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur definieras massiv blödning vid extremitetstrauma?',
      options: [
        { text: 'Blödning som inte kan kontrolleras med direkt tryck', correct: true },
        { text: 'All synlig blödning', correct: false },
        { text: 'Blödning >100 ml', correct: false },
        { text: 'Blödning som kräver förband', correct: false },
      ],
      explanation: 'Massiv blödning är livshotande blödning som inte kan kontrolleras med enbart direkt tryck och kräver tourniquet.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; TCCC Guidelines',
    },
    {
      code: '1.37',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste orsaken till kompartmentsyndrom?',
      options: [
        { text: 'Tibiafraktur', correct: true },
        { text: 'Femurfraktur', correct: false },
        { text: 'Handledsfraktur', correct: false },
        { text: 'Höftfraktur', correct: false },
      ],
      explanation: 'Tibiafraktur är den vanligaste orsaken till kompartmentsyndrom, särskilt proximala tibiafrakturer.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; McQueen MM JBJS 2000',
    },
    {
      code: '1.38',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken infektionsrisk har en Gustilo typ III öppen fraktur?',
      options: [
        { text: '10-50% beroende på subtyp', correct: true },
        { text: '<1%', correct: false },
        { text: 'Cirka 5%', correct: false },
        { text: 'Nästan 100%', correct: false },
      ],
      explanation: 'Gustilo IIIA har cirka 10-15% infektionsrisk, IIIB 25-50% och IIIC ännu högre.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Gustilo RB JBJS 1984',
    },
    {
      code: '1.39',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är huvudsyftet med debridering vid öppen fraktur?',
      options: [
        { text: 'Avlägsna devitaliserad vävnad och kontamination för att förhindra infektion', correct: true },
        { text: 'Förbättra kosmetiskt resultat', correct: false },
        { text: 'Underlätta röntgenundersökning', correct: false },
        { text: 'Minska smärta', correct: false },
      ],
      explanation: 'Debridering avlägsnar nekrotisk vävnad och kontamination, vilket är avgörande för att förebygga infektion.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; BOA/BAPRAS 2020',
    },
    {
      code: '1.40',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken ledning har B-ORTIM-kursen i Sverige?',
      options: [
        { text: 'Svensk Ortopedisk Förening (SOF)', correct: true },
        { text: 'Socialstyrelsen', correct: false },
        { text: 'ATLS-kommittén', correct: false },
        { text: 'Läkarförbundet', correct: false },
      ],
      explanation: 'B-ORTIM utvecklades av Svensk Ortopedisk Förening som en specialiserad traumakurs.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.41',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är teamarbete viktigt vid handläggning av extremitetstrauma?',
      options: [
        { text: 'Flera tillstånd kan kräva samtidig behandling av olika specialister', correct: true },
        { text: 'Det är billigare', correct: false },
        { text: 'En läkare kan inte ta ansvar', correct: false },
        { text: 'Det är ett myndighetskrav', correct: false },
      ],
      explanation: 'Multitraumapatient kan behöva samtidig behandling av kärlkirurg, ortoped och traumakirurg.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.42',
      chapterNumber: 1,
      bloomLevel: 'APPLICATION',
      question: 'En patient har öppen tibiafraktur och kompartmentsyndrom. Vilken behandlingsordning är korrekt?',
      options: [
        { text: 'Fasciotomi och sårrevision kan ofta göras samtidigt', correct: true },
        { text: 'Sårrevision först, fasciotomi senare', correct: false },
        { text: 'Fasciotomi först, sårrevision efter 48 timmar', correct: false },
        { text: 'Konservativ behandling initialt', correct: false },
      ],
      explanation: 'Vid kombination av öppen fraktur och kompartmentsyndrom görs ofta fasciotomi och debridering samtidigt på operation.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.43',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "Volkmann kontraktur"?',
      options: [
        { text: 'Ischemic muskelkontraktur som följd av obehandlat kompartmentsyndrom', correct: true },
        { text: 'En frakturtyp', correct: false },
        { text: 'En infektionskomplikation', correct: false },
        { text: 'En nervskada', correct: false },
      ],
      explanation: 'Volkmann kontraktur är den klassiska komplikationen efter missat kompartmentsyndrom i underarmen.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Volkmann R 1881',
    },
    {
      code: '1.44',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Inom hur många timmar bör en akut kärlskada repareras för bäst prognos?',
      options: [
        { text: '6 timmar', correct: true },
        { text: '12 timmar', correct: false },
        { text: '24 timmar', correct: false },
        { text: '48 timmar', correct: false },
      ],
      explanation: '6 timmar är gränsen för optimal limb salvage vid komplett kärlocklusjon ("golden 6 hours").',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Feliciano DV J Trauma 2011',
    },
    {
      code: '1.45',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur påverkas prognosen om fasciotomi görs >8 timmar efter symtomdebut?',
      options: [
        { text: 'Permanent funktionsnedsättning är vanlig', correct: true },
        { text: 'Ingen skillnad jämfört med tidig fasciotomi', correct: false },
        { text: 'Prognosen förbättras', correct: false },
        { text: 'Fasciotomi är kontraindicerad efter 8 timmar', correct: false },
      ],
      explanation: 'Försenad fasciotomi (>6-8 timmar) leder ofta till permanent muskelskada och funktionsnedsättning.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; McQueen MM JBJS 2000',
    },
    {
      code: '1.46',
      chapterNumber: 1,
      bloomLevel: 'ANALYSIS',
      question: 'En 25-årig motorcyklist har öppen tibiafraktur med pulslöst ben. Vilka B-ORTIM-tillstånd kan föreligga?',
      options: [
        { text: 'Öppen fraktur + kärlskada, eventuellt även kompartmentsyndrom', correct: true },
        { text: 'Endast öppen fraktur', correct: false },
        { text: 'Endast kärlskada', correct: false },
        { text: 'Enbart blödning', correct: false },
      ],
      explanation: 'Flera tidskritiska tillstånd kan förekomma samtidigt. Pulslöshet tyder på kärlskada (Gustilo IIIC).',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.47',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "secondary survey" i traumasammanhang?',
      options: [
        { text: 'Detaljerad undersökning från huvud till tå efter att livshotande tillstånd åtgärdats', correct: true },
        { text: 'Undersökning av vittnen', correct: false },
        { text: 'Röntgenundersökning', correct: false },
        { text: 'Uppföljning dagen efter', correct: false },
      ],
      explanation: 'Secondary survey är den fullständiga undersökningen som görs efter att ABCDE och primärundersökning är klar.',
      reference: 'ATLS 10th Edition; B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.48',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'När bör extremitetsskador bedömas i traumaomhändertagandet?',
      options: [
        { text: 'Under C (blödning) och i secondary survey (övriga skador)', correct: true },
        { text: 'Endast i secondary survey', correct: false },
        { text: 'Före airway-bedömning', correct: false },
        { text: 'Endast av ortoped', correct: false },
      ],
      explanation: 'Massiv extremitetsblödning adresseras under C, övriga extremitetsskador bedöms i secondary survey.',
      reference: 'ATLS 10th Edition; B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.49',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den rekommenderade dokumentationen vid extremitetsskada?',
      options: [
        { text: 'Neurovaskulär status före och efter varje intervention', correct: true },
        { text: 'Endast vid misstanke om komplikation', correct: false },
        { text: 'Enbart röntgenfynd', correct: false },
        { text: 'Dokumentation är valfri', correct: false },
      ],
      explanation: 'Dokumentation av neurovaskulär status före och efter reponering, gips eller operation är medikolegalt viktigt.',
      reference: 'B-ORTIM Kursbok, Kapitel 1',
    },
    {
      code: '1.50',
      chapterNumber: 1,
      bloomLevel: 'ANALYSIS',
      question: 'Vilka lärdomar från militär traumavård har påverkat civil extremitetstraumabehandling mest?',
      options: [
        { text: 'Tourniquet-användning och tidig blödningskontroll', correct: true },
        { text: 'Nya frakturbehandlingsmetoder', correct: false },
        { text: 'Antibiotikaterapi', correct: false },
        { text: 'Rehabiliteringsprotokoll', correct: false },
      ],
      explanation: 'Militära konflikter har visat tourniquet-effektivitet och lett till ökad civil användning vid massiv extremitetsblödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 1; Kragh JF J Trauma 2008',
    },

    // Kapitel 2: Extra frågor
    {
      code: '2.3',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Vid LIMB-undersökning av en patient med knäluxation, vilken struktur är viktigast att bedöma akut?',
      options: [
        { text: 'A. poplitea (kärlstatus)', correct: true },
        { text: 'Meniskerna', correct: false },
        { text: 'Patellasenan', correct: false },
        { text: 'Quadricepsstyrka', correct: false },
      ],
      explanation: 'Knäluxation har hög risk för popliteakärlskada (upp till 40%). Kärlstatus måste bedömas omedelbart.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.4',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad betyder "M" i LIMB-protokollet?',
      options: [
        { text: 'Movement (rörlighet) och Muscle (motorik/sensorik)', correct: true },
        { text: 'Medication (medicinering)', correct: false },
        { text: 'Monitoring (övervakning)', correct: false },
        { text: 'Mechanism (skademekanism)', correct: false },
      ],
      explanation: 'M i LIMB står för rörlighet (aktiv/passiv), motorik och sensorik - viktigt för att bedöma nervfunktion och kompartmentstatus.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.5',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är det viktigt att dokumentera neurovaskulär status före och efter reponering?',
      options: [
        { text: 'För att upptäcka iatrogen skada och ha medikolegal dokumentation', correct: true },
        { text: 'Endast för statistik', correct: false },
        { text: 'Det krävs för försäkringsutbetalning', correct: false },
        { text: 'Det är frivilligt', correct: false },
      ],
      explanation: 'Dokumentation före och efter manipulation är essentiell för att upptäcka behandlingsorsakad skada och för medikolegala skäl.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.6',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står "L" för i LIMB-undersökningen?',
      options: [
        { text: 'Look - inspektion av extremiteten', correct: true },
        { text: 'Level - frakturnivå', correct: false },
        { text: 'Limb - extremitetens längd', correct: false },
        { text: 'Location - skadans placering', correct: false },
      ],
      explanation: 'L = Look innebär systematisk inspektion: sår, deformitet, svullnad, missfärgning, förkortning.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.7',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står "I" för i LIMB-undersökningen?',
      options: [
        { text: 'Ischemia - bedömning av cirkulation', correct: true },
        { text: 'Injury - skadebedömning', correct: false },
        { text: 'Inspection - inspektion', correct: false },
        { text: 'Immobilization - immobilisering', correct: false },
      ],
      explanation: 'I = Ischemia innebär bedömning av distal cirkulation: puls, kapillär återfyllnad, temperatur, färg.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.8',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står "B" för i LIMB-undersökningen?',
      options: [
        { text: 'Bones & soft tissue - palpation av skelett och mjukdelar', correct: true },
        { text: 'Bleeding - blödningsbedömning', correct: false },
        { text: 'Bandage - förband', correct: false },
        { text: 'Bilateral - jämförelse med andra sidan', correct: false },
      ],
      explanation: 'B = Bones & soft tissue innebär palpation av skelett (krepitationer, instabilitet) och mjukdelar (svullnad, spänd loge).',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.9',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Vid Look-steget noterar du att underbenets hud är blek och marmorerad. Vad tyder detta på?',
      options: [
        { text: 'Nedsatt cirkulation/ischemi', correct: true },
        { text: 'Normal hudfärg', correct: false },
        { text: 'Infektion', correct: false },
        { text: 'Venös stas', correct: false },
      ],
      explanation: 'Blek, marmorerad hud är ett tecken på arteriell insufficiens och ischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.10',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de fem komponenterna i neurovaskulär statusbedömning?',
      options: [
        { text: 'Puls, kapillär återfyllnad, hudfärg, temperatur, sensorik/motorik', correct: true },
        { text: 'Blodtryck, puls, andning, temperatur, medvetande', correct: false },
        { text: 'Smärta, svullnad, rodnad, värme, funktionsnedsättning', correct: false },
        { text: 'Rörlighet, styrka, stabilitet, smärta, svullnad', correct: false },
      ],
      explanation: 'Neurovaskulär status inkluderar vaskulära (puls, kapillär återfyllnad, färg, temperatur) och neurologiska (sensorik, motorik) komponenter.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.11',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är normal kapillär återfyllnadstid?',
      options: [
        { text: '<2 sekunder', correct: true },
        { text: '<5 sekunder', correct: false },
        { text: '<10 sekunder', correct: false },
        { text: '<1 sekund', correct: false },
      ],
      explanation: 'Normal kapillär återfyllnad är <2 sekunder. Förlängd tid indikerar nedsatt perfusion.',
      reference: 'B-ORTIM Kursbok, Kapitel 2; ATLS 10th Edition',
    },
    {
      code: '2.12',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'En patient har kapillär återfyllnadstid på 5 sekunder i en skadad fot. Vad indikerar detta?',
      options: [
        { text: 'Nedsatt arteriell perfusion', correct: true },
        { text: 'Normalt fynd', correct: false },
        { text: 'Venös insufficiens', correct: false },
        { text: 'Nervskada', correct: false },
      ],
      explanation: 'Förlängd kapillär återfyllnad (>2 sek) indikerar nedsatt arteriell perfusion och kräver vidare utredning.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.13',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är det viktigt att jämföra med kontralaterala extremiteten?',
      options: [
        { text: 'För att upptäcka sidoskillnader i puls, temperatur och omfång', correct: true },
        { text: 'Det är ett myndighetskrav', correct: false },
        { text: 'För att spara tid', correct: false },
        { text: 'Endast vid bilateral skada', correct: false },
      ],
      explanation: 'Jämförelse med friska sidan hjälper identifiera subtila skillnader i cirkulation och svullnad.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.14',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Patient med underbensfraktur. Du kan inte palpera a. dorsalis pedis men a. tibialis posterior är palpabel. Vad gör du?',
      options: [
        { text: 'Kontrollera med doppler och beräkna ABI', correct: true },
        { text: 'Lugn, en palpabel puls räcker', correct: false },
        { text: 'Direkt till operation', correct: false },
        { text: 'Avvakta och se', correct: false },
      ],
      explanation: 'Avsaknad av en puls med bevarad annan puls kräver doppler-verifikation. ABI <0.9 indicerar kärlskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.15',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv testas vid bedömning av dorsalflexion av foten?',
      options: [
        { text: 'N. peroneus profundus', correct: true },
        { text: 'N. tibialis', correct: false },
        { text: 'N. suralis', correct: false },
        { text: 'N. saphenus', correct: false },
      ],
      explanation: 'N. peroneus profundus innerverar m. tibialis anterior (dorsalflexion av foten) och extensor digitorum.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.16',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv testas vid bedömning av plantarflexion av foten?',
      options: [
        { text: 'N. tibialis', correct: true },
        { text: 'N. peroneus superficialis', correct: false },
        { text: 'N. femoralis', correct: false },
        { text: 'N. obturatorius', correct: false },
      ],
      explanation: 'N. tibialis innerverar m. gastrocnemius och soleus (plantarflexion).',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.17',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Patient med suprakondylär humerusfraktur kan inte flektera tumme och pekfinger. Vilken nerv är skadad?',
      options: [
        { text: 'N. medianus (anterior interosseus)', correct: true },
        { text: 'N. ulnaris', correct: false },
        { text: 'N. radialis', correct: false },
        { text: 'N. musculocutaneus', correct: false },
      ],
      explanation: 'Anteriora interosseusnerven (gren av n. medianus) innerverar FPL och FDP till dig II. Skada ger oförmåga att göra "OK-tecken".',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.18',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket sensoriskt område testar n. radialis?',
      options: [
        { text: 'Dorsala första interdigitalrummet (mellan tumme och pekfinger)', correct: true },
        { text: 'Palmarsidan av lillfingret', correct: false },
        { text: 'Palmarsidan av pekfingret', correct: false },
        { text: 'Mediala underarmen', correct: false },
      ],
      explanation: 'N. radialis sensoriska område testas bäst i första interdigitalrummet dorsalt.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.19',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket sensoriskt område testar n. ulnaris?',
      options: [
        { text: 'Lillfingrets palmara yta', correct: true },
        { text: 'Tummens palmara yta', correct: false },
        { text: 'Handryggen centralt', correct: false },
        { text: 'Underarmens radiala sida', correct: false },
      ],
      explanation: 'N. ulnaris sensoriska område inkluderar lillfingret och ulnara halvan av ringfingret.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.20',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket sensoriskt område testar n. medianus?',
      options: [
        { text: 'Pekfingrets palmara yta', correct: true },
        { text: 'Lillfingrets dorsala yta', correct: false },
        { text: 'Första interdigitalrummet dorsalt', correct: false },
        { text: 'Laterala underarmen', correct: false },
      ],
      explanation: 'N. medianus sensoriska område inkluderar tumme, pekfinger, långfinger och radiala halvan av ringfingret palmarsida.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.21',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Efter handleds­reponering noteras nedsatt sensorik i tumme, pek- och långfinger. Vilken struktur är komprimerad?',
      options: [
        { text: 'N. medianus i karpaltunneln', correct: true },
        { text: 'N. ulnaris i Guyons kanal', correct: false },
        { text: 'N. radialis', correct: false },
        { text: 'A. radialis', correct: false },
      ],
      explanation: 'Medianusdistribution (tumme, pekfinger, långfinger) tyder på kompression i karpaltunneln, vanligt vid handledsfraktur.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.22',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är sensorisk testning mer tillförlitlig än motorisk testning vid akut trauma?',
      options: [
        { text: 'Smärta kan förhindra aktiv rörelse men påverkar inte sensorik', correct: true },
        { text: 'Motorisk testning tar längre tid', correct: false },
        { text: 'Sensoriska nerver är starkare', correct: false },
        { text: 'Det finns ingen skillnad', correct: false },
      ],
      explanation: 'Smärta och svullnad kan ge falskt nedsatt motorik. Sensorik påverkas inte på samma sätt av smärta.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.23',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Patient med fibulahuvudfraktur har droppfot. Vilken nerv är skadad?',
      options: [
        { text: 'N. peroneus communis', correct: true },
        { text: 'N. tibialis', correct: false },
        { text: 'N. femoralis', correct: false },
        { text: 'N. ischiadicus', correct: false },
      ],
      explanation: 'N. peroneus communis löper runt fibulahuvudet och är mycket känslig för trauma där. Skada ger droppfot.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.24',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad menas med "hard signs" vid kärlskada?',
      options: [
        { text: 'Tecken som kräver omedelbar operation utan ytterligare utredning', correct: true },
        { text: 'Svåra att upptäcka tecken', correct: false },
        { text: 'Tecken som kräver CT-angio', correct: false },
        { text: 'Tecken som indikerar benbrott', correct: false },
      ],
      explanation: 'Hard signs (pulsatil blödning, expanderande hematom, avsaknad puls, ischemi, bruit/thrill) kräver direkt exploration.',
      reference: 'B-ORTIM Kursbok, Kapitel 2; EAST Guidelines 2012',
    },
    {
      code: '2.25',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de fem "hard signs" för kärlskada?',
      options: [
        { text: 'Pulsatil blödning, expanderande hematom, avsaknad distal puls, ischemi, bruit/thrill', correct: true },
        { text: 'Smärta, svullnad, rodnad, värme, funktionsnedsättning', correct: false },
        { text: 'Blekhet, pulslöshet, parestesier, paralys, poikilothermi', correct: false },
        { text: 'Fraktur, luxation, hematom, sår, svullnad', correct: false },
      ],
      explanation: 'De fem hard signs indikerar säker kärlskada och kräver omedelbar kirurgisk exploration.',
      reference: 'B-ORTIM Kursbok, Kapitel 2; EAST Guidelines 2012',
    },
    {
      code: '2.26',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad menas med "soft signs" vid kärlskada?',
      options: [
        { text: 'Tecken som kräver vidare utredning (CTA/ABI)', correct: true },
        { text: 'Tecken som kan ignoreras', correct: false },
        { text: 'Tecken på mjukdelsskada', correct: false },
        { text: 'Tecken på nervskada', correct: false },
      ],
      explanation: 'Soft signs (närliggande penetrerande skada, litet hematom, neurologiskt bortfall) kräver utredning med CTA eller ABI.',
      reference: 'B-ORTIM Kursbok, Kapitel 2; EAST Guidelines 2012',
    },
    {
      code: '2.27',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Patient med knivskada i ljumsken har expanderande hematom men palpabel fotpuls. Vad gör du?',
      options: [
        { text: 'Direkt operation - expanderande hematom är hard sign', correct: true },
        { text: 'CT-angiografi först', correct: false },
        { text: 'Observation i 24 timmar', correct: false },
        { text: 'Compression av hematom', correct: false },
      ],
      explanation: 'Expanderande hematom är ett hard sign som kräver omedelbar kirurgisk exploration oavsett pulsstatus.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.28',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför kan en patient ha palpabel puls trots kärlskada?',
      options: [
        { text: 'Intimaskada utan komplett ocklusion, eller kollateral cirkulation', correct: true },
        { text: 'Puls utesluter alltid kärlskada', correct: false },
        { text: 'Det är ett mätfel', correct: false },
        { text: 'Patienten ljuger om symtomen', correct: false },
      ],
      explanation: 'Intimaskada kan ge normal puls initialt men orsaka trombos senare. Kollateraler kan ge puls trots huvudkärlskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.29',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur beräknas ABI (Ankle-Brachial Index)?',
      options: [
        { text: 'Systoliskt ankeltryck / Systoliskt armtryck', correct: true },
        { text: 'Diastoliskt ankeltryck / Diastoliskt armtryck', correct: false },
        { text: 'Armtryck / Ankeltryck', correct: false },
        { text: 'Pulstryck ankel / Pulstryck arm', correct: false },
      ],
      explanation: 'ABI = systoliskt tryck i ankel (med doppler) / systoliskt tryck i arm.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.30',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket ABI-värde är normalt?',
      options: [
        { text: '0.9-1.3', correct: true },
        { text: '0.5-0.8', correct: false },
        { text: '1.5-2.0', correct: false },
        { text: '0.3-0.5', correct: false },
      ],
      explanation: 'Normalt ABI är 0.9-1.3. Värden <0.9 indikerar arteriell insufficiens, >1.3 kan indikera icke-komprimerbara kärl.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.31',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'ABI mäts till 0.7 hos en patient med underbensfraktur. Vad innebär detta?',
      options: [
        { text: 'Misstänkt kärlskada - vidare utredning med CTA behövs', correct: true },
        { text: 'Normalt fynd', correct: false },
        { text: 'Ingen åtgärd behövs', correct: false },
        { text: 'Direkt amputation', correct: false },
      ],
      explanation: 'ABI <0.9 indikerar nedsatt arteriell perfusion och kräver CT-angiografi för att utvärdera kärlskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.32',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken utrustning behövs för ABI-mätning?',
      options: [
        { text: 'Blodtrycksmanschett och doppler', correct: true },
        { text: 'Endast stetoskop', correct: false },
        { text: 'EKG-apparat', correct: false },
        { text: 'Pulsoximeter', correct: false },
      ],
      explanation: 'För ABI behövs blodtrycksmanschett och doppler (för att detektera blodflöde under ocklusion).',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.33',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Vid palpation av underbenet känns vaden spänd och extremt öm. Patienten skriker vid passiv dorsalflexion av tårna. Vilken diagnos misstänker du?',
      options: [
        { text: 'Kompartmentsyndrom', correct: true },
        { text: 'Djup ventrombos', correct: false },
        { text: 'Muskelruptur', correct: false },
        { text: 'Fraktur', correct: false },
      ],
      explanation: 'Spänd vad med smärta vid passiv töjning är klassiska tecken på kompartmentsyndrom.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.34',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de klassiska "6 P" vid ischemi?',
      options: [
        { text: 'Pain, Pallor, Pulselessness, Paresthesia, Paralysis, Poikilothermia', correct: true },
        { text: 'Pressure, Pain, Pulse, Perfusion, Position, Protection', correct: false },
        { text: 'Primary, Prevention, Protection, Position, Pulse, Pressure', correct: false },
        { text: 'Pain, Pulse, Pressure, Perfusion, Paralysis, Position', correct: false },
      ],
      explanation: 'De 6 P:na beskriver klassiska tecken på akut extremitetsischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.35',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilket av de 6 P:na är ett SENT tecken på ischemi?',
      options: [
        { text: 'Paralysis och Pulselessness', correct: true },
        { text: 'Pain', correct: false },
        { text: 'Pallor', correct: false },
        { text: 'Paresthesia', correct: false },
      ],
      explanation: 'Paralys och pulslöshet är sena tecken. Smärta och parestesier uppträder tidigare.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.36',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'En patient har kraftig deformitet vid underbensfraktur. Foten är blek och pulslös. Vad är första åtgärd?',
      options: [
        { text: 'Reponera frakturen för att återställa cirkulation', correct: true },
        { text: 'CT-angiografi', correct: false },
        { text: 'Vänta på ortoped', correct: false },
        { text: 'Operationsanmälan direkt', correct: false },
      ],
      explanation: 'En kraftigt dislokerad fraktur med ischemitecken reponeras omedelbart för att avlasta kärlen.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.37',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är syftet med reponering vid en fraktur med cirkulationspåverkan?',
      options: [
        { text: 'Avlasta kärl och nerver genom att minska vinkeln och återställa längd', correct: true },
        { text: 'Förbereda för gipsning', correct: false },
        { text: 'Kosmetiskt', correct: false },
        { text: 'Smärtlindring endast', correct: false },
      ],
      explanation: 'Reponering avlastar komprimerade kärl och nerver genom att korrigera felställning.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.38',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Du reponerar en underbensfraktur. Efter reponeringen återkommer fotpulsen. Vad dokumenterar du?',
      options: [
        { text: 'Neurovaskulär status före och efter reponering, tid, och utförare', correct: true },
        { text: 'Endast att reponering genomfördes', correct: false },
        { text: 'Inget, det är standard', correct: false },
        { text: 'Endast om komplikation uppstår', correct: false },
      ],
      explanation: 'Noggrann dokumentation av neurovaskulär status före och efter är essentiell för medikolegala skäl.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.39',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken röntgenvy är förstahandsval vid extremitetsskada?',
      options: [
        { text: 'Två vinkelräta projektioner (frontal och lateral)', correct: true },
        { text: 'Enbart frontal', correct: false },
        { text: 'CT i första hand', correct: false },
        { text: 'MR', correct: false },
      ],
      explanation: 'Frakturdiagnostik kräver minst två vinkelräta projektioner för att inte missa frakturer.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.40',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken princip gäller för röntgen av extremitetsskador?',
      options: [
        { text: 'Inkludera leden ovanför och nedan om frakturen', correct: true },
        { text: 'Endast frakturnivån', correct: false },
        { text: 'Hela extremiteten alltid', correct: false },
        { text: 'Beror på läkarens preferens', correct: false },
      ],
      explanation: 'Leder ovanför och nedan inkluderas för att inte missa associerade skador (t.ex. Maisonneuve-fraktur).',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.41',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska röntgen tas EFTER reponering vid påverkad cirkulation?',
      options: [
        { text: 'Cirkulationen prioriteras, röntgen kan vänta till efter reponering', correct: true },
        { text: 'Röntgen skadar kärlen', correct: false },
        { text: 'Bildkvaliteten blir bättre', correct: false },
        { text: 'Det är aldrig bråttom med röntgen', correct: false },
      ],
      explanation: 'Vid ischemitecken prioriteras reponering före röntgen. Dokumentera neurovaskulär status.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.42',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Patient med misstänkt höftfraktur efter fall har stark smärta och förkortad, utåtroterad extremitet. Vilken undersökning prioriteras?',
      options: [
        { text: 'Röntgen höft/bäcken efter neurovaskulär statusbedömning', correct: true },
        { text: 'MR höft', correct: false },
        { text: 'CT bäcken direkt', correct: false },
        { text: 'Ultraljud', correct: false },
      ],
      explanation: 'Kliniska fynd (förkortad, utåtroterad) tyder på höftfraktur. Röntgen bekräftar diagnosen efter neurovaskulär undersökning.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.43',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'När är CT-angiografi indicerad vid extremitetstrauma?',
      options: [
        { text: 'Vid soft signs för kärlskada eller ABI <0.9', correct: true },
        { text: 'Vid alla frakturer', correct: false },
        { text: 'Endast vid hard signs', correct: false },
        { text: 'Aldrig vid akut trauma', correct: false },
      ],
      explanation: 'CTA är indicerad vid soft signs eller patologiskt ABI för att utvärdera misstänkt kärlskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 2; EAST Guidelines 2012',
    },
    {
      code: '2.44',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Vilket LIMB-fynd kräver mest akut åtgärd?',
      options: [
        { text: 'Ischemia: pulslös, blek, kall extremitet', correct: true },
        { text: 'Look: öppet sår', correct: false },
        { text: 'Movement: nedsatt rörlighet', correct: false },
        { text: 'Bones: krepitationer', correct: false },
      ],
      explanation: 'Ischemitecken (pulslös, blek, kall) kräver omedelbar åtgärd för att rädda extremiteten.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.45',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska LIMB-undersökningen upprepas regelbundet?',
      options: [
        { text: 'För att upptäcka utvecklande kompartmentsyndrom eller kärlkomplikation', correct: true },
        { text: 'För att träna personalen', correct: false },
        { text: 'Endast om patienten klagar', correct: false },
        { text: 'Det är inte nödvändigt', correct: false },
      ],
      explanation: 'Kompartmentsyndrom och kärlskador kan utvecklas över tid. Regelbunden reevaluering är essentiell.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.46',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'En patient med gipsad underbensfraktur får tilltagande smärta efter 6 timmar. Gipset är cirkulärt. Första åtgärd?',
      options: [
        { text: 'Klipp upp gipset/öppna längs hela längden och utvärdera', correct: true },
        { text: 'Ge mer smärtstillande', correct: false },
        { text: 'Avvakta till morgondagen', correct: false },
        { text: 'Ta röntgen', correct: false },
      ],
      explanation: 'Tilltagande smärta i cirkulärt gips kan tyda på kompartmentsyndrom. Gipset öppnas omedelbart.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.47',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur ofta bör neurovaskulär status kontrolleras hos en patient med hög risk för kompartmentsyndrom?',
      options: [
        { text: 'Var 1-2 timme initialt', correct: true },
        { text: 'En gång per dygn', correct: false },
        { text: 'Endast vid symtom', correct: false },
        { text: 'Var 8:e timme', correct: false },
      ],
      explanation: 'Högriskpatienter (tibiafraktur, crushing injury) bör övervakas var 1-2 timme de första 24-48 timmarna.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.48',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Patient med armbågsfraktur har nedsatt radialispuls jämfört med andra armen. Vad gör du?',
      options: [
        { text: 'Jämför med kontralateralt, överväg reponering och planera för ABI/CTA', correct: true },
        { text: 'Ignorera, pulsen är palpabel', correct: false },
        { text: 'Avvakta till morgonen', correct: false },
        { text: 'Direkt amputation', correct: false },
      ],
      explanation: 'Sidoskillnad i puls kan indikera kärlpåverkan. Reponering och vidare utredning är indicerad.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.49',
      chapterNumber: 2,
      bloomLevel: 'ANALYSIS',
      question: 'LIMB-undersökning visar: L=sår dorsalt underben, I=puls+, kapillär återfyllnad 4 sek, M=nedsatt dorsalflexion, B=instabil tibiafraktur. Viktigaste fyndet?',
      options: [
        { text: 'Förlängd kapillär återfyllnad (4 sek) tyder på cirkulationspåverkan', correct: true },
        { text: 'Såret dorsalt', correct: false },
        { text: 'Frakturen', correct: false },
        { text: 'Nedsatt dorsalflexion', correct: false },
      ],
      explanation: 'Förlängd kapillär återfyllnad trots palpabel puls indikerar nedsatt perfusion som kräver akut åtgärd.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: '2.50',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är LIMB-protokollet systematiskt uppbyggt?',
      options: [
        { text: 'För att inte missa kritiska fynd och säkerställa reproducerbarhet', correct: true },
        { text: 'Det är juridiskt krav', correct: false },
        { text: 'För att spara tid', correct: false },
        { text: 'Det är slumpmässigt utformat', correct: false },
      ],
      explanation: 'Systematik minskar risken att missa kritiska fynd och underlättar kommunikation och dokumentation.',
      reference: 'B-ORTIM Kursbok, Kapitel 2',
    },

    // Kapitel 3: Extra frågor
    {
      code: '3.3',
      chapterNumber: 3,
      bloomLevel: 'ANALYSIS',
      question: 'Patient med bilateral femurfraktur och instabilt bäcken. Vilket tillstånd prioriteras?',
      options: [
        { text: 'Instabilt bäcken - större blödningsrisk', correct: true },
        { text: 'Vänster femurfraktur', correct: false },
        { text: 'Höger femurfraktur', correct: false },
        { text: 'Alla behandlas samtidigt', correct: false },
      ],
      explanation: 'Instabilt bäcken har högre blödningspotential och prioriteras. Bäckenbälte appliceras omedelbart.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.4',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär principen "life over limb"?',
      options: [
        { text: 'Livshotande tillstånd behandlas före extremitetshotande', correct: true },
        { text: 'Amputation är alltid förstahandsval', correct: false },
        { text: 'Extremiteter är viktigare än vitala organ', correct: false },
        { text: 'Livskvalitet går före överlevnad', correct: false },
      ],
      explanation: 'Life over limb innebär att livshotande tillstånd (t.ex. bäckenblödning) alltid prioriteras före extremitetshotande (t.ex. kärlskada i arm).',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.5',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken tidsgräns gäller för "golden hour" vid extremitetskärlskada?',
      options: [
        { text: '6 timmar', correct: true },
        { text: '1 timme', correct: false },
        { text: '12 timmar', correct: false },
        { text: '24 timmar', correct: false },
      ],
      explanation: 'Trots namnet "golden hour" är tidsgränsen för limb salvage vid kärlskada 6 timmar varm ischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Feliciano DV J Trauma 2011',
    },
    {
      code: '3.6',
      chapterNumber: 3,
      bloomLevel: 'ANALYSIS',
      question: 'Patient med bilateral femurfraktur och skallfraktur med epiduralhematom. Vilken skada prioriteras?',
      options: [
        { text: 'Epiduralhematomet - livshotande intrakraniellt tryck', correct: true },
        { text: 'Vänster femur', correct: false },
        { text: 'Höger femur', correct: false },
        { text: 'Alla behandlas lika', correct: false },
      ],
      explanation: 'Expanderande epiduralhematom är livshotande och prioriteras enligt "life over limb".',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.7',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Två patienter: A har öppen tibiafraktur, B har ischemisk fot efter knäluxation. Vem prioriteras?',
      options: [
        { text: 'Patient B - ischemi kräver akutare intervention än öppen fraktur', correct: true },
        { text: 'Patient A - öppen fraktur är allvarligare', correct: false },
        { text: 'Lika prioritet', correct: false },
        { text: 'Beror på vem som kom först', correct: false },
      ],
      explanation: 'Ischemi har kortare tidsfönster (6h) än öppen fraktur (12-24h för debridering). Kärlskada prioriteras.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.8',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär "limb over limb" i prioriteringssammanhang?',
      options: [
        { text: 'Undre extremitet prioriteras över övre vid resursbrist (funktion)', correct: true },
        { text: 'Övre extremitet prioriteras alltid', correct: false },
        { text: 'Alla extremiteter är lika viktiga', correct: false },
        { text: 'Höger sida prioriteras', correct: false },
      ],
      explanation: 'Vid resursbrist prioriteras nedre extremitet för gångfunktion, men varje fall bedöms individuellt.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.9',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är tidsgränsen för fasciotomi vid kompartmentsyndrom för optimal prognos?',
      options: [
        { text: '6 timmar', correct: true },
        { text: '12 timmar', correct: false },
        { text: '24 timmar', correct: false },
        { text: '2 timmar', correct: false },
      ],
      explanation: 'Fasciotomi inom 6 timmar ger bäst prognos. Efter 6-8 timmar ökar risken för permanent skada markant.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; McQueen MM JBJS 2000',
    },
    {
      code: '3.10',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Patient inkommer med bäckenfraktur och massiv blödning samt öppen tibiafraktur. Vad görs först?',
      options: [
        { text: 'Bäckenbälte och massiv transfusion - bäckenblödning är livshotande', correct: true },
        { text: 'Debridering av öppen tibiafraktur', correct: false },
        { text: 'Röntgen av tibia', correct: false },
        { text: 'CT-angiografi av bäcken', correct: false },
      ],
      explanation: 'Bäckenblödning kan vara massiv och livshotande. Stabilisering med bälte och blödningskontroll prioriteras.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.11',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur klassificeras extremitetsskador enligt prioritet i ATLS?',
      options: [
        { text: 'Livshotande → Extremitetshotande → Icke-brådskande', correct: true },
        { text: 'Proximala → Distala → Mjukdelsskador', correct: false },
        { text: 'Öppna → Slutna → Luxationer', correct: false },
        { text: 'Vänster → Höger → Båda', correct: false },
      ],
      explanation: 'ATLS prioriterar: 1) Livshotande (massiv blödning), 2) Extremitetshotande (ischemi), 3) Icke-brådskande.',
      reference: 'ATLS 10th Edition; B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.12',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken extremitetsskada räknas som "livshotande"?',
      options: [
        { text: 'Massiv blödning som hotar att förblöda patienten', correct: true },
        { text: 'Öppen fraktur', correct: false },
        { text: 'Alla kärlskador', correct: false },
        { text: 'Kompartmentsyndrom', correct: false },
      ],
      explanation: 'Livshotande = direkt hot mot patientens liv. Massiv blödning är den primära livshotande extremitetsskadan.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.13',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken extremitetsskada räknas som "extremitetshotande"?',
      options: [
        { text: 'Kärlskada med ischemi, kompartmentsyndrom', correct: true },
        { text: 'Alla frakturer', correct: false },
        { text: 'Endast öppna frakturer', correct: false },
        { text: 'Luxationer utan cirkulationspåverkan', correct: false },
      ],
      explanation: 'Extremitetshotande = hotar extremitetens överlevnad: kärlskador med ischemi, kompartmentsyndrom.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.14',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En patient har traumatisk amputation av underarm med kontrollerad blödning. Vilken prioritet har skadan nu?',
      options: [
        { text: 'Extremitetshotande - replantation kräver snabb åtgärd', correct: true },
        { text: 'Livshotande', correct: false },
        { text: 'Icke-brådskande', correct: false },
        { text: 'Kan vänta till nästa dag', correct: false },
      ],
      explanation: 'Med kontrollerad blödning är skadan extremitetshotande. Replantation har tidsgräns beroende på ischemitid.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.15',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken ischemitid gäller för fingerreplantation vid kall förvaring?',
      options: [
        { text: 'Upp till 24 timmar', correct: true },
        { text: '6 timmar', correct: false },
        { text: '2 timmar', correct: false },
        { text: '48 timmar', correct: false },
      ],
      explanation: 'Fingrar kan replanteras upp till 24h vid kall förvaring (4°C) eftersom de har liten muskelmassa.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Soucacos PN Microsurgery 2001',
    },
    {
      code: '3.16',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken ischemitid gäller för arm/ben replantation vid kall förvaring?',
      options: [
        { text: '12 timmar', correct: true },
        { text: '24 timmar', correct: false },
        { text: '6 timmar', correct: false },
        { text: '48 timmar', correct: false },
      ],
      explanation: 'Större amputat med muskelmassa tolererar kortare tid: 6h varm, 12h kall ischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.17',
      chapterNumber: 3,
      bloomLevel: 'ANALYSIS',
      question: 'Multitraumapatient med lungkontusion, femurfraktur och misstänkt kompartmentsyndrom i underbenet. Vilken ordning?',
      options: [
        { text: 'Stabilisera andning → Kompartmenttryckmätning → Femurfixation', correct: true },
        { text: 'Femurfixation först', correct: false },
        { text: 'Kompartmenttryck först', correct: false },
        { text: 'Alla samtidigt', correct: false },
      ],
      explanation: 'ABCDE-princip: andning först (B). Sedan extremitetshotande (kompartment), sedan fraktur.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.18',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är teamarbete viktigt vid prioritering av multitraumapatienter?',
      options: [
        { text: 'Flera åtgärder kan genomföras parallellt', correct: true },
        { text: 'Juridiska skäl', correct: false },
        { text: 'Det är billigare', correct: false },
        { text: 'En person kan inte ta beslut', correct: false },
      ],
      explanation: 'Traumateam möjliggör parallell behandling: en hanterar airway, en cirkulerar, ortoped bedömer extremitet.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.19',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En patient har ischemisk hand (6h sedan skada) och hemothorax. Thoraxdrän sätts. Vad händer med handen?',
      options: [
        { text: 'Parallell utvärdering/behandling om resurser finns, annars direkt efter thorax', correct: true },
        { text: 'Handen kan vänta tills patienten är helt stabil', correct: false },
        { text: 'Amputera handen för att fokusera på thorax', correct: false },
        { text: 'Ischemitiden spelar ingen roll', correct: false },
      ],
      explanation: 'Med team kan kärlkirurg utvärdera parallellt. Ischemitiden (6h) är kritisk och får inte förlängas onödigt.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.20',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "damage control orthopaedics" (DCO)?',
      options: [
        { text: 'Temporär stabilisering för att minimera second hit', correct: true },
        { text: 'Definitiv frakturfixation akut', correct: false },
        { text: 'Konservativ behandling', correct: false },
        { text: 'Direkt amputation', correct: false },
      ],
      explanation: 'DCO innebär snabb temporär fixation (extern fixatör) för att undvika ytterligare fysiologisk belastning.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Pape HC J Trauma 2007',
    },
    {
      code: '3.21',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är "second hit" i traumasammanhang?',
      options: [
        { text: 'Ytterligare fysiologisk stress från operation hos redan skadad patient', correct: true },
        { text: 'En andra traumatisk skada', correct: false },
        { text: 'Nosokomial infektion', correct: false },
        { text: 'Reoperation', correct: false },
      ],
      explanation: 'Second hit är den inflammatoriska/fysiologiska belastning som långvarig kirurgi orsakar på en redan stressad patient.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Pape HC Injury 2007',
    },
    {
      code: '3.22',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Patient med hypotermi (34°C), pH 7.18, INR 2.1 och femurfraktur. DCO eller definitiv fixation?',
      options: [
        { text: 'DCO med extern fixatör - patienten har "lethal triad"', correct: true },
        { text: 'Definitiv märgspik nu', correct: false },
        { text: 'Avvakta med all behandling', correct: false },
        { text: 'Endast gips', correct: false },
      ],
      explanation: 'Patienten har den letala triaden. DCO med snabb extern fixation minimerar second hit.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Pape HC J Trauma 2007',
    },
    {
      code: '3.23',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka parametrar indikerar behov av DCO istället för ETC (early total care)?',
      options: [
        { text: 'Hypotermi <35°C, pH <7.25, koagulopati, laktat >2.5', correct: true },
        { text: 'Endast frakturtypen', correct: false },
        { text: 'Patientens ålder', correct: false },
        { text: 'Tiden på dygnet', correct: false },
      ],
      explanation: 'DCO-indikationer: hypotermi, acidos, koagulopati, förhöjt laktat, instabilitet, lungskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Vallier HA J Orthop Trauma 2013',
    },
    {
      code: '3.24',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär ETC (Early Total Care)?',
      options: [
        { text: 'Definitiv frakturfixation inom 24h hos stabil patient', correct: true },
        { text: 'Samma som DCO', correct: false },
        { text: 'Konservativ behandling', correct: false },
        { text: 'Behandling efter 1 vecka', correct: false },
      ],
      explanation: 'ETC innebär definitiv kirurgisk behandling tidigt hos fysiologiskt stabila patienter.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.25',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Ung patient med isolerad femurfraktur, normala vitalparametrar, laktat 1.0. DCO eller ETC?',
      options: [
        { text: 'ETC med definitiv märgspik', correct: true },
        { text: 'DCO med extern fixatör', correct: false },
        { text: 'Konservativ behandling', correct: false },
        { text: 'Avvakta 1 vecka', correct: false },
      ],
      explanation: 'Fysiologiskt stabil patient med isolerad skada gynnas av ETC med tidigt definitiv fixation.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.26',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken fraktur har högst prioritet vid multitrauma?',
      options: [
        { text: 'Instabil bäckenfraktur med hemodynamisk påverkan', correct: true },
        { text: 'Tibiafraktur', correct: false },
        { text: 'Handleds­fraktur', correct: false },
        { text: 'Fotledsfraktur', correct: false },
      ],
      explanation: 'Bäckenfrakturer kan orsaka massiv blödning och kräver omedelbar stabilisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.27',
      chapterNumber: 3,
      bloomLevel: 'ANALYSIS',
      question: 'Patient med öppen femurfraktur (Gustilo IIIA) och sluten tibiafraktur med kompartmentsyndrom. Prioritering?',
      options: [
        { text: 'Fasciotomi för kompartmentsyndrom, sedan debridering av öppen fraktur', correct: true },
        { text: 'Öppen fraktur först', correct: false },
        { text: 'Tibianspik först', correct: false },
        { text: 'Båda kan vänta', correct: false },
      ],
      explanation: 'Kompartmentsyndrom är extremitetshotande med kort tidsfönster (6h). Öppen fraktur har längre tid (12-24h).',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.28',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är öppna frakturer INTE klassade som "extremitetshotande"?',
      options: [
        { text: 'De hotar inte extremitetens cirkulation akut (tidsfönster 12-24h)', correct: true },
        { text: 'De är inte allvarliga', correct: false },
        { text: 'Antibiotika löser problemet', correct: false },
        { text: 'De läker av sig själva', correct: false },
      ],
      explanation: 'Öppna frakturer hotar inte akut extremitetens överlevnad. Risken är infektion, med tidsfönster 12-24h.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.29',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Ett 5-årigt barn har suprakondylär humerusfraktur med pulslös, blek hand. Hur prioriteras?',
      options: [
        { text: 'Extremt brådskande - omedelbar reponering/operation för att rädda armen', correct: true },
        { text: 'Kan vänta till imorgon', correct: false },
        { text: 'Observera först', correct: false },
        { text: 'Gipsa och se', correct: false },
      ],
      explanation: 'Pulslös extremitet hos barn är akut. Reponering på akuten och/eller akut operation krävs.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.30',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är tidsgränsen för debridering av öppen fraktur enligt BOA/BAPRAS?',
      options: [
        { text: '12-24 timmar beroende på grad', correct: true },
        { text: '6 timmar för alla', correct: false },
        { text: '48 timmar', correct: false },
        { text: 'Ingen tidsgräns', correct: false },
      ],
      explanation: 'BOA/BAPRAS 2020: Gustilo IIIB/C inom 12h, övriga inom 24h (tidigare 6h-regel gäller ej).',
      reference: 'B-ORTIM Kursbok, Kapitel 3; BOA/BAPRAS 2020',
    },
    {
      code: '3.31',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ändrades tidsgränsen för öppen frakturdebridering från 6h till 12-24h?',
      options: [
        { text: 'Evidens visade att tidig antibiotika är viktigare än exakt debridetingstid', correct: true },
        { text: 'Resursbrist', correct: false },
        { text: 'Patienterna vägrade operation', correct: false },
        { text: 'Det var ett misstag', correct: false },
      ],
      explanation: 'Studier visade att antibiotika inom 1h är viktigare än exakt tidpunkt för debridering.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; BOA/BAPRAS 2020',
    },
    {
      code: '3.32',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Nattetid: patient med Gustilo II öppen underbensfraktur. Stabil. Ska operation ske nu eller imorgon?',
      options: [
        { text: 'Operation kan vänta till dagtid om antibiotika givits och såret täckts', correct: true },
        { text: 'Måste opereras inom 6 timmar', correct: false },
        { text: 'Kan vänta i 48 timmar', correct: false },
        { text: 'Behöver ingen operation', correct: false },
      ],
      explanation: 'Gustilo II kan debridieras inom 24h enligt BOA/BAPRAS. Antibiotika och sterilt förband prioriteras.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; BOA/BAPRAS 2020',
    },
    {
      code: '3.33',
      chapterNumber: 3,
      bloomLevel: 'ANALYSIS',
      question: 'Tre patienter väntar: A=öppen fraktur 8h, B=kompartmentsyndrom 4h, C=kärlskada med ischemi 5h. Prioritering?',
      options: [
        { text: 'B (kompartment) → C (kärlskada) → A (öppen fraktur)', correct: true },
        { text: 'A → B → C', correct: false },
        { text: 'C → B → A', correct: false },
        { text: 'Alla lika brådskande', correct: false },
      ],
      explanation: 'B har 4h av 6h-fönster, C har 5h av 6h-fönster (båda kritiska men B är mer akut). A har 8h av 24h.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.34',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är MESS-scoren?',
      options: [
        { text: 'Mangled Extremity Severity Score - prediktor för amputation vs limb salvage', correct: true },
        { text: 'Motorisk funktion score', correct: false },
        { text: 'Medicinsk akutskala', correct: false },
        { text: 'Mentalstatus skala', correct: false },
      ],
      explanation: 'MESS används för att prognostisera om en svårt skadad extremitet kan räddas eller bör amputeras.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Johansen K J Trauma 1990',
    },
    {
      code: '3.35',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka faktorer ingår i MESS-scoren?',
      options: [
        { text: 'Skelett/mjukdelsskada, ischemi, chock, ålder', correct: true },
        { text: 'Endast frakturtyp', correct: false },
        { text: 'Blodtryck och puls', correct: false },
        { text: 'Röntgenfynd', correct: false },
      ],
      explanation: 'MESS: Skelett/mjukdel (1-4p), Limb ischemia (1-3p, dubblas om >6h), Shock (0-2p), Age (0-2p).',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Johansen K J Trauma 1990',
    },
    {
      code: '3.36',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'MESS-score beräknas till 8. Vad indikerar detta?',
      options: [
        { text: 'Hög risk för amputation - överväg primär amputation', correct: true },
        { text: 'God prognos för limb salvage', correct: false },
        { text: 'Normalvärde', correct: false },
        { text: 'Behov av replantation', correct: false },
      ],
      explanation: 'MESS ≥7 har hög prediktivt värde för misslyckad limb salvage. Amputation bör övervägas.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Johansen K J Trauma 1990',
    },
    {
      code: '3.37',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är MESS-scoren kontroversiell?',
      options: [
        { text: 'Falskt positivt - kan leda till onödiga amputationer', correct: true },
        { text: 'Den är för komplicerad', correct: false },
        { text: 'Den tar för lång tid', correct: false },
        { text: 'Den är inte evidensbaserad', correct: false },
      ],
      explanation: 'MESS har visat falskt positiva (predikterar amputation men limb salvage lyckas). Bör inte användas isolerat.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.38',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Patient 65 år med "mangled extremity", systoliskt BT 70, ischemitid 8h. Hur vägs beslut amputation vs salvage?',
      options: [
        { text: 'MESS + klinisk bedömning + patientens önskan + resurser', correct: true },
        { text: 'Endast MESS', correct: false },
        { text: 'Läkarens magkänsla', correct: false },
        { text: 'Alltid limb salvage först', correct: false },
      ],
      explanation: 'Beslut baseras på flera faktorer: scoring, klinisk bedömning, patientfaktorer och tillgänglig kompetens.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.39',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "permissive hypotension" vid traumaresuscitering?',
      options: [
        { text: 'Tolerera lägre blodtryck (SBT 80-90) för att undvika att spä ut koagulationsfaktorer', correct: true },
        { text: 'Sträva efter normalt blodtryck alltid', correct: false },
        { text: 'Ge inga vätskor', correct: false },
        { text: 'Högt blodtryck är målet', correct: false },
      ],
      explanation: 'Permissive hypotension minskar utspädning av koagulationsfaktorer och undviker att "blåsa loss" koagler.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.40',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka patienter ska INTE ha permissive hypotension?',
      options: [
        { text: 'Patienter med skalltrauma - hjärnan behöver bra perfusionstryck', correct: true },
        { text: 'Alla traumapatienter', correct: false },
        { text: 'Endast äldre', correct: false },
        { text: 'Gravida', correct: false },
      ],
      explanation: 'Vid skallskada är cerebralt perfusionstryck avgörande. Dessa patienter behöver högre MAP.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.41',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Traumapatient med massiv blödning: vad ges först - kristalloid, kolloid eller blod?',
      options: [
        { text: 'Blodprodukter (tidig massiv transfusion) om tillgängligt', correct: true },
        { text: 'Kristalloid i stora volymer', correct: false },
        { text: 'Kolloid', correct: false },
        { text: 'Endast syrgas', correct: false },
      ],
      explanation: 'Modern resuscitering förespråkar tidig blodprodukt (1:1:1 ratio) framför kristalloidöverbelastning.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.42',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "1:1:1" transfusionsstrategi?',
      options: [
        { text: 'Plasma:Trombocyter:Erytrocyter i förhållandet 1:1:1', correct: true },
        { text: 'Kristalloid:Kolloid:Blod 1:1:1', correct: false },
        { text: 'Tre olika blodgrupper', correct: false },
        { text: 'En enhet av varje per timme', correct: false },
      ],
      explanation: '1:1:1 mimikerar helblod och förbättrar koagulation jämfört med enbart erytrocyter.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; PROPPR Trial',
    },
    {
      code: '3.43',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Vid resursbrist på traumarummet, hur prioriteras arbetet?',
      options: [
        { text: 'Enligt ABCDE med teamledare som koordinerar', correct: true },
        { text: 'Alla gör samma sak', correct: false },
        { text: 'Den mest erfarna bestämmer allt', correct: false },
        { text: 'Ingen prioritering behövs', correct: false },
      ],
      explanation: 'ABCDE-prioritering med tydlig teamledning säkerställer rätt fokus vid resursbrist.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; ATLS 10th ed',
    },
    {
      code: '3.44',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är syftet med "damage control surgery"?',
      options: [
        { text: 'Snabbt kontrollera blödning och kontamination, minimera operationstid', correct: true },
        { text: 'Definitiv behandling av alla skador', correct: false },
        { text: 'Kosmetiskt bästa resultat', correct: false },
        { text: 'Utbilda kirurger', correct: false },
      ],
      explanation: 'Damage control = snabb blödningskontroll och kontaminationskontroll, sedan IVA för resuscitering.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; Rotondo MF J Trauma 1993',
    },
    {
      code: '3.45',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En multitraumapatient har leverlaceration och femurfraktur. Vilken operationsordning?',
      options: [
        { text: 'Laparotomi för blödningskontroll, sedan extern fixation av femur', correct: true },
        { text: 'Femurspik först', correct: false },
        { text: 'Båda kan vänta', correct: false },
        { text: 'Endast observation', correct: false },
      ],
      explanation: 'Intraabdominell blödning är livshotande och prioriteras. Femur stabiliseras med ex-fix efter.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.46',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur kommuniceras prioriteringsbeslut i traumateamet?',
      options: [
        { text: 'Closed-loop kommunikation med bekräftelse', correct: true },
        { text: 'Skrivet PM efteråt', correct: false },
        { text: 'Tyst överenskommelse', correct: false },
        { text: 'Endast muntligt till teamledaren', correct: false },
      ],
      explanation: 'Closed-loop: order → bekräftelse → genomförande → återrapport. Minskar missförstånd.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; TeamSTEPPS',
    },
    {
      code: '3.47',
      chapterNumber: 3,
      bloomLevel: 'ANALYSIS',
      question: 'Klockan 02:00, ensam ortoped, två akuta patienter: A=öppen tibia 6h gammal, B=kompartment 3h. Vem först?',
      options: [
        { text: 'B (kompartment) - kortare tidsfönster kvar', correct: true },
        { text: 'A - äldst skada', correct: false },
        { text: 'Lotta', correct: false },
        { text: 'Vänta på hjälp', correct: false },
      ],
      explanation: 'Kompartment har 3h av 6h kvar. Öppen tibia har 18h av 24h kvar. Kompartment är mer akut.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.48',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför dokumenteras prioriteringsbeslut?',
      options: [
        { text: 'Medikolegal dokumentation och kvalitetsuppföljning', correct: true },
        { text: 'Endast för statistik', correct: false },
        { text: 'Det krävs inte', correct: false },
        { text: 'För försäkringsbolag enbart', correct: false },
      ],
      explanation: 'Dokumentation skyddar vid eventuella klagomål och möjliggör kvalitetsförbättring.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.49',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En patient med svårt skadad arm vill absolut att man försöker rädda armen trots MESS 8. Hur hanteras detta?',
      options: [
        { text: 'Informera om risker, respektera autonomi men säkerställ informerat beslut', correct: true },
        { text: 'Ignorera patientens önskan', correct: false },
        { text: 'Amputera mot patientens vilja', correct: false },
        { text: 'Gör inget', correct: false },
      ],
      explanation: 'Patientens autonomi respekteras efter fullständig information om risker och prognos.',
      reference: 'B-ORTIM Kursbok, Kapitel 3',
    },
    {
      code: '3.50',
      chapterNumber: 3,
      bloomLevel: 'ANALYSIS',
      question: 'Vid masskadehändelse med begränsade resurser, hur ändras prioriteringen?',
      options: [
        { text: 'Från individuell optimal vård till största nytta för flest - triage', correct: true },
        { text: 'Samma principer gäller', correct: false },
        { text: 'Först till kvarn', correct: false },
        { text: 'Ingen behandlas', correct: false },
      ],
      explanation: 'Masskada kräver triage där resurserna riktas till dem som har störst nytta av begränsade resurser.',
      reference: 'B-ORTIM Kursbok, Kapitel 3; START Triage',
    },

    // Kapitel 4: Extra frågor
    {
      code: '4.3',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'En tourniquet har suttit i 3 timmar. Patienten är på väg till operation. Ska tourniquet lossas?',
      options: [
        { text: 'Nej, behåll tills kirurgisk blödningskontroll är möjlig', correct: true },
        { text: 'Ja, lossa omedelbart', correct: false },
        { text: 'Lossa i 5 minuter varje timme', correct: false },
        { text: 'Byt till ny tourniquet', correct: false },
      ],
      explanation: 'Tourniquet ska inte lossas prehospitalt eller på akuten. Den behålls tills definitiv kirurgisk blödningskontroll kan uppnås.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; Kragh JF J Trauma 2008',
    },
    {
      code: '4.4',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Var ska en tourniquet placeras optimalt?',
      options: [
        { text: '5-7 cm proximalt om skadan, över ett ben (inte led)', correct: true },
        { text: 'Direkt över såret', correct: false },
        { text: 'Över leden närmast skadan', correct: false },
        { text: 'Så högt upp som möjligt', correct: false },
      ],
      explanation: 'Tourniquet placeras 5-7 cm proximalt om blödningskällan, över ett ben (inte över led) för effektiv kompression av kärlen.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.5',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är den viktigaste åtgärden efter tourniquet-applikation?',
      options: [
        { text: 'Dokumentera applikationstid tydligt', correct: true },
        { text: 'Ge morfin', correct: false },
        { text: 'Ta blodprover', correct: false },
        { text: 'Röntga extremiteten', correct: false },
      ],
      explanation: 'Tid för tourniquet-applikation måste dokumenteras tydligt (helst på patientens panna: "TK" + tid) för att förhindra för lång ischemitid.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.6',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad definieras som massiv blödning vid extremitetstrauma?',
      options: [
        { text: 'Livshotande blödning som inte kan kontrolleras med direkt tryck', correct: true },
        { text: 'All synlig blödning', correct: false },
        { text: 'Blödning >100 ml', correct: false },
        { text: 'Blödning som kräver ett förband', correct: false },
      ],
      explanation: 'Massiv blödning är livshotande blödning som inte svarar på direkt tryck och kräver tourniquet.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; TCCC Guidelines 2023',
    },
    {
      code: '4.7',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur snabbt kan en patient med massiv arteriell extremitetsblödning förblöda?',
      options: [
        { text: '2-3 minuter', correct: true },
        { text: '10-15 minuter', correct: false },
        { text: '30 minuter', correct: false },
        { text: '>1 timme', correct: false },
      ],
      explanation: 'En skadad femoral- eller brachialartär kan leda till exsanguination inom 2-3 minuter.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; TCCC Guidelines',
    },
    {
      code: '4.8',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför har tourniquet-användning ökat inom civil traumavård de senaste åren?',
      options: [
        { text: 'Erfarenheter från militära konflikter visar att det räddar liv', correct: true },
        { text: 'Det är billigare än andra metoder', correct: false },
        { text: 'Nya lagar kräver det', correct: false },
        { text: 'Det är enklare att använda', correct: false },
      ],
      explanation: 'Militära data från Irak/Afghanistan visade dramatiskt minskad mortalitet med tidig tourniquet-användning.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; Kragh JF J Trauma 2008',
    },
    {
      code: '4.9',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är förstahandsvalet för blödningskontroll vid extremitetsskada?',
      options: [
        { text: 'Direkt manuellt tryck', correct: true },
        { text: 'Tourniquet', correct: false },
        { text: 'Hemostatiskt förband', correct: false },
        { text: 'Höjning av extremiteten', correct: false },
      ],
      explanation: 'Direkt tryck är förstahandsval. Tourniquet används när direkt tryck är otillräckligt.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; ATLS 10th ed',
    },
    {
      code: '4.10',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken typ av tourniquet rekommenderas för prehospital användning?',
      options: [
        { text: 'CAT (Combat Application Tourniquet) eller liknande evidensbaserade modeller', correct: true },
        { text: 'Vilken rem som helst', correct: false },
        { text: 'Elastisk binda', correct: false },
        { text: 'Blodtrycksmanschett', correct: false },
      ],
      explanation: 'CAT och liknande testade tourniquets ger tillräcklig kompression för att stoppa arteriellt flöde.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; Kragh JF J Trauma 2008',
    },
    {
      code: '4.11',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'En tourniquet appliceras men blödningen fortsätter. Vad gör du?',
      options: [
        { text: 'Dra åt mer eller applicera en andra tourniquet proximalt', correct: true },
        { text: 'Ta bort tourniqueten', correct: false },
        { text: 'Lägg ett förband över såret', correct: false },
        { text: 'Avvakta och observera', correct: false },
      ],
      explanation: 'Om en tourniquet inte stoppar blödningen helt, dra åt mer eller lägg en andra tourniquet 5 cm proximalt.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; TCCC Guidelines',
    },
    {
      code: '4.12',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur vet man att en tourniquet är tillräckligt åtdragen?',
      options: [
        { text: 'Blödningen upphör helt och distal puls är ej palpabel', correct: true },
        { text: 'Patienten klagar på smärta', correct: false },
        { text: 'Tourniqueten sitter åt', correct: false },
        { text: 'Blödningen minskar', correct: false },
      ],
      explanation: 'Korrekt tourniquet stoppar blödningen helt och eliminerar distal puls.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; TCCC Guidelines',
    },
    {
      code: '4.13',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska tourniquet INTE placeras över en led?',
      options: [
        { text: 'Ledstrukturer förhindrar effektiv kompression av kärlen', correct: true },
        { text: 'Det gör mer ont', correct: false },
        { text: 'Det skadar leden', correct: false },
        { text: 'Det är estetiskt olämpligt', correct: false },
      ],
      explanation: 'Leder har ben och senstrukturer som förhindrar jämn kompression av underliggande kärl.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.14',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur länge kan en tourniquet sitta säkert?',
      options: [
        { text: 'Upp till 2 timmar anses säkert, längre tid acceptabelt vid livshotande blödning', correct: true },
        { text: 'Max 30 minuter', correct: false },
        { text: 'Max 6 timmar', correct: false },
        { text: 'Obegränsad tid', correct: false },
      ],
      explanation: '2 timmar är säkert med minimal risk för permanent skada. Upp till 6h har använts vid livshotande blödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; Kragh JF J Trauma 2009',
    },
    {
      code: '4.15',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'En tourniquet har suttit i 4 timmar. Ska den lossas på akutmottagningen?',
      options: [
        { text: 'Nej, behåll tills kirurgisk blödningskontroll är möjlig', correct: true },
        { text: 'Ja, lossa för att undvika nervskada', correct: false },
        { text: 'Lossa i 10 minuter och spänn igen', correct: false },
        { text: 'Byt till ny tourniquet', correct: false },
      ],
      explanation: 'En tourniquet ska aldrig lossas prehospitalt eller på akuten utan kirurgisk beredskap.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; TCCC Guidelines',
    },
    {
      code: '4.16',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Var ska tourniquet-tiden dokumenteras?',
      options: [
        { text: 'På patientens panna ("TK" + tid) och i journal', correct: true },
        { text: 'Endast i journalen', correct: false },
        { text: 'På tourniqueten', correct: false },
        { text: 'Muntligt till nästa vårdnivå', correct: false },
      ],
      explanation: 'Tid skrivs synligt på patienten (ofta pannan) för att säkerställa att informationen följer patienten.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; TCCC Guidelines',
    },
    {
      code: '4.17',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "junctional bleeding"?',
      options: [
        { text: 'Blödning från områden där tourniquet inte kan appliceras (ljumske, axill, hals)', correct: true },
        { text: 'Blödning från leder', correct: false },
        { text: 'Blödning från flera sår samtidigt', correct: false },
        { text: 'Blödning från frakturer', correct: false },
      ],
      explanation: 'Junctional areas (ljumske, axill, hals/supraklavikulärt) kan inte komprimeras med tourniquet.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; TCCC Guidelines',
    },
    {
      code: '4.18',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Patient med massiv blödning från ljumsken. Tourniquet är ej möjlig. Vad gör du?',
      options: [
        { text: 'Direkt manuellt tryck + wound packing med hemostatiskt förband', correct: true },
        { text: 'Applicera tourniquet på låret', correct: false },
        { text: 'Ge endast IV-vätska', correct: false },
        { text: 'Avvakta transport', correct: false },
      ],
      explanation: 'Junctional blödning kräver direkt tryck och wound packing med hemostatiska medel.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; TCCC Guidelines',
    },
    {
      code: '4.19',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "wound packing"?',
      options: [
        { text: 'Att fylla ett djupt sår med förband för att komprimera blödande kärl', correct: true },
        { text: 'Att linda ett sår', correct: false },
        { text: 'Att sy ett sår', correct: false },
        { text: 'Att applicera sterilstrip', correct: false },
      ],
      explanation: 'Wound packing innebär att fylla sårkanalen med förband för att uppnå hemostas inifrån.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.20',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Hur utför man wound packing korrekt?',
      options: [
        { text: 'Tryck förbandet djupt in i såret, fyll hela kaviteten, håll tryck i 3-5 min', correct: true },
        { text: 'Lägg löst förband över såret', correct: false },
        { text: 'Applicera spraylim', correct: false },
        { text: 'Använd endast steril kompress utanpå', correct: false },
      ],
      explanation: 'Förbandet trycks in djupt för att komprimera blödande kärl. Fyll hela kaviteten och håll tryck.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.21',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka hemostatiska förband finns tillgängliga?',
      options: [
        { text: 'QuikClot, Celox, ChitoGauze', correct: true },
        { text: 'Vanlig bomullskompress endast', correct: false },
        { text: 'Plastförband', correct: false },
        { text: 'Gips', correct: false },
      ],
      explanation: 'Hemostatiska förband innehåller ämnen (kaolin, kitosan) som accelererar koagulation.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.22',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur fungerar hemostatiska förband?',
      options: [
        { text: 'De aktiverar koagulationskaskaden och absorberar vätska', correct: true },
        { text: 'De kyler ner blodet', correct: false },
        { text: 'De innehåller adrenalin', correct: false },
        { text: 'De syr ihop kärlen', correct: false },
      ],
      explanation: 'Hemostatiska ämnen aktiverar faktor XII och trombocyter samt absorberar plasma.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.23',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är tranexamsyra (TXA)?',
      options: [
        { text: 'Ett antifibrinolytiskt läkemedel som minskar blödning', correct: true },
        { text: 'Ett smärtstillande medel', correct: false },
        { text: 'Ett antibiotikum', correct: false },
        { text: 'En koagulationsfaktor', correct: false },
      ],
      explanation: 'TXA hämmar fibrinolys och stabiliserar koagler, vilket minskar blödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; CRASH-2 Trial',
    },
    {
      code: '4.24',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'När ska tranexamsyra ges vid trauma?',
      options: [
        { text: 'Inom 3 timmar från skadan, helst inom 1 timme', correct: true },
        { text: 'Endast preoperativt', correct: false },
        { text: 'Efter 6 timmar', correct: false },
        { text: 'Endast vid känd koagulopati', correct: false },
      ],
      explanation: 'TXA-effekten är störst om given tidigt. Efter 3 timmar är nyttan ifrågasatt.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; CRASH-2 Trial',
    },
    {
      code: '4.25',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken dos tranexamsyra ges vid trauma?',
      options: [
        { text: '1 g IV bolus följt av 1 g under 8 timmar', correct: true },
        { text: '100 mg IV', correct: false },
        { text: '5 g som engångsdos', correct: false },
        { text: '500 mg oralt', correct: false },
      ],
      explanation: 'Standarddos: 1g IV bolus (över 10 min), följt av 1g infusion över 8 timmar.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; CRASH-2 Trial',
    },
    {
      code: '4.26',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad visade CRASH-2-studien?',
      options: [
        { text: 'Tidig TXA minskar mortalitet vid traumablödning', correct: true },
        { text: 'Tourniquet ökar amputationsrisken', correct: false },
        { text: 'Kristalloid är bättre än blod', correct: false },
        { text: 'Väntetid påverkar inte prognos', correct: false },
      ],
      explanation: 'CRASH-2 visade signifikant minskad mortalitet med TXA givet inom 3h efter trauma.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; CRASH-2 Lancet 2010',
    },
    {
      code: '4.27',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Patient med traumatisk amputation av underben, blödning kontrollerad med tourniquet. Ska TXA ges?',
      options: [
        { text: 'Ja, om inom 3 timmar och misstänkt signifikant blodförlust', correct: true },
        { text: 'Nej, blödningen är ju kontrollerad', correct: false },
        { text: 'Endast om patienten är hypotensiv', correct: false },
        { text: 'TXA är kontraindicerat vid amputation', correct: false },
      ],
      explanation: 'TXA minskar total blödning och mortalitet även om akut blödning är kontrollerad.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.28',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka tecken tyder på hypovolemisk chock?',
      options: [
        { text: 'Takykardi, hypotension, blek/kall hud, förvirring', correct: true },
        { text: 'Bradykardi och hypertension', correct: false },
        { text: 'Feber och svettning', correct: false },
        { text: 'Endast smärta', correct: false },
      ],
      explanation: 'Chocktecken: takykardi (tidigt), hypotension (sent), blek/kall/fuktig hud, förändrad medvetandegrad.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; ATLS 10th ed',
    },
    {
      code: '4.29',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket är det tidigaste tecknet på blödningschock?',
      options: [
        { text: 'Takykardi', correct: true },
        { text: 'Hypotension', correct: false },
        { text: 'Anuri', correct: false },
        { text: 'Medvetslöshet', correct: false },
      ],
      explanation: 'Takykardi är det tidigaste kompensatoriska tecknet. Hypotension är sent (>30% blodförlust).',
      reference: 'B-ORTIM Kursbok, Kapitel 4; ATLS 10th ed',
    },
    {
      code: '4.30',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Patient med puls 120, systoliskt BT 90, blek och kallsvettig efter trauma. Vilken chockklass?',
      options: [
        { text: 'Klass III (30-40% blodförlust)', correct: true },
        { text: 'Klass I (lindrig)', correct: false },
        { text: 'Klass II (måttlig)', correct: false },
        { text: 'Klass IV (svår)', correct: false },
      ],
      explanation: 'Klass III: takykardi, hypotension, förändrad medvetandegrad, 30-40% blodförlust (~1.5-2 liter).',
      reference: 'B-ORTIM Kursbok, Kapitel 4; ATLS 10th ed',
    },
    {
      code: '4.31',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur mycket blod kan en sluten femurfraktur dölja?',
      options: [
        { text: '1-2 liter', correct: true },
        { text: '100-200 ml', correct: false },
        { text: '3-4 liter', correct: false },
        { text: '500 ml', correct: false },
      ],
      explanation: 'Lårets stora mjukdelsvolym kan dölja 1-2 liter blod vid sluten femurfraktur.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; ATLS 10th ed',
    },
    {
      code: '4.32',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur mycket blod kan en instabil bäckenfraktur dölja?',
      options: [
        { text: '>3 liter', correct: true },
        { text: '500 ml', correct: false },
        { text: '1 liter', correct: false },
        { text: '200 ml', correct: false },
      ],
      explanation: 'Bäckenet kan rymma mycket stora mängder blod (>3 liter), ofta underskattat.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; ATLS 10th ed',
    },
    {
      code: '4.33',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Patient med bilateral tibiafraktur och puls 130, BT 80/50. Förväntad blodförlust?',
      options: [
        { text: '1-1.5 liter (dock kliniken tyder på mer förlust - leta andra källor)', correct: true },
        { text: '200 ml', correct: false },
        { text: '4 liter', correct: false },
        { text: 'Ingen blodförlust vid tibiafraktur', correct: false },
      ],
      explanation: 'Tibiafrakturer ger ~500-750 ml var, men chocktecknen indikerar mer blödning - sök annan källa.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.34',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär permissive hypotension?',
      options: [
        { text: 'Tolerera lägre BT (SBT 80-90) för att inte störa koagulation', correct: true },
        { text: 'Sträva efter normalt BT', correct: false },
        { text: 'Ge vasopressorer', correct: false },
        { text: 'Höj blodtrycket maximalt', correct: false },
      ],
      explanation: 'Permissive hypotension undviker övertransfusion och utspädning av koagulationsfaktorer.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; ATLS 10th ed',
    },
    {
      code: '4.35',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är kristalloidöverbelastning farligt vid traumablödning?',
      options: [
        { text: 'Det späder ut koagulationsfaktorer och försämrar hemostas', correct: true },
        { text: 'Det ger hypertension', correct: false },
        { text: 'Det är för dyrt', correct: false },
        { text: 'Det har ingen effekt', correct: false },
      ],
      explanation: 'Stora kristalloidvolymer ger utspädningskoagulopati och hypotermi (kall vätska).',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.36',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär massiv transfusion?',
      options: [
        { text: '>10 enheter erytrocyter/24h eller >4 enheter/1h', correct: true },
        { text: '>2 enheter', correct: false },
        { text: '>50 enheter', correct: false },
        { text: 'All blodtransfusion', correct: false },
      ],
      explanation: 'Massiv transfusion definieras som >10 enheter/24h eller >4 enheter/timme.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.37',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket blod ges initialt vid okänd blodgrupp och akut blödning?',
      options: [
        { text: 'O negativt (O Rh-)', correct: true },
        { text: 'A positivt', correct: false },
        { text: 'AB positivt', correct: false },
        { text: 'Inget blod ges', correct: false },
      ],
      explanation: 'O negativt är universaldonator och kan ges utan gruppering/BAS-test i akuta situationer.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; ATLS 10th ed',
    },
    {
      code: '4.38',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'En ambulans larmar om traumapatient med massiv blödning, ETA 5 min. Vilken förberedelse?',
      options: [
        { text: 'Aktivera traumateam, förbered O neg blod, varm vätska, tranexamsyra', correct: true },
        { text: 'Vänta tills patienten kommer', correct: false },
        { text: 'Endast röntgen', correct: false },
        { text: 'Ring ortoped', correct: false },
      ],
      explanation: 'Proaktiv förberedelse med blodprodukter, uppvärmning och personal räddar tid och liv.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.39',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "1:1:1" i massiv transfusion?',
      options: [
        { text: 'Plasma:Trombocyter:Erytrocyter i förhållandet 1:1:1', correct: true },
        { text: 'Tre typer av kristalloid', correct: false },
        { text: 'En enhet per minut', correct: false },
        { text: 'Tre olika blodgrupper', correct: false },
      ],
      explanation: '1:1:1 ratio efterliknar helblod och förbättrar hemostas vid massiv transfusion.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; PROPPR Trial',
    },
    {
      code: '4.40',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken temperatur ska blodprodukter värmas till?',
      options: [
        { text: '37°C', correct: true },
        { text: 'Rumstemperatur räcker', correct: false },
        { text: '42°C', correct: false },
        { text: 'De ska inte värmas', correct: false },
      ],
      explanation: 'Blodprodukter värms till 37°C för att förhindra hypotermi och koagulopati.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.41',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ökar hypotermi blödningsrisken?',
      options: [
        { text: 'Koagulationsfaktorer och trombocyter fungerar sämre vid låg temperatur', correct: true },
        { text: 'Blodet blir tjockare', correct: false },
        { text: 'Kärlen kontraherar', correct: false },
        { text: 'Det har ingen effekt', correct: false },
      ],
      explanation: 'Koagulationsenzymer fungerar optimalt vid 37°C. Hypotermi ger koagulopati.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; Jurkovich GJ J Trauma 1987',
    },
    {
      code: '4.42',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Patient med pågående blödning har temperatur 34°C. Vilken åtgärd?',
      options: [
        { text: 'Aktiv uppvärmning: varma vätskor, värmetäcke, warm environment', correct: true },
        { text: 'Ignorera temperaturen', correct: false },
        { text: 'Kylbehandling', correct: false },
        { text: 'Endast täcke', correct: false },
      ],
      explanation: 'Hypotermi är del av "lethal triad". Aktiv uppvärmning är kritisk för att bryta cykeln.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.43',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "the lethal triad" vid trauma?',
      options: [
        { text: 'Hypotermi, acidos, koagulopati', correct: true },
        { text: 'Hypotension, takykardi, anemi', correct: false },
        { text: 'Smärta, chock, medvetslöshet', correct: false },
        { text: 'Fraktur, blödning, infektion', correct: false },
      ],
      explanation: 'Den letala triaden är en ond cirkel där varje komponent förvärrar de andra.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.44',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Traumapatient med pH 7.15, temp 34°C, INR 2.5 och pågående blödning. Prioritering?',
      options: [
        { text: 'Blödningskontroll + värmning + balanserad transfusion + TXA', correct: true },
        { text: 'Endast ge bikarbonat', correct: false },
        { text: 'Operation för fraktur', correct: false },
        { text: 'Avvakta', correct: false },
      ],
      explanation: 'Behandla alla komponenter parallellt: stoppa blödning, värm, ge balanserad transfusion, TXA.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.45',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket pH-värde indikerar signifikant acidos vid trauma?',
      options: [
        { text: '<7.25', correct: true },
        { text: '<7.35', correct: false },
        { text: '<7.45', correct: false },
        { text: '<7.0', correct: false },
      ],
      explanation: 'pH <7.25 är signifikant acidos som indikerar behov av damage control och resuscitering.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.46',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket laktatvärde indikerar signifikant vävnadshypoxi?',
      options: [
        { text: '>2.5 mmol/L', correct: true },
        { text: '>0.5 mmol/L', correct: false },
        { text: '>10 mmol/L', correct: false },
        { text: '>1.0 mmol/L', correct: false },
      ],
      explanation: 'Laktat >2.5 mmol/L tyder på vävnadshypoxi och är markör för resusciteringsbehov.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.47',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'En patient med kontrollerad extremitetsblödning har laktat 6.0. Vad indikerar detta?',
      options: [
        { text: 'Signifikant vävnadshypoxi/chock - fortsatt resuscitering behövs', correct: true },
        { text: 'Normalt vid trauma', correct: false },
        { text: 'Patienten är fullt resusciterad', correct: false },
        { text: 'Ingen klinisk betydelse', correct: false },
      ],
      explanation: 'Högt laktat trots kontrollerad blödning indikerar behov av fortsatt resuscitering.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.48',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska reperfusionsskada beaktas vid tourniquet-lossning?',
      options: [
        { text: 'Toxiner från ischemisk vävnad kan orsaka systemisk påverkan', correct: true },
        { text: 'Det gör mer ont', correct: false },
        { text: 'Det finns ingen risk', correct: false },
        { text: 'Kärlen kan rupturera', correct: false },
      ],
      explanation: 'Vid lång ischemi kan reperfusion frisätta kalium, myoglobin och andra toxiner.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.49',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Tourniquet ska lossas efter 6 timmars ischemi. Vilken förberedelse?',
      options: [
        { text: 'Monitorering, beredskap för hyperkalemi, njurskydd, ev. dialys', correct: true },
        { text: 'Ingen förberedelse behövs', correct: false },
        { text: 'Endast smärtstillande', correct: false },
        { text: 'Lossa snabbt utan monitorering', correct: false },
      ],
      explanation: 'Reperfusion efter lång ischemi kan ge hyperkalemi, arytmier och njurskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: '4.50',
      chapterNumber: 4,
      bloomLevel: 'ANALYSIS',
      question: 'Vilken faktor har störst påverkan på överlevnad vid massiv extremitetsblödning?',
      options: [
        { text: 'Tid till blödningskontroll', correct: true },
        { text: 'Patientens ålder', correct: false },
        { text: 'Sjukhusets storlek', correct: false },
        { text: 'Tidpunkt på dygnet', correct: false },
      ],
      explanation: 'Tiden till effektiv blödningskontroll är den enskilt viktigaste prognostiska faktorn.',
      reference: 'B-ORTIM Kursbok, Kapitel 4; Kragh JF J Trauma 2008',
    },

    // Kapitel 5: Extra frågor
    {
      code: '5.3',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'ABI mäts till 0.7 på skadad extremitet efter trauma. Vad är nästa steg?',
      options: [
        { text: 'CT-angiografi eller direkt kärlkirurgisk exploration', correct: true },
        { text: 'Upprepa mätningen om 24 timmar', correct: false },
        { text: 'Enbart observation', correct: false },
        { text: 'MR-undersökning', correct: false },
      ],
      explanation: 'ABI <0.9 efter trauma indikerar sannolik kärlskada. CT-angio eller kirurgisk exploration krävs akut.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; EAST Guidelines 2012',
    },
    {
      code: '5.4',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är "hard signs" på kärlskada?',
      options: [
        { text: 'Pulserande blödning, expanderande hematom, avsaknad av distal puls', correct: true },
        { text: 'Smärta och svullnad', correct: false },
        { text: 'Blåmärke och ömhet', correct: false },
        { text: 'Nedsatt rörlighet', correct: false },
      ],
      explanation: 'Hard signs inkluderar pulserande blödning, expanderande hematom, palpabel thrill, avsaknad av distal puls, och ischemitecken (6 P).',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.5',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'En patient har "hard signs" på kärlskada. Behövs CT-angio före operation?',
      options: [
        { text: 'Nej, direkt till operation', correct: true },
        { text: 'Ja, alltid', correct: false },
        { text: 'Endast om patienten är stabil', correct: false },
        { text: 'CT-angio är kontraindicerat', correct: false },
      ],
      explanation: 'Vid hard signs på kärlskada går patienten direkt till operation. CT-angio fördröjer bara behandlingen i onödan.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; EAST Guidelines 2012',
    },
    {
      code: '5.6',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken artär är vanligast skadad vid extremitetstrauma?',
      options: [
        { text: 'A. poplitea', correct: true },
        { text: 'A. femoralis', correct: false },
        { text: 'A. brachialis', correct: false },
        { text: 'A. radialis', correct: false },
      ],
      explanation: 'A. poplitea är vanligast skadad, särskilt vid knäluxation och proximala tibiafrakturer.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; Mills WJ JBJS 2004',
    },
    {
      code: '5.7',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är a. poplitea särskilt vulnerabel vid knätrauma?',
      options: [
        { text: 'Den är fixerad proximalt och distalt och har begränsad rörlighet', correct: true },
        { text: 'Den är det tunnaste kärlet', correct: false },
        { text: 'Den har inget kollateralt flöde', correct: false },
        { text: 'Den löper ytligt', correct: false },
      ],
      explanation: 'A. poplitea är fixerad vid adduktorhiatus och vid soleusarkaden, vilket gör den känslig för sträckning.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.8',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur hög är risken för popliteakärlskada vid knäluxation?',
      options: [
        { text: '30-50%', correct: true },
        { text: '5-10%', correct: false },
        { text: '70-80%', correct: false },
        { text: '<1%', correct: false },
      ],
      explanation: 'Knäluxation medför 30-50% risk för popliteakärlskada. Alla kräver kärlutredning.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; Wascher DC JAAOS 2000',
    },
    {
      code: '5.9',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka typer av kärlskador kan uppstå vid trauma?',
      options: [
        { text: 'Laceration, intimalskada, transsektion, spasm, AV-fistel, pseudoaneurysm', correct: true },
        { text: 'Endast laceration', correct: false },
        { text: 'Endast trombos', correct: false },
        { text: 'Endast blödning', correct: false },
      ],
      explanation: 'Kärlskador varierar från minor intimalskada till komplett transsektion. Alla kan leda till ischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.10',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är en intimalskada och varför är den farlig?',
      options: [
        { text: 'Skada på kärlväggens innersta lager som kan leda till trombos', correct: true },
        { text: 'Fullständig genomskärning av kärlet', correct: false },
        { text: 'Infektion i kärlet', correct: false },
        { text: 'Aneurysm på kärlet', correct: false },
      ],
      explanation: 'Intimalskada kan ge normal puls initialt men orsaka trombos och ischemi timmar-dagar senare.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.11',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Patient med knäluxation har normal fotpuls. Utesluter detta kärlskada?',
      options: [
        { text: 'Nej, intimalskada kan ge normal puls initialt', correct: true },
        { text: 'Ja, normal puls utesluter skada', correct: false },
        { text: 'Ja, om pulsen är stark', correct: false },
        { text: 'Beror på patientens ålder', correct: false },
      ],
      explanation: 'Intimalskada kan ha normal puls initialt. Alla knäluxationer kräver ABI och ofta CTA.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.12',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är ett pseudoaneurysm?',
      options: [
        { text: 'Pulsatilt hematom som kommunicerar med artärlumen', correct: true },
        { text: 'En äkta aneurysm', correct: false },
        { text: 'En venös dilatation', correct: false },
        { text: 'En trombos', correct: false },
      ],
      explanation: 'Pseudoaneurysm är ett hematom som kommunicerar med artären genom en defekt i kärlväggen.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.13',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är en arteriovenös (AV) fistel?',
      options: [
        { text: 'Patologisk kommunikation mellan artär och ven', correct: true },
        { text: 'Trombos i artär', correct: false },
        { text: 'Aneurysm', correct: false },
        { text: 'Venös insufficiens', correct: false },
      ],
      explanation: 'AV-fistel ger arteriovenös shunt med thrill/bruit och kan ge hjärtsvikt på sikt.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.14',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken klinisk tidsgräns gäller för kärlrekonstruktion vid komplett ischemi?',
      options: [
        { text: '6 timmar varm ischemi', correct: true },
        { text: '12 timmar', correct: false },
        { text: '24 timmar', correct: false },
        { text: '2 timmar', correct: false },
      ],
      explanation: '6 timmar är gränsen för varm ischemi innan irreversibel muskelskada uppstår.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; Feliciano DV J Trauma 2011',
    },
    {
      code: '5.15',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad händer med muskelvävnad efter >6 timmars ischemi?',
      options: [
        { text: 'Irreversibel muskelskada, reperfusionsskada, risk för amputation', correct: true },
        { text: 'Full återhämtning', correct: false },
        { text: 'Endast lätt svaghet', correct: false },
        { text: 'Ingen påverkan', correct: false },
      ],
      explanation: 'Efter 6 timmar börjar irreversibel muskelskada. Reperfusion kan ge systemisk toxicitet.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.16',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka "soft signs" indikerar möjlig kärlskada?',
      options: [
        { text: 'Närliggande penetrerande trauma, litet hematom, nervpåverkan, anatomisk risk', correct: true },
        { text: 'Endast smärta', correct: false },
        { text: 'Endast svullnad', correct: false },
        { text: 'Endast fraktur', correct: false },
      ],
      explanation: 'Soft signs kräver utredning (ABI, CTA) men inte omedelbar operation som hard signs.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; EAST Guidelines 2012',
    },
    {
      code: '5.17',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Patient med skottskada nära a. femoralis, litet stabilt hematom, palpabel puls. Vad görs?',
      options: [
        { text: 'ABI-mätning och/eller CT-angiografi', correct: true },
        { text: 'Direkt operation', correct: false },
        { text: 'Endast observation', correct: false },
        { text: 'Hemskickas', correct: false },
      ],
      explanation: 'Soft signs (närhet till kärl, litet hematom) kräver utredning, men inte akut operation.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; EAST Guidelines 2012',
    },
    {
      code: '5.18',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur beräknas Ankle-Brachial Index (ABI)?',
      options: [
        { text: 'Systoliskt ankeltryck / Systoliskt armtryck', correct: true },
        { text: 'Armtryck / Ankeltryck', correct: false },
        { text: 'Diastoliskt tryck / Systoliskt tryck', correct: false },
        { text: 'Pulstryck / Medelartärtryck', correct: false },
      ],
      explanation: 'ABI = systoliskt ankeltryck (med doppler) dividerat med systoliskt armtryck.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.19',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket ABI-värde är normalt?',
      options: [
        { text: '0.9-1.3', correct: true },
        { text: '0.5-0.7', correct: false },
        { text: '1.5-2.0', correct: false },
        { text: '>2.0', correct: false },
      ],
      explanation: 'ABI 0.9-1.3 är normalt. <0.9 indikerar nedsatt arteriellt flöde.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.20',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'ABI mäts till 0.75 efter trauma. Nästa steg?',
      options: [
        { text: 'CT-angiografi för att kartlägga kärlskadan', correct: true },
        { text: 'Upprepa mätning imorgon', correct: false },
        { text: 'Ingen åtgärd', correct: false },
        { text: 'Direkt amputation', correct: false },
      ],
      explanation: 'ABI <0.9 efter trauma indikerar sannolik kärlskada och kräver CTA.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; EAST Guidelines 2012',
    },
    {
      code: '5.21',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken utrustning behövs för ABI-mätning?',
      options: [
        { text: 'Blodtrycksmanschett och handhållen doppler', correct: true },
        { text: 'Endast stetoskop', correct: false },
        { text: 'EKG', correct: false },
        { text: 'Ultraljudsapparat', correct: false },
      ],
      explanation: 'ABI mäts med manschett och doppler för att detektera trycket vid flödesåterkomst.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.22',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är ABI värdefull vid extremitetstrauma?',
      options: [
        { text: 'Snabb, icke-invasiv screening för kärlskada med hög sensitivitet', correct: true },
        { text: 'Det är det enda sättet att diagnostisera kärlskada', correct: false },
        { text: 'Det är billigt', correct: false },
        { text: 'Det ersätter klinisk undersökning', correct: false },
      ],
      explanation: 'ABI har >95% sensitivitet för signifikant kärlskada och kan göras vid sängkanten.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; Johansen K J Trauma 1991',
    },
    {
      code: '5.23',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'När är CT-angiografi indicerad vid extremitetstrauma?',
      options: [
        { text: 'Vid soft signs, patologiskt ABI, eller för anatomisk kartläggning före operation', correct: true },
        { text: 'Alltid vid alla frakturer', correct: false },
        { text: 'Aldrig vid trauma', correct: false },
        { text: 'Endast vid hard signs', correct: false },
      ],
      explanation: 'CTA är indicerat vid soft signs eller ABI <0.9, samt för preoperativ planering.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; EAST Guidelines 2012',
    },
    {
      code: '5.24',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Patient med hard signs (pulsatil blödning) från ljumsken. Ska CTA göras?',
      options: [
        { text: 'Nej, direkt till operation - CTA fördröjer behandlingen', correct: true },
        { text: 'Ja, alltid CTA först', correct: false },
        { text: 'CTA om patienten är stabil', correct: false },
        { text: 'MR istället', correct: false },
      ],
      explanation: 'Hard signs = direkt operation. CTA fördröjer livräddande behandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; EAST Guidelines 2012',
    },
    {
      code: '5.25',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka frakturtyper har hög risk för associerad kärlskada?',
      options: [
        { text: 'Knäluxation, suprakondylär humerusfraktur (barn), proximal tibiafraktur', correct: true },
        { text: 'Alla frakturer', correct: false },
        { text: 'Endast öppna frakturer', correct: false },
        { text: 'Endast bäckenfrakturer', correct: false },
      ],
      explanation: 'Dessa skador har anatomisk närhet till kärl och kräver rutinmässig kärlbedömning.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.26',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Barn med suprakondylär humerusfraktur och nedsatt radialispuls. Vad görs först?',
      options: [
        { text: 'Omedelbar reponering för att avlasta kärlen', correct: true },
        { text: 'CT-angio', correct: false },
        { text: 'Avvakta och observera', correct: false },
        { text: 'Amputation', correct: false },
      ],
      explanation: 'Suprakondylär fraktur med pulsbortfall reponeras omedelbart. Pulsen återkommer ofta.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.27',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför kan reponering återställa cirkulation vid dislocerad fraktur?',
      options: [
        { text: 'Kärlet kan vara komprimerat eller töjt av frakturfragmentet', correct: true },
        { text: 'Reponeringen reparerar kärlskadan', correct: false },
        { text: 'Det öppnar kollateraler', correct: false },
        { text: 'Det finns ingen relation', correct: false },
      ],
      explanation: 'Dislocerade fragment kan komprimera eller spänna kärl. Reponering avlastar trycket.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.28',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Efter reponering av en underbensfraktur finns fortfarande ingen fotpuls. Vad görs?',
      options: [
        { text: 'Akut CTA och/eller kärlkirurgisk exploration', correct: true },
        { text: 'Avvakta till morgonen', correct: false },
        { text: 'Ny reponering', correct: false },
        { text: 'Endast gips', correct: false },
      ],
      explanation: 'Kvarstående pulslöshet efter reponering indikerar kärlskada som kräver utredning/operation.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.29',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är en temporär kärlshunt?',
      options: [
        { text: 'Tillfällig plastslang för att återställa flöde tills definitiv reparation', correct: true },
        { text: 'Permanent kärlprotes', correct: false },
        { text: 'En typ av tourniquet', correct: false },
        { text: 'En medicin', correct: false },
      ],
      explanation: 'Temporär shunt ger snabb reperfusion och köper tid för stabilisering innan definitiv kärlkirurgi.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.30',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'När används temporär kärlshunt?',
      options: [
        { text: 'När frakturfixation behövs före definitiv kärlrekonstruktion (damage control)', correct: true },
        { text: 'Aldrig, det är föråldrat', correct: false },
        { text: 'Endast i krig', correct: false },
        { text: 'Vid alla kärlskador', correct: false },
      ],
      explanation: 'Shunt ger snabb reperfusion så att skelettfixation kan göras före definitiv kärlreparation.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.31',
      chapterNumber: 5,
      bloomLevel: 'ANALYSIS',
      question: 'Patient med kombinerad femurfraktur och artärskada. Vilken operationssekvens?',
      options: [
        { text: 'Shunt → frakturfixation → definitiv kärlreparation', correct: true },
        { text: 'Frakturfixation först, sedan kärl', correct: false },
        { text: 'Kärlreparation först, sedan fraktur', correct: false },
        { text: 'Behandla bara frakturen', correct: false },
      ],
      explanation: 'Temporär shunt ger reperfusion snabbt, stabilisering ger stöd åt kärlreparationen.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.32',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka kärlrekonstruktionsmetoder finns?',
      options: [
        { text: 'Primär sutur, patchangioplastik, interpositionsgraft, bypass', correct: true },
        { text: 'Endast ligering', correct: false },
        { text: 'Endast bypass', correct: false },
        { text: 'Inga metoder', correct: false },
      ],
      explanation: 'Metod beror på skadans omfattning: enkel laceration kan sutureras, segmentbortfall kräver graft.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.33',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken ven används vanligen som graft vid kärlrekonstruktion i underbenet?',
      options: [
        { text: 'V. saphena magna (kontralateralt)', correct: true },
        { text: 'V. jugularis', correct: false },
        { text: 'V. cava', correct: false },
        { text: 'Konstgjort graft alltid', correct: false },
      ],
      explanation: 'V. saphena magna från oskadad sida ger bäst resultat i infektionskänsliga områden.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.34',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är ven ofta bättre än konstgjort material för graft vid trauma?',
      options: [
        { text: 'Lägre infektionsrisk, bättre patency i kontaminerade sår', correct: true },
        { text: 'Det är billigare', correct: false },
        { text: 'Det är snabbare', correct: false },
        { text: 'Konstgjort material finns inte', correct: false },
      ],
      explanation: 'Autolog ven har lägre infektionsrisk, särskilt viktigt vid öppna skador.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.35',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är fasciotomi och varför görs den efter kärlrekonstruktion?',
      options: [
        { text: 'Öppning av muskellogerna för att förhindra kompartmentsyndrom efter reperfusion', correct: true },
        { text: 'En typ av kärlkirurgi', correct: false },
        { text: 'Hudtransplantation', correct: false },
        { text: 'Benkirurgi', correct: false },
      ],
      explanation: 'Reperfusion efter ischemi orsakar svullnad. Profylaktisk fasciotomi förebygger kompartmentsyndrom.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.36',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Efter kärlrekonstruktion för popliteaskada med 5h ischemi. Behövs fasciotomi?',
      options: [
        { text: 'Ja, profylaktisk fasciotomi rekommenderas vid ischemitid >4-6h', correct: true },
        { text: 'Nej, endast om symtom uppstår', correct: false },
        { text: 'Aldrig vid popliteaskador', correct: false },
        { text: 'Beror på patientens önskan', correct: false },
      ],
      explanation: 'Profylaktisk fasciotomi vid ischemitid >4-6h minskar risk för kompartmentsyndrom.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.37',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur många kompartment har underbenet?',
      options: [
        { text: '4 (anteriort, lateralt, ytligt posteriort, djupt posteriort)', correct: true },
        { text: '2', correct: false },
        { text: '3', correct: false },
        { text: '6', correct: false },
      ],
      explanation: 'Underbenet har 4 kompartment som alla måste öppnas vid fasciotomi.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.38',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är antikoagulation viktigt efter kärlrekonstruktion?',
      options: [
        { text: 'Förhindra trombos i rekonstruktionen', correct: true },
        { text: 'Det är inte viktigt', correct: false },
        { text: 'Endast vid venösa skador', correct: false },
        { text: 'Förhindra infektion', correct: false },
      ],
      explanation: 'Antikoagulation (heparin) minskar risk för trombos i suturlinjer och graft.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.39',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Patient med kärlskada i arm, blödning kontrollerad. ABI 0.95 på skadad sida. Åtgärd?',
      options: [
        { text: 'Observation med upprepad ABI-mätning, CTA om försämring', correct: true },
        { text: 'Direkt operation', correct: false },
        { text: 'Hemgång utan uppföljning', correct: false },
        { text: 'Amputation', correct: false },
      ],
      explanation: 'ABI >0.9 har högt negativt prediktivt värde. Observation med uppföljning är rimligt.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.40',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka komplikationer kan uppstå efter kärlrekonstruktion?',
      options: [
        { text: 'Trombos, blödning, infektion, pseudoaneurysm, stenos', correct: true },
        { text: 'Inga komplikationer', correct: false },
        { text: 'Endast smärta', correct: false },
        { text: 'Endast infektion', correct: false },
      ],
      explanation: 'Kärlrekonstruktion har risk för tidiga (trombos, blödning) och sena (stenos, pseudoaneurysm) komplikationer.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.41',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Dag 2 efter kärlrekonstruktion: foten blir plötsligt blek och kall. Orsak?',
      options: [
        { text: 'Misstänkt trombos i rekonstruktionen - akut reoperation', correct: true },
        { text: 'Normal postoperativ förändring', correct: false },
        { text: 'Vänta och se', correct: false },
        { text: 'Ge smärtstillande', correct: false },
      ],
      explanation: 'Akut försämring postoperativt tyder på trombos och kräver omedelbar åtgärd.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.42',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är kärlskador i övre extremitet ofta mindre akuta än i nedre?',
      options: [
        { text: 'Bättre kollateral cirkulation i armen', correct: true },
        { text: 'Armen är mindre viktig', correct: false },
        { text: 'Skadorna är lindrigare', correct: false },
        { text: 'Det finns ingen skillnad', correct: false },
      ],
      explanation: 'Överarmens rika kollateralnät gör att hand ofta klarar sig trots kärlskada proximalt.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.43',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'A. brachialis skadad men handens cirkulation är tillfredsställande. Ska kärlet repareras?',
      options: [
        { text: 'Ja, för att undvika sena komplikationer som claudicatio och AV-fistel', correct: true },
        { text: 'Nej, om cirkulationen är bra', correct: false },
        { text: 'Endast observation', correct: false },
        { text: 'Beror på patientens ålder', correct: false },
      ],
      explanation: 'Även med kollateraler bör artärer repareras för att undvika sena komplikationer.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.44',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är artärspasm?',
      options: [
        { text: 'Kontraktion av kärlväggen som kan ge temporär ischemi', correct: true },
        { text: 'Permanent kärlskada', correct: false },
        { text: 'Infektion i kärlet', correct: false },
        { text: 'Trombos', correct: false },
      ],
      explanation: 'Spasm är reaktiv vasokonstriktion som kan likna kärlskada men ofta går över spontant.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.45',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Misstänkt artärspasm efter trauma. Hur skiljer man från verklig skada?',
      options: [
        { text: 'Observation, värme, ev. vasodilaterare - förbättring tyder på spasm', correct: true },
        { text: 'Det går inte att skilja', correct: false },
        { text: 'Alltid operera', correct: false },
        { text: 'Ignorera', correct: false },
      ],
      explanation: 'Spasm förbättras med tiden och värme. Kvarstående ischemi kräver utredning/operation.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.46',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför dokumenteras neurovaskulär status före och efter varje intervention?',
      options: [
        { text: 'För att upptäcka iatrogen skada och för medikolegal dokumentation', correct: true },
        { text: 'Det är inte nödvändigt', correct: false },
        { text: 'Endast vid misstanke om skada', correct: false },
        { text: 'Endast för statistik', correct: false },
      ],
      explanation: 'Dokumentation före/efter visar om skada är primär eller iatrogen, viktigt medikolegalt.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.47',
      chapterNumber: 5,
      bloomLevel: 'ANALYSIS',
      question: 'Patient med öppen tibiafraktur och avsaknad fotpuls (Gustilo IIIC). Prioritering?',
      options: [
        { text: 'Kärlrekonstruktion/shunt är mest akut, sedan frakturfixation och debridering', correct: true },
        { text: 'Debridering först', correct: false },
        { text: 'Frakturfixation först', correct: false },
        { text: 'Kan vänta', correct: false },
      ],
      explanation: 'IIIC = öppen fraktur + kärlskada. Kärlskadan har kortast tidsfönster.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; Gustilo RB JBJS 1984',
    },
    {
      code: '5.48',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken amputationsfrekvens har Gustilo IIIC-skador?',
      options: [
        { text: '30-50% eller högre', correct: true },
        { text: '<5%', correct: false },
        { text: '10%', correct: false },
        { text: '90%', correct: false },
      ],
      explanation: 'IIIC har hög amputationsfrekvens trots rekonstruktionsförsök pga multikomponent skada.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.49',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är multidisciplinärt team viktigt vid kombinerad kärl-skelettskada?',
      options: [
        { text: 'Ortoped och kärlkirurg måste koordinera sekvensen: shunt-fixation-repair', correct: true },
        { text: 'Det är billigare', correct: false },
        { text: 'Juridiska skäl', correct: false },
        { text: 'Det är inte viktigt', correct: false },
      ],
      explanation: 'Koordinerad sekvens optimerar både skelettläkning och kärlpatency.',
      reference: 'B-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: '5.50',
      chapterNumber: 5,
      bloomLevel: 'ANALYSIS',
      question: 'Vilken faktor har störst påverkan på limb salvage vid extremitetskärlskada?',
      options: [
        { text: 'Ischemitid - tid till reperfusion', correct: true },
        { text: 'Patientens ålder', correct: false },
        { text: 'Sjukhusets storlek', correct: false },
        { text: 'Tidpunkt på dygnet', correct: false },
      ],
      explanation: 'Tid till reperfusion är den viktigaste prognostiska faktorn. 6h är gränsen.',
      reference: 'B-ORTIM Kursbok, Kapitel 5; Feliciano DV J Trauma 2011',
    },

    // Kapitel 6: Extra frågor
    {
      code: '6.3',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de "6 P:na" vid kompartmentsyndrom?',
      options: [
        { text: 'Pain, Pressure, Paresthesia, Paralysis, Pallor, Pulselessness', correct: true },
        { text: 'Pulse, Pallor, Perspiration, Paralysis, Pain, Paresis', correct: false },
        { text: 'Position, Pressure, Pain, Pulse, Paralysis, Prognosis', correct: false },
        { text: 'Palpation, Percussion, Pain, Pulse, Paresthesia, Paralysis', correct: false },
      ],
      explanation: 'De 6 P:na är klassiska tecken på kompartmentsyndrom. Pain (smärta) och Paresthesia (stickningar) är ofta tidigaste tecknen.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.4',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilket är det tidigaste och mest tillförlitliga tecknet på kompartmentsyndrom?',
      options: [
        { text: 'Smärta vid passiv töjning av muskler i kompartmentet', correct: true },
        { text: 'Avsaknad av puls', correct: false },
        { text: 'Blekhet', correct: false },
        { text: 'Paralys', correct: false },
      ],
      explanation: 'Smärta vid passiv töjning är det tidigaste och mest tillförlitliga tecknet. Pulsförlust är ett sent tecken som indikerar avancerad ischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.5',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Kompartmenttryck mäts till 45 mmHg och diastoliskt blodtryck är 70 mmHg. Delta-tryck är 25 mmHg. Behövs fasciotomi?',
      options: [
        { text: 'Ja, delta-tryck ≤30 mmHg indikerar fasciotomi', correct: true },
        { text: 'Nej, normalvärde', correct: false },
        { text: 'Avvakta och mät om', correct: false },
        { text: 'Endast om patienten har symtom', correct: false },
      ],
      explanation: 'Delta-tryck = diastoliskt BT minus kompartmenttryck. Här: 70-45=25 mmHg. Delta-tryck ≤30 mmHg indikerar fasciotomi.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; McQueen MM JBJS 1996',
    },
    {
      code: '6.6',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är kompartmentsyndrom?',
      options: [
        { text: 'Ischemi i muskelogen pga förhöjt tryck som överstiger perfusionstrycket', correct: true },
        { text: 'Infektion i muskeln', correct: false },
        { text: 'Fraktur i muskelogen', correct: false },
        { text: 'Blödning utanför muskeln', correct: false },
      ],
      explanation: 'Kompartmentsyndrom uppstår när trycket i en sluten muskeloge överstiger kapillärperfusionstrycket.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; Matsen FA Clin Orthop 1975',
    },
    {
      code: '6.7',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de vanligaste orsakerna till kompartmentsyndrom?',
      options: [
        { text: 'Fraktur (särskilt tibia), crushing injury, kärlskada, postoperativ', correct: true },
        { text: 'Endast frakturer', correct: false },
        { text: 'Endast infektioner', correct: false },
        { text: 'Endast brännskador', correct: false },
      ],
      explanation: 'Tibiafraktur är vanligast (40%), följt av mjukdelsskador, kärlrekonstruktion och gips.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.8',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken frakturtyp har högst risk för kompartmentsyndrom?',
      options: [
        { text: 'Tibiafraktur, särskilt proximal/platåfraktur', correct: true },
        { text: 'Höftfraktur', correct: false },
        { text: 'Handledsfraktur', correct: false },
        { text: 'Clavikelfraktur', correct: false },
      ],
      explanation: 'Tibiafrakturer står för ~40% av alla kompartmentsyndrom, med proximal tibia som högriskområde.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; McQueen MM JBJS 2000',
    },
    {
      code: '6.9',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är underbenet särskilt känsligt för kompartmentsyndrom?',
      options: [
        { text: 'Det har 4 välavgränsade fasta kompartment med begränsad expansionsmöjlighet', correct: true },
        { text: 'Det har dålig blodförsörjning', correct: false },
        { text: 'Musklerna är svagare', correct: false },
        { text: 'Det har bara ett kompartment', correct: false },
      ],
      explanation: 'Underbenets fascior är tjocka och oelastiska. Små volymökningar ger snabb tryckstegring.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.10',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka patientgrupper har svårare diagnostik av kompartmentsyndrom?',
      options: [
        { text: 'Medvetslösa, sederade, barn, intoxikerade, ryggmärgsskadade', correct: true },
        { text: 'Äldre patienter', correct: false },
        { text: 'Diabetiker', correct: false },
        { text: 'Överviktiga', correct: false },
      ],
      explanation: 'Patienter som inte kan kommunicera smärta kräver objektiv tryckmätning.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.11',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket av de 6 P:na är tidigaste tecknet på kompartmentsyndrom?',
      options: [
        { text: 'Pain - oproportionerlig smärta, särskilt vid passiv töjning', correct: true },
        { text: 'Pulselessness', correct: false },
        { text: 'Paralysis', correct: false },
        { text: 'Pallor', correct: false },
      ],
      explanation: 'Smärta vid passiv töjning är det tidigaste och mest sensitiva tecknet.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.12',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är pulslöshet ett SENT tecken på kompartmentsyndrom?',
      options: [
        { text: 'Artärtrycket överstiger kompartmenttrycket - ischemi uppstår före pulsbortfall', correct: true },
        { text: 'Pulsen försvinner först', correct: false },
        { text: 'Det finns ingen relation', correct: false },
        { text: 'Pulsen är alltid normal', correct: false },
      ],
      explanation: 'Kapillärperfusion upphör vid lägre tryck än artärpulsen. Pulslöshet = mycket sent stadium.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.13',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Patient med tibiafraktur har stark smärta trots morfin och smärtar vid passiv dorsalflexion. Vad görs?',
      options: [
        { text: 'Misstänk kompartmentsyndrom - mät tryck eller gå direkt till fasciotomi', correct: true },
        { text: 'Öka morfinsdosen', correct: false },
        { text: 'Vänta till morgonen', correct: false },
        { text: 'Ge NSAID', correct: false },
      ],
      explanation: 'Oproportionerlig smärta och smärta vid passiv töjning är varningssignaler för kompartmentsyndrom.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.14',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "delta-P" vid kompartmenttryckmätning?',
      options: [
        { text: 'Diastoliskt blodtryck minus kompartmenttryck', correct: true },
        { text: 'Systoliskt blodtryck minus kompartmenttryck', correct: false },
        { text: 'Kompartmenttryck minus atmosfärtryck', correct: false },
        { text: 'Medelartärtryck minus kompartmenttryck', correct: false },
      ],
      explanation: 'Delta-P = diastoliskt BT - kompartmenttryck. ≤30 mmHg indikerar fasciotomi.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; McQueen MM JBJS 1996',
    },
    {
      code: '6.15',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket delta-P-värde indikerar behov av fasciotomi?',
      options: [
        { text: '≤30 mmHg', correct: true },
        { text: '≤50 mmHg', correct: false },
        { text: '≤10 mmHg', correct: false },
        { text: '≥30 mmHg', correct: false },
      ],
      explanation: 'Delta-P ≤30 mmHg indikerar otillräcklig perfusion och behov av fasciotomi.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; McQueen MM JBJS 1996',
    },
    {
      code: '6.16',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Kompartmenttryck 40 mmHg, diastoliskt BT 80 mmHg. Delta-P?',
      options: [
        { text: '40 mmHg - ingen akut fasciotomi', correct: true },
        { text: '20 mmHg - akut fasciotomi', correct: false },
        { text: '120 mmHg', correct: false },
        { text: 'Kan inte beräknas', correct: false },
      ],
      explanation: 'Delta-P = 80 - 40 = 40 mmHg. >30 mmHg, så ingen akut indikation men fortsatt övervakning.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.17',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför används delta-P istället för absolut kompartmenttryck?',
      options: [
        { text: 'Det tar hänsyn till patientens blodtryck och verklig perfusion', correct: true },
        { text: 'Det är lättare att mäta', correct: false },
        { text: 'Det är samma sak', correct: false },
        { text: 'Det är mer precist', correct: false },
      ],
      explanation: 'En hypotensiv patient kan ha ischemi vid lägre absolut tryck. Delta-P justerar för detta.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.18',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken utrustning används för kompartmenttryckmätning?',
      options: [
        { text: 'Stryker-monitor eller artärkanylsystem kopplat till tryckmätare', correct: true },
        { text: 'Blodtrycksmanschett', correct: false },
        { text: 'Ultraljud', correct: false },
        { text: 'MR', correct: false },
      ],
      explanation: 'Stryker är dedikerad utrustning. Artärkanyl med tryckdome är alternativ.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.19',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Var mäter man kompartmenttrycket vid misstänkt underbenssyndrom?',
      options: [
        { text: 'Inom 5 cm från frakturnivån, i alla 4 kompartment', correct: true },
        { text: 'Endast i ett kompartment', correct: false },
        { text: 'I låret', correct: false },
        { text: 'Var som helst', correct: false },
      ],
      explanation: 'Trycket är högst nära frakturen. Alla 4 kompartment bör mätas då de kan påverkas olika.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.20',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är tidsgränsen för fasciotomi för bäst prognos?',
      options: [
        { text: '6 timmar', correct: true },
        { text: '12 timmar', correct: false },
        { text: '24 timmar', correct: false },
        { text: '48 timmar', correct: false },
      ],
      explanation: 'Fasciotomi inom 6h ger bäst prognos. Efter 6-8h ökar risken för permanent skada markant.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; McQueen MM JBJS 2000',
    },
    {
      code: '6.21',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad händer om fasciotomi görs för sent (>8 timmar)?',
      options: [
        { text: 'Permanent muskelskada, nervskada, kontraktur (Volkmann)', correct: true },
        { text: 'Full återhämtning', correct: false },
        { text: 'Endast lätt svaghet', correct: false },
        { text: 'Ingen förändring', correct: false },
      ],
      explanation: 'Försenad fasciotomi leder till irreversibel muskel- och nervskada med permanenta funktionsnedsättningar.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.22',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Volkmann-kontraktur?',
      options: [
        { text: 'Ischemisk kontraktur av underarmsmuskler efter missat kompartmentsyndrom', correct: true },
        { text: 'En frakturtyp', correct: false },
        { text: 'En nervskada', correct: false },
        { text: 'En ledkontraktur', correct: false },
      ],
      explanation: 'Volkmann-kontraktur är klassisk komplikation av missat kompartmentsyndrom i underarmen.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; Volkmann R 1881',
    },
    {
      code: '6.23',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur utförs fasciotomi i underbenet?',
      options: [
        { text: 'Dubbelincision: lateral för anteriort+lateralt, medial för posteriora kompartmenten', correct: true },
        { text: 'En liten incision', correct: false },
        { text: 'Enbart medialt', correct: false },
        { text: 'Genom fraktursåret', correct: false },
      ],
      explanation: 'Dubbelincision är standard: lateral för anteriort/lateralt, medial för ytligt/djupt posteriort.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.24',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför görs långa incisioner vid fasciotomi?',
      options: [
        { text: 'Fascian måste öppnas längs hela muskelns längd för dekompression', correct: true },
        { text: 'Det är lättare', correct: false },
        { text: 'Det är estetiskt bättre', correct: false },
        { text: 'Det blöder mindre', correct: false },
      ],
      explanation: 'För adekvat dekompression måste fascian öppnas i hela sin längd. Korta incisioner räcker inte.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.25',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Efter fasciotomi för kompartmentsyndrom, hur hanteras såren?',
      options: [
        { text: 'Lämnas öppna, VAC eller gradvis slutning, huddel efter 5-7 dagar', correct: true },
        { text: 'Sys direkt', correct: false },
        { text: 'Gipsas', correct: false },
        { text: 'Bandageras tätt', correct: false },
      ],
      explanation: 'Fasciotomisår kan inte slutas primärt pga svullnad. VAC eller sekundär slutning används.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.26',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Patient med gipsad underbensfraktur får tilltagande smärta. Första åtgärd?',
      options: [
        { text: 'Klipp upp gipset längs hela längden och utvärdera', correct: true },
        { text: 'Ge mer smärtstillande', correct: false },
        { text: 'Vänta till morgonen', correct: false },
        { text: 'Ordinera höjning', correct: false },
      ],
      explanation: 'Cirkulärt gips kan orsaka eller förvärra kompartmentsyndrom. Öppning är första steg.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.27',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför kan gips orsaka kompartmentsyndrom?',
      options: [
        { text: 'Gipset är stelt och förhindrar volymexpansion vid svullnad', correct: true },
        { text: 'Gipset är för varmt', correct: false },
        { text: 'Gipset innehåller toxiner', correct: false },
        { text: 'Det finns ingen relation', correct: false },
      ],
      explanation: 'Cirkulärt gips fungerar som ett yttre kompartment som förhindrar svullnadsexpansion.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.28',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur mycket kan öppning av gipset sänka kompartmenttrycket?',
      options: [
        { text: 'Upp till 65% reduktion', correct: true },
        { text: '5%', correct: false },
        { text: '10%', correct: false },
        { text: 'Ingen effekt', correct: false },
      ],
      explanation: 'Bivalvering och vaddering kan reducera trycket med upp till 65%, vilket kan undvika fasciotomi.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; Garfin SR JBJS 1981',
    },
    {
      code: '6.29',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'En medvetslös patient har underbensfraktur. Hur övervakas för kompartmentsyndrom?',
      options: [
        { text: 'Kontinuerlig eller regelbunden kompartmenttryckmätning', correct: true },
        { text: 'Endast klinisk observation', correct: false },
        { text: 'Ingen övervakning behövs', correct: false },
        { text: 'Röntgenkontroll', correct: false },
      ],
      explanation: 'Medvetslösa kan inte rapportera smärta. Objektiv tryckmätning är nödvändig.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.30',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka kompartment finns i underarmen?',
      options: [
        { text: 'Volart (flexor) och dorsalt (extensor)', correct: true },
        { text: 'Endast ett kompartment', correct: false },
        { text: '4 kompartment', correct: false },
        { text: '6 kompartment', correct: false },
      ],
      explanation: 'Underarmen har två huvudkompartment: volart och dorsalt.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.31',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Efter kärlrekonstruktion i underbenet med 5h ischemitid. Behövs profylaktisk fasciotomi?',
      options: [
        { text: 'Ja, profylaktisk fasciotomi rekommenderas vid ischemitid >4-6 timmar', correct: true },
        { text: 'Nej, endast vid symtom', correct: false },
        { text: 'Beror på patientens ålder', correct: false },
        { text: 'Aldrig profylaktiskt', correct: false },
      ],
      explanation: 'Reperfusion efter ischemi >4-6h ger svullnad som kan orsaka kompartmentsyndrom.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.32',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför uppstår kompartmentsyndrom efter kärlrekonstruktion?',
      options: [
        { text: 'Reperfusion efter ischemi orsakar ödem och svullnad', correct: true },
        { text: 'Kärlrekonstruktionen misslyckas', correct: false },
        { text: 'Infektion', correct: false },
        { text: 'Det är ett tekniskt fel', correct: false },
      ],
      explanation: 'Reperfusionsskada med ödem, mikrovaskulär skada och cellsvullnad ökar kompartmenttrycket.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.33',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur ofta bör neurovaskulär status kontrolleras hos högriskpatienter?',
      options: [
        { text: 'Var 1-2 timme de första 24-48 timmarna', correct: true },
        { text: 'En gång per dygn', correct: false },
        { text: 'Endast vid utskrivning', correct: false },
        { text: 'Var 8:e timme', correct: false },
      ],
      explanation: 'Tidig upptäckt kräver frekvent övervakning, särskilt första dygnet.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.34',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Patient med crushing injury i underbenet. Vilken övervakning?',
      options: [
        { text: 'Frekvent neurovaskulär kontroll + låg tröskel för tryckmätning/fasciotomi', correct: true },
        { text: 'Standard övervakning', correct: false },
        { text: 'Ingen särskild övervakning', correct: false },
        { text: 'Endast röntgen', correct: false },
      ],
      explanation: 'Crushing injury har hög risk för kompartmentsyndrom. Noggrann övervakning är essentiell.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.35',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Kan kompartmentsyndrom uppstå utan fraktur?',
      options: [
        { text: 'Ja, vid crushing injury, blödning, reperfusion, överansträngning', correct: true },
        { text: 'Nej, endast vid fraktur', correct: false },
        { text: 'Endast vid öppen fraktur', correct: false },
        { text: 'Endast vid bäckenfraktur', correct: false },
      ],
      explanation: 'Kompartmentsyndrom kan uppstå vid alla tillstånd som ökar trycket i kompartmentet.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.36',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "exertional compartment syndrome"?',
      options: [
        { text: 'Kompartmentsyndrom orsakat av intensiv fysisk aktivitet', correct: true },
        { text: 'Kompartmentsyndrom vid trauma', correct: false },
        { text: 'Kompartmentsyndrom hos äldre', correct: false },
        { text: 'Kompartmentsyndrom vid infektion', correct: false },
      ],
      explanation: 'Ansträngningsutlöst kompartmentsyndrom ses hos atleter, ofta kroniskt återkommande.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.37',
      chapterNumber: 6,
      bloomLevel: 'ANALYSIS',
      question: 'Patient med narkotikaövervakning kan inte bedöma smärta. Kompartmenttryck 35 mmHg, dia BT 60 mmHg. Åtgärd?',
      options: [
        { text: 'Fasciotomi - delta-P är 25 mmHg (≤30 = indikation)', correct: true },
        { text: 'Avvakta och mät igen', correct: false },
        { text: 'Ge vasopressor för att höja BT', correct: false },
        { text: 'Ingen åtgärd', correct: false },
      ],
      explanation: 'Delta-P = 60-35 = 25 mmHg. ≤30 mmHg och patient kan inte rapportera symtom = fasciotomi.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.38',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är analgetikabehandling kontroversiell vid misstänkt kompartmentsyndrom?',
      options: [
        { text: 'Smärtlindring kan maskera symtom och fördröja diagnos', correct: true },
        { text: 'Analgetika är kontraindicerat', correct: false },
        { text: 'Det finns ingen kontroverser', correct: false },
        { text: 'Analgetika förvärrar tillståndet', correct: false },
      ],
      explanation: 'Effektiv smärtlindring kan dölja varningssignalen "oproportionerlig smärta".',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.39',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Ska analgetika undanhållas vid misstänkt kompartmentsyndrom?',
      options: [
        { text: 'Nej, ge adekvat smärtlindring men var extra uppmärksam på andra tecken', correct: true },
        { text: 'Ja, undanhåll all smärtlindring', correct: false },
        { text: 'Ge endast lokalanestetika', correct: false },
        { text: 'Ge endast paracetamol', correct: false },
      ],
      explanation: 'Smärtlindring är humanitärt nödvändig. Kompensera med tätare kontroller och tryckmätning.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.40',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka kompartment finns i låret?',
      options: [
        { text: 'Anteriort, medialt, posteriort', correct: true },
        { text: 'Endast anteriort', correct: false },
        { text: '4 kompartment', correct: false },
        { text: '6 kompartment', correct: false },
      ],
      explanation: 'Låret har 3 kompartment: anteriort (quadriceps), medialt (adduktorer), posteriort (hamstrings).',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.41',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är kompartmentsyndrom i låret ovanligare än i underbenet?',
      options: [
        { text: 'Lårets kompartment är större och mer elastiska', correct: true },
        { text: 'Låret har inga kompartment', correct: false },
        { text: 'Låret skadas sällan', correct: false },
        { text: 'Det finns ingen skillnad', correct: false },
      ],
      explanation: 'Lårets större volym och mer eftergivande fascior gör det mer tolerant för tryckökningar.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.42',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Patient med suprakondylär humerusfraktur utvecklar svår underarmssmärta och oförmåga att sträcka fingrarna. Diagnos?',
      options: [
        { text: 'Kompartmentsyndrom i underarmen - akut fasciotomi', correct: true },
        { text: 'Normal fraktursmärta', correct: false },
        { text: 'Nervskada', correct: false },
        { text: 'Infektion', correct: false },
      ],
      explanation: 'Klassisk presentation av underarmskompartmentsyndrom. Akut fasciotomi krävs.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.43',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka muskler påverkas vid anteriort underbenssyndrom?',
      options: [
        { text: 'M. tibialis anterior, extensor digitorum longus, extensor hallucis longus', correct: true },
        { text: 'M. gastrocnemius', correct: false },
        { text: 'M. soleus', correct: false },
        { text: 'M. peroneus', correct: false },
      ],
      explanation: 'Anteriora kompartmentet innehåller dorsalflexorerna av fot och tår.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.44',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Vilken nerv skadas vid anteriort underbenssyndrom?',
      options: [
        { text: 'N. peroneus profundus', correct: true },
        { text: 'N. tibialis', correct: false },
        { text: 'N. suralis', correct: false },
        { text: 'N. saphenus', correct: false },
      ],
      explanation: 'N. peroneus profundus löper genom anteriora kompartmentet och skagas vid ischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.45',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket sensoriskt bortfall ses vid anteriort kompartmentsyndrom?',
      options: [
        { text: 'Nedsatt sensation mellan stortån och andra tån (första interdigitalrummet)', correct: true },
        { text: 'Hela fotsulans undersida', correct: false },
        { text: 'Hälen', correct: false },
        { text: 'Fotrygggen', correct: false },
      ],
      explanation: 'N. peroneus profundus sensoriska område är första interdigitalrummet dorsalt.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.46',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Hur testas anteriora kompartmentet kliniskt?',
      options: [
        { text: 'Smärta vid passiv plantarflexion av fot/tår, svaghet vid dorsalflexion', correct: true },
        { text: 'Smärta vid passiv dorsalflexion', correct: false },
        { text: 'Palpation av vaden', correct: false },
        { text: 'Hofmann-test', correct: false },
      ],
      explanation: 'Passiv plantarflexion töjer anteriora musklerna. Svag dorsalflexion indikerar påverkad motorik.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.47',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Hur testas djupa posteriora kompartmentet kliniskt?',
      options: [
        { text: 'Smärta vid passiv dorsalflexion av tårna, svag plantarflexion av tår', correct: true },
        { text: 'Smärta vid passiv plantarflexion', correct: false },
        { text: 'Palpation anteriort', correct: false },
        { text: 'Knäflex', correct: false },
      ],
      explanation: 'Djupa posteriora kompartmentet innehåller tåflexorerna. Passiv tådorsalflexion töjer dessa.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.48',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför kan regionalbedövning (nervblockad) vara problematiskt vid risk för kompartmentsyndrom?',
      options: [
        { text: 'Den blockerar smärtsignaler och kan maskera tidiga symtom', correct: true },
        { text: 'Den är kontraindicerad', correct: false },
        { text: 'Den orsakar kompartmentsyndrom', correct: false },
        { text: 'Ingen påverkan', correct: false },
      ],
      explanation: 'Effektiv nervblockad eliminerar smärtvarningen. Överväg risker och använd tryckmätning.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.49',
      chapterNumber: 6,
      bloomLevel: 'ANALYSIS',
      question: 'En patient med tibiafraktur vårdas på IVA, sederad och ventilerad. Hur handläggs kompartmentrisk?',
      options: [
        { text: 'Kontinuerlig kompartmenttryckmätning eller låg tröskel för profylaktisk fasciotomi', correct: true },
        { text: 'Ingen åtgärd behövs', correct: false },
        { text: 'Endast klinisk observation', correct: false },
        { text: 'Avvakta till patienten vaknar', correct: false },
      ],
      explanation: 'Sederade patienter kan inte rapportera symtom. Objektiv mätning eller profylax krävs.',
      reference: 'B-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: '6.50',
      chapterNumber: 6,
      bloomLevel: 'ANALYSIS',
      question: 'Vilken faktor har störst inverkan på prognos vid kompartmentsyndrom?',
      options: [
        { text: 'Tid till fasciotomi', correct: true },
        { text: 'Patientens ålder', correct: false },
        { text: 'Frakturtyp', correct: false },
        { text: 'Antibiotika', correct: false },
      ],
      explanation: 'Tid till dekompression är avgörande. <6h = god prognos, >8h = dålig prognos.',
      reference: 'B-ORTIM Kursbok, Kapitel 6; McQueen MM JBJS 2000',
    },

    // Kapitel 7: Extra frågor
    {
      code: '7.3',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad karakteriserar en Gustilo typ IIIB öppen fraktur?',
      options: [
        { text: 'Omfattande mjukdelsskada med perioststripping, kräver lambåtäckning', correct: true },
        { text: 'Sår <1 cm', correct: false },
        { text: 'Sår 1-10 cm utan periostskada', correct: false },
        { text: 'Kärlskada som kräver reparation', correct: false },
      ],
      explanation: 'Gustilo IIIB har massiv mjukdelsskada, perioststripping och exponerat ben som kräver lambåtäckning för att läka.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1984',
    },
    {
      code: '7.4',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska öppna frakturer fotograferas vid ankomst?',
      options: [
        { text: 'För att undvika upprepade förbandsbyten och infektionsrisk', correct: true },
        { text: 'Endast för journaldokumentation', correct: false },
        { text: 'För att visa patienten', correct: false },
        { text: 'Det är inte nödvändigt', correct: false },
      ],
      explanation: 'Fotodokumentation vid ankomst minskar behovet av upprepade förbandsbyten, vilket reducerar kontaminering och infektionsrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.5',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Öppen tibiafraktur typ IIIA. Vilken antibiotika och duration?',
      options: [
        { text: 'Cefuroxim + Gentamicin i 72 timmar', correct: true },
        { text: 'Cefuroxim enbart i 24 timmar', correct: false },
        { text: 'Penicillin i 1 vecka', correct: false },
        { text: 'Ingen antibiotika behövs', correct: false },
      ],
      explanation: 'Gustilo III-frakturer kräver bredspektrumantibiotika (Cefuroxim + aminoglykosid) i 72 timmar enligt EAST-riktlinjer.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; EAST Guidelines 2011',
    },
    {
      code: '7.6',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad definierar en öppen fraktur?',
      options: [
        { text: 'Fraktur med kommunikation mellan frakturhematom och yttre miljön', correct: true },
        { text: 'Fraktur med synligt ben genom huden', correct: false },
        { text: 'Fraktur med sår i närheten', correct: false },
        { text: 'Fraktur med blödning', correct: false },
      ],
      explanation: 'En öppen fraktur definieras som kommunikation mellan frakturen och den yttre miljön, oavsett sårens storlek eller om ben syns.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS Standards 2020',
    },
    {
      code: '7.7',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är Gustilo-Anderson typ I?',
      options: [
        { text: 'Sår <1 cm, minimal kontaminering, lågenergiskada', correct: true },
        { text: 'Sår 1-10 cm, måttlig mjukdelsskada', correct: false },
        { text: 'Sår >10 cm med perioststripping', correct: false },
        { text: 'Kärlskada som kräver reparation', correct: false },
      ],
      explanation: 'Gustilo typ I: sår mindre än 1 cm, minimal mjukdelsskada, ren/enkel fraktur, lågenergimekanism.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1976',
    },
    {
      code: '7.8',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är Gustilo-Anderson typ II?',
      options: [
        { text: 'Sår 1-10 cm utan extensiv mjukdelsskada, måttlig kontaminering', correct: true },
        { text: 'Sår <1 cm', correct: false },
        { text: 'Extensiv mjukdelsskada med perioststripping', correct: false },
        { text: 'Skottskada', correct: false },
      ],
      explanation: 'Gustilo typ II: sår 1-10 cm, måttlig mjukdelsskada, ingen extensiv devitalisering, måttlig kontaminering.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1976',
    },
    {
      code: '7.9',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad karakteriserar Gustilo typ IIIA?',
      options: [
        { text: 'Extensiv mjukdelsskada men adekvat mjukdelstäckning av ben möjlig', correct: true },
        { text: 'Sår <1 cm', correct: false },
        { text: 'Kräver lambåtäckning', correct: false },
        { text: 'Kärlskada som kräver reparation', correct: false },
      ],
      explanation: 'Gustilo IIIA har extensiv mjukdelsskada från högenergitrauma, men adekvat mjukdelstäckning kan uppnås utan lambå.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1984',
    },
    {
      code: '7.10',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför uppgraderas alltid jordbruksskador till minst Gustilo IIIA?',
      options: [
        { text: 'Hög kontaminationsgrad med polymikrobiella organismer inklusive klostridier', correct: true },
        { text: 'Alltid högenergitrauma', correct: false },
        { text: 'Alltid kärlskada', correct: false },
        { text: 'Juridiska skäl', correct: false },
      ],
      explanation: 'Jordbruksskador har hög polymikrobiell kontaminering inklusive Clostridium-arter som orsakar gasgangrän, vilket kräver aggressiv behandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1984',
    },
    {
      code: '7.11',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken skademekanism klassificeras automatiskt som minst Gustilo typ III?',
      options: [
        { text: 'Skottskada, jordbruksolycka, högenergiskada med massiv kontaminering', correct: true },
        { text: 'Fall från stående', correct: false },
        { text: 'Sportskada', correct: false },
        { text: 'Alla trafikolyckor', correct: false },
      ],
      explanation: 'Skottskador, jordbruksolyckor och högenergiskador med massiv kontaminering klassificeras alltid som minst typ III oavsett sårens storlek.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.12',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Patient inkommer med litet hudperforationssår 0.5 cm över tibia efter motorcykelolycka i hög hastighet. Vilken Gustilo-typ?',
      options: [
        { text: 'Typ III - högenergimekanism uppgraderar klassifikationen', correct: true },
        { text: 'Typ I - litet sår', correct: false },
        { text: 'Typ II - motorcykelolycka', correct: false },
        { text: 'Kan ej klassificeras förrän efter debridering', correct: false },
      ],
      explanation: 'Högenergimekanism (hög hastighet) uppgraderar klassifikationen oavsett sårens storlek. Slutlig klassifikation görs efter debridering.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1984',
    },
    {
      code: '7.13',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är "golden hour" för antibiotikaadministration vid öppen fraktur?',
      options: [
        { text: '1 timme från skada eller ankomst', correct: true },
        { text: '3 timmar', correct: false },
        { text: '6 timmar', correct: false },
        { text: '24 timmar', correct: false },
      ],
      explanation: 'Antibiotika ska ges inom 1 timme ("golden hour") för att minska infektionsrisken signifikant.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Patzakis MJ JBJS 1974',
    },
    {
      code: '7.14',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket förstahandsantibiotikum rekommenderas vid öppen fraktur typ I-II?',
      options: [
        { text: 'Cefuroxim (2:a generationens cefalosporin)', correct: true },
        { text: 'Penicillin V', correct: false },
        { text: 'Vancomycin', correct: false },
        { text: 'Metronidazol', correct: false },
      ],
      explanation: 'Cefuroxim ger god täckning mot både grampositiva (stafylokocker) och gramnegativa bakterier vid typ I-II.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; EAST Guidelines 2011',
    },
    {
      code: '7.15',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket tillägg rekommenderas för antibiotikabehandling vid Gustilo typ III?',
      options: [
        { text: 'Aminoglykosid (Gentamicin)', correct: true },
        { text: 'Metronidazol', correct: false },
        { text: 'Flukonazol', correct: false },
        { text: 'Inget tillägg behövs', correct: false },
      ],
      explanation: 'Aminoglykosid läggs till vid typ III för utökad gramnegativ täckning vid högre kontaminationsrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; EAST Guidelines 2011',
    },
    {
      code: '7.16',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'När ska penicillin läggas till antibiotikabehandlingen vid öppen fraktur?',
      options: [
        { text: 'Vid jordbruksskada eller fekal kontaminering (klostridierisker)', correct: true },
        { text: 'Alltid vid typ III', correct: false },
        { text: 'Aldrig - cefalosporin räcker', correct: false },
        { text: 'Vid penicillinallergi', correct: false },
      ],
      explanation: 'Penicillin eller metronidazol läggs till vid jordbruksskador för täckning mot Clostridium perfringens (gasgangrän).',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.17',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Hur länge ska antibiotika ges vid Gustilo typ I öppen fraktur?',
      options: [
        { text: '24 timmar eller till sårslutning', correct: true },
        { text: '72 timmar', correct: false },
        { text: '1 vecka', correct: false },
        { text: 'Tills frakturen läkt', correct: false },
      ],
      explanation: 'Vid Gustilo typ I räcker 24 timmars profylax eller tills sårslutning enligt moderna guidelines.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; EAST Guidelines 2011',
    },
    {
      code: '7.18',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Hur länge ska antibiotika ges vid Gustilo typ III öppen fraktur?',
      options: [
        { text: '72 timmar eller till definitivt mjukdelstäckande', correct: true },
        { text: '24 timmar', correct: false },
        { text: '1 vecka', correct: false },
        { text: 'Tills CRP normaliserats', correct: false },
      ],
      explanation: 'Vid Gustilo typ III ges antibiotika i 72 timmar eller tills definitivt mjukdelstäckande uppnåtts.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; EAST Guidelines 2011',
    },
    {
      code: '7.19',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är tetanusprofylax-rekommendationen vid öppen fraktur?',
      options: [
        { text: 'Tetanusvaccin om >5 år sedan senaste dos, immunoglobulin vid okänd status', correct: true },
        { text: 'Alltid tetanusvaccin och immunoglobulin', correct: false },
        { text: 'Endast vid jordbruksskada', correct: false },
        { text: 'Tetanusprofylax behövs ej vid antibiotika', correct: false },
      ],
      explanation: 'Tetanusvaccin ges om >5 år sedan senaste dos. Tetanusimmunoglobulin (TIG) ges vid okänd vaccinationsstatus eller <3 doser.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Folkhälsomyndigheten',
    },
    {
      code: '7.20',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Hur ska ett öppet sår initialt hanteras på akutmottagningen?',
      options: [
        { text: 'Fotografera, täck med NaCl-fuktad kompress, undvik upprepade inspektioner', correct: true },
        { text: 'Grundlig debridering på akuten', correct: false },
        { text: 'Lämna öppet för luftning', correct: false },
        { text: 'Primärsuturera direkt', correct: false },
      ],
      explanation: 'Såret fotograferas för dokumentation, täcks med fuktigt förband och manipuleras minimalt för att minska kontaminering.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.21',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska upprepade sårinspektioner undvikas på akuten?',
      options: [
        { text: 'Varje inspektion ökar kontaminering och infektionsrisk', correct: true },
        { text: 'Patienten känner smärta', correct: false },
        { text: 'Det finns ingen tid', correct: false },
        { text: 'Klassifikationen ändras inte', correct: false },
      ],
      explanation: 'Upprepade inspektioner introducerar nya mikroorganismer och ökar infektionsrisken signifikant.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.22',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Inom vilken tid ska debridering ske vid öppen fraktur enligt BOA/BAPRAS?',
      options: [
        { text: 'Inom 12-24 timmar, tidigare vid grov kontaminering', correct: true },
        { text: 'Alltid inom 6 timmar', correct: false },
        { text: 'Inom 48 timmar', correct: false },
        { text: 'Timing spelar ingen roll', correct: false },
      ],
      explanation: 'Modern evidens visar att debridering inom 12-24 timmar är acceptabelt, men grov kontaminering kräver tidigare åtgärd.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.23',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär principen "fix and flap" vid öppen fraktur?',
      options: [
        { text: 'Frakturstabilisering och mjukdelstäckning bör ske tidigt, helst inom 72 timmar', correct: true },
        { text: 'Vänta med täckning tills såret är rent', correct: false },
        { text: 'Alltid extern fixation', correct: false },
        { text: 'Mjukdelstäckning före frakturbehandling', correct: false },
      ],
      explanation: 'Fix and flap innebär tidig frakturstabilisering och mjukdelstäckning (inom 72h) för att minska infektionsrisk och förbättra läkning.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Godina M 1986',
    },
    {
      code: '7.24',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är målet med kirurgisk debridering vid öppen fraktur?',
      options: [
        { text: 'Avlägsna all devitaliserad vävnad och främmande material', correct: true },
        { text: 'Endast ta bort synlig smuts', correct: false },
        { text: 'Minimal vävnadsexcision', correct: false },
        { text: 'Spola med stora volymer', correct: false },
      ],
      explanation: 'Debridering syftar till att skapa en ren sårmiljö genom att avlägsna all devitaliserad vävnad (muskel, fascia, ben) och kontaminering.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.25',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken spolvolym rekommenderas vid kirurgisk debridering av öppen fraktur?',
      options: [
        { text: '6-9 liter lågtrykkslavage med NaCl', correct: true },
        { text: '500 ml', correct: false },
        { text: 'Högtryckslavage med antiseptika', correct: false },
        { text: 'Spolning behövs ej efter debridering', correct: false },
      ],
      explanation: 'FLOW-studien visade att lågtrykkslavage med 6-9 liter NaCl är tillräckligt. Högtryck och additiv ökar vävnadsskada utan fördel.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; FLOW Trial NEJM 2015',
    },
    {
      code: '7.26',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför rekommenderas inte högtryckslavage vid öppen fraktur?',
      options: [
        { text: 'Riskerar att driva in kontaminering djupare och skadar vävnad', correct: true },
        { text: 'För dyrt', correct: false },
        { text: 'Tar för lång tid', correct: false },
        { text: 'Högtryck rekommenderas faktiskt', correct: false },
      ],
      explanation: 'Högtryckslavage driver in bakterier djupare i vävnaden och orsakar mekanisk vävnadsskada, vilket ökar infektionsrisken.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; FLOW Trial NEJM 2015',
    },
    {
      code: '7.27',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur bedöms muskelvitalitet vid debridering?',
      options: [
        { text: 'Färg (Color), Kontraktilitet, Konsistens, Kapillär blödning (4 C)', correct: true },
        { text: 'Endast om muskeln blöder', correct: false },
        { text: 'Elektrisk stimulering', correct: false },
        { text: 'MR-undersökning', correct: false },
      ],
      explanation: 'Muskelvitalitet bedöms med 4 C: Color (färg), Contractility (kontraktilitet), Consistency (konsistens), Capillary bleeding (blödning).',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Scully RE Surgery 1956',
    },
    {
      code: '7.28',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Ska devitaliserat ben avlägsnas vid initial debridering?',
      options: [
        { text: 'Ja, lösa fragment utan mjukdelsfäste ska tas bort', correct: true },
        { text: 'Nej, allt ben ska bevaras', correct: false },
        { text: 'Endast kontaminerat ben', correct: false },
        { text: 'Alltid total benexcision', correct: false },
      ],
      explanation: 'Lösa benfragment utan mjukdelsförsörjning (periost) ska avlägsnas då de blir fokus för infektion. Fragment med mjukdelsfäste bevaras.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.29',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken stabiliseringsmetod rekommenderas primärt vid Gustilo IIIB/IIIC?',
      options: [
        { text: 'Extern fixation', correct: true },
        { text: 'Märgspik', correct: false },
        { text: 'Plattfixation', correct: false },
        { text: 'Gips', correct: false },
      ],
      explanation: 'Extern fixation rekommenderas vid svåra öppna frakturer då den undviker ytterligare mjukdelsskada och tillåter sårinspektion.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.30',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'När kan primär definitiv fixation (märgspik) övervägas vid öppen tibiafraktur?',
      options: [
        { text: 'Gustilo I-II och IIIA med adekvat mjukdelstäckning', correct: true },
        { text: 'Alla öppna frakturer', correct: false },
        { text: 'Endast typ I', correct: false },
        { text: 'Aldrig vid öppen fraktur', correct: false },
      ],
      explanation: 'Vid Gustilo I-IIIA med adekvat mjukdelstäckning kan primär märgspikning vara säkert och ge bättre funktionellt resultat.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; SPRINT Study JBJS 2008',
    },
    {
      code: '7.31',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är infektionsrisken vid Gustilo typ I öppen fraktur?',
      options: [
        { text: '0-2%', correct: true },
        { text: '5-10%', correct: false },
        { text: '10-25%', correct: false },
        { text: '>30%', correct: false },
      ],
      explanation: 'Gustilo typ I har låg infektionsrisk på 0-2% med korrekt behandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1984',
    },
    {
      code: '7.32',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är infektionsrisken vid Gustilo typ IIIB öppen fraktur?',
      options: [
        { text: '10-50%', correct: true },
        { text: '0-2%', correct: false },
        { text: '2-5%', correct: false },
        { text: '5-10%', correct: false },
      ],
      explanation: 'Gustilo IIIB har hög infektionsrisk på 10-50% på grund av extensiv mjukdelsskada och behov av lambåtäckning.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1984',
    },
    {
      code: '7.33',
      chapterNumber: 7,
      bloomLevel: 'ANALYSIS',
      question: 'Vilken är viktigaste faktorn för att förebygga infektion vid öppen fraktur?',
      options: [
        { text: 'Adekvat kirurgisk debridering', correct: true },
        { text: 'Antibiotikaval', correct: false },
        { text: 'Spolvolym', correct: false },
        { text: 'Tidpunkt för operation', correct: false },
      ],
      explanation: 'Kirurgisk debridering med avlägsnande av devitaliserad vävnad är den enskilt viktigaste åtgärden för att förebygga infektion.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.34',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Patient med öppen tibiafraktur Gustilo IIIB. Mjukdelstäckning planeras. Vilken tidsgräns?',
      options: [
        { text: 'Inom 72 timmar om möjligt', correct: true },
        { text: 'Inom 24 timmar', correct: false },
        { text: 'Inom 1 vecka', correct: false },
        { text: 'Vänta tills granulationsvävnad bildats', correct: false },
      ],
      explanation: 'Mjukdelstäckning inom 72 timmar reducerar infektionsrisken och förbättrar läkning enligt Godina-principen.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Godina M Plast Reconstr Surg 1986',
    },
    {
      code: '7.35',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken typ av lambå används oftast vid Gustilo IIIB tibiafraktur?',
      options: [
        { text: 'Fri lambå (t.ex. latissimus dorsi eller gracilis)', correct: true },
        { text: 'Hudtransplantat', correct: false },
        { text: 'Lokal rotationslambå', correct: false },
        { text: 'Kompressionsförband', correct: false },
      ],
      explanation: 'Fria mikrovaskulära lambåer (latissimus, gracilis) används vid IIIB för att täcka exponerat ben och ge vaskulariserad vävnad.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.36',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför övervägs amputation vid Gustilo IIIC trots möjlig kärlrekonstruktion?',
      options: [
        { text: 'Höga infektions- och komplikationsrisker kan ge sämre långtidsfunktion än amputation', correct: true },
        { text: 'Kärlrekonstruktion är alltid kontraindicerad', correct: false },
        { text: 'Proteser är alltid bättre', correct: false },
        { text: 'Ekonomiska skäl', correct: false },
      ],
      explanation: 'LEAP-studien visade att funktionellt utfall vid salvage vs amputation kan vara likvärdigt, medan salvage medför fler komplikationer.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; LEAP Study JBJS 2002',
    },
    {
      code: '7.37',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är MESS-score?',
      options: [
        { text: 'Mangled Extremity Severity Score - predikterar amputationsbehov', correct: true },
        { text: 'Mätning av mjukdelsskada', correct: false },
        { text: 'Infektionsriskbedömning', correct: false },
        { text: 'Neurologisk funktionsbedömning', correct: false },
      ],
      explanation: 'MESS (Mangled Extremity Severity Score) används för att förutsäga sannolikheten för lyckad limb salvage vs primär amputation.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Johansen K J Trauma 1990',
    },
    {
      code: '7.38',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'MESS score ≥7 indikerar?',
      options: [
        { text: 'Hög sannolikhet för amputation', correct: true },
        { text: 'Säker limb salvage', correct: false },
        { text: 'Typ IIIA skada', correct: false },
        { text: 'Behov av antibiotika', correct: false },
      ],
      explanation: 'MESS ≥7 har historiskt associerats med hög amputationsrisk, men beslutet baseras på klinisk helhetsbedömning.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Johansen K J Trauma 1990',
    },
    {
      code: '7.39',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken nervskada har sämst prognos vid öppen tibiafraktur?',
      options: [
        { text: 'Tibialis posterior-skada (plantar sensation)', correct: true },
        { text: 'Peroneusskada', correct: false },
        { text: 'Suralisskada', correct: false },
        { text: 'Saphenousskada', correct: false },
      ],
      explanation: 'Skada på tibialis posterior (plantar sensation) ger sämst prognos då det påverkar gångförmåga och sensorisk feedback för balans.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; LEAP Study JBJS 2002',
    },
    {
      code: '7.40',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste patogenen vid infektion efter öppen fraktur?',
      options: [
        { text: 'Staphylococcus aureus', correct: true },
        { text: 'Pseudomonas aeruginosa', correct: false },
        { text: 'Escherichia coli', correct: false },
        { text: 'Streptococcus pyogenes', correct: false },
      ],
      explanation: 'Staphylococcus aureus är den vanligaste orsaken till infektion vid öppen fraktur, följt av gramnegativa bakterier.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Gustilo RB JBJS 1984',
    },
    {
      code: '7.41',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Vid penicillinallergi, vilken antibiotika vid öppen fraktur typ I-II?',
      options: [
        { text: 'Klindamycin', correct: true },
        { text: 'Amoxicillin', correct: false },
        { text: 'Ampicillin', correct: false },
        { text: 'Piperacillin-tazobactam', correct: false },
      ],
      explanation: 'Klindamycin är förstahandsvalet vid penicillin/cefalosporinallergi och ger god täckning mot grampositiva bakterier.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; EAST Guidelines 2011',
    },
    {
      code: '7.42',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "second look" vid öppen fraktur?',
      options: [
        { text: 'Planerad re-debridering inom 24-48 timmar', correct: true },
        { text: 'Postoperativ röntgen', correct: false },
        { text: 'Uppföljning efter 1 vecka', correct: false },
        { text: 'CT-undersökning', correct: false },
      ],
      explanation: 'Second look är planerad återoperation inom 24-48 timmar för att bedöma vävnadsvitalitet och komplettera debridering vid behov.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.43',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'När är second look särskilt indicerat?',
      options: [
        { text: 'Gustilo IIIB/C, grov kontaminering, osäker vävnadsvitalitet', correct: true },
        { text: 'Alla öppna frakturer', correct: false },
        { text: 'Endast vid infektion', correct: false },
        { text: 'Endast vid extern fixation', correct: false },
      ],
      explanation: 'Second look är särskilt viktigt vid svåra skador där initial debridering kan vara otillräcklig och vävnadsvitalitet osäker.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.44',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Patient med öppen fraktur utvecklar feber, ökande smärta och rodnad dag 3. Åtgärd?',
      options: [
        { text: 'Akut reoperation med debridering och odlingar', correct: true },
        { text: 'Byta antibiotika empiriskt', correct: false },
        { text: 'Avvakta och observera', correct: false },
        { text: 'CT-undersökning', correct: false },
      ],
      explanation: 'Tidiga infektionstecken kräver akut kirurgisk intervention med debridering och odlingar för riktad antibiotika.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.45',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad kännetecknar gasgangrän vid öppen fraktur?',
      options: [
        { text: 'Snabb progress, krepitationer, allvarlig systemisk påverkan', correct: true },
        { text: 'Långsam progress', correct: false },
        { text: 'Endast lokal rodnad', correct: false },
        { text: 'Alltid vid jordbruksskada', correct: false },
      ],
      explanation: 'Gasgangrän (klostridial myonekros) progredierar snabbt med krepitationer, bronsfärgad hud och svår systemisk påverkan.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Stevens DL Clin Infect Dis 2014',
    },
    {
      code: '7.46',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Behandling vid misstänkt gasgangrän?',
      options: [
        { text: 'Akut extensiv debridering, högdos penicillin + klindamycin, ev amputation', correct: true },
        { text: 'Antibiotika och observation', correct: false },
        { text: 'Hyperbar oxygenterapi som förstahandsbehandling', correct: false },
        { text: 'Endast såromläggning', correct: false },
      ],
      explanation: 'Gasgangrän kräver omedelbar extensiv kirurgisk debridering, ofta amputation, samt högdos penicillin + klindamycin (toxinhämning).',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Stevens DL Clin Infect Dis 2014',
    },
    {
      code: '7.47',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är kronisk osteomyelit?',
      options: [
        { text: 'Beninfektion >6 veckor med nekrotiskt ben (sequester)', correct: true },
        { text: 'Akut beninfektion', correct: false },
        { text: 'Mjukdelsinfektion', correct: false },
        { text: 'Frakturläkningsproblem', correct: false },
      ],
      explanation: 'Kronisk osteomyelit definieras av beninfektion >6 veckor med bildning av nekrotiskt ben (sequester) och ofta fistel.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Cierny G Clin Orthop 2003',
    },
    {
      code: '7.48',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är öppna frakturer i tibia särskilt problemtiska?',
      options: [
        { text: 'Minimal mjukdelstäckning och begränsad blodförsörjning', correct: true },
        { text: 'Tibia är det längsta benet', correct: false },
        { text: 'Alltid kärlskada', correct: false },
        { text: 'Svår att reponera', correct: false },
      ],
      explanation: 'Tibia har minimal mjukdelstäckning anteriort och ändartärsförsörjning, vilket ökar risk för läkningsproblem och infektion.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.49',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är en segmentell bendefekt?',
      options: [
        { text: 'Förlust av ett segment av benet, ofta efter debridering', correct: true },
        { text: 'Fraktur i två plan', correct: false },
        { text: 'Ledskada', correct: false },
        { text: 'Mjukdelsskada', correct: false },
      ],
      explanation: 'Segmentell bendefekt innebär förlust av en del av benkontinuiteten, vilket kräver speciell rekonstruktionsteknik.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; BOA/BAPRAS 2020',
    },
    {
      code: '7.50',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken rekonstruktionsteknik används vid stora segmentella bendefekter?',
      options: [
        { text: 'Bentransport (Ilizarov), vaskulariserat fibulafritt transplantat', correct: true },
        { text: 'Endast bentransplantat', correct: false },
        { text: 'Extern fixation permanent', correct: false },
        { text: 'Protesersättning', correct: false },
      ],
      explanation: 'Stora defekter (>4 cm) kan behandlas med bentransport (Ilizarov/TSF) eller vaskulariserat fibulafritt transplantat.',
      reference: 'B-ORTIM Kursbok, Kapitel 7; Masquelet AC J Orthop Trauma 2010',
    },

    // Kapitel 8: Extra frågor
    {
      code: '8.3',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken bäckenfrakturtyp har högst blödningsrisk?',
      options: [
        { text: 'Vertikal instabil (VS/APC-III)', correct: true },
        { text: 'Lateral kompression typ I', correct: false },
        { text: 'Isolerad ramus pubis-fraktur', correct: false },
        { text: 'Acetabelfraktur', correct: false },
      ],
      explanation: 'Vertikalt instabila frakturer (VS) och APC typ III har störst volymökning och högst blödningsrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Young-Burgess klassifikation',
    },
    {
      code: '8.4',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Bäckenbältet har applicerats men patienten är fortfarande hypotensiv. Nästa steg?',
      options: [
        { text: 'Aktivera massivt transfusionsprotokoll (MTP) och förbered för intervention', correct: true },
        { text: 'Ta av bältet och applicera igen', correct: false },
        { text: 'Vänta och se', correct: false },
        { text: 'Ge mer kristalloid', correct: false },
      ],
      explanation: 'Om bäckenbälte inte stabiliserar patienten hemodynamiskt, aktivera MTP och förbered för preperitonal packing eller angioembolisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.5',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska bäckenbältet placeras över trochanter major och inte över crista iliaca?',
      options: [
        { text: 'Trochanter-nivå ger optimal kompression av bäckenringen', correct: true },
        { text: 'Det är enklare att applicera', correct: false },
        { text: 'Det är mer bekvämt för patienten', correct: false },
        { text: 'Det spelar ingen roll var det placeras', correct: false },
      ],
      explanation: 'Placering över trochanter major ger biomekaniskt optimal kompression av den posteriora bäckenringen för att reducera volym och blödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 8',
    },
    {
      code: '8.6',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Young-Burgess klassifikationen?',
      options: [
        { text: 'Mekanismbaserad klassifikation av bäckenfrakturer (LC, APC, VS, CM)', correct: true },
        { text: 'Klassifikation av blödningskällor', correct: false },
        { text: 'Behandlingsalgoritm', correct: false },
        { text: 'Bedömning av neurologisk skada', correct: false },
      ],
      explanation: 'Young-Burgess klassificerar bäckenfrakturer efter skademekanism: Lateral Compression, Anterior-Posterior Compression, Vertical Shear, Combined Mechanism.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Young JW Radiology 1986',
    },
    {
      code: '8.7',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad karakteriserar LC (Lateral Compression) typ I?',
      options: [
        { text: 'Ramus pubis-fraktur + sacral impaktionsfraktur på samma sida', correct: true },
        { text: 'Symysfruptur >2.5 cm', correct: false },
        { text: 'Vertikal förskjutning av hemipelvis', correct: false },
        { text: 'Bilateral ramus-fraktur', correct: false },
      ],
      explanation: 'LC-I har en tvärfraktur av ramus pubis med ipsilateral sakral kompression, oftast stabil skada.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Young-Burgess klassifikation',
    },
    {
      code: '8.8',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad karakteriserar LC typ III?',
      options: [
        { text: 'LC-skada ipsilateralt + "open book" kontralateralt (windswept pelvis)', correct: true },
        { text: 'Enkel ramus pubis-fraktur', correct: false },
        { text: 'Vertikal instabilitet', correct: false },
        { text: 'Bilaterala LC-I skador', correct: false },
      ],
      explanation: 'LC-III är "windswept pelvis" med LC-skada på ena sidan och kontralateral APC-typ öppning - hög blödningsrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Young-Burgess klassifikation',
    },
    {
      code: '8.9',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad karakteriserar APC typ I?',
      options: [
        { text: 'Symysdiastas <2.5 cm med intakt posterior ring', correct: true },
        { text: 'Symysdiastas >2.5 cm', correct: false },
        { text: 'Vertikal instabilitet', correct: false },
        { text: 'Komplett posterior ringruptur', correct: false },
      ],
      explanation: 'APC-I har symysdiastas under 2.5 cm med intakta anteriora sacroiliaka ligament - stabil skada.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Young-Burgess klassifikation',
    },
    {
      code: '8.10',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad karakteriserar APC typ II ("open book")?',
      options: [
        { text: 'Symysdiastas >2.5 cm + ruptur av anteriora SI-ligament', correct: true },
        { text: 'Symysdiastas <2.5 cm', correct: false },
        { text: 'Vertikal instabilitet', correct: false },
        { text: 'Stabil posterior ring', correct: false },
      ],
      explanation: 'APC-II är "open book" med symysdiastas >2.5 cm och ruptur av anteriora SI-ligament - stor volymökning och blödningsrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Young-Burgess klassifikation',
    },
    {
      code: '8.11',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad karakteriserar APC typ III?',
      options: [
        { text: 'Komplett ruptur av anteriora OCH posteriora SI-ligament', correct: true },
        { text: 'Endast symysdiastas', correct: false },
        { text: 'Vertikal förskjutning', correct: false },
        { text: 'LC-mönster', correct: false },
      ],
      explanation: 'APC-III har komplett ruptur av samtliga sacroiliaka ligament - rotationsinstabil och högt instabil.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Young-Burgess klassifikation',
    },
    {
      code: '8.12',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad karakteriserar VS (Vertical Shear)?',
      options: [
        { text: 'Vertikal förskjutning av hemipelvis genom kraftig axial belastning', correct: true },
        { text: 'Lateral kompression', correct: false },
        { text: 'Symysdiastas enbart', correct: false },
        { text: 'Stabil fraktur', correct: false },
      ],
      explanation: 'VS-skada har vertikal förskjutning av hela hemipelvis - maximalt instabil med högsta blödningsrisken.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Young-Burgess klassifikation',
    },
    {
      code: '8.13',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ger APC-skador störst blödning?',
      options: [
        { text: 'Bäckenvolymen ökar kraftigt när ringen öppnas anteriort', correct: true },
        { text: 'Fler artärer skadas', correct: false },
        { text: 'Koagulationsrubbning', correct: false },
        { text: 'Mjukdelsskadan är störst', correct: false },
      ],
      explanation: 'APC öppnar bäckenringen och volymen kan öka med flera liter, vilket tillåter stor retroperitoneal blödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Tile M Clin Orthop 1996',
    },
    {
      code: '8.14',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den huvudsakliga blödningskällan vid bäckenfraktur?',
      options: [
        { text: 'Presakrala venplexus och frakturyta (80-90%)', correct: true },
        { text: 'Arteria iliaca interna (80-90%)', correct: false },
        { text: 'Mjukdelsblödning', correct: false },
        { text: 'Benmärgsblödning', correct: false },
      ],
      explanation: 'Majoriteten (80-90%) av blödningen kommer från venösa plexa och frakturytor, endast 10-20% är arteriell.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Huittinen VM Acta Chir Scand 1973',
    },
    {
      code: '8.15',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka artärer kan skadas vid bäckenfraktur?',
      options: [
        { text: 'Grenar från a. iliaca interna (gluteal, pudendal, obturator)', correct: true },
        { text: 'Endast a. femoralis', correct: false },
        { text: 'A. iliaca externa primärt', correct: false },
        { text: 'Aorta', correct: false },
      ],
      explanation: 'Arteriell blödning kommer vanligen från grenar av a. iliaca interna, särskilt superior gluteal, internal pudendal och obturator.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Velmahos GC J Trauma 2000',
    },
    {
      code: '8.16',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Hemodynamiskt instabil patient med bäckenfraktur på akuten. Första mekaniska åtgärd?',
      options: [
        { text: 'Bäckenbälte/circumferentiell kompression', correct: true },
        { text: 'Extern fixation', correct: false },
        { text: 'C-clamp', correct: false },
        { text: 'Angiografi', correct: false },
      ],
      explanation: 'Bäckenbälte är förstahandsåtgärd för snabb mekanisk stabilisering och volymreduktion på akutmottagningen.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.17',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur verkar bäckenbältet för att minska blödning?',
      options: [
        { text: 'Reducerar bäckenvolymen och möjliggör tamponad', correct: true },
        { text: 'Komprimerar artärer direkt', correct: false },
        { text: 'Aktiverar koagulation', correct: false },
        { text: 'Minskar smärta', correct: false },
      ],
      explanation: 'Bäckenbältet stänger bäckenringen och reducerar volymen, vilket tillåter tamponadeffekt av det retroperitoneala utrymmet.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Croce MA J Trauma 2007',
    },
    {
      code: '8.18',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Hur kontrolleras korrekt bäckenbältesplacering?',
      options: [
        { text: 'Bältet ska sitta över trochanter major, ej över crista iliaca', correct: true },
        { text: 'Bältet ska sitta över navelnivå', correct: false },
        { text: 'Placering spelar ingen roll', correct: false },
        { text: 'Så högt som möjligt', correct: false },
      ],
      explanation: 'Placering över trochanter major ger optimal kompression av bäckenringen. Felplacering över crista är ineffektivt.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Spanjersberg WR Injury 2009',
    },
    {
      code: '8.19',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är kontraindikation för bäckenbälte?',
      options: [
        { text: 'LC-typ fraktur med redan stängd bäckenring', correct: true },
        { text: 'APC-skada', correct: false },
        { text: 'VS-skada', correct: false },
        { text: 'Hemodynamisk instabilitet', correct: false },
      ],
      explanation: 'LC-frakturer har redan stängd/komprimerad ring - ytterligare kompression kan förvärra skadan. Dock används bälte ofta initialt tills typ klarlagts.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Tile M Fractures of the Pelvis and Acetabulum',
    },
    {
      code: '8.20',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är massivt transfusionsprotokoll (MTP)?',
      options: [
        { text: 'Balanserad transfusion med erytrocyter:plasma:trombocyter i 1:1:1 ratio', correct: true },
        { text: 'Endast erytrocyttransfusion', correct: false },
        { text: 'Kristalloidresuscitation', correct: false },
        { text: 'Autotransfusion', correct: false },
      ],
      explanation: 'MTP innebär balanserad blodprodukttillförsel (1:1:1) för att behandla traumainducerad koagulopati vid massiv blödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; PROPPR Trial JAMA 2015',
    },
    {
      code: '8.21',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'När aktiveras MTP vid bäckenfraktur?',
      options: [
        { text: 'Hemodynamisk instabilitet trots bäckenbälte och initial resuscitation', correct: true },
        { text: 'Alla bäckenfrakturer', correct: false },
        { text: 'Endast vid öppen bäckenfraktur', correct: false },
        { text: 'Vid Hb <100', correct: false },
      ],
      explanation: 'MTP aktiveras vid pågående hemodynamisk instabilitet (SBT <90, HR >120) trots initiala åtgärder.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.22',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är tranexamsyras (TXA) roll vid bäckenfraktur?',
      options: [
        { text: 'Antifibrinolytikum som minskar blödning om givet inom 3 timmar', correct: true },
        { text: 'Ersätter blodtransfusion', correct: false },
        { text: 'Behandlar koagulopati', correct: false },
        { text: 'Har ingen roll', correct: false },
      ],
      explanation: 'TXA givet inom 3 timmar efter trauma minskar mortalitet vid blödning enligt CRASH-2.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; CRASH-2 Trial Lancet 2010',
    },
    {
      code: '8.23',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Hemodynamiskt instabil bäckenfraktur som ej svarar på bälte och transfusion. Nästa steg?',
      options: [
        { text: 'Preperitoneal packing eller angioembolisering beroende på resurser', correct: true },
        { text: 'Mer kristalloid', correct: false },
        { text: 'Avvakta', correct: false },
        { text: 'Definitiv fixation', correct: false },
      ],
      explanation: 'Vid refraktär hypotension ska preperitoneal packing (snabbast) eller angioembolisering (vid arteriell blödning) utföras.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Burlew CC J Trauma 2017',
    },
    {
      code: '8.24',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är preperitoneal packing?',
      options: [
        { text: 'Kirurgisk packning av retroperitoneala rummet för tamponad', correct: true },
        { text: 'Bukhålepackning', correct: false },
        { text: 'Endovaskulär intervention', correct: false },
        { text: 'Extern kompression', correct: false },
      ],
      explanation: 'Preperitoneal packing innebär packning av det preperitoneala/retroperitoneala utrymmet via kort snitt för direkt tamponad.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Burlew CC J Trauma 2017',
    },
    {
      code: '8.25',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Fördel med preperitoneal packing jämfört med angioembolisering?',
      options: [
        { text: 'Snabbare, kräver ej speciellt team, effektiv mot venös blödning', correct: true },
        { text: 'Behandlar arteriell blödning bättre', correct: false },
        { text: 'Mindre invasivt', correct: false },
        { text: 'Bättre långtidsresultat', correct: false },
      ],
      explanation: 'Preperitoneal packing är snabbt (kan göras av traumakirurg), och effektivt mot venös blödning som är vanligast.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Osborn PM J Trauma 2009',
    },
    {
      code: '8.26',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'När är angioembolisering indicerad vid bäckenfraktur?',
      options: [
        { text: 'Vid misstänkt arteriell blödning, särskilt efter misslyckad packing', correct: true },
        { text: 'Alla instabila bäckenfrakturer', correct: false },
        { text: 'Endast vid öppen fraktur', correct: false },
        { text: 'Före bäckenbälte', correct: false },
      ],
      explanation: 'Angioembolisering är indicerad vid arteriell blödning (kontrastextravasation på CT) eller efter misslyckad packing.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Velmahos GC J Trauma 2000',
    },
    {
      code: '8.27',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är REBOA?',
      options: [
        { text: 'Resuscitative Endovascular Balloon Occlusion of the Aorta', correct: true },
        { text: 'Rapid External Bleeding Occlusion Apparatus', correct: false },
        { text: 'Retroperitoneal Emergency Balloon Occlusion Aid', correct: false },
        { text: 'Regional Embolization and Occlusion Algorithm', correct: false },
      ],
      explanation: 'REBOA är endovaskulär aortaocklusion med ballong för temporär blödningskontroll vid bäcken/bukblödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Morrison JJ Ann Surg 2016',
    },
    {
      code: '8.28',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'I vilken zon placeras REBOA-ballongen vid bäckenblödning?',
      options: [
        { text: 'Zon III (infrarenalt)', correct: true },
        { text: 'Zon I (suprarenalt)', correct: false },
        { text: 'Zon II (pararenal)', correct: false },
        { text: 'I thorax', correct: false },
      ],
      explanation: 'Vid bäckenblödning placeras REBOA i Zon III (infrarenalt, ovan aortabifurkationen) för att bevara njurperfusion.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Morrison JJ Ann Surg 2016',
    },
    {
      code: '8.29',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är C-clamp?',
      options: [
        { text: 'Posterior pelvic clamp för akut mekanisk stabilisering av posterior ring', correct: true },
        { text: 'Typ av bäckenbälte', correct: false },
        { text: 'Endovaskulär device', correct: false },
        { text: 'Extern fixation anteriort', correct: false },
      ],
      explanation: 'C-clamp ger posterior kompression via perkutan applicering över sacrum/SI-led för bättre stabilisering vid VS-skador.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Ganz R Injury 1991',
    },
    {
      code: '8.30',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Patient med APC-III skada och massiv blödning. Vilken definitiv stabilisering?',
      options: [
        { text: 'Anterior extern fixation + posterior fixation (platta eller skruvar)', correct: true },
        { text: 'Endast bäckenbälte långtid', correct: false },
        { text: 'Gips', correct: false },
        { text: 'Ingen stabilisering behövs', correct: false },
      ],
      explanation: 'APC-III kräver stabilisering av både anterior (extern fix eller platta) och posterior ring (SI-skruvar eller platta).',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Tile M Fractures of the Pelvis and Acetabulum',
    },
    {
      code: '8.31',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken undersökning ska göras för att utesluta urethraskada vid bäckenfraktur hos man?',
      options: [
        { text: 'Retrograd urethrografi före KAD-inläggning', correct: true },
        { text: 'Direkt KAD-försök', correct: false },
        { text: 'Cystoskopi', correct: false },
        { text: 'CT-urografi', correct: false },
      ],
      explanation: 'Vid misstanke om urethraskada (blod vid meatus, perinealhematom) ska retrograd urethrografi göras före kateterförsök.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.32',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Kliniska tecken på urethraskada vid bäckenfraktur?',
      options: [
        { text: 'Blod vid meatus, perinealhematom, högt ridande prostata', correct: true },
        { text: 'Endast hematuri', correct: false },
        { text: 'Smärta vid miktion', correct: false },
        { text: 'Inga specifika tecken finns', correct: false },
      ],
      explanation: 'Klassiska tecken på posterior urethraskada inkluderar blod vid meatus, butterfly-hematom i perineum och högt ridande prostata.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.33',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Misstänkt urethraskada vid bäckenfraktur. Behov av urinkateter. Åtgärd?',
      options: [
        { text: 'Suprapubisk kateter', correct: true },
        { text: 'Försiktig KAD-inläggning', correct: false },
        { text: 'Intermittent kateterisering', correct: false },
        { text: 'Avvakta', correct: false },
      ],
      explanation: 'Vid misstänkt urethraskada läggs suprapubisk kateter för att undvika förvärring av skadan.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.34',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur vanlig är urethraskada vid manlig bäckenfraktur?',
      options: [
        { text: '5-10% av alla bäckenfrakturer', correct: true },
        { text: '<1%', correct: false },
        { text: '>50%', correct: false },
        { text: '25-30%', correct: false },
      ],
      explanation: 'Urethraskada förekommer hos 5-10% av män med bäckenfraktur, vanligare vid APC-skador.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Koraitim MM J Urol 1996',
    },
    {
      code: '8.35',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken rectalskada är associerad med öppen bäckenfraktur?',
      options: [
        { text: 'Rektal perforation med kommunikation till frakturen', correct: true },
        { text: 'Hemorrojder', correct: false },
        { text: 'Analinkontinens', correct: false },
        { text: 'Rektalcancer', correct: false },
      ],
      explanation: 'Öppen bäckenfraktur kan ha kommunikation med rektum, vilket kraftigt ökar infektionsrisken.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.36',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Hur undersöks för rektalskada vid bäckenfraktur?',
      options: [
        { text: 'Rektalundersökning med inspektion för blod och sfinktertonus', correct: true },
        { text: 'CT utan specifik undersökning', correct: false },
        { text: 'Rektalskada behöver ej uteslutas', correct: false },
        { text: 'Koloskopi akut', correct: false },
      ],
      explanation: 'Rektalundersökning är obligatorisk vid bäckenfraktur för att påvisa blod, benfragment eller sfinktertonus-påverkan.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.37',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad definierar öppen bäckenfraktur?',
      options: [
        { text: 'Kommunikation mellan fraktur och hud, vagina eller rektum', correct: true },
        { text: 'Synligt ben genom huden', correct: false },
        { text: 'Blödning från perineum', correct: false },
        { text: 'Instabil fraktur', correct: false },
      ],
      explanation: 'Öppen bäckenfraktur har kommunikation med yttre miljön via hud, vagina eller rektum - mycket hög mortalitet.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Jones AL J Orthop Trauma 1997',
    },
    {
      code: '8.38',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är mortaliteten vid öppen bäckenfraktur?',
      options: [
        { text: '30-50%', correct: true },
        { text: '<5%', correct: false },
        { text: '5-10%', correct: false },
        { text: '>90%', correct: false },
      ],
      explanation: 'Öppen bäckenfraktur har mortalitet på 30-50% på grund av massiv blödning och hög infektionsrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Jones AL J Orthop Trauma 1997',
    },
    {
      code: '8.39',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Patient med öppen bäckenfraktur (perinealsår). Initial åtgärd?',
      options: [
        { text: 'Blödningskontroll, antibiotika, tetanus, avledande stomi övervägs', correct: true },
        { text: 'Endast bäckenbälte', correct: false },
        { text: 'Definitiv fixation akut', correct: false },
        { text: 'Avvakta till stabil', correct: false },
      ],
      explanation: 'Öppen bäckenfraktur kräver aggressiv blödningskontroll, bred antibiotika, och ofta avledande stomi vid rektumskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Jones AL J Orthop Trauma 1997',
    },
    {
      code: '8.40',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är avledande stomi indicerad vid öppen bäckenfraktur med rektumskada?',
      options: [
        { text: 'Minska fekal kontaminering och infektionsrisk', correct: true },
        { text: 'Förbättra nutrition', correct: false },
        { text: 'Minska blödning', correct: false },
        { text: 'Underlätta mobilisering', correct: false },
      ],
      explanation: 'Avledande stomi förhindrar fortsatt fekal kontaminering av frakturen/såret och minskar sepsisrisk.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Grotz MR Injury 2005',
    },
    {
      code: '8.41',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken neurologisk skada är vanligast vid bäckenfraktur?',
      options: [
        { text: 'Skada på L5/S1-rötter och lumbosacrala plexus', correct: true },
        { text: 'Ryggmärgsskada', correct: false },
        { text: 'N. femoralis-skada', correct: false },
        { text: 'Peroneuspares', correct: false },
      ],
      explanation: 'Lumbosacralplexus och L5/S1-rötter är sårbara vid bäckenfraktur, särskilt VS-skador.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Tile M Fractures of the Pelvis and Acetabulum',
    },
    {
      code: '8.42',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Patient med VS-bäckenfraktur har fotsläpp. Vilken struktur är skadad?',
      options: [
        { text: 'L5-roten eller peroneusgrenen av ischiasnerven', correct: true },
        { text: 'Tibialis posterior', correct: false },
        { text: 'Ryggmärgen', correct: false },
        { text: 'N. femoralis', correct: false },
      ],
      explanation: 'Fotsläpp vid bäckenfraktur orsakas oftast av L5-rotskada eller skada på n. peroneus (del av ischiasnerven).',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Tile M Fractures of the Pelvis and Acetabulum',
    },
    {
      code: '8.43',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken bilddiagnostik är förstahandsval vid hemodynamiskt stabil bäckenfraktur?',
      options: [
        { text: 'CT bäcken med kontrast', correct: true },
        { text: 'Konventionell röntgen endast', correct: false },
        { text: 'MR', correct: false },
        { text: 'Ultraljud', correct: false },
      ],
      explanation: 'CT med kontrast ger detaljerad frakturklassifikation och kan påvisa aktiv blödning (kontrastextravasation).',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.44',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Hemodynamiskt instabil patient med bäckenfraktur. Ska CT göras?',
      options: [
        { text: 'Endast om patienten stabiliseras tillfälligt, annars direkt intervention', correct: true },
        { text: 'Alltid innan intervention', correct: false },
        { text: 'Aldrig', correct: false },
        { text: 'Endast MR är indicerat', correct: false },
      ],
      explanation: 'Instabila patienter ska stabiliseras först (bälte, MTP). CT endast om tillfällig stabilisering uppnås, annars direkt till intervention.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; ATLS 10th ed',
    },
    {
      code: '8.45',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad indikerar "blush" på CT vid bäckenfraktur?',
      options: [
        { text: 'Aktiv arteriell blödning (kontrastextravasation)', correct: true },
        { text: 'Venös blödning', correct: false },
        { text: 'Hematom', correct: false },
        { text: 'Mjukdelsskada', correct: false },
      ],
      explanation: 'Kontrastblush på CT indikerar aktiv arteriell extravasation och är indikation för angioembolisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Velmahos GC J Trauma 2000',
    },
    {
      code: '8.46',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Tile-klassifikationen?',
      options: [
        { text: 'Stabilitetsbaserad klassifikation (A=stabil, B=rotationsinstabil, C=rotations+vertikalinstabil)', correct: true },
        { text: 'Mekanismbaserad klassifikation', correct: false },
        { text: 'Blödningsriskskala', correct: false },
        { text: 'Behandlingsalgoritm', correct: false },
      ],
      explanation: 'Tile klassificerar bäckenfrakturer efter mekanisk stabilitet: A=stabil, B=rotationsinstabil, C=komplett instabil.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Tile M Clin Orthop 1996',
    },
    {
      code: '8.47',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Tile C-fraktur. Vilken stabilitet har den?',
      options: [
        { text: 'Rotations- och vertikalt instabil, kräver operativ fixation', correct: true },
        { text: 'Stabil, konservativ behandling', correct: false },
        { text: 'Endast rotationsinstabil', correct: false },
        { text: 'Kan behandlas med bäckenbälte enbart', correct: false },
      ],
      explanation: 'Tile C har komplett instabilitet (posterior ringruptur) och kräver nästan alltid operativ stabilisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Tile M Clin Orthop 1996',
    },
    {
      code: '8.48',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken skada bör misstänkas vid "Morel-Lavallée lesion"?',
      options: [
        { text: 'Degloving-skada med subkutan vätskeansamling över bäckenet', correct: true },
        { text: 'Urethraskada', correct: false },
        { text: 'Rektalskada', correct: false },
        { text: 'Nervskada', correct: false },
      ],
      explanation: 'Morel-Lavallée är en sluten degloving-skada med hematom/serom mellan fascia och subkutis över trochantern/bäckenet.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Morel-Lavallée A 1853; Hak DJ J Orthop Trauma 1997',
    },
    {
      code: '8.49',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är tidig mobilisering viktig efter bäckenfraktur?',
      options: [
        { text: 'Minska komplikationer (trombos, pneumoni, trycksår)', correct: true },
        { text: 'Snabbare frakturläkning', correct: false },
        { text: 'Bättre smärtkontroll', correct: false },
        { text: 'Tidig mobilisering rekommenderas ej', correct: false },
      ],
      explanation: 'Tidig mobilisering minskar immobiliseringskomplikationer som DVT, lungembol, pneumoni och trycksår.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Tile M Fractures of the Pelvis and Acetabulum',
    },
    {
      code: '8.50',
      chapterNumber: 8,
      bloomLevel: 'ANALYSIS',
      question: 'Vilken faktor har störst betydelse för mortalitet vid bäckenfraktur?',
      options: [
        { text: 'Hemodynamisk instabilitet och associerade skador', correct: true },
        { text: 'Frakturtyp isolerat', correct: false },
        { text: 'Patientens ålder', correct: false },
        { text: 'Tid till kirurgi', correct: false },
      ],
      explanation: 'Hemodynamisk instabilitet och associerade skador (buk, thorax) är de viktigaste prognostiska faktorerna vid bäckenfraktur.',
      reference: 'B-ORTIM Kursbok, Kapitel 8; Demetriades D J Trauma 2002',
    },

    // Kapitel 9: Extra frågor
    {
      code: '9.3',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur ska ett amputat förvaras korrekt för transport?',
      options: [
        { text: 'Fuktig kompress, plastpåse, kylväska med is (ej direkt kontakt)', correct: true },
        { text: 'Direkt i is', correct: false },
        { text: 'I rumstemperatur', correct: false },
        { text: 'I koksaltlösning', correct: false },
      ],
      explanation: 'Amputat lindas i fuktig kompress, läggs i plastpåse, och placeras i kylväska med is utan direkt kontakt (undvik frostskada).',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.4',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Tumamputat hos 35-åring. Ischemitid hittills 4 timmar. Är replantation möjlig?',
      options: [
        { text: 'Ja, tumme har hög prioritet och finger tolererar längre ischemi', correct: true },
        { text: 'Nej, för lång ischemitid', correct: false },
        { text: 'Endast om patienten är ung', correct: false },
        { text: 'Replantation är aldrig indicerat', correct: false },
      ],
      explanation: 'Fingrar (utan muskel) tolererar längre ischemi (upp till 12h kall). Tumme har högsta prioritet för replantation pga funktion.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.5',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka faktorer talar mot replantationsförsök?',
      options: [
        { text: 'Svår krossning, multilevel-skada, lång varm ischemitid', correct: true },
        { text: 'Patientens ålder över 40', correct: false },
        { text: 'Dominant hand', correct: false },
        { text: 'Skada på pekfinger', correct: false },
      ],
      explanation: 'Relativa kontraindikationer inkluderar crush-skada, multilevel-amputationer, och förlängd varm ischemi. Ålder ensamt är ej kontraindikation.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.6',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är skillnaden mellan traumatisk amputation och kirurgisk amputation?',
      options: [
        { text: 'Traumatisk är ofrivillig skada, kirurgisk är planerad behandling', correct: true },
        { text: 'Traumatisk är alltid ren skärskada', correct: false },
        { text: 'Kirurgisk kräver alltid replantation', correct: false },
        { text: 'Ingen klinisk skillnad', correct: false },
      ],
      explanation: 'Traumatisk amputation är en oplanerad förlust av kroppsdel genom yttre våld, medan kirurgisk amputation är planerad behandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.7',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka typer av traumatiska amputationer finns?',
      options: [
        { text: 'Guillotine (ren), crush (krossning), avulsion (utslitning)', correct: true },
        { text: 'Endast guillotine och crush', correct: false },
        { text: 'Endast partial och komplett', correct: false },
        { text: 'Arteriell och venös', correct: false },
      ],
      explanation: 'Traumatiska amputationer klassificeras efter mekanism: guillotine (skärande), crush (krossande) och avulsion (utdragande).',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.8',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken amputationstyp har bäst prognos för replantation?',
      options: [
        { text: 'Guillotine-amputation (ren skärskada)', correct: true },
        { text: 'Crush-amputation', correct: false },
        { text: 'Avulsionsamputation', correct: false },
        { text: 'Alla har samma prognos', correct: false },
      ],
      explanation: 'Guillotine-amputationer har skarpaste vävnadsränder och minst zona contusus, vilket ger bäst förutsättningar för replantation.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.9',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför har avulsionsamputationer sämst replantationsprognos?',
      options: [
        { text: 'Kärl och nerver är utdragna med skada på flera nivåer', correct: true },
        { text: 'Mer blödning', correct: false },
        { text: 'Längre ischemitid', correct: false },
        { text: 'Svårare att hitta amputatet', correct: false },
      ],
      explanation: 'Vid avulsion dras kärl och nerver ut ur sina fästen med intima-skador och nervskada på flera nivåer (multilevel injury).',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.10',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är kall ischemitid?',
      options: [
        { text: 'Tid amputatet förvaras kylt utan blodcirkulation', correct: true },
        { text: 'Tid utan kylning', correct: false },
        { text: 'Tid i rumstemperatur', correct: false },
        { text: 'Operationstid', correct: false },
      ],
      explanation: 'Kall ischemitid är tiden från amputation till reperfusion då amputatet förvaras kylt (<4°C).',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.11',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är maximal kall ischemitid för finger utan muskel?',
      options: [
        { text: '12-24 timmar', correct: true },
        { text: '6 timmar', correct: false },
        { text: '3 timmar', correct: false },
        { text: '48 timmar', correct: false },
      ],
      explanation: 'Finger utan muskelinnehåll tolererar 12-24 timmars kall ischemi tack vare lägre metabolisk aktivitet.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Tamai S Orthop Clin North Am 1981',
    },
    {
      code: '9.12',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är maximal kall ischemitid för amputation med muskel (t.ex. överarm)?',
      options: [
        { text: '6-8 timmar', correct: true },
        { text: '12-24 timmar', correct: false },
        { text: '3 timmar', correct: false },
        { text: '48 timmar', correct: false },
      ],
      explanation: 'Amputationer med muskel har kortare tolerans (6-8h kall) pga muskelns högre metaboliska krav.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Tamai S Orthop Clin North Am 1981',
    },
    {
      code: '9.13',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Underarmsamputation med 3h varm ischemi. Kan man kyla nu för att förlänga tiden?',
      options: [
        { text: 'Ja, men varm ischemi har redan orsakat skada som ej reverseras', correct: true },
        { text: 'Nej, det är för sent att kyla', correct: false },
        { text: 'Ja, och all skada kan reverseras', correct: false },
        { text: 'Kylning har ingen effekt', correct: false },
      ],
      explanation: 'Kylning fördröjer ytterligare skada men reverserar inte redan uppkommen varm ischemisk skada.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.14',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Varför är tummen prioriterad för replantation?',
      options: [
        { text: 'Tummen utgör 40-50% av handens funktion', correct: true },
        { text: 'Tummen är lättast att replantela', correct: false },
        { text: 'Tummen har kortast ischemitolerans', correct: false },
        { text: 'Kosmetiska skäl enbart', correct: false },
      ],
      explanation: 'Tummen är avgörande för greppfunktion (pinch grip) och utgör en stor del av handens funktionella kapacitet.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Morrison WA J Hand Surg 1978',
    },
    {
      code: '9.15',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka fingrar har relativt lägre replantationsprioritet hos vuxna?',
      options: [
        { text: 'Enstaka finger-amputationer proximalt om FDS-insertion (zon II)', correct: true },
        { text: 'Tumme', correct: false },
        { text: 'Multipla fingrar', correct: false },
        { text: 'Alla fingrar har samma prioritet', correct: false },
      ],
      explanation: 'Enstaka finger proximalt i zon II har sämre funktionellt resultat pga stelhet och kan ge bättre funktion utan replantation.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Urbaniak JR Hand Clin 1985',
    },
    {
      code: '9.16',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "absolute indications" för replantation?',
      options: [
        { text: 'Barn, tumme, multipla fingrar, handledsnivå eller proximalt', correct: true },
        { text: 'Endast tumme', correct: false },
        { text: 'Alla amputationer', correct: false },
        { text: 'Endast guillotine-skador', correct: false },
      ],
      explanation: 'Absoluta indikationer inkluderar alla pediatriska amputationer, tumme, multipla fingrar och amputationer proximalt om handled.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Morrison WA J Hand Surg 1978',
    },
    {
      code: '9.17',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka relativa kontraindikationer finns för replantation?',
      options: [
        { text: 'Multilevel-skada, massiv crushing, förlängd varm ischemi, svår sjukdom', correct: true },
        { text: 'Ålder över 50', correct: false },
        { text: 'Yrke som kräver manuellt arbete', correct: false },
        { text: 'Höger-hänthet vid vänsterhandsskada', correct: false },
      ],
      explanation: 'Relativa kontraindikationer inkluderar multilevel-skador, grav crushing, lång varm ischemi och allvarlig komorbiditet.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.18',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Initial handläggning av stump vid amputation?',
      options: [
        { text: 'Direkt tryck, tryckförband, elevation - tourniquet vid okontrollerad blödning', correct: true },
        { text: 'Alltid tourniquet direkt', correct: false },
        { text: 'Suturering av blödande kärl på akuten', correct: false },
        { text: 'Låt blöda fritt', correct: false },
      ],
      explanation: 'Stumpblödning kontrolleras primärt med direkt tryck och tryckförband. Tourniquet används vid okontrollerad blödning.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; TCCC Guidelines',
    },
    {
      code: '9.19',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Varför ska man INTE klämma av blödande kärl med peang på stump?',
      options: [
        { text: 'Risk för ytterligare kärlskada som försvårar replantation', correct: true },
        { text: 'Det är ineffektivt', correct: false },
        { text: 'Smärtsamt för patienten', correct: false },
        { text: 'Peangklämning rekommenderas faktiskt', correct: false },
      ],
      explanation: 'Peangklämning skadar kärlväggen och försvårar mikrovaskulär anastomos vid replantation.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.20',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Hur ska amputatet transporteras?',
      options: [
        { text: 'Fuktig kompress → plastpåse → isvatten i yttre behållare', correct: true },
        { text: 'Direkt i is', correct: false },
        { text: 'I vatten', correct: false },
        { text: 'I torr kompress', correct: false },
      ],
      explanation: 'Amputat i fuktig kompress, sedan plastpåse, sedan i behållare med is/isvatten. Undvik direkt iskontakt (frostskada) och vattenkontakt (maceration).',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.21',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska amputatet inte läggas direkt i is?',
      options: [
        { text: 'Risk för frostskada som skadar vävnaden irreversibelt', correct: true },
        { text: 'Det kyls för snabbt', correct: false },
        { text: 'Isen smälter', correct: false },
        { text: 'Det är ej kostnadseffektivt', correct: false },
      ],
      explanation: 'Direkt iskontakt (0°C) orsakar kristallbildning och frostskada i celler. Optimal temperatur är 4°C.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.22',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska amputatet inte läggas i vatten eller koksalt?',
      options: [
        { text: 'Vävnadsmaceration och osmotisk cellskada', correct: true },
        { text: 'Infektion', correct: false },
        { text: 'Missfärgning', correct: false },
        { text: 'Vatten är faktiskt rekommenderat', correct: false },
      ],
      explanation: 'Nedsänkning i vätska orsakar osmotisk skada och vävnadsmaceration som försämrar replantationsresultat.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.23',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Amputat hittades ej initialt. Hittas 2 timmar senare i marken. Vad gäller?',
      options: [
        { text: 'Skölj försiktigt, kyl och transportera - replantation kan fortfarande vara möjlig', correct: true },
        { text: 'För sent för replantation', correct: false },
        { text: 'Amputatet är kontaminerat och kan ej användas', correct: false },
        { text: 'Frys amputatet', correct: false },
      ],
      explanation: 'Även försenat funna amputat ska förvaras korrekt och bedömas. Replantation kan vara möjlig, särskilt för fingrar.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.24',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "ring avulsion injury"?',
      options: [
        { text: 'Fingerskada orsakad av ring som dras av - ofta med kärl/nervavulsion', correct: true },
        { text: 'Amputation genom ring-format föremål', correct: false },
        { text: 'Cirkulär sårskada', correct: false },
        { text: 'Fraktur genom led', correct: false },
      ],
      explanation: 'Ring avulsion är en specifik skadetyp där ring fastnar och dras av, ofta med avulsion av digitala kärl och nerver.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Urbaniak JR J Hand Surg 1981',
    },
    {
      code: '9.25',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur klassificeras ring avulsion injuries?',
      options: [
        { text: 'Urbaniak: I (cirkulation intakt), II (cirkulation utslagen), III (komplett avulsion)', correct: true },
        { text: 'Gustilo-klassifikation', correct: false },
        { text: 'AO-klassifikation', correct: false },
        { text: 'Ingen specifik klassifikation finns', correct: false },
      ],
      explanation: 'Urbaniak klassifikation: I=mjukdelsskada med intakt cirkulation, II=cirkulation utslagen, III=komplett degloving/avulsion.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Urbaniak JR J Hand Surg 1981',
    },
    {
      code: '9.26',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är subtotal amputation?',
      options: [
        { text: 'Kroppsdel hänger kvar med brygga av vävnad men saknar cirkulation', correct: true },
        { text: 'Delvis avskuren vävnad med intakt cirkulation', correct: false },
        { text: 'Komplett amputation', correct: false },
        { text: 'Fraktur utan mjukdelsskada', correct: false },
      ],
      explanation: 'Subtotal amputation har vävnadsbrygga kvar men cirkulationen är helt utslagen - kräver revaskularisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.27',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Subtotal finger-amputation med vitalt finger men endast hudbrygga. Åtgärd?',
      options: [
        { text: 'Handläggs som komplett amputation - behöver vaskulär rekonstruktion', correct: true },
        { text: 'Hudbryggan räcker för cirkulation', correct: false },
        { text: 'Amputera fullständigt', correct: false },
        { text: 'Endast immobilisering', correct: false },
      ],
      explanation: 'Även om hud finns kvar kan fingret vara devaskulariserat och kräva mikrovaskulär rekonstruktion.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.28',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken operationsteknik används vid fingerreplantation?',
      options: [
        { text: 'Benfixation → senorrafier → artär → nerv → ven → hud', correct: true },
        { text: 'Endast kärlsuturer', correct: false },
        { text: 'Ven före artär', correct: false },
        { text: 'Endast benfixation', correct: false },
      ],
      explanation: 'Strukturerad sekvens: Ben (stabilitet) → Böjsenor → Sträcksenor → Artär → Nerver → Vener → Hud.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Tamai S Orthop Clin North Am 1981',
    },
    {
      code: '9.29',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför sutureras artärer före vener vid replantation?',
      options: [
        { text: 'Arteriell inflow ger oxygenering och "flushar" ut stagnerat blod', correct: true },
        { text: 'Artärer är lättare att sy', correct: false },
        { text: 'Vener behöver inte sutureras', correct: false },
        { text: 'Vener sutureras faktiskt först', correct: false },
      ],
      explanation: 'Arteriell reperfusion först ger syre och spolar ut metaboliter innan venös dränage etableras.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.30',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur många vener behöver sutureras vid fingerreplantation?',
      options: [
        { text: 'Minst två vener per artär för adekvat dränage', correct: true },
        { text: 'En ven räcker', correct: false },
        { text: 'Vener behöver ej sutureras', correct: false },
        { text: 'Alltid fyra vener', correct: false },
      ],
      explanation: 'Två vener per artär ger adekvat venöst återflöde och minskar risken för venös kongestion.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.31',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken komplikation är vanligast efter fingerreplantation?',
      options: [
        { text: 'Venös trombos/kongestion', correct: true },
        { text: 'Arteriell trombos', correct: false },
        { text: 'Infektion', correct: false },
        { text: 'Frakturkomplikation', correct: false },
      ],
      explanation: 'Venös trombos är vanligare än arteriell och leder till kongestion. Viktig att monitorera och intervenera tidigt.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.32',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Tecken på venös kongestion postoperativt efter replantation?',
      options: [
        { text: 'Mörkt röd/blåviolett missfärgning, snabb cap refill, turgid finger', correct: true },
        { text: 'Blek, kall, utebliven cap refill', correct: false },
        { text: 'Normal färg', correct: false },
        { text: 'Endast smärta', correct: false },
      ],
      explanation: 'Venös stasis ger mörk färg, turgiditet och snabb cap refill (<1s) pga högt venöst tryck.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.33',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Tecken på arteriell insufficiens postoperativt efter replantation?',
      options: [
        { text: 'Blek, kall, saknad/långsam cap refill, turgor låg', correct: true },
        { text: 'Mörk röd färg', correct: false },
        { text: 'Svullnad och värme', correct: false },
        { text: 'Ökad blödning', correct: false },
      ],
      explanation: 'Arteriell insufficiens ger blek, kall extremitet med långsam eller utebliven kapillär återfyllnad.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.34',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Akut åtgärd vid misstänkt venös kongestion efter replantation?',
      options: [
        { text: 'Ta bort strikturerade förband, medicinsk blodigelbehandling, ev. reoperation', correct: true },
        { text: 'Avvakta', correct: false },
        { text: 'Mer kompression', correct: false },
        { text: 'Antibiotika', correct: false },
      ],
      explanation: 'Vid venös kongestion: släpp förband, medicinska blodiglar för venös avlastning, överväg reoperation för trombektomi.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.35',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Varför används medicinska blodiglar efter replantation?',
      options: [
        { text: 'Skapar venös avlastning genom blodsugning och hirudin (antikoagulant)', correct: true },
        { text: 'Antibakteriell effekt', correct: false },
        { text: 'Smärtlindring', correct: false },
        { text: 'Stimulerar kärlnybildning', correct: false },
      ],
      explanation: 'Blodiglar suger ut stagnerat blod och utsöndrar hirudin som ger lokal antikoagulation vid venös insufficiens.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Derganc M Br J Plast Surg 1960',
    },
    {
      code: '9.36',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken antibiotikaprofylax ges vid blodigelbehandling?',
      options: [
        { text: 'Ciprofloxacin eller trimetoprim-sulfa pga Aeromonas hydrophila', correct: true },
        { text: 'Penicillin', correct: false },
        { text: 'Ingen behövs', correct: false },
        { text: 'Cefalosporin', correct: false },
      ],
      explanation: 'Blodiglar bär Aeromonas hydrophila i tarmen som kan orsaka infektion. Ciprofloxacin eller TMP-SMX ger täckning.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Lineaweaver W Ann Plast Surg 1992',
    },
    {
      code: '9.37',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är överlevnadsfrekvens för fingerreplantation generellt?',
      options: [
        { text: '80-90% vid optimala förhållanden', correct: true },
        { text: '20-30%', correct: false },
        { text: '100%', correct: false },
        { text: '50%', correct: false },
      ],
      explanation: 'Modern mikrokirurgi ger 80-90% överlevnad vid fingerreplantation under gynnsamma omständigheter.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Tamai S Orthop Clin North Am 1981',
    },
    {
      code: '9.38',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är överlevnadsfrekvens för major limb replantation (arm/ben)?',
      options: [
        { text: '70-80%', correct: true },
        { text: '95%', correct: false },
        { text: '30%', correct: false },
        { text: 'Replantation görs ej på major limbs', correct: false },
      ],
      explanation: 'Major limb replantation har något lägre överlevnad (70-80%) pga mer muskel och kortare ischemitolerans.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.39',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka faktorer påverkar funktionellt resultat efter replantation?',
      options: [
        { text: 'Skadans nivå, mekanism, nervåterhämtning, patientens compliance med rehab', correct: true },
        { text: 'Endast ischemitid', correct: false },
        { text: 'Endast kirurgens erfarenhet', correct: false },
        { text: 'Endast patientens ålder', correct: false },
      ],
      explanation: 'Funktionellt resultat beror på skadenivå, skademekanism, nervregeneration och patientmedverkan i rehabilitering.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.40',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär köldintolerans efter replantation?',
      options: [
        { text: 'Ökad känslighet för kyla med smärta/domningar - vanlig långtidskomplikation', correct: true },
        { text: 'Frostskada', correct: false },
        { text: 'Infektion', correct: false },
        { text: 'Normal sensation', correct: false },
      ],
      explanation: 'Köldintolerans är mycket vanligt efter replantation (>50%) pga störd vaskulär reglering och nervskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.41',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: '55-åring med DM, crush-amputation av pekfinger. Varm ischemi 8h. Replantation?',
      options: [
        { text: 'Relativ kontraindikation - diskutera amputation och stumpslutning', correct: true },
        { text: 'Absolut indikation', correct: false },
        { text: 'Vänta och se', correct: false },
        { text: 'Endast benfixation', correct: false },
      ],
      explanation: 'Multipla ogynnsamma faktorer (singel finger, crush, lång varm ischemi, DM) talar för primär amputation istället.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.42',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: '8-årig pojke med guillotine-amputation av pekfinger. Kall ischemi 5h. Replantation?',
      options: [
        { text: 'Ja - barn har alltid replantationsindikation', correct: true },
        { text: 'Nej - singel finger', correct: false },
        { text: 'Nej - för lång ischemitid', correct: false },
        { text: 'Avvakta', correct: false },
      ],
      explanation: 'Alla pediatriska amputationer har replantationsindikation oavsett nivå pga utmärkt läkning och adaptation.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.43',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "completion amputation"?',
      options: [
        { text: 'Kirurgisk amputation när replantation inte är möjlig eller misslyckats', correct: true },
        { text: 'Delvis amputation', correct: false },
        { text: 'Traumatisk amputation', correct: false },
        { text: 'Revaskularisering', correct: false },
      ],
      explanation: 'Completion amputation innebär att man kirurgiskt färdigställer amputationen när replantation är kontraindicerad eller misslyckas.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.44',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka faktorer är viktiga vid stumpslutning efter amputation?',
      options: [
        { text: 'Bevara längd, god mjukdelstäckning, nervresektion, atraumatisk teknik', correct: true },
        { text: 'Endast kosmetik', correct: false },
        { text: 'Så kort som möjligt', correct: false },
        { text: 'Endast hudslutning', correct: false },
      ],
      explanation: 'God stump kräver bevarad längd för funktion, mjukdelstäckning för protesanpassning, och nervresektion för att undvika neurom.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.45',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Varför sker nervresektion proximalt vid stumpslutning?',
      options: [
        { text: 'Förhindra smärtsamt neurom i belastningszon', correct: true },
        { text: 'Minska blödning', correct: false },
        { text: 'Förbättra läkning', correct: false },
        { text: 'Nervresektion görs ej', correct: false },
      ],
      explanation: 'Nerven dras ut och skärs av proximalt så att det oundvikliga neuromet bildas utanför tryckbelastade områden.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.46',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är fantomsmärta?',
      options: [
        { text: 'Upplevelse av smärta i amputerad kroppsdel', correct: true },
        { text: 'Stumpsmärta', correct: false },
        { text: 'Infektion i stump', correct: false },
        { text: 'Blödning från stump', correct: false },
      ],
      explanation: 'Fantomsmärta är smärtupplevelse projicerad till den saknade extremiteten - vanligt efter amputation.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.47',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur vanlig är fantomsmärta efter amputation?',
      options: [
        { text: '60-80% upplever det någon gång', correct: true },
        { text: '<10%', correct: false },
        { text: '100%', correct: false },
        { text: 'Endast hos äldre', correct: false },
      ],
      explanation: 'Majoriteten av amputerade upplever fantomsmärta i varierande grad, ofta avtagande med tiden.',
      reference: 'B-ORTIM Kursbok, Kapitel 9; Flor H Lancet Neurol 2002',
    },
    {
      code: '9.48',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken rehabilitering behövs efter handamputation?',
      options: [
        { text: 'Arbetsterapi, rörelseträning, eventuell protes, psykologiskt stöd', correct: true },
        { text: 'Endast fysioterapi', correct: false },
        { text: 'Ingen rehab behövs', correct: false },
        { text: 'Endast protesutprovning', correct: false },
      ],
      explanation: 'Multidisciplinär rehabilitering med arbetsterapi, rörelseträning, protesutprovning och psykologiskt stöd.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.49',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är reperfusionssyndrom vid major limb replantation?',
      options: [
        { text: 'Systemisk påverkan av metaboliter vid reperfusion - kan ge njursvikt, arytmi', correct: true },
        { text: 'Lokal svullnad', correct: false },
        { text: 'Infektion', correct: false },
        { text: 'Fördröjd läkning', correct: false },
      ],
      explanation: 'Reperfusionssyndrom vid major replantation kan ge hyperkalemi, myoglobinuri, metabol acidos och multiorgansvikt.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: '9.50',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Profylax mot reperfusionssyndrom vid major limb replantation?',
      options: [
        { text: 'Riklig vätska, bikarbonat, följ K+ och myoglobin, överväg shunting före reperfusion', correct: true },
        { text: 'Endast antibiotika', correct: false },
        { text: 'Ingen profylax behövs', correct: false },
        { text: 'Steroider', correct: false },
      ],
      explanation: 'Förebygg reperfusionsskada med vätskeresuscitation, urin-alkalisering, elektrolytmonitorering och eventuell temporär shunting.',
      reference: 'B-ORTIM Kursbok, Kapitel 9',
    },

    // Kapitel 10: Extra frågor
    {
      code: '10.3',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken Salter-Harris-typ har sämst prognos?',
      options: [
        { text: 'Typ V (kompressionsskada av tillväxtzonen)', correct: true },
        { text: 'Typ I', correct: false },
        { text: 'Typ II', correct: false },
        { text: 'Typ III', correct: false },
      ],
      explanation: 'Salter-Harris V är en kompressionsskada av fysen som ofta ger tillväxtstörning. Den är svår att diagnostisera initialt.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Salter-Harris klassifikation',
    },
    {
      code: '10.4',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: '7-årigt barn med suprakondylär humerusfraktur. Vilken komplikation måste uteslutas akut?',
      options: [
        { text: 'Skada på a. brachialis', correct: true },
        { text: 'Infektion', correct: false },
        { text: 'Pseudoartros', correct: false },
        { text: 'Tillväxtstörning', correct: false },
      ],
      explanation: 'Suprakondylär humerusfraktur hos barn har hög risk för a. brachialis-skada och kompartmentsyndrom. Kontrollera puls och distal cirkulation!',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.5',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är pediatriska frakturer annorlunda än vuxnas?',
      options: [
        { text: 'Tillväxtzonen (fysen) kan skadas och ge tillväxtstörningar', correct: true },
        { text: 'Barns ben läker långsammare', correct: false },
        { text: 'Barn får aldrig öppna frakturer', correct: false },
        { text: 'Smärtupplevelsen är mindre hos barn', correct: false },
      ],
      explanation: 'Barn har öppna fyser som kan skadas. Fraktur genom fysen kan ge tillväxtstörning. Dessutom har barn större remodellering.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.6',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är fysen (epifysplattan)?',
      options: [
        { text: 'Tillväxtzon av brosk mellan epifys och metafys', correct: true },
        { text: 'Benhinnan', correct: false },
        { text: 'Ledkapsel', correct: false },
        { text: 'Ligament', correct: false },
      ],
      explanation: 'Fysen (growth plate) är en broskzon som ansvarar för longitudinell bentillväxt hos barn.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.7',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'I vilken ålder stängs fyserna typiskt?',
      options: [
        { text: '14-18 år (varierar mellan kön och skelettdel)', correct: true },
        { text: '8-10 år', correct: false },
        { text: '20-25 år', correct: false },
        { text: 'Fyserna stängs aldrig helt', correct: false },
      ],
      explanation: 'Fyserna stängs vanligen mellan 14-18 år. Flickor typiskt 2 år tidigare än pojkar. Distala radius stängs sist.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.8',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Beskriv Salter-Harris typ I.',
      options: [
        { text: 'Fraktur genom fysen utan ben-involvering', correct: true },
        { text: 'Fraktur genom fysen och metafysen', correct: false },
        { text: 'Fraktur genom fysen och epifysen', correct: false },
        { text: 'Kompressionsskada', correct: false },
      ],
      explanation: 'SH-I: Separering genom fysen utan fraktur i epifys eller metafys. Ofta svår att se på röntgen.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Salter RB J Bone Joint Surg 1963',
    },
    {
      code: '10.9',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Beskriv Salter-Harris typ II.',
      options: [
        { text: 'Fraktur genom fysen med metafysärt fragment (Thurston-Holland)', correct: true },
        { text: 'Fraktur genom fysen och epifysen', correct: false },
        { text: 'Endast genom epifysen', correct: false },
        { text: 'Kompressionsskada', correct: false },
      ],
      explanation: 'SH-II är vanligast (75%). Frakturen går genom fysen och ut genom metafysen med triangelformat fragment.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Salter RB J Bone Joint Surg 1963',
    },
    {
      code: '10.10',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Beskriv Salter-Harris typ III.',
      options: [
        { text: 'Fraktur genom fysen och epifysen in i leden', correct: true },
        { text: 'Fraktur genom fysen och metafysen', correct: false },
        { text: 'Endast genom fysen', correct: false },
        { text: 'Kompressionsskada', correct: false },
      ],
      explanation: 'SH-III: Intraartikulär fraktur genom fysen och epifysen. Kräver noggrann reposition pga ledinvolvering.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Salter RB J Bone Joint Surg 1963',
    },
    {
      code: '10.11',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Beskriv Salter-Harris typ IV.',
      options: [
        { text: 'Fraktur genom epifys, fys och metafys', correct: true },
        { text: 'Endast genom fysen', correct: false },
        { text: 'Endast genom metafysen', correct: false },
        { text: 'Kompressionsskada', correct: false },
      ],
      explanation: 'SH-IV: Frakturlinjen går genom alla tre (epifys, fys, metafys). Hög risk för tillväxtstörning.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Salter RB J Bone Joint Surg 1963',
    },
    {
      code: '10.12',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Beskriv Salter-Harris typ V.',
      options: [
        { text: 'Kompressionsskada av fysen utan synlig fraktur', correct: true },
        { text: 'Fraktur genom alla lager', correct: false },
        { text: 'Avulsion', correct: false },
        { text: 'Öppen fysskada', correct: false },
      ],
      explanation: 'SH-V är en crush-skada av fysen. Ofta ej synlig på röntgen initialt, diagnostiseras retrospektivt vid tillväxtstörning.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Salter RB J Bone Joint Surg 1963',
    },
    {
      code: '10.13',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är Salter-Harris typ V svår att diagnostisera?',
      options: [
        { text: 'Ingen synlig fraktulinje - endast kompressionsskada av fysen', correct: true },
        { text: 'Alltid dolt av mjukdelssvullnad', correct: false },
        { text: 'Barn kan inte beskriva symtom', correct: false },
        { text: 'Kräver MR för diagnos', correct: false },
      ],
      explanation: 'SH-V har ingen synlig fraktur på röntgen. Diagnosen ställs ofta först när tillväxtstörning uppkommer månader-år senare.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.14',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka Salter-Harris-typer är intraartikulära?',
      options: [
        { text: 'Typ III och IV', correct: true },
        { text: 'Typ I och II', correct: false },
        { text: 'Endast typ V', correct: false },
        { text: 'Alla typer', correct: false },
      ],
      explanation: 'SH-III och IV involverar epifysen och är därmed intraartikulära, vilket kräver anatomisk reposition.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.15',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Behandling av Salter-Harris typ I handledsfraktur?',
      options: [
        { text: 'Reposition vid dislokation, gipsbehandling 3-4 veckor', correct: true },
        { text: 'Alltid operation', correct: false },
        { text: 'Ingen behandling behövs', correct: false },
        { text: 'Extern fixation', correct: false },
      ],
      explanation: 'SH-I behandlas ofta konservativt med sluten reposition och gips. God prognos vid adekvat reposition.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.16',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'När krävs operativ behandling av fysfrakturer?',
      options: [
        { text: 'Instabilitet, SH typ III-IV, inadekvat sluten reposition', correct: true },
        { text: 'Aldrig - alla fysfrakturer behandlas konservativt', correct: false },
        { text: 'Alltid vid SH typ II', correct: false },
        { text: 'Endast vid öppna frakturer', correct: false },
      ],
      explanation: 'Operation indiceras vid instabilitet, intraartikulära frakturer (III-IV) och misslyckad sluten reposition.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.17',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är tillväxtstörning (growth arrest)?',
      options: [
        { text: 'Partiell eller komplett stopp av longitudinell bentillväxt efter fysskada', correct: true },
        { text: 'Ökad tillväxt', correct: false },
        { text: 'Frakturläkningsproblem', correct: false },
        { text: 'Mjukdelsskada', correct: false },
      ],
      explanation: 'Growth arrest är komplikation där fysen slutar växa (helt eller delvis) efter skada, ledande till längdskillnad eller vinkelfelställning.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.18',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "bony bar" vid fysskada?',
      options: [
        { text: 'Benbrygga över fysen som hindrar tillväxt i den delen', correct: true },
        { text: 'Callus', correct: false },
        { text: 'Benhinneförändring', correct: false },
        { text: 'Normalt läkningsfynd', correct: false },
      ],
      explanation: 'Bony bar (physeal bar) är en benbrygga som bildas över den skadade fysportionen och hindrar tillväxt lokalt.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.19',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad händer om benbryggan bildas centralt i fysen?',
      options: [
        { text: 'Tenting av fysen och minskad längdtillväxt', correct: true },
        { text: 'Vinkelfelställning', correct: false },
        { text: 'Ingen effekt', correct: false },
        { text: 'Ökad tillväxt', correct: false },
      ],
      explanation: 'Central benbrygga ger "tenting" där periferin växer men centrum inte, vilket ger minskad längd och ev viss deformitet.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.20',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad händer om benbryggan bildas perifert i fysen?',
      options: [
        { text: 'Vinkelfelställning (angulär deformitet)', correct: true },
        { text: 'Endast längdförlust', correct: false },
        { text: 'Ingen effekt', correct: false },
        { text: 'Överväxt', correct: false },
      ],
      explanation: 'Perifer benbrygga ger tillväxt på ena sidan men inte andra, vilket orsakar progressiv vinkelfelställning.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.21',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är remodellering vid barnfrakturer?',
      options: [
        { text: 'Korrigering av felställning genom fortsatt tillväxt', correct: true },
        { text: 'Benombyggnad vid läkning', correct: false },
        { text: 'Kirurgisk korrigering', correct: false },
        { text: 'Gipsbyten', correct: false },
      ],
      explanation: 'Remodellering är den naturliga korrigeringen av kvarvarande felställning genom tillväxt och Wolff\'s law.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.22',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka faktorer påverkar remodelleringsförmågan?',
      options: [
        { text: 'Ålder (yngre=mer), närhet till fys, felställning i sagittalplan', correct: true },
        { text: 'Endast åldern', correct: false },
        { text: 'Endast frakturtyp', correct: false },
        { text: 'Kön', correct: false },
      ],
      explanation: 'Yngre barn, fraktur nära fysen och felställning i ledens rörelseplan har störst remodelleringspotential.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.23',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: '4-åring med 20° angulation i distal radius (sagittalplan). Behövs reposition?',
      options: [
        { text: 'Nej, troligen acceptabel remodellering pga låg ålder och sagittalplan', correct: true },
        { text: 'Ja, alltid perfekt reposition', correct: false },
        { text: 'Operation krävs', correct: false },
        { text: 'Kan ej bedömas', correct: false },
      ],
      explanation: 'Ung patient med felställning i sagittalplanet nära fys har excellent remodelleringspotential. 20° kan accepteras.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.24',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är suprakondylär humerusfraktur?',
      options: [
        { text: 'Fraktur strax ovan armbågsleden genom distala humerus', correct: true },
        { text: 'Fraktur genom armbågsleden', correct: false },
        { text: 'Proximal humerusfraktur', correct: false },
        { text: 'Olecranonfraktur', correct: false },
      ],
      explanation: 'Suprakondylär humerusfraktur är den vanligaste armbågsfrakturen hos barn, strax ovan condylerna.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.25',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste frakturtypen hos barn?',
      options: [
        { text: 'Distal underarmsfraktur', correct: true },
        { text: 'Suprakondylär humerusfraktur', correct: false },
        { text: 'Lårbensfraktur', correct: false },
        { text: 'Nyckelbensfraktur', correct: false },
      ],
      explanation: 'Distal underarmsfraktur är den absolut vanligaste frakturen hos barn, ofta vid fall på utsträckt hand.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.26',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken allvarlig komplikation är associerad med suprakondylär humerusfraktur?',
      options: [
        { text: 'Kärlskada (a. brachialis) och nervskada (n. medianus/interosseus ant.)', correct: true },
        { text: 'Endast frakturläkningsproblem', correct: false },
        { text: 'Tillväxtstörning i armbågen', correct: false },
        { text: 'Infektion', correct: false },
      ],
      explanation: 'A. brachialis och n. medianus/n. interosseus anterior anterior kan skadas vid dislokation. Kontrollera alltid distal cirkulation och neurologi.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Gartland JJ Surg Gynecol Obstet 1959',
    },
    {
      code: '10.27',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Suprakondylär humerusfraktur med svag radialispuls. Initial åtgärd?',
      options: [
        { text: 'Reponera frakturen - ofta återkommer pulsen efter reposition', correct: true },
        { text: 'Direkt kärlkirurgisk exploration', correct: false },
        { text: 'CT-angio', correct: false },
        { text: 'Avvakta', correct: false },
      ],
      explanation: 'Ofta är artären komprimerad av fragmenten. Reposition återställer vanligen flödet. Om utebliven förbättring - exploration.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Gartland JJ Surg Gynecol Obstet 1959',
    },
    {
      code: '10.28',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Gartland-klassifikationen för suprakondylär humerusfraktur?',
      options: [
        { text: 'I=odislokerad, II=angulerad med intakt posterior cortex, III=komplett dislokerad', correct: true },
        { text: 'Baserad på ålder', correct: false },
        { text: 'Baserad på komplikationer', correct: false },
        { text: 'I-V liknande Salter-Harris', correct: false },
      ],
      explanation: 'Gartland: I=odislokerad, II=dislokerad med intakt posterior cortex, III=helt dislokerad. Bestämmer behandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Gartland JJ Surg Gynecol Obstet 1959',
    },
    {
      code: '10.29',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Behandling av Gartland typ I suprakondylär fraktur?',
      options: [
        { text: 'Gips i 3-4 veckor', correct: true },
        { text: 'Operation med stiftning', correct: false },
        { text: 'Sluten reposition och stiftning', correct: false },
        { text: 'Ingen behandling', correct: false },
      ],
      explanation: 'Gartland I (odislokerad) behandlas konservativt med gips/ortos i 3-4 veckor.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.30',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Behandling av Gartland typ III suprakondylär fraktur?',
      options: [
        { text: 'Sluten reposition och perkutan stiftning (K-trådar)', correct: true },
        { text: 'Endast gips', correct: false },
        { text: 'Öppen plattfixation', correct: false },
        { text: 'Avvakta', correct: false },
      ],
      explanation: 'Gartland III kräver operativ behandling med sluten reposition och perkutan K-trådsfixation, vanligen samma dag.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.31',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nervskada är vanligast vid suprakondylär humerusfraktur?',
      options: [
        { text: 'N. interosseus anterior (gren av n. medianus)', correct: true },
        { text: 'N. ulnaris', correct: false },
        { text: 'N. radialis', correct: false },
        { text: 'N. musculocutaneus', correct: false },
      ],
      explanation: 'Anterior interosseus nerve (AIN) skadas oftast. Testa genom att be barnet göra "OK-tecken" med tumme och pekfinger.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.32',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Hur testas n. interosseus anterior-funktion?',
      options: [
        { text: 'Be barnet göra OK-tecken (IP-flexion tumme + DIP-flexion pekfinger)', correct: true },
        { text: 'Handgreppsstyrka', correct: false },
        { text: 'Sensorisk undersökning', correct: false },
        { text: 'Pronation', correct: false },
      ],
      explanation: 'AIN är rent motorisk. Oförmåga att göra OK-tecken (FPL + FDP till pekfinger) indikerar skada.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.33',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Volkmanns ischemic contracture?',
      options: [
        { text: 'Kontraktur efter kompartmentsyndrom i underarmen', correct: true },
        { text: 'Medfödd deformitet', correct: false },
        { text: 'Muskelskada vid fraktur', correct: false },
        { text: 'Senskada', correct: false },
      ],
      explanation: 'Volkmanns kontraktur är den fruktade följden av obehandlat kompartmentsyndrom i underarmen - muskelfibrös och permanent funktionsförlust.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Volkmann R 1881',
    },
    {
      code: '10.34',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Tecken på kompartmentsyndrom efter suprakondylär fraktur hos barn?',
      options: [
        { text: 'Ökat analgetikabehov, smärta vid passiv extension, spänd underarm', correct: true },
        { text: 'Endast bortfallen puls', correct: false },
        { text: 'Feber', correct: false },
        { text: 'Paralys initialt', correct: false },
      ],
      explanation: 'Barn: Ökat smärtstillande behov (pain out of proportion) är det viktigaste tidiga tecknet. Smärta vid passiv sträckning, spänd logg.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.35',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "buckle fracture" (torus fracture)?',
      options: [
        { text: 'Kompression av cortex utan fullständig fraktulinje - unikt för barn', correct: true },
        { text: 'Fraktur med angulation', correct: false },
        { text: 'Öppen fraktur', correct: false },
        { text: 'Fysfraktur', correct: false },
      ],
      explanation: 'Buckle/torus-fraktur: Ena cortex bucklar vid kompression utan att gå av helt. Stabilt, kort gips.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.36',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "greenstick fracture"?',
      options: [
        { text: 'Ena cortex bruten, andra böjd men intakt - liknande färsk grönkvist', correct: true },
        { text: 'Komplett fraktur', correct: false },
        { text: 'Fysfraktur', correct: false },
        { text: 'Stressfraktur', correct: false },
      ],
      explanation: 'Greenstick: En cortex bruten, andra intakt men böjd. Benämnt efter hur en färsk kvist bryts. Kan behöva bryta helt för stabil reposition.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.37',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "plastic deformation" (bowing fracture)?',
      options: [
        { text: 'Ben som böjts utan synlig fraktulinje - unikt för barn', correct: true },
        { text: 'Torus-fraktur', correct: false },
        { text: 'Greenstick-fraktur', correct: false },
        { text: 'Komplett fraktur', correct: false },
      ],
      explanation: 'Plastisk deformation: Benet har böjts utan synlig fraktur, mikrofrakturer i cortex. Svår diagnos, kan behöva reponeras.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.38',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Behandling av distal radius buckle-fraktur hos 7-åring?',
      options: [
        { text: 'Avtagbar ortos/gips 2-3 veckor', correct: true },
        { text: 'Reposition och gips', correct: false },
        { text: 'Operation', correct: false },
        { text: 'Ingen behandling', correct: false },
      ],
      explanation: 'Buckle-frakturer är stabila. Kort immobilisering (2-3v) med ortos eller gips för smärtlindring är tillräckligt.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.39',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Varför läker frakturer snabbare hos barn?',
      options: [
        { text: 'Tjockare och mer aktivt periost, bättre blodförsörjning, högre metabolism', correct: true },
        { text: 'Mjukare ben', correct: false },
        { text: 'Mindre inflammation', correct: false },
        { text: 'Läker inte snabbare', correct: false },
      ],
      explanation: 'Barns periost är tjockt och osteogent aktivt. God blodförsörjning och snabb metabolism ger snabbare läkning.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.40',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Ungefärlig läkningstid för underarmsfraktur hos 8-åring vs vuxen?',
      options: [
        { text: '4-6 veckor hos barn vs 8-12 veckor hos vuxen', correct: true },
        { text: 'Samma tid', correct: false },
        { text: 'Längre hos barn', correct: false },
        { text: '1 vecka hos barn', correct: false },
      ],
      explanation: 'Barn läker ungefär dubbelt så snabbt som vuxna. Underarmsfraktur: ~4-6v hos barn, 8-12v hos vuxna.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.41',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är toddler\'s fracture?',
      options: [
        { text: 'Osynlig spiralfraktur i tibia hos barn som börjat gå', correct: true },
        { text: 'Femurfraktur', correct: false },
        { text: 'Fotfraktur', correct: false },
        { text: 'Fraktur vid barnmisshandel', correct: false },
      ],
      explanation: 'Toddler\'s fracture: Spiral/oblique tibiadiafysfraktur hos 1-3 åringar, ofta utan tydligt trauma. Klassiskt hältande barn.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.42',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Behandling av toddler\'s fracture?',
      options: [
        { text: 'Lårbensavgjutning eller walking cast 3-4 veckor', correct: true },
        { text: 'Operation', correct: false },
        { text: 'Ingen behandling', correct: false },
        { text: 'Sängläge', correct: false },
      ],
      explanation: 'Toddler\'s fracture är stabil. Lårbensavgjutning eller cirkulärgips i 3-4 veckor. God prognos.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.43',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken frakturtyp ska väcka misstanke om barnmisshandel?',
      options: [
        { text: 'Metafysära hörnfrakturer (CML), frakturer i olika läkningsstadier, revbensfrakturer hos spädbarn', correct: true },
        { text: 'Distal radiusfraktur', correct: false },
        { text: 'Nyckelbensfraktur', correct: false },
        { text: 'Suprakondylär humerusfraktur', correct: false },
      ],
      explanation: 'Classic metaphyseal lesions (CML), frakturer i olika stadier, revbensfrakturer <2 år är högspecifika för non-accidental injury.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Kleinman PK Diagnostic Imaging of Child Abuse',
    },
    {
      code: '10.44',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är spädbarn med femurfraktur högriskgrupp för misshandel?',
      options: [
        { text: 'Spädbarn som ej går kan ej skada sig själva på det sättet', correct: true },
        { text: 'Femur är det starkaste benet', correct: false },
        { text: 'Alltid högenergiskada', correct: false },
        { text: 'Ingen speciell risk', correct: false },
      ],
      explanation: 'Femurfraktur hos icke-ambulerande spädbarn (<1 år) utan tydlig olycksmekanism har hög sannolikhet för NAI.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Kleinman PK Diagnostic Imaging of Child Abuse',
    },
    {
      code: '10.45',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Åtgärd vid misstänkt barnmisshandel med fraktur?',
      options: [
        { text: 'Behandla skadan, dokumentera, anmäl till socialtjänst, överväg skelettstatus', correct: true },
        { text: 'Endast behandla skadan', correct: false },
        { text: 'Konfrontera föräldrarna', correct: false },
        { text: 'Vänta på mer bevis', correct: false },
      ],
      explanation: 'Vid misstanke: Behandla skadan, dokumentera noggrant, anmäl till socialtjänst (lagstadgad skyldighet), skelett-screening.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Socialtjänstlagen',
    },
    {
      code: '10.46',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är åldersgräns för lårbensavgjutning vid femurfraktur?',
      options: [
        { text: 'Ca 5-6 år - därefter traktion eller operation', correct: true },
        { text: '10 år', correct: false },
        { text: '2 år', correct: false },
        { text: 'Ingen åldersgräns', correct: false },
      ],
      explanation: 'Lårbensavgjutning fungerar upp till ca 5-6 år. Äldre barn behandlas med traktion, elastisk märgspikning eller platta.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.47',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför undviks rigid märgspikning vid barns femurfrakturer?',
      options: [
        { text: 'Risk för skada på femurkapitalis blodförsörjning och tillväxtzon', correct: true },
        { text: 'För svårt tekniskt', correct: false },
        { text: 'Barn läker inte med märgspik', correct: false },
        { text: 'Märgspikning rekommenderas faktiskt', correct: false },
      ],
      explanation: 'Rigid märgspikning via fossa piriformis riskerar skada på a. circumflexa och proximala fysen. Elastisk spikning eller lateral entry används.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.48',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är elastisk märgspikning (TENS/ESIN)?',
      options: [
        { text: 'Titanspikpar för pediatriska femur/underarmsfrakturer', correct: true },
        { text: 'K-trådsmetod', correct: false },
        { text: 'Extern fixation', correct: false },
        { text: 'Plattfixation', correct: false },
      ],
      explanation: 'Titanium Elastic Nails: Flexibla titanspik som bucclas in för stabil intern fixation utan att skada fysen.',
      reference: 'B-ORTIM Kursbok, Kapitel 10; Métaizeau JP J Pediatr Orthop 2004',
    },
    {
      code: '10.49',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken benlängdsskillnad accepteras vid konservativ femurfrakturbehandling hos barn?',
      options: [
        { text: '1-2 cm - kompenseras av överväxt', correct: true },
        { text: '>3 cm', correct: false },
        { text: 'Ingen skillnad accepteras', correct: false },
        { text: '5 cm', correct: false },
      ],
      explanation: 'Viss förkortning (1-2 cm) accepteras då diafysär fraktur ofta ger stimulerad tillväxt (overväxt) som kompenserar.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },
    {
      code: '10.50',
      chapterNumber: 10,
      bloomLevel: 'ANALYSIS',
      question: 'Varför kräver pediatriska frakturer specialkompetens?',
      options: [
        { text: 'Unika frakturtyper, fysers sårbarhet, remodelleringspotential kräver anpassad behandling', correct: true },
        { text: 'Barn är svårare att kommunicera med', correct: false },
        { text: 'Juridiska skäl', correct: false },
        { text: 'Alla frakturer behandlas likadant', correct: false },
      ],
      explanation: 'Barnfrakturer har unika mönster (fys, buckle, greenstick), kräver förståelse av tillväxt och remodellering för korrekt beslut.',
      reference: 'B-ORTIM Kursbok, Kapitel 10',
    },

    // Kapitel 11: Extra frågor
    {
      code: '11.3',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken elektrolytrubbning är mest livshotande vid crush syndrome?',
      options: [
        { text: 'Hyperkalemi', correct: true },
        { text: 'Hyponatremi', correct: false },
        { text: 'Hypokalcemi', correct: false },
        { text: 'Hypernatremi', correct: false },
      ],
      explanation: 'Hyperkalemi är den mest akut livshotande komplikationen vid crush syndrome och kan ge hjärtrytmrubbningar och hjärtstopp.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Better OS Nephrol Dial Transplant 1990',
    },
    {
      code: '11.4',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Patient har varit fastklämd i 4 timmar. Vad ska påbörjas INNAN friläggning?',
      options: [
        { text: 'IV vätska (NaCl) och kalciumklorid i beredskap', correct: true },
        { text: 'Inget speciellt, frigör direkt', correct: false },
        { text: 'Ge insulin', correct: false },
        { text: 'Applicera tourniquet', correct: false },
      ],
      explanation: 'Före friläggning vid crush syndrome: påbörja aggressiv vätska (1L/h NaCl), ha kalcium och natriumbikarbonat i beredskap för hyperkalemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.5',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför uppstår akut njursvikt vid crush syndrome?',
      options: [
        { text: 'Myoglobin från skadad muskel ockluderar njurtubuli', correct: true },
        { text: 'Direkt njurskada från trauma', correct: false },
        { text: 'Dehydrering enbart', correct: false },
        { text: 'Infektion', correct: false },
      ],
      explanation: 'Myoglobin frisätts från krossad muskel och fälls ut i njurtubuli, vilket orsakar akut tubulär nekros och njursvikt.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.6',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är crush syndrome?',
      options: [
        { text: 'Systemisk komplikation av rabdomyolys efter prolongerad muskelkompression', correct: true },
        { text: 'Lokalt kompartmentsyndrom', correct: false },
        { text: 'Nervskada vid krossning', correct: false },
        { text: 'Fraktursjukdom', correct: false },
      ],
      explanation: 'Crush syndrome är den systemiska manifestationen av rabdomyolys som uppstår efter friläggning av fastklämd patient.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Bywaters EG BMJ 1941',
    },
    {
      code: '11.7',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är skillnaden mellan crush injury och crush syndrome?',
      options: [
        { text: 'Crush injury är den lokala skadan, crush syndrome är den systemiska komplikationen', correct: true },
        { text: 'De är synonyma', correct: false },
        { text: 'Crush syndrome är mildare', correct: false },
        { text: 'Crush injury involverar alltid fraktur', correct: false },
      ],
      explanation: 'Crush injury: lokal vävnadsskada vid krossning. Crush syndrome: systemisk påverkan (hyperkalemi, njursvikt) efter reperfusion.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.8',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är rabdomyolys?',
      options: [
        { text: 'Upplösning av skelettmuskel med frisättning av intracellulära komponenter', correct: true },
        { text: 'Muskelinflammation', correct: false },
        { text: 'Muskelkramp', correct: false },
        { text: 'Muskeltumör', correct: false },
      ],
      explanation: 'Rabdomyolys är nedbrytning av skelettmuskel med frisättning av myoglobin, kalium, fosfat och CK till blodbanan.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Bosch X NEJM 2009',
    },
    {
      code: '11.9',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka intracellulära substanser frisätts vid rabdomyolys?',
      options: [
        { text: 'Kalium, myoglobin, fosfat, CK, LDH, urat', correct: true },
        { text: 'Endast myoglobin', correct: false },
        { text: 'Kalcium och natrium', correct: false },
        { text: 'Glukos', correct: false },
      ],
      explanation: 'Muskelsönderfall frisätter kalium (hyperkalemi), myoglobin (njurskada), fosfat, CK, LDH och urat till blodet.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.10',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är hyperkalemi vid crush syndrome så farligt?',
      options: [
        { text: 'Orsakar hjärtarytmier (VF, asystoli) vid K >6.5 mmol/L', correct: true },
        { text: 'Ger muskelsvaghet', correct: false },
        { text: 'Orsakar kramper', correct: false },
        { text: 'Ger lågt blodtryck', correct: false },
      ],
      explanation: 'Kalium >6.5 mmol/L påverkar hjärtats elektriska aktivitet och kan ge fatal ventrikelflimmer eller asystoli.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.11',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka EKG-förändringar ses vid hyperkalemi?',
      options: [
        { text: 'Spetsiga T-vågor, breddökade QRS, förlängt PR, sinusvågsmönster', correct: true },
        { text: 'ST-höjningar', correct: false },
        { text: 'Förmaksflimmer', correct: false },
        { text: 'Q-vågor', correct: false },
      ],
      explanation: 'Hyperkalemi ger progressiva EKG-förändringar: spetsiga T-vågor → förlängt PR → breddökat QRS → sinusvågsmönster → VF/asystoli.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.12',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är myoglobin?',
      options: [
        { text: 'Syrebärande protein i muskelceller', correct: true },
        { text: 'Hemoglobin i röda blodkroppar', correct: false },
        { text: 'Plasmaprotein', correct: false },
        { text: 'Enzym', correct: false },
      ],
      explanation: 'Myoglobin är det intracellulära järninnehållande proteinet som lagrar syre i muskelceller.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.13',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur orsakar myoglobin njurskada?',
      options: [
        { text: 'Utfällning i tubuli i sur miljö + direkttoxisk effekt + vasokonstriktion', correct: true },
        { text: 'Blockerar glomeruli', correct: false },
        { text: 'Immunreaktion', correct: false },
        { text: 'Infektion', correct: false },
      ],
      explanation: 'Myoglobin fälls ut i sura njurtubuli, har direkt tubulotoxisk effekt och orsakar renal vasokonstriktion.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Bosch X NEJM 2009',
    },
    {
      code: '11.14',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilket CK-värde misstänks signifikant rabdomyolys?',
      options: [
        { text: 'CK >5000 U/L (ofta >10000 vid crush)', correct: true },
        { text: 'CK >100 U/L', correct: false },
        { text: 'CK >500 U/L', correct: false },
        { text: 'CK-värde är irrelevant', correct: false },
      ],
      explanation: 'CK >5x normalvärdet (>1000 U/L) indikerar rabdomyolys. Vid crush syndrome ses ofta värden >10000 U/L.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.15',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad visar urinprov vid myoglobinuri?',
      options: [
        { text: 'Positivt för blod på sticka men inga röda blodkroppar i mikroskopi', correct: true },
        { text: 'Röda blodkroppar i urinen', correct: false },
        { text: 'Protein', correct: false },
        { text: 'Normal urin', correct: false },
      ],
      explanation: 'Myoglobin ger positivt hemoglobin/blod-test på sticka men ingen hematuri - detta är patognomont för myoglobinuri.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.16',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken urinfärg tyder på myoglobinuri?',
      options: [
        { text: 'Mörkt brunröd ("tea-colored")', correct: true },
        { text: 'Ljusgul', correct: false },
        { text: 'Klar', correct: false },
        { text: 'Grumlig vit', correct: false },
      ],
      explanation: 'Myoglobin ger karakteristisk mörkt brunröd eller "coca-cola-färgad" urin.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.17',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Efter hur lång kompression kan crush syndrome utvecklas?',
      options: [
        { text: '>1 timme, risk ökar signifikant efter 4-6 timmar', correct: true },
        { text: 'Endast efter >24 timmar', correct: false },
        { text: 'Direkt vid kompression', correct: false },
        { text: 'Endast efter veckor', correct: false },
      ],
      explanation: 'Signifikant muskelskada kan uppstå efter >1h kompression. Risk för systemisk påverkan ökar markant efter 4-6h.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Better OS Nephrol Dial Transplant 1990',
    },
    {
      code: '11.18',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Vilken vätska rekommenderas för resuscitation vid crush syndrome?',
      options: [
        { text: 'Natriumklorid 0.9% (isoton NaCl)', correct: true },
        { text: 'Ringer-laktat', correct: false },
        { text: 'Glukos 5%', correct: false },
        { text: 'Kolloid', correct: false },
      ],
      explanation: 'Isoton NaCl rekommenderas - undvik kaliuminnehållande lösningar (Ringer) pga befintlig hyperkalemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Better OS Nephrol Dial Transplant 1990',
    },
    {
      code: '11.19',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Hur mycket vätska behövs initialt vid crush syndrome?',
      options: [
        { text: '1-1.5 liter/timme de första 3-6 timmarna, sedan justera', correct: true },
        { text: '100 ml/h', correct: false },
        { text: 'Endast vid törst', correct: false },
        { text: '10 liter bolus', correct: false },
      ],
      explanation: 'Aggressiv vätskeresuscitation med 1-1.5L/h initialt för att upprätthålla diures och spola ut myoglobin.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Sever MS JASN 2006',
    },
    {
      code: '11.20',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är aggressiv vätskebehandling så viktig vid crush syndrome?',
      options: [
        { text: 'Späder ut myoglobin, ökar diures och minskar tubulär utfällning', correct: true },
        { text: 'Endast för att behandla chock', correct: false },
        { text: 'Minskar kalium', correct: false },
        { text: 'Smärtlindring', correct: false },
      ],
      explanation: 'Vätska späder ut toxiner, ökar urinflöde (>200-300 ml/h målet) och minskar myoglobinutfällning i njurtubuli.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.21',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är målet för urinproduktion vid crush syndrome?',
      options: [
        { text: '200-300 ml/timme', correct: true },
        { text: '50 ml/timme', correct: false },
        { text: '30 ml/timme', correct: false },
        { text: 'Urinproduktion är inte viktigt', correct: false },
      ],
      explanation: 'Målet är hög diures (200-300 ml/h) för att spola ut myoglobin och förebygga tubulär obstruktion.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Sever MS JASN 2006',
    },
    {
      code: '11.22',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken roll har natriumbikarbonat vid crush syndrome?',
      options: [
        { text: 'Alkaliserar urinen och förhindrar myoglobinutfällning i tubuli', correct: true },
        { text: 'Behandlar hyperkalemi direkt', correct: false },
        { text: 'Smärtlindring', correct: false },
        { text: 'Har ingen roll', correct: false },
      ],
      explanation: 'Bikarbonat höjer urin-pH >6.5 vilket förhindrar myoglobin-utfällning och har viss njurskyddande effekt.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.23',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Akut hyperkalemi (K 7.5 mmol/L) vid crush syndrome. Första åtgärd?',
      options: [
        { text: 'Kalciumklorid/kalciumglukonat IV för att stabilisera hjärtmembran', correct: true },
        { text: 'Dialys', correct: false },
        { text: 'Mer vätska', correct: false },
        { text: 'Avvakta', correct: false },
      ],
      explanation: 'Kalcium stabiliserar hjärtmuskelns membranpotential akut och köper tid. Sedan insulin+glukos, bikarbonat, dialys.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; ATLS 10th ed',
    },
    {
      code: '11.24',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur behandlas hyperkalemi farmakologiskt?',
      options: [
        { text: 'Kalcium (skydd), insulin+glukos (shift), bikarbonat, diuretika, resiner, dialys', correct: true },
        { text: 'Endast vätskebehandling', correct: false },
        { text: 'Antibiotika', correct: false },
        { text: 'Smärtstillande', correct: false },
      ],
      explanation: 'Stegvis: 1) Kalcium (membranstabilisering), 2) Insulin+glukos (K-shift), 3) Bikarbonat, 4) Diuretika, 5) Dialys.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.25',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur verkar insulin vid hyperkalemi?',
      options: [
        { text: 'Driver kalium intracellulärt via Na-K-ATPas', correct: true },
        { text: 'Ökar njurutsöndring', correct: false },
        { text: 'Binder kalium', correct: false },
        { text: 'Har ingen effekt på kalium', correct: false },
      ],
      explanation: 'Insulin aktiverar Na-K-ATPas och driver kalium in i cellerna. Ges alltid med glukos för att undvika hypoglykemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.26',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'När är dialys indicerad vid crush syndrome?',
      options: [
        { text: 'Refraktär hyperkalemi, svår acidos, oliguri trots vätska, övervätskning', correct: true },
        { text: 'Alla patienter', correct: false },
        { text: 'Endast vid anuri', correct: false },
        { text: 'Dialys är kontraindicerat', correct: false },
      ],
      explanation: 'Dialys behövs vid behandlingsrefraktär hyperkalemi, svår metabol acidos, volymöverbelastning eller oliguri.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Sever MS JASN 2006',
    },
    {
      code: '11.27',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken typ av dialys används akut vid crush syndrome?',
      options: [
        { text: 'Kontinuerlig veno-venös hemodialys (CVVHD) eller intermittent HD', correct: true },
        { text: 'Endast peritonealdialys', correct: false },
        { text: 'Plasmaferes', correct: false },
        { text: 'Dialys används ej', correct: false },
      ],
      explanation: 'Kontinuerlig dialys (CVVHD) är skonsam vid hemodynamisk instabilitet. Intermittent HD vid stabil patient.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.28',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Patient fastklämd 6 timmar. Räddningspersonal förbereder friläggning. Viktigaste förberedelsen?',
      options: [
        { text: 'IV-access, starta NaCl-infusion, ha kalcium och defibrillator redo', correct: true },
        { text: 'Frigör omedelbart', correct: false },
        { text: 'Vänta på sjukhustransport', correct: false },
        { text: 'Endast smärtstillande', correct: false },
      ],
      explanation: 'Förbered för reperfusionssyndrom: IV med NaCl, kalcium för hyperkalemi, defibrillator för arytmi vid friläggning.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; TCCC Guidelines',
    },
    {
      code: '11.29',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför kan patienten dö vid friläggning efter prolongerad kompression?',
      options: [
        { text: 'Reperfusion frisätter kalium som ger hjärtstopp', correct: true },
        { text: 'Blödning', correct: false },
        { text: 'Smärta', correct: false },
        { text: 'Infektion', correct: false },
      ],
      explanation: '"Rescue death": Vid friläggning reperfuseras ischemisk muskel och kalium+myoglobin strömmar ut i cirkulationen.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Better OS Nephrol Dial Transplant 1990',
    },
    {
      code: '11.30',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Ska tourniquet användas vid crush syndrome innan friläggning?',
      options: [
        { text: 'Kontroversiellt - kan övervägas för att kontrollera reperfusion, inte standard', correct: true },
        { text: 'Ja, alltid', correct: false },
        { text: 'Absolut kontraindicerat', correct: false },
        { text: 'Endast vid synlig blödning', correct: false },
      ],
      explanation: 'Tourniquet före friläggning är kontroversiellt - kan fördröja reperfusion men förlänger också ischemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.31',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är riskfaktorerna för att utveckla crush syndrome?',
      options: [
        { text: 'Lång kompressionstid, stor muskelmassa involverad, försenad behandling', correct: true },
        { text: 'Endast ålder', correct: false },
        { text: 'Endast kön', correct: false },
        { text: 'Diabetes', correct: false },
      ],
      explanation: 'Risk ökar med längre kompressionstid, större muskelvolym, försenad räddning/behandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.32',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'I vilket sammanhang är crush syndrome vanligast?',
      options: [
        { text: 'Jordbävningar, byggnadsras, trafikolyckor med fastklämd patient', correct: true },
        { text: 'Sportskador', correct: false },
        { text: 'Operationer', correct: false },
        { text: 'Infektioner', correct: false },
      ],
      explanation: 'Crush syndrome ses vid masskatastrofer (jordbävningar, bombningar) där personer ligger fastklamda i timmar.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Bywaters EG BMJ 1941',
    },
    {
      code: '11.33',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken historisk händelse definierade crush syndrome?',
      options: [
        { text: 'London Blitz 1940 - Bywaters beskrev syndromet', correct: true },
        { text: 'Första världskriget', correct: false },
        { text: 'Vietnamkriget', correct: false },
        { text: 'Gulfkriget', correct: false },
      ],
      explanation: 'Eric Bywaters beskrev crush syndrome 1941 hos offer för bombningarna av London under andra världskriget.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Bywaters EG BMJ 1941',
    },
    {
      code: '11.34',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är skillnaden mellan crush syndrome och kompartmentsyndrom?',
      options: [
        { text: 'Crush syndrome är systemiskt (njure, hjärta), kompartment är lokalt (extremitet)', correct: true },
        { text: 'De är samma tillstånd', correct: false },
        { text: 'Kompartment är allvarligare', correct: false },
        { text: 'Crush syndrome involverar endast muskel', correct: false },
      ],
      explanation: 'Crush syndrome: systemisk påverkan efter reperfusion. Kompartmentsyndrom: lokalt högt tryck i slutet fasciarum.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.35',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Kan crush syndrome och kompartmentsyndrom förekomma samtidigt?',
      options: [
        { text: 'Ja, och kompartmentsyndrom kan förvärra rabdomyolysen', correct: true },
        { text: 'Nej, de utesluter varandra', correct: false },
        { text: 'Endast crush syndrome', correct: false },
        { text: 'Endast kompartmentsyndrom', correct: false },
      ],
      explanation: 'Crush injury kan ge lokalt kompartmentsyndrom som förvärrar muskelskadan och systemisk påverkan.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.36',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken hypokalcemisk komplikation kan uppstå vid crush syndrome?',
      options: [
        { text: 'Kalcium binds till skadad muskel och fosfat, ger hypokalcemi', correct: true },
        { text: 'Hypokalcemi uppstår ej', correct: false },
        { text: 'Kalcium ökar alltid', correct: false },
        { text: 'Kalcium påverkas ej', correct: false },
      ],
      explanation: 'Hypokalcemi uppstår tidigt när kalcium binder till skadad muskel och komplexbinder med frigjort fosfat.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.37',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Ska hypokalcemi vid crush syndrome behandlas aggressivt?',
      options: [
        { text: 'Nej, försiktighet - rebound hyperkalcemi kan uppstå vid återhämtning', correct: true },
        { text: 'Ja, alltid korrigera till normalvärde', correct: false },
        { text: 'Kalcium ska aldrig ges', correct: false },
        { text: 'Endast vid symtom', correct: false },
      ],
      explanation: 'Var försiktig med kalciumtillskott - vid återhämtning frisätts kalcium från muskeln och kan ge hyperkalcemi.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Sever MS JASN 2006',
    },
    {
      code: '11.38',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Varför uppstår metabol acidos vid crush syndrome?',
      options: [
        { text: 'Laktat från ischemisk vävnad + organiska syror från muskelceller', correct: true },
        { text: 'Hyperventilation', correct: false },
        { text: 'Njurarna producerar syra', correct: false },
        { text: 'Bikarbonatförlust i urin', correct: false },
      ],
      explanation: 'Ischemisk muskel producerar laktat och frisätter organiska syror vid celldöd, vilket ger metabol acidos.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.39',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Mannitol vid crush syndrome - indikation?',
      options: [
        { text: 'Kan användas för att öka diures och minska muskelödem (kontroversiellt)', correct: true },
        { text: 'Standardbehandling', correct: false },
        { text: 'Kontraindicerat', correct: false },
        { text: 'Ersätter vätskebehandling', correct: false },
      ],
      explanation: 'Mannitol kan öka urinflöde och verka antioxidativt. Evidens är dock svag, inte förstahandsval.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.40',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur snabbt utvecklas njursvikt vid obehandlad crush syndrome?',
      options: [
        { text: 'Inom 24-72 timmar efter friläggning', correct: true },
        { text: 'Inom minuter', correct: false },
        { text: 'Efter 1 vecka', correct: false },
        { text: 'Njursvikt uppstår ej', correct: false },
      ],
      explanation: 'Akut njursvikt (ATN) utvecklas typiskt inom 24-72h efter reperfusion om adekvat vätskebehandling ej ges.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.41',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är prognosen för njurfunktion vid adekvat behandlad crush syndrome?',
      options: [
        { text: 'God - de flesta återfår njurfunktionen med intensiv behandling', correct: true },
        { text: 'Alltid permanent dialysbehov', correct: false },
        { text: 'Alla dör', correct: false },
        { text: 'Alltid kronisk njursvikt', correct: false },
      ],
      explanation: 'Med aggressiv vätskebehandling och vid behov dialys återhämtar de flesta njurfunktionen helt.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Sever MS JASN 2006',
    },
    {
      code: '11.42',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Patient med crush injury vaknar med mörk urin dagen efter. Åtgärd?',
      options: [
        { text: 'Kontrollera CK, elektrolyter, kreatinin - starta aggressiv vätska', correct: true },
        { text: 'Avvakta', correct: false },
        { text: 'Diuretika', correct: false },
        { text: 'Antibiotika', correct: false },
      ],
      explanation: 'Mörk urin efter trauma tyder på myoglobinuri. Kontrollera labs och starta aggressiv vätskebehandling.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.43',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför kan sekundär fasciotomi behövas vid crush syndrome?',
      options: [
        { text: 'Reperfusionsödem kan ge kompartmentsyndrom', correct: true },
        { text: 'Förebygger infektion', correct: false },
        { text: 'Standard vid alla crush injuries', correct: false },
        { text: 'Minskar smärta', correct: false },
      ],
      explanation: 'Reperfusion orsakar ödem som kan ge sekundärt kompartmentsyndrom - monitorera och utför fasciotomi vid behov.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.44',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka laboratorievärden ska monitoreras vid crush syndrome?',
      options: [
        { text: 'K, Ca, fosfat, kreatinin, CK, myoglobin, blodgas, laktat', correct: true },
        { text: 'Endast kreatinin', correct: false },
        { text: 'Endast elektrolyter', correct: false },
        { text: 'Laboratorieprover ej nödvändiga', correct: false },
      ],
      explanation: 'Tätt följande av elektrolyter (särskilt K), njurfunktion, CK och syra-basstatus krävs för att styra behandlingen.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.45',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Hur ofta bör kalium kontrolleras vid svår crush syndrome?',
      options: [
        { text: 'Var 1-2:e timme initialt', correct: true },
        { text: 'En gång dagligen', correct: false },
        { text: 'Varannan dag', correct: false },
        { text: 'Endast vid symtom', correct: false },
      ],
      explanation: 'Kalium kan stiga snabbt och oförutsägbart - frekvent monitorering (varannan timme) initialt är essentiellt.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.46',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka andra orsaker till rabdomyolys finns förutom trauma?',
      options: [
        { text: 'Läkemedel (statiner), intoxikation, kramper, extrem ansträngning, infektion', correct: true },
        { text: 'Endast trauma', correct: false },
        { text: 'Endast intoxikation', correct: false },
        { text: 'Endast läkemedel', correct: false },
      ],
      explanation: 'Rabdomyolys kan orsakas av statiner, alkohol/droger, epileptiska kramper, hypertermi, infektioner mm.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Bosch X NEJM 2009',
    },
    {
      code: '11.47',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Indikation för amputation vid crush injury?',
      options: [
        { text: 'Irreversibel extremitetsischemi, livshotande sepsis, okontrollerbar hyperkalemi', correct: true },
        { text: 'Alla crush injuries', correct: false },
        { text: 'Endast vid fraktur', correct: false },
        { text: 'Amputation är aldrig indicerat', correct: false },
      ],
      explanation: 'Amputation övervägs vid icke-viabel extremitet, livshotande systemisk påverkan som ej kan kontrolleras.',
      reference: 'B-ORTIM Kursbok, Kapitel 11',
    },
    {
      code: '11.48',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur hög är mortaliteten vid crush syndrome utan behandling?',
      options: [
        { text: 'Upp till 50% eller högre utan adekvat resuscitation', correct: true },
        { text: '<5%', correct: false },
        { text: '10%', correct: false },
        { text: '100%', correct: false },
      ],
      explanation: 'Obehandlad crush syndrome har hög mortalitet, främst pga hyperkalemiska arytmier och multiorgansvikt.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Better OS Nephrol Dial Transplant 1990',
    },
    {
      code: '11.49',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Vilken initial infusionstakt rekommenderas vid fältbehandling av crush syndrome?',
      options: [
        { text: '1000 ml NaCl först, sedan 500 ml/h till ankomst sjukhus', correct: true },
        { text: '100 ml/h', correct: false },
        { text: 'Ingen vätska i fält', correct: false },
        { text: '5000 ml bolus', correct: false },
      ],
      explanation: 'I fält: Snabb initial bolus (1L) sedan fortsatt hög takt (500 ml/h) under transport för att förebygga njurskada.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; TCCC Guidelines',
    },
    {
      code: '11.50',
      chapterNumber: 11,
      bloomLevel: 'ANALYSIS',
      question: 'Viktigaste prognostiska faktorn vid crush syndrome?',
      options: [
        { text: 'Tid till initiering av vätskebehandling', correct: true },
        { text: 'Patientens ålder', correct: false },
        { text: 'Typ av trauma', correct: false },
        { text: 'Tid på dygnet', correct: false },
      ],
      explanation: 'Tidig aggressiv vätskeresuscitation - helst påbörjad före friläggning - är avgörande för överlevnad och njurfunktion.',
      reference: 'B-ORTIM Kursbok, Kapitel 11; Sever MS JASN 2006',
    },

    // Kapitel 13: Extra frågor (DCO)
    {
      code: '13.3',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står DCO för?',
      options: [
        { text: 'Damage Control Orthopaedics', correct: true },
        { text: 'Definitive Care Operation', correct: false },
        { text: 'Delayed Compartment Opening', correct: false },
        { text: 'Diagnostic Clinical Observation', correct: false },
      ],
      explanation: 'DCO = Damage Control Orthopaedics - principen att göra minimal stabilisering hos instabila patienter och vänta med definitiv kirurgi.',
      reference: 'B-ORTIM Kursbok, Kapitel 13; Pape HC J Trauma 2007',
    },
    {
      code: '13.4',
      chapterNumber: 13,
      bloomLevel: 'APPLICATION',
      question: 'Multitraumapatient med femurfraktur, pH 7.2, temp 34.5°C, laktat 6. Vilken strategi?',
      options: [
        { text: 'DCO med extern fixation, sedan IVA för optimering', correct: true },
        { text: 'Direkt definitiv märgspikning', correct: false },
        { text: 'Konservativ behandling utan operation', correct: false },
        { text: 'Vänta tills pH normaliseras spontant', correct: false },
      ],
      explanation: 'Patienten uppfyller DCO-kriterier (pH <7.25, temp <35°C, laktat >4). Extern fixation nu, definitiv kirurgi efter fysiologisk stabilisering.',
      reference: 'B-ORTIM Kursbok, Kapitel 13; Pape HC J Orthop Trauma 2007',
    },
    {
      code: '13.5',
      chapterNumber: 13,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är "second hit" fenomenet?',
      options: [
        { text: 'Stor kirurgi hos redan stressad patient förvärrar inflammatoriskt svar', correct: true },
        { text: 'En andra traumatisk skada', correct: false },
        { text: 'Upprepade operationer är alltid bättre', correct: false },
        { text: 'Patienten får en ny fraktur', correct: false },
      ],
      explanation: 'Second hit = ytterligare kirurgiskt trauma hos fysiologiskt komprometterad patient förvärrar SIRS och kan leda till ARDS/MODS.',
      reference: 'B-ORTIM Kursbok, Kapitel 13; Pape HC J Trauma 2007',
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
    // ============================================
    // YTTERLIGARE FRÅGOR FÖR A-ORTIM
    // ============================================

    // Kapitel 1: Extra frågor (Bilddiagnostik)
    {
      code: 'A1.3',
      chapterNumber: 1,
      bloomLevel: 'APPLICATION',
      question: 'CT-angio visar kontrastextravasering vid knäleden efter trauma. Nästa steg?',
      options: [
        { text: 'Akut kärlkirurgisk exploration', correct: true },
        { text: 'Upprepa CT om 6 timmar', correct: false },
        { text: 'MR för bättre visualisering', correct: false },
        { text: 'Konservativ behandling', correct: false },
      ],
      explanation: 'Kontrastextravasering innebär aktiv blödning och kräver omedelbar kirurgisk intervention.',
      reference: 'A-ORTIM Kursbok, Kapitel 1; EAST Guidelines 2012',
    },
    {
      code: 'A1.4',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken CT-angio-fynd tyder på intimaskada?',
      options: [
        { text: 'Intimal flap med lumeninskränkning', correct: true },
        { text: 'Frakturfragment', correct: false },
        { text: 'Mjukdelssvullnad', correct: false },
        { text: 'Normal kärlkontur', correct: false },
      ],
      explanation: 'Intimaskada ses som intimal flap, dissektionsplane eller lumeninskränkning på CT-angio.',
      reference: 'A-ORTIM Kursbok, Kapitel 1; SVS Practice Guidelines 2020',
    },
    {
      code: 'A1.5',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är sensitiviteten för CT-angio vid extremitetskärlskada?',
      options: [
        { text: 'Cirka 96% sensitivitet, 99% specificitet', correct: true },
        { text: 'Cirka 50% sensitivitet', correct: false },
        { text: 'Endast 75% sensitivitet', correct: false },
        { text: 'CT-angio är opålitlig', correct: false },
      ],
      explanation: 'CT-angio har mycket hög diagnostisk träffsäkerhet (sensitivitet 96%, specificitet 99%) enligt SVS 2020.',
      reference: 'A-ORTIM Kursbok, Kapitel 1; SVS Practice Guidelines 2020',
    },

    // Kapitel 2: Extra frågor (Neurovaskulär)
    {
      code: 'A2.3',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv innerverar m. tibialis anterior och stortåns dorsalflexion?',
      options: [
        { text: 'N. peroneus profundus', correct: true },
        { text: 'N. peroneus superficialis', correct: false },
        { text: 'N. tibialis', correct: false },
        { text: 'N. suralis', correct: false },
      ],
      explanation: 'N. peroneus profundus innerverar fotens dorsalflexorer (m. tibialis anterior, m. extensor hallucis longus).',
      reference: 'A-ORTIM Kursbok, Kapitel 2',
    },
    {
      code: 'A2.4',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'Patient med knäluxation har palpabel puls men ABI 0.85. Vad gör du?',
      options: [
        { text: 'CT-angio - palpabel puls utesluter ej intimaskada', correct: true },
        { text: 'Avsluta utredningen, pulsen är normal', correct: false },
        { text: 'Endast uppföljning om 1 vecka', correct: false },
        { text: 'MR-undersökning', correct: false },
      ],
      explanation: 'ABI <0.9 indikerar kärlskada även vid palpabel puls. Intimaskador kan ge normala pulsar initialt men progrediera.',
      reference: 'A-ORTIM Kursbok, Kapitel 2; EAST Guidelines',
    },
    {
      code: 'A2.5',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken struktur testar du vid bedömning av n. tibialis-funktion?',
      options: [
        { text: 'Plantarflexion och sensorik i fotsulan', correct: true },
        { text: 'Dorsalflexion av foten', correct: false },
        { text: 'Knäflexion', correct: false },
        { text: 'Höftabduktion', correct: false },
      ],
      explanation: 'N. tibialis innerverar plantarflexorerna och ger sensorik i fotsulan - kritiskt för gångfunktion.',
      reference: 'A-ORTIM Kursbok, Kapitel 2',
    },

    // Kapitel 3: Extra frågor (Intraoperativ)
    {
      code: 'A3.3',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är normalt kompartmenttryck i vila?',
      options: [
        { text: '0-8 mmHg', correct: true },
        { text: '20-30 mmHg', correct: false },
        { text: '40-50 mmHg', correct: false },
        { text: '60-70 mmHg', correct: false },
      ],
      explanation: 'Normalt kompartmenttryck är 0-8 mmHg. Tryck >30 mmHg eller delta-tryck <30 mmHg indikerar fasciotomi.',
      reference: 'A-ORTIM Kursbok, Kapitel 3; McQueen MM JBJS 1996',
    },
    {
      code: 'A3.4',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Under operation för öppen fraktur är du osäker på muskelns viabilitet. Vad gör du?',
      options: [
        { text: 'Bevara tveksam vävnad, planera obligatorisk second-look 48h', correct: true },
        { text: 'Ta bort all tveksam vävnad direkt', correct: false },
        { text: 'Stäng såret och avvakta', correct: false },
        { text: 'Skicka vävnad på fryssnitt', correct: false },
      ],
      explanation: 'Vid tveksam viabilitet: bevara vävnaden och planera second-look efter 48h. Bättre att debridera vid andra tillfället.',
      reference: 'A-ORTIM Kursbok, Kapitel 3; BOA/BAPRAS 2020',
    },
    {
      code: 'A3.5',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken fluorescensmetod kan användas för att bedöma vävnadsperfusion?',
      options: [
        { text: 'Indocyaningrönt (ICG) angiografi', correct: true },
        { text: 'Röntgen med kontrast', correct: false },
        { text: 'MR-spektroskopi', correct: false },
        { text: 'Ultraljud', correct: false },
      ],
      explanation: 'ICG-angiografi är en modern metod för real-time bedömning av vävnadsperfusion intraoperativt.',
      reference: 'A-ORTIM Kursbok, Kapitel 3',
    },

    // Kapitel 4: Extra frågor (Vaskulär reparation)
    {
      code: 'A4.3',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Patient med popliteakärlskada och ischemitid 8 timmar. Vilken sekvens är korrekt?',
      options: [
        { text: 'Shunt → skelettfixation → definitiv kärlrepair → fasciotomi', correct: true },
        { text: 'Skelettfixation → kärlrepair → fasciotomi', correct: false },
        { text: 'Enbart fasciotomi', correct: false },
        { text: 'Amputation direkt', correct: false },
      ],
      explanation: 'Vid lång ischemitid: temporär shunt först för snabb reperfusion, sedan skelettfixation, kärlrepair och profylaktisk fasciotomi.',
      reference: 'A-ORTIM Kursbok, Kapitel 4; Feliciano DV J Trauma 2011',
    },
    {
      code: 'A4.4',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är maximal längd för primär end-to-end kärlsutur?',
      options: [
        { text: 'Cirka 2 cm defekt', correct: true },
        { text: 'Upp till 10 cm', correct: false },
        { text: 'Endast 5 mm', correct: false },
        { text: 'Längden spelar ingen roll', correct: false },
      ],
      explanation: 'End-to-end anastomos är möjlig vid defekt <2 cm. Större defekter kräver graft eller interpositionsven.',
      reference: 'A-ORTIM Kursbok, Kapitel 4',
    },
    {
      code: 'A4.5',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är autolog ven bättre än syntetiskt graft i kontaminerad miljö?',
      options: [
        { text: 'Lägre infektionsrisk och bättre läkning', correct: true },
        { text: 'Billigare', correct: false },
        { text: 'Enklare att sy', correct: false },
        { text: 'Syntetiskt graft finns inte tillgängligt', correct: false },
      ],
      explanation: 'Autolog ven har betydligt lägre infektionsrisk i kontaminerad miljö (öppen fraktur) jämfört med PTFE.',
      reference: 'A-ORTIM Kursbok, Kapitel 4',
    },

    // Kapitel 5: Extra frågor (Fasciotomi)
    {
      code: 'A5.3',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur många kompartment har underbenet?',
      options: [
        { text: '4 stycken', correct: true },
        { text: '2 stycken', correct: false },
        { text: '3 stycken', correct: false },
        { text: '6 stycken', correct: false },
      ],
      explanation: 'Underbenet har 4 kompartment: anteriort, lateralt, ytligt posteriort, djupt posteriort.',
      reference: 'A-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: 'A5.4',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Du utför fasciotomi men patienten har kvarstående högt tryck i djupa posteriora. Vad har gått fel?',
      options: [
        { text: 'Soleus-fascian har ej öppnats genom medial incision', correct: true },
        { text: 'Lateral incision är för kort', correct: false },
        { text: 'Det är normalt', correct: false },
        { text: 'Fler incisioner behövs', correct: false },
      ],
      explanation: 'Djupa posteriora kompartmentet når endast genom incision genom soleus-fascian via medial approach.',
      reference: 'A-ORTIM Kursbok, Kapitel 5',
    },
    {
      code: 'A5.5',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur länge efter kärlskada med reperfusion bör profylaktisk fasciotomi övervägas?',
      options: [
        { text: 'Vid ischemitid >4-6 timmar', correct: true },
        { text: 'Endast vid symtom', correct: false },
        { text: 'Aldrig profylaktiskt', correct: false },
        { text: 'Alltid oavsett tid', correct: false },
      ],
      explanation: 'Profylaktisk fasciotomi rekommenderas vid ischemitid >4-6 timmar pga risk för reperfusionsskada.',
      reference: 'A-ORTIM Kursbok, Kapitel 5; Frykberg et al. J Vasc Surg 2002',
    },

    // Kapitel 6: Extra frågor (Extern fixation)
    {
      code: 'A6.3',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är indikationerna för extern fixation vid akut trauma?',
      options: [
        { text: 'Instabil patient, öppen fraktur IIIB/C, kärlskada som kräver repair', correct: true },
        { text: 'Endast slutna frakturer', correct: false },
        { text: 'Alla tibiafrakturer', correct: false },
        { text: 'Extern fixation är aldrig indicerat akut', correct: false },
      ],
      explanation: 'Extern fixation används vid DCO (instabil patient), svåra öppna frakturer, och frakturer med kärlskada.',
      reference: 'A-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: 'A6.4',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Var ska pinnar INTE placeras vid extern fixation av tibia?',
      options: [
        { text: 'Genom framtida operationsområde eller i infekterad vävnad', correct: true },
        { text: 'Proximalt om frakturen', correct: false },
        { text: 'Distalt om frakturen', correct: false },
        { text: 'I metafysen', correct: false },
      ],
      explanation: 'Pinnar ska undvika framtida operationssnitt och infekterad vävnad. Pin-site infektioner kan äventyra definitiv fixation.',
      reference: 'A-ORTIM Kursbok, Kapitel 6',
    },
    {
      code: 'A6.5',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är "safe corridor" vid tibial pin-placering?',
      options: [
        { text: 'Anteromediala ytan där inga neurovaskulära strukturer finns', correct: true },
        { text: 'Posteriora sidan', correct: false },
        { text: 'Laterala sidan', correct: false },
        { text: 'Alla sidor är lika säkra', correct: false },
      ],
      explanation: 'Anteromediala tibiaytan är subkutan och saknar viktiga strukturer - den säkraste korridoren för pin-placering.',
      reference: 'A-ORTIM Kursbok, Kapitel 6',
    },

    // Kapitel 7: Extra frågor (Mjukdelstäckning)
    {
      code: 'A7.3',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "fix and flap" konceptet tidsmässigt?',
      options: [
        { text: 'Definitiv fixation + mjukdelstäckning inom 72-96 timmar', correct: true },
        { text: 'Fixation och lambå inom 24 timmar', correct: false },
        { text: 'Lambå efter 2 veckor', correct: false },
        { text: 'Tid spelar ingen roll', correct: false },
      ],
      explanation: 'Fix and flap innebär tidig definitiv fixation kombinerat med lambåtäckning inom 72-96h för att minimera infektion.',
      reference: 'A-ORTIM Kursbok, Kapitel 7; Gopal 2000',
    },
    {
      code: 'A7.4',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Exponerad tibia utan periost. Vilket täckningsalternativ?',
      options: [
        { text: 'Lambå (lokal eller fri) krävs', correct: true },
        { text: 'Delhudstransplantat (SSG)', correct: false },
        { text: 'Sekundärläkning', correct: false },
        { text: 'VAC-terapi enbart', correct: false },
      ],
      explanation: 'Ben utan periost tar inte hudtransplantat. Lambå med egen kärlförsörjning krävs för att täcka exponerat ben.',
      reference: 'A-ORTIM Kursbok, Kapitel 7',
    },
    {
      code: 'A7.5',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är fördelen med tidig mjukdelstäckning vid öppen fraktur?',
      options: [
        { text: 'Reducerad infektionsrisk från 29% till 6%', correct: true },
        { text: 'Bättre kosmetiskt resultat', correct: false },
        { text: 'Kortare operationstid', correct: false },
        { text: 'Ingen dokumenterad fördel', correct: false },
      ],
      explanation: 'Gopal 2000 visade dramatisk reduktion av infektionsrisk med tidig täckning (<72h: 6% vs fördröjd: 29%).',
      reference: 'A-ORTIM Kursbok, Kapitel 7; Gopal 2000',
    },

    // Kapitel 8: Extra frågor (Multitrauma)
    {
      code: 'A8.3',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är komponenterna i "the lethal triad"?',
      options: [
        { text: 'Hypotermi, acidos, koagulopati', correct: true },
        { text: 'Hypotension, hypoxi, hypotermi', correct: false },
        { text: 'Tachykardi, hypotension, oliguri', correct: false },
        { text: 'Acidos, hyponatremi, hyperkalemi', correct: false },
      ],
      explanation: 'The lethal triad (dödstriaden) består av hypotermi, acidos och koagulopati - indikerar dålig prognos.',
      reference: 'A-ORTIM Kursbok, Kapitel 8',
    },
    {
      code: 'A8.4',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'ISS 35, bilateral femurfraktur, BT 90, laktat 5. ETC eller DCO?',
      options: [
        { text: 'DCO - patienten är borderline/instabil', correct: true },
        { text: 'ETC - kan göra definitiv fixation direkt', correct: false },
        { text: 'Konservativ behandling', correct: false },
        { text: 'Avvakta och se', correct: false },
      ],
      explanation: 'Borderline-patient (ISS 20-40, bilateral femur, hypotension, förhöjt laktat) = DCO.',
      reference: 'A-ORTIM Kursbok, Kapitel 8; Pape HC J Trauma 2007',
    },
    {
      code: 'A8.5',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär ETC (Early Total Care)?',
      options: [
        { text: 'Definitiv fixation inom 24h hos stabil patient', correct: true },
        { text: 'Endast gipsbehandling', correct: false },
        { text: 'Extern fixation i alla fall', correct: false },
        { text: 'Fördröjd kirurgi efter 2 veckor', correct: false },
      ],
      explanation: 'ETC innebär tidig definitiv fixation (inom 24-36h) hos hemodynamiskt stabil patient utan fysiologisk kompromittering.',
      reference: 'A-ORTIM Kursbok, Kapitel 8; Vallier HA JBJS 2013',
    },

    // Kapitel 9: Extra frågor (Mangled extremity)
    {
      code: 'A9.3',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'MESS-score 8 hos 55-årig patient. Tibialis posterior-funktion bevarad. Beslut?',
      options: [
        { text: 'Diskutera med patient - limb salvage kan övervägas trots hög MESS', correct: true },
        { text: 'Amputation obligatoriskt vid MESS ≥7', correct: false },
        { text: 'Ignorera MESS-score', correct: false },
        { text: 'Avvakta 48h', correct: false },
      ],
      explanation: 'MESS är vägledande, ej absolut. Bevarad n. tibialis posterior-funktion och patientens önskemål väger tungt.',
      reference: 'A-ORTIM Kursbok, Kapitel 9; Johansen K J Trauma 1990',
    },
    {
      code: 'A9.4',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är n. tibialis posterior-funktion avgörande vid limb salvage beslut?',
      options: [
        { text: 'Sensorik i fotsulan är essentiell för gångfunktion', correct: true },
        { text: 'Det är den starkaste muskeln', correct: false },
        { text: 'Den läker snabbast', correct: false },
        { text: 'Ingen särskild betydelse', correct: false },
      ],
      explanation: 'Utan sensorik i fotsulan (n. tibialis) utvecklar patienten trycksår och har svårt att gå - funktionellt resultat blir dåligt.',
      reference: 'A-ORTIM Kursbok, Kapitel 9',
    },
    {
      code: 'A9.5',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka faktorer ingår i MESS-beräkningen?',
      options: [
        { text: 'Skelett/mjukdelsskada, ischemi, chock, ålder', correct: true },
        { text: 'Endast ischemitid', correct: false },
        { text: 'Frakturtyp och kön', correct: false },
        { text: 'Blodtryck och puls', correct: false },
      ],
      explanation: 'MESS inkluderar: skelett/mjukdelsskada (1-4p), ischemi (1-6p, dubblas vid >6h), chock (0-2p), ålder (0-2p).',
      reference: 'A-ORTIM Kursbok, Kapitel 9; Johansen K J Trauma 1990',
    },

    // Kapitel 10: Extra frågor (Bäckentrauma)
    {
      code: 'A10.3',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Instabil bäckenfraktur, icke-responder på resuscitering. CT visar arteriell kontrastextravasering. Nästa steg?',
      options: [
        { text: 'Preperitonal packing följt av angioembolisering om fortsatt instabil', correct: true },
        { text: 'Endast bäckenbälte', correct: false },
        { text: 'Definitiv fixation direkt', correct: false },
        { text: 'Avvakta och ge mer vätska', correct: false },
      ],
      explanation: 'Non-responder med arteriell blödning: PPP kontrollerar venös blödning (80%), sedan angio för arteriell (15%).',
      reference: 'A-ORTIM Kursbok, Kapitel 10; WSES Guidelines 2017',
    },
    {
      code: 'A10.4',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är REBOA och när används det?',
      options: [
        { text: 'Resuscitative Endovascular Balloon Occlusion of Aorta - temporär bridge vid massiv blödning', correct: true },
        { text: 'Radiologisk undersökning', correct: false },
        { text: 'Rehabiliteringsmetod', correct: false },
        { text: 'Antibiotika', correct: false },
      ],
      explanation: 'REBOA är en temporär åtgärd med aortaocklusion via ballongkateter för att köpa tid vid massiv blödning.',
      reference: 'A-ORTIM Kursbok, Kapitel 10; Brenner 2018',
    },
    {
      code: 'A10.5',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken zon placeras REBOA vid bäckenblödning?',
      options: [
        { text: 'Zon III (infrarenal aorta)', correct: true },
        { text: 'Zon I (supraceliak)', correct: false },
        { text: 'Zon II (pararenal)', correct: false },
        { text: 'Bröstaorta', correct: false },
      ],
      explanation: 'Zon III-placering (infrarenalt) är lämplig för bäckenblödning. Zon I används vid intraabdominell blödning.',
      reference: 'A-ORTIM Kursbok, Kapitel 10',
    },

    // Kapitel 11: Extra frågor (Pediatrisk)
    {
      code: 'A11.3',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket är normalt systoliskt blodtryck hos ett 6-årigt barn?',
      options: [
        { text: 'Cirka 90-110 mmHg', correct: true },
        { text: '60-70 mmHg', correct: false },
        { text: '120-140 mmHg', correct: false },
        { text: '70-80 mmHg', correct: false },
      ],
      explanation: 'Normalt systoliskt BT hos 6-12 år är 90-110 mmHg. Barn kompenserar med tachykardi innan BT faller.',
      reference: 'A-ORTIM Kursbok, Kapitel 11; ATLS 10th ed',
    },
    {
      code: 'A11.4',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'Vätskevolym för initial bolus till barn i chock?',
      options: [
        { text: '20 ml/kg Ringer, upprepa x2 vid behov', correct: true },
        { text: '1 liter direkt', correct: false },
        { text: '5 ml/kg', correct: false },
        { text: '50 ml/kg', correct: false },
      ],
      explanation: 'Barn: 20 ml/kg bolus, kan upprepas 2 gånger. Om fortsatt instabil: blodtransfusion.',
      reference: 'A-ORTIM Kursbok, Kapitel 11; ATLS 10th ed',
    },
    {
      code: 'A11.5',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är barn känsligare för hypotermi vid trauma?',
      options: [
        { text: 'Större kroppsyta i förhållande till vikt = snabbare värmeförlust', correct: true },
        { text: 'Barn fryser lätt pga rädsla', correct: false },
        { text: 'Barn har tunnare hud', correct: false },
        { text: 'Ingen skillnad mot vuxna', correct: false },
      ],
      explanation: 'Barn har högre yta/volym-kvot och förlorar värme snabbare. Aktiv uppvärmning är kritiskt.',
      reference: 'A-ORTIM Kursbok, Kapitel 11',
    },

    // Kapitel 12: Extra frågor (Teamledning)
    {
      code: 'A12.3',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'Som traumaledare märker du att teamet verkar okoordinerat. Vad gör du?',
      options: [
        { text: 'Stoppa, återta kontrollen, fördela roller tydligt, fortsätt strukturerat', correct: true },
        { text: 'Ropa högre', correct: false },
        { text: 'Lämna rummet', correct: false },
        { text: 'Börja själv utföra åtgärderna', correct: false },
      ],
      explanation: 'Traumaledaren ska återta kontrollen, tydliggöra roller och använda closed-loop kommunikation.',
      reference: 'A-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: 'A12.4',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken position ska traumaledaren ha under mottagandet?',
      options: [
        { text: 'Vid fotändan för överblick, delegerar men utför ej själv', correct: true },
        { text: 'Vid huvudändan för att intubera', correct: false },
        { text: 'Utanför rummet', correct: false },
        { text: 'Position spelar ingen roll', correct: false },
      ],
      explanation: 'Traumaledaren ska ha överblick (vid fotändan), leda teamet och delegera - inte själv utföra åtgärder.',
      reference: 'A-ORTIM Kursbok, Kapitel 12',
    },
    {
      code: 'A12.5',
      chapterNumber: 12,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är syftet med hot debrief efter traumamottagning?',
      options: [
        { text: 'Direkt feedback, emotionell ventilering, snabb identifiering av förbättringsområden', correct: true },
        { text: 'Att fördela skuld', correct: false },
        { text: 'Administrativ dokumentation', correct: false },
        { text: 'Det är inte nödvändigt', correct: false },
      ],
      explanation: 'Hot debrief (5 min direkt efter) ger snabb feedback, stödjer teamet emotionellt och identifierar akuta problem.',
      reference: 'A-ORTIM Kursbok, Kapitel 12',
    },

    // Kapitel 13: Extra frågor (Masskada)
    {
      code: 'A13.3',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad definierar en masskadesituation?',
      options: [
        { text: 'Antalet skadade överstiger tillgängliga resurser med normala rutiner', correct: true },
        { text: 'Fler än 10 skadade', correct: false },
        { text: 'Fler än 50 skadade', correct: false },
        { text: 'Alla olyckor med mer än 5 personer', correct: false },
      ],
      explanation: 'Masskada = resursbrist. Definitionen beror på tillgängliga resurser, inte ett fast antal.',
      reference: 'A-ORTIM Kursbok, Kapitel 13',
    },
    {
      code: 'A13.4',
      chapterNumber: 13,
      bloomLevel: 'APPLICATION',
      question: 'Vid START-triage: patienten går ej, andas, AF 35, kapillär återfyllnad 1 sekund. Kategori?',
      options: [
        { text: 'RÖD - AF >30/min', correct: true },
        { text: 'GUL', correct: false },
        { text: 'GRÖN', correct: false },
        { text: 'SVART', correct: false },
      ],
      explanation: 'AF >30/min = RÖD oavsett övriga parametrar. Patienten behöver omedelbar hjälp.',
      reference: 'A-ORTIM Kursbok, Kapitel 13',
    },
    {
      code: 'A13.5',
      chapterNumber: 13,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför påbörjas ej HLR vid masskada för patienter klassade som SVART?',
      options: [
        { text: 'Resurserna prioriteras till räddningsbara patienter', correct: true },
        { text: 'HLR fungerar aldrig', correct: false },
        { text: 'Det är olagligt', correct: false },
        { text: 'Personalens säkerhet', correct: false },
      ],
      explanation: 'Vid resursbrist prioriteras insatser till patienter som kan räddas. HLR kräver många resurser med låg chans till överlevnad.',
      reference: 'A-ORTIM Kursbok, Kapitel 13',
    },

    // Kapitel 14: Extra frågor (Kvalitet)
    {
      code: 'A14.3',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är huvudkomponenterna i en M&M-konferens?',
      options: [
        { text: 'Fallpresentation, analys av avvikelser, identifiering av systemfel, förbättringsåtgärder', correct: true },
        { text: 'Endast fallpresentation', correct: false },
        { text: 'Att hitta syndabockar', correct: false },
        { text: 'Statistisk rapportering', correct: false },
      ],
      explanation: 'M&M fokuserar på systemförbättring, ej skuld. Strukturerad genomgång identifierar system- och processfel.',
      reference: 'A-ORTIM Kursbok, Kapitel 14',
    },
    {
      code: 'A14.4',
      chapterNumber: 14,
      bloomLevel: 'APPLICATION',
      question: 'Traumaregistret visar ökad tid till fasciotomi. Hur adresseras detta?',
      options: [
        { text: 'PDSA-cykel: identifiera orsak, testa intervention, utvärdera, implementera', correct: true },
        { text: 'Ignorera data', correct: false },
        { text: 'Byta ut personalen', correct: false },
        { text: 'Sluta mäta', correct: false },
      ],
      explanation: 'Kvalitetsförbättring använder PDSA-cykel för att systematiskt testa och implementera förbättringar.',
      reference: 'A-ORTIM Kursbok, Kapitel 14',
    },
    {
      code: 'A14.5',
      chapterNumber: 14,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är traumaregister viktiga?',
      options: [
        { text: 'Möjliggör benchmarking, identifierar förbättringsområden, följer utfall över tid', correct: true },
        { text: 'Endast för forskning', correct: false },
        { text: 'Lagkrav utan kliniskt värde', correct: false },
        { text: 'Administrativ börda', correct: false },
      ],
      explanation: 'Traumaregister ger data för kvalitetsförbättring, jämförelser mellan centra och utfallsuppföljning.',
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

// Vascular Injury Management Algorithm
// References: EAST Guidelines 2012, Feliciano DV et al. J Trauma 2011, Rich NM Vascular Trauma 2nd ed
function getVascularInjuryAlgorithmSVG(): string {
  return `<svg viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 13px sans-serif; fill: white; }
    .text { font: 11px sans-serif; fill: #333; }
    .ref { font: italic 9px sans-serif; fill: #666; }
    .decision { font: bold 11px sans-serif; fill: #333; }
  </style>

  <text x="450" y="25" text-anchor="middle" class="title">Vaskulär Skada - Handläggningsalgoritm</text>
  <text x="450" y="42" text-anchor="middle" class="ref">Ref: EAST Guidelines 2012, Feliciano DV J Trauma 2011, SVS Practice Guidelines 2020</text>

  <!-- Start: Misstänkt kärlskada -->
  <rect x="350" y="55" width="200" height="40" fill="#3498db" rx="8"/>
  <text x="450" y="80" text-anchor="middle" class="header">Misstänkt kärlskada?</text>

  <!-- Hard signs -->
  <line x1="450" y1="95" x2="450" y2="115" stroke="#333" stroke-width="2"/>
  <rect x="250" y="115" width="180" height="80" fill="#e74c3c" rx="8"/>
  <text x="340" y="138" text-anchor="middle" class="header">HARD SIGNS</text>
  <text x="260" y="155" class="text" fill="white">• Pulserande blödning</text>
  <text x="260" y="170" class="text" fill="white">• Expanderande hematom</text>
  <text x="260" y="185" class="text" fill="white">• Palpabel thrill/blåsljud</text>

  <rect x="470" y="115" width="180" height="80" fill="#f39c12" rx="8"/>
  <text x="560" y="138" text-anchor="middle" class="header">SOFT SIGNS</text>
  <text x="480" y="155" class="text" fill="white">• Icke-expanderande hematom</text>
  <text x="480" y="170" class="text" fill="white">• Nervskada intill kärl</text>
  <text x="480" y="185" class="text" fill="white">• Oförklarlig hypotension</text>

  <!-- Hard signs path -->
  <line x1="340" y1="195" x2="340" y2="220" stroke="#333" stroke-width="2"/>
  <rect x="250" y="220" width="180" height="35" fill="#c0392b" rx="8"/>
  <text x="340" y="243" text-anchor="middle" class="header">DIREKT TILL OP</text>

  <!-- Soft signs path -->
  <line x1="560" y1="195" x2="560" y2="220" stroke="#333" stroke-width="2"/>
  <rect x="470" y="220" width="180" height="35" fill="#3498db" rx="8"/>
  <text x="560" y="243" text-anchor="middle" class="header">ABI + CT-ANGIO</text>

  <!-- ABI decision -->
  <line x1="560" y1="255" x2="560" y2="285" stroke="#333" stroke-width="2"/>
  <rect x="470" y="285" width="180" height="35" fill="#9b59b6" rx="8"/>
  <text x="560" y="308" text-anchor="middle" class="header">ABI &lt; 0.9?</text>

  <line x1="470" y1="302" x2="400" y2="302" stroke="#333" stroke-width="2"/>
  <line x1="400" y1="302" x2="400" y2="340" stroke="#333" stroke-width="2"/>
  <text x="430" y="295" class="decision">JA</text>
  <rect x="310" y="340" width="180" height="35" fill="#e74c3c" rx="8"/>
  <text x="400" y="363" text-anchor="middle" class="header">Kärlkirurgisk exploration</text>

  <line x1="650" y1="302" x2="700" y2="302" stroke="#333" stroke-width="2"/>
  <line x1="700" y1="302" x2="700" y2="340" stroke="#333" stroke-width="2"/>
  <text x="670" y="295" class="decision">NEJ</text>
  <rect x="610" y="340" width="180" height="35" fill="#27ae60" rx="8"/>
  <text x="700" y="363" text-anchor="middle" class="header">Observation 24h + ABI</text>

  <!-- Surgical options -->
  <line x1="340" y1="255" x2="340" y2="400" stroke="#333" stroke-width="2"/>
  <line x1="400" y1="375" x2="400" y2="400" stroke="#333" stroke-width="2"/>
  <line x1="340" y1="400" x2="560" y2="400" stroke="#333" stroke-width="2"/>

  <rect x="300" y="410" width="400" height="40" fill="#1a5276" rx="8"/>
  <text x="500" y="435" text-anchor="middle" class="header">OPERATIV STRATEGI</text>

  <!-- Shunt vs repair -->
  <line x1="400" y1="450" x2="400" y2="470" stroke="#333" stroke-width="2"/>
  <line x1="600" y1="450" x2="600" y2="470" stroke="#333" stroke-width="2"/>

  <rect x="50" y="470" width="220" height="100" fill="#e74c3c" rx="8"/>
  <text x="160" y="495" text-anchor="middle" class="header">TILLFÄLLIG SHUNT</text>
  <text x="60" y="515" class="text" fill="white">Indikationer:</text>
  <text x="60" y="530" class="text" fill="white">• Instabil patient (DCO)</text>
  <text x="60" y="545" class="text" fill="white">• Ischemitid &gt;6h</text>
  <text x="60" y="560" class="text" fill="white">• Behov av skelettfixation först</text>

  <rect x="290" y="470" width="220" height="100" fill="#27ae60" rx="8"/>
  <text x="400" y="495" text-anchor="middle" class="header">PRIMÄR REPAIR</text>
  <text x="300" y="515" class="text" fill="white">• Lateral sutur (&lt;50% circumferens)</text>
  <text x="300" y="530" class="text" fill="white">• End-to-end (&lt;2cm defekt)</text>
  <text x="300" y="545" class="text" fill="white">• Autolog vengraft (förstaval)</text>
  <text x="300" y="560" class="text" fill="white">• PTFE om ingen ven tillgänglig</text>

  <rect x="530" y="470" width="220" height="100" fill="#3498db" rx="8"/>
  <text x="640" y="495" text-anchor="middle" class="header">ENDOVASKULÄRT</text>
  <text x="540" y="515" class="text" fill="white">Indikationer:</text>
  <text x="540" y="530" class="text" fill="white">• Pseudoaneurysm</text>
  <text x="540" y="545" class="text" fill="white">• AV-fistel</text>
  <text x="540" y="560" class="text" fill="white">• Svåråtkomlig lokalisation</text>

  <!-- Fasciotomy reminder -->
  <rect x="150" y="590" width="600" height="50" fill="#9b59b6" rx="8"/>
  <text x="450" y="615" text-anchor="middle" class="header">⚠ ALLTID ÖVERVÄG FASCIOTOMI vid ischemitid &gt;4-6h eller reperfusion</text>
  <text x="450" y="632" text-anchor="middle" class="text" fill="white">Ref: Defined Frykberg et al. J Vasc Surg 2002 - Reperfusionsskada kräver profylaktisk fasciotomi</text>

  <!-- References -->
  <text x="450" y="665" text-anchor="middle" class="ref">EAST: Stable hematoma without hard signs - observe with serial ABI (Level II)</text>
  <text x="450" y="680" text-anchor="middle" class="ref">SVS 2020: CTA sensitivity 96%, specificity 99% for extremity vascular injury</text>
</svg>`;
}

// DCO vs ETC Decision Algorithm
// References: Pape HC et al. J Trauma 2007, Vallier HA et al. JBJS 2013, OTA Guidelines
function getDCOvsETCAlgorithmSVG(): string {
  return `<svg viewBox="0 0 900 750" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 13px sans-serif; fill: white; }
    .text { font: 11px sans-serif; fill: #333; }
    .ref { font: italic 9px sans-serif; fill: #666; }
    .value { font: bold 12px sans-serif; fill: white; }
  </style>

  <text x="450" y="25" text-anchor="middle" class="title">DCO vs ETC - Beslutsalgoritm vid Multitrauma</text>
  <text x="450" y="42" text-anchor="middle" class="ref">Ref: Pape HC J Trauma 2007, Vallier HA JBJS 2013, Roberts CS Injury 2005</text>

  <!-- Patient categories -->
  <rect x="50" y="60" width="200" height="120" fill="#27ae60" rx="8"/>
  <text x="150" y="85" text-anchor="middle" class="header">STABIL</text>
  <text x="60" y="105" class="text" fill="white">• Hemodynamiskt stabil</text>
  <text x="60" y="120" class="text" fill="white">• Ingen koagulopati</text>
  <text x="60" y="135" class="text" fill="white">• Ingen hypotermi</text>
  <text x="60" y="150" class="text" fill="white">• Ingen acidos</text>
  <text x="60" y="168" class="value">→ ETC möjlig</text>

  <rect x="270" y="60" width="200" height="120" fill="#f39c12" rx="8"/>
  <text x="370" y="85" text-anchor="middle" class="header">BORDERLINE</text>
  <text x="280" y="105" class="text" fill="white">• ISS 20-40</text>
  <text x="280" y="120" class="text" fill="white">• Initial hypotension</text>
  <text x="280" y="135" class="text" fill="white">• Bilaterala femur-fx</text>
  <text x="280" y="150" class="text" fill="white">• Thoraxtrauma (AIS≥2)</text>
  <text x="280" y="168" class="value">→ Individuell bedömning</text>

  <rect x="490" y="60" width="200" height="120" fill="#e74c3c" rx="8"/>
  <text x="590" y="85" text-anchor="middle" class="header">INSTABIL</text>
  <text x="500" y="105" class="text" fill="white">• Chock (SBT &lt;90)</text>
  <text x="500" y="120" class="text" fill="white">• Pågående blödning</text>
  <text x="500" y="135" class="text" fill="white">• Massiv transfusion</text>
  <text x="500" y="150" class="text" fill="white">• Koagulopati</text>
  <text x="500" y="168" class="value">→ DCO obligatoriskt</text>

  <rect x="710" y="60" width="170" height="120" fill="#7f8c8d" rx="8"/>
  <text x="795" y="85" text-anchor="middle" class="header">IN EXTREMIS</text>
  <text x="720" y="105" class="text" fill="white">• pH &lt;7.1</text>
  <text x="720" y="120" class="text" fill="white">• Temp &lt;32°C</text>
  <text x="720" y="135" class="text" fill="white">• Laktat &gt;10</text>
  <text x="720" y="150" class="text" fill="white">• Massiv blödning</text>
  <text x="720" y="168" class="value">→ Endast livräddande</text>

  <!-- Physiological parameters -->
  <rect x="100" y="200" width="700" height="130" fill="#1a5276" rx="8"/>
  <text x="450" y="225" text-anchor="middle" class="header">FYSIOLOGISKA PARAMETRAR FÖR DCO-BESLUT</text>

  <text x="130" y="255" class="text" fill="white">Parameter</text>
  <text x="350" y="255" class="text" fill="white">Gränsvärde för DCO</text>
  <text x="600" y="255" class="text" fill="white">Evidensnivå</text>

  <line x1="120" y1="265" x2="780" y2="265" stroke="white" stroke-width="1"/>

  <text x="130" y="285" class="text" fill="white">pH</text>
  <text x="350" y="285" class="value">&lt; 7.25</text>
  <text x="600" y="285" class="text" fill="white">Pape 2007 (Level III)</text>

  <text x="130" y="305" class="text" fill="white">Temperatur</text>
  <text x="350" y="305" class="value">&lt; 35°C</text>
  <text x="600" y="305" class="text" fill="white">Jurkovich 1987 (Level II)</text>

  <text x="130" y="325" class="text" fill="white">Laktat</text>
  <text x="350" y="325" class="value">&gt; 4 mmol/L</text>
  <text x="600" y="325" class="text" fill="white">Vallier 2013 (Level II)</text>

  <!-- Flowchart for borderline -->
  <text x="450" y="360" text-anchor="middle" class="title" style="font-size:16px">Borderline-patient: Beslutsflöde</text>

  <rect x="350" y="375" width="200" height="35" fill="#3498db" rx="8"/>
  <text x="450" y="398" text-anchor="middle" class="header">Initial stabilisering 30-60 min</text>

  <line x1="450" y1="410" x2="450" y2="440" stroke="#333" stroke-width="2"/>

  <rect x="350" y="440" width="200" height="35" fill="#9b59b6" rx="8"/>
  <text x="450" y="463" text-anchor="middle" class="header">Responerar på resuscitering?</text>

  <line x1="350" y1="457" x2="250" y2="457" stroke="#333" stroke-width="2"/>
  <line x1="250" y1="457" x2="250" y2="500" stroke="#333" stroke-width="2"/>
  <text x="290" y="450" class="text">NEJ</text>

  <line x1="550" y1="457" x2="650" y2="457" stroke="#333" stroke-width="2"/>
  <line x1="650" y1="457" x2="650" y2="500" stroke="#333" stroke-width="2"/>
  <text x="590" y="450" class="text">JA</text>

  <rect x="150" y="500" width="200" height="80" fill="#e74c3c" rx="8"/>
  <text x="250" y="525" text-anchor="middle" class="header">DCO</text>
  <text x="160" y="545" class="text" fill="white">• Extern fixation</text>
  <text x="160" y="560" class="text" fill="white">• Blödningskontroll</text>
  <text x="160" y="575" class="text" fill="white">• IVA för optimering</text>

  <rect x="550" y="500" width="200" height="80" fill="#27ae60" rx="8"/>
  <text x="650" y="525" text-anchor="middle" class="header">ETC möjlig</text>
  <text x="560" y="545" class="text" fill="white">• Definitiv fixation</text>
  <text x="560" y="560" class="text" fill="white">• Inom 24-36h</text>
  <text x="560" y="575" class="text" fill="white">• Monitorera kontinuerligt</text>

  <!-- Second hit concept -->
  <rect x="100" y="600" width="700" height="70" fill="#c0392b" rx="8"/>
  <text x="450" y="625" text-anchor="middle" class="header">⚠ "SECOND HIT" FENOMENET</text>
  <text x="120" y="645" class="text" fill="white">Stor definitiv kirurgi hos fysiologiskt komprometterad patient → förvärrad inflammation → ARDS, MODS, död</text>
  <text x="450" y="662" text-anchor="middle" class="ref" style="fill: white">Pape HC: "Damage control orthopedics" reduces second hit by staged surgery (J Trauma 2007)</text>

  <!-- Evidence box -->
  <rect x="100" y="685" width="700" height="45" fill="#34495e" rx="8"/>
  <text x="450" y="705" text-anchor="middle" class="text" fill="white">EVIDENS: DCO reducerar ARDS (3% vs 21%, p&lt;0.01) och mortalitet hos borderline-patienter</text>
  <text x="450" y="722" text-anchor="middle" class="ref" style="fill: #bbb">Pape HC et al. J Orthop Trauma 2007;21:S1-S162, Vallier HA et al. JBJS 2013;95:294-302</text>
</svg>`;
}

// Open Fracture Management Algorithm
// References: BOA/BAPRAS Standards 2020, Gustilo-Anderson Classification, EAST Guidelines
function getOpenFractureAlgorithmSVG(): string {
  return `<svg viewBox="0 0 900 800" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 13px sans-serif; fill: white; }
    .text { font: 11px sans-serif; fill: #333; }
    .ref { font: italic 9px sans-serif; fill: #666; }
    .time { font: bold 14px sans-serif; fill: #e74c3c; }
  </style>

  <text x="450" y="25" text-anchor="middle" class="title">Öppen Fraktur - Handläggningsalgoritm</text>
  <text x="450" y="42" text-anchor="middle" class="ref">Ref: BOA/BAPRAS Standards 2020, EAST Guidelines 2011, Gustilo RB JBJS 1976/1984</text>

  <!-- Gustilo Classification -->
  <rect x="50" y="60" width="800" height="120" fill="#1a5276" rx="8"/>
  <text x="450" y="85" text-anchor="middle" class="header">GUSTILO-ANDERSON KLASSIFIKATION</text>

  <rect x="70" y="95" width="150" height="75" fill="#27ae60" rx="5"/>
  <text x="145" y="115" text-anchor="middle" class="header">TYP I</text>
  <text x="80" y="132" class="text" fill="white">• Sår &lt;1 cm</text>
  <text x="80" y="147" class="text" fill="white">• Låg energi</text>
  <text x="80" y="162" class="text" fill="white">• Minimal kontaminering</text>

  <rect x="235" y="95" width="150" height="75" fill="#f39c12" rx="5"/>
  <text x="310" y="115" text-anchor="middle" class="header">TYP II</text>
  <text x="245" y="132" class="text" fill="white">• Sår 1-10 cm</text>
  <text x="245" y="147" class="text" fill="white">• Måttlig mjukdelsskada</text>
  <text x="245" y="162" class="text" fill="white">• Adekvat täckning</text>

  <rect x="400" y="95" width="150" height="75" fill="#e67e22" rx="5"/>
  <text x="475" y="115" text-anchor="middle" class="header">TYP IIIA</text>
  <text x="410" y="132" class="text" fill="white">• Sår &gt;10 cm</text>
  <text x="410" y="147" class="text" fill="white">• Hög energi</text>
  <text x="410" y="162" class="text" fill="white">• Täckning möjlig</text>

  <rect x="565" y="95" width="130" height="75" fill="#e74c3c" rx="5"/>
  <text x="630" y="115" text-anchor="middle" class="header">TYP IIIB</text>
  <text x="575" y="132" class="text" fill="white">• Perioststripping</text>
  <text x="575" y="147" class="text" fill="white">• Exponerat ben</text>
  <text x="575" y="162" class="text" fill="white">• Kräver lambå</text>

  <rect x="710" y="95" width="125" height="75" fill="#8e44ad" rx="5"/>
  <text x="772" y="115" text-anchor="middle" class="header">TYP IIIC</text>
  <text x="720" y="132" class="text" fill="white">• Kärlskada som</text>
  <text x="720" y="147" class="text" fill="white">  kräver repair</text>
  <text x="720" y="162" class="text" fill="white">• Ischemisk extremitet</text>

  <!-- Timeline -->
  <text x="450" y="205" text-anchor="middle" class="title" style="font-size:16px">Tidskritiska åtgärder (BOA/BAPRAS 2020)</text>

  <rect x="50" y="220" width="180" height="90" fill="#3498db" rx="8"/>
  <text x="140" y="245" text-anchor="middle" class="header">AKUTMOTTAGNING</text>
  <text x="140" y="265" text-anchor="middle" class="time">&lt;1 timme</text>
  <text x="60" y="285" class="text" fill="white">• Fotodokumentation</text>
  <text x="60" y="300" class="text" fill="white">• Saline-fuktigt förband</text>

  <line x1="230" y1="265" x2="270" y2="265" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>

  <rect x="270" y="220" width="180" height="90" fill="#9b59b6" rx="8"/>
  <text x="360" y="245" text-anchor="middle" class="header">ANTIBIOTIKA</text>
  <text x="360" y="265" text-anchor="middle" class="time">&lt;1 timme</text>
  <text x="280" y="285" class="text" fill="white">• I-II: Cefuroxim 1.5g</text>
  <text x="280" y="300" class="text" fill="white">• III: +Gentamicin 5mg/kg</text>

  <line x1="450" y1="265" x2="490" y2="265" stroke="#333" stroke-width="2"/>

  <rect x="490" y="220" width="180" height="90" fill="#e74c3c" rx="8"/>
  <text x="580" y="245" text-anchor="middle" class="header">DEBRIDERING</text>
  <text x="580" y="265" text-anchor="middle" class="time">&lt;12 timmar*</text>
  <text x="500" y="285" class="text" fill="white">• Tvättning 6-9L NaCl</text>
  <text x="500" y="300" class="text" fill="white">• Excision av nekros</text>

  <line x1="670" y1="265" x2="710" y2="265" stroke="#333" stroke-width="2"/>

  <rect x="710" y="220" width="160" height="90" fill="#27ae60" rx="8"/>
  <text x="790" y="245" text-anchor="middle" class="header">STABILISERING</text>
  <text x="790" y="265" text-anchor="middle" class="time">&lt;24 timmar</text>
  <text x="720" y="285" class="text" fill="white">• Ex-fix eller definitiv</text>
  <text x="720" y="300" class="text" fill="white">• Baserat på patient</text>

  <text x="450" y="330" text-anchor="middle" class="ref">*BOA/BAPRAS 2020: "No evidence supports 6-hour rule" - fokus på kvalitet före hastighet</text>

  <!-- Antibiotic protocol -->
  <rect x="50" y="350" width="400" height="160" fill="#2c3e50" rx="8"/>
  <text x="250" y="375" text-anchor="middle" class="header">ANTIBIOTIKAPROTOKOLL (EAST 2011)</text>

  <text x="70" y="400" class="text" fill="white">Typ I-II:</text>
  <text x="150" y="400" class="text" fill="#27ae60">Cefuroxim 1.5g x 3 i 24h</text>

  <text x="70" y="420" class="text" fill="white">Typ III:</text>
  <text x="150" y="420" class="text" fill="#f39c12">Cefuroxim + Gentamicin i 72h</text>

  <text x="70" y="440" class="text" fill="white">Jordkontaminering:</text>
  <text x="180" y="440" class="text" fill="#e74c3c">Tillägg av Bensyl-PC (Clostridium)</text>

  <text x="70" y="460" class="text" fill="white">Vattenexponering:</text>
  <text x="180" y="460" class="text" fill="#e74c3c">Tillägg av Ciprofloxacin (Aeromonas)</text>

  <text x="250" y="495" text-anchor="middle" class="ref" style="fill:#bbb">Evidens: Antibiotika &lt;3h reducerar infektion (Patzakis 1974, Level II)</text>

  <!-- Soft tissue coverage -->
  <rect x="470" y="350" width="400" height="160" fill="#16a085" rx="8"/>
  <text x="670" y="375" text-anchor="middle" class="header">MJUKDELSTÄCKNING - "FIX AND FLAP"</text>

  <text x="490" y="400" class="text" fill="white">Mål: Definitiv täckning inom 72-96h</text>

  <text x="490" y="425" class="text" fill="white">IIIA: Primärstängning/SSG ofta möjlig</text>
  <text x="490" y="445" class="text" fill="white">IIIB: Lokal/fri lambå krävs</text>
  <text x="490" y="465" class="text" fill="white">IIIC: Vaskulär repair före täckning</text>

  <text x="670" y="495" text-anchor="middle" class="ref" style="fill:#fff">Gopal 2000: Täckning &lt;72h → 6% infektionsrisk vs 29% vid fördröjning</text>

  <!-- Second look -->
  <rect x="50" y="530" width="820" height="80" fill="#8e44ad" rx="8"/>
  <text x="460" y="555" text-anchor="middle" class="header">SECOND LOOK - 48-72 TIMMAR</text>
  <text x="70" y="580" class="text" fill="white">Obligatoriskt vid: Typ IIIB/C, tveksam viabilitet, massiv kontaminering, fasciotomi</text>
  <text x="70" y="600" class="text" fill="white">Syfte: Ny debridering, bedöm täckningsmöjlighet, verifiera kärlcirkulation vid shunt</text>

  <!-- Key outcomes -->
  <rect x="50" y="630" width="400" height="90" fill="#c0392b" rx="8"/>
  <text x="250" y="655" text-anchor="middle" class="header">KOMPLIKATIONSRISK</text>
  <text x="70" y="680" class="text" fill="white">Typ I: Infektion 0-2%</text>
  <text x="70" y="695" class="text" fill="white">Typ II: Infektion 2-5%</text>
  <text x="70" y="710" class="text" fill="white">Typ III: Infektion 10-50%</text>

  <rect x="470" y="630" width="400" height="90" fill="#27ae60" rx="8"/>
  <text x="670" y="655" text-anchor="middle" class="header">NYCKELFAKTORER</text>
  <text x="490" y="680" class="text" fill="white">✓ Tidig antibiotika (&lt;1h)</text>
  <text x="490" y="695" class="text" fill="white">✓ Adekvat debridering</text>
  <text x="490" y="710" class="text" fill="white">✓ Tidig mjukdelstäckning (&lt;72h)</text>

  <!-- References footer -->
  <text x="450" y="745" text-anchor="middle" class="ref">BOA/BAPRAS: British Orthopaedic Association and British Association of Plastic Surgeons Standards for Trauma 2020</text>
  <text x="450" y="760" text-anchor="middle" class="ref">EAST: Eastern Association for the Surgery of Trauma Guidelines - Open Fractures 2011</text>
</svg>`;
}

// Pelvic Hemorrhage Management Algorithm
// References: ATLS 10th ed, WSES Guidelines 2017, Coccolini F World J Emerg Surg 2017
function getPelvicHemorrhageAlgorithmSVG(): string {
  return `<svg viewBox="0 0 900 750" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 13px sans-serif; fill: white; }
    .text { font: 11px sans-serif; fill: #333; }
    .ref { font: italic 9px sans-serif; fill: #666; }
    .percent { font: bold 14px sans-serif; fill: white; }
  </style>

  <text x="450" y="25" text-anchor="middle" class="title">Bäckenblödning - Handläggningsalgoritm</text>
  <text x="450" y="42" text-anchor="middle" class="ref">Ref: ATLS 10th ed 2018, WSES Guidelines 2017, Coccolini F World J Emerg Surg 2017</text>

  <!-- Bleeding sources -->
  <rect x="50" y="60" width="800" height="90" fill="#1a5276" rx="8"/>
  <text x="450" y="85" text-anchor="middle" class="header">BLÖDNINGSKÄLLOR VID BÄCKENTRAUMA</text>

  <rect x="70" y="95" width="200" height="45" fill="#9b59b6" rx="5"/>
  <text x="170" y="115" text-anchor="middle" class="header">VENÖS PLEXUS</text>
  <text x="170" y="132" text-anchor="middle" class="percent">80%</text>

  <rect x="290" y="95" width="200" height="45" fill="#e74c3c" rx="5"/>
  <text x="390" y="115" text-anchor="middle" class="header">ARTERIELL</text>
  <text x="390" y="132" text-anchor="middle" class="percent">15%</text>

  <rect x="510" y="95" width="200" height="45" fill="#f39c12" rx="5"/>
  <text x="610" y="115" text-anchor="middle" class="header">FRAKTURYTA</text>
  <text x="610" y="132" text-anchor="middle" class="percent">5%</text>

  <!-- Initial management -->
  <rect x="300" y="170" width="300" height="40" fill="#3498db" rx="8"/>
  <text x="450" y="195" text-anchor="middle" class="header">Instabil bäckenfraktur + Hemodynamisk instabilitet</text>

  <line x1="450" y1="210" x2="450" y2="240" stroke="#333" stroke-width="2"/>

  <rect x="300" y="240" width="300" height="40" fill="#27ae60" rx="8"/>
  <text x="450" y="265" text-anchor="middle" class="header">1. BÄCKENBÄLTE (omedelbart)</text>

  <line x1="450" y1="280" x2="450" y2="310" stroke="#333" stroke-width="2"/>

  <rect x="300" y="310" width="300" height="40" fill="#9b59b6" rx="8"/>
  <text x="450" y="335" text-anchor="middle" class="header">2. TXA 1g IV + MTP-aktivering</text>

  <line x1="450" y1="350" x2="450" y2="380" stroke="#333" stroke-width="2"/>

  <rect x="300" y="380" width="300" height="40" fill="#e67e22" rx="8"/>
  <text x="450" y="405" text-anchor="middle" class="header">3. FAST / CT vid stabil patient</text>

  <!-- Decision point -->
  <line x1="450" y1="420" x2="450" y2="450" stroke="#333" stroke-width="2"/>
  <rect x="350" y="450" width="200" height="35" fill="#1a5276" rx="8"/>
  <text x="450" y="473" text-anchor="middle" class="header">Responerar på resuscitering?</text>

  <!-- Non-responder path -->
  <line x1="350" y1="467" x2="200" y2="467" stroke="#333" stroke-width="2"/>
  <line x1="200" y1="467" x2="200" y2="510" stroke="#333" stroke-width="2"/>
  <text x="265" y="460" class="text">NEJ - Non-responder</text>

  <rect x="50" y="510" width="300" height="130" fill="#e74c3c" rx="8"/>
  <text x="200" y="535" text-anchor="middle" class="header">KIRURGISK BLÖDNINGSKONTROLL</text>
  <text x="70" y="560" class="text" fill="white">1. Preperitonal packing (PPP)</text>
  <text x="80" y="575" class="text" fill="white">• Effektivt mot venös blödning (80%)</text>
  <text x="80" y="590" class="text" fill="white">• Kan utföras snabbt på akutrummet</text>
  <text x="70" y="610" class="text" fill="white">2. Extern fixation</text>
  <text x="70" y="630" class="text" fill="white">3. Överväg REBOA (Zon III)</text>

  <!-- Responder path -->
  <line x1="550" y1="467" x2="700" y2="467" stroke="#333" stroke-width="2"/>
  <line x1="700" y1="467" x2="700" y2="510" stroke="#333" stroke-width="2"/>
  <text x="610" y="460" class="text">JA - Transient responder</text>

  <rect x="550" y="510" width="300" height="130" fill="#f39c12" rx="8"/>
  <text x="700" y="535" text-anchor="middle" class="header">ANGIOEMBOLISERING</text>
  <text x="570" y="560" class="text" fill="white">Indikationer:</text>
  <text x="570" y="575" class="text" fill="white">• Arteriell kontrastextravasering på CT</text>
  <text x="570" y="590" class="text" fill="white">• Fortsatt transfusionsbehov</text>
  <text x="570" y="605" class="text" fill="white">• Stabil nog för angio-suite</text>
  <text x="570" y="625" class="text" fill="white">Framgång: 85-100% (WSES 2017)</text>

  <!-- Combined approach -->
  <line x1="200" y1="640" x2="200" y2="670" stroke="#333" stroke-width="2"/>
  <line x1="700" y1="640" x2="700" y2="670" stroke="#333" stroke-width="2"/>
  <line x1="200" y1="670" x2="700" y2="670" stroke="#333" stroke-width="2"/>
  <line x1="450" y1="670" x2="450" y2="690" stroke="#333" stroke-width="2"/>

  <rect x="250" y="690" width="400" height="50" fill="#8e44ad" rx="8"/>
  <text x="450" y="712" text-anchor="middle" class="header">KOMBINERAD APPROACH vid refraktär blödning</text>
  <text x="450" y="730" text-anchor="middle" class="text" fill="white">PPP + Angioembolisering = "Damage Control Resuscitation"</text>

  <!-- Key evidence boxes -->
  <rect x="50" y="655" width="145" height="80" fill="#2c3e50" rx="5"/>
  <text x="122" y="675" text-anchor="middle" class="header" style="font-size:10px">BÄCKENBÄLTE</text>
  <text x="60" y="695" class="text" fill="white" style="font-size:9px">Reducerar volym</text>
  <text x="60" y="710" class="text" fill="white" style="font-size:9px">upp till 10-20%</text>
  <text x="60" y="725" class="ref" style="fill:#bbb">Croce 2007</text>

  <rect x="705" y="655" width="145" height="80" fill="#2c3e50" rx="5"/>
  <text x="777" y="675" text-anchor="middle" class="header" style="font-size:10px">REBOA</text>
  <text x="715" y="695" class="text" fill="white" style="font-size:9px">Zon III - temporär</text>
  <text x="715" y="710" class="text" fill="white" style="font-size:9px">bridge to surgery</text>
  <text x="715" y="725" class="ref" style="fill:#bbb">Brenner 2018</text>

</svg>`;
}

// ============================================
// PRE-COURSE ASSESSMENT - FÖRKUNSKAPSTEST
// ============================================

function getPreCourseAssessmentQuestions() {
  return [
    // ATLS och traumaprinciper
    {
      code: 'PRE-1',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den korrekta ordningen för ABCDE-principen vid traumaomhändertagande?',
      options: [
        { text: 'Airway, Breathing, Circulation, Disability, Exposure', correct: true },
        { text: 'Assessment, Bleeding, Circulation, Diagnosis, Evaluation', correct: false },
        { text: 'Airway, Blood pressure, Consciousness, Disability, Examination', correct: false },
        { text: 'Alertness, Breathing, Cardiac, Diagnosis, Emergency', correct: false },
      ],
      explanation: 'ABCDE är den standardiserade prioriteringsordningen vid akut traumaomhändertagande enligt ATLS.',
      reference: 'ATLS 10th Edition, American College of Surgeons',
    },
    {
      code: 'PRE-2',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken blodvolym har en normalviktig vuxen person (70 kg)?',
      options: [
        { text: 'Cirka 3 liter', correct: false },
        { text: 'Cirka 5 liter', correct: true },
        { text: 'Cirka 7 liter', correct: false },
        { text: 'Cirka 10 liter', correct: false },
      ],
      explanation: 'Blodvolymen är cirka 70 ml/kg, vilket ger ungefär 5 liter hos en 70 kg person.',
      reference: 'ATLS 10th Edition, Chapter 3: Shock',
    },
    {
      code: 'PRE-3',
      bloomLevel: 'COMPREHENSION',
      question: 'Vid vilken blodförlust börjar typiskt blodtrycket sjunka hos en tidigare frisk vuxen?',
      options: [
        { text: '10-15% (500-750 ml)', correct: false },
        { text: '15-30% (750-1500 ml)', correct: false },
        { text: '30-40% (1500-2000 ml)', correct: true },
        { text: 'Först vid >50% (>2500 ml)', correct: false },
      ],
      explanation: 'Blodtrycksfall är ett sent tecken på blödningschock (klass III). Tidiga tecken inkluderar takykardi och ändrad medvetandegrad.',
      reference: 'ATLS 10th Edition, Shock Classification',
    },
    {
      code: 'PRE-4',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket av följande är det tidigaste tecknet på hypovolemisk chock?',
      options: [
        { text: 'Hypotension', correct: false },
        { text: 'Takykardi', correct: true },
        { text: 'Anuri', correct: false },
        { text: 'Medvetslöshet', correct: false },
      ],
      explanation: 'Takykardi är oftast det första kliniska tecknet på blödning. Blodtrycksfall är ett sent tecken.',
      reference: 'ATLS 10th Edition, Chapter 3',
    },

    // Anatomi
    {
      code: 'PRE-5',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken artär löper bakom knäleden och är särskilt utsatt vid knäledsluxation?',
      options: [
        { text: 'Arteria femoralis', correct: false },
        { text: 'Arteria poplitea', correct: true },
        { text: 'Arteria tibialis anterior', correct: false },
        { text: 'Arteria dorsalis pedis', correct: false },
      ],
      explanation: 'A. poplitea löper genom fossa poplitea och är fixerad proximalt och distalt, vilket gör den vulnerabel vid knäledsluxation.',
      reference: 'Gray\'s Anatomy, Lower Limb Vasculature',
    },
    {
      code: 'PRE-6',
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur många muskelkompartment finns det i underbenet?',
      options: [
        { text: '2', correct: false },
        { text: '3', correct: false },
        { text: '4', correct: true },
        { text: '5', correct: false },
      ],
      explanation: 'Underbenet har 4 kompartment: anteriort, lateralt, ytligt posteriort och djupt posteriort.',
      reference: 'Gray\'s Anatomy, Compartments of the Leg',
    },
    {
      code: 'PRE-7',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv innerverar främre underbenets muskler och ger sensation mellan stortån och andra tån?',
      options: [
        { text: 'Nervus tibialis', correct: false },
        { text: 'Nervus peroneus profundus (fibularis profundus)', correct: true },
        { text: 'Nervus suralis', correct: false },
        { text: 'Nervus saphenus', correct: false },
      ],
      explanation: 'N. peroneus profundus innerverar främre kompartmentet och ger sensorik i första interdigitalrummet (mellan dig I och II).',
      reference: 'Netter Atlas of Human Anatomy',
    },

    // Frakturkunskap
    {
      code: 'PRE-8',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär en öppen fraktur?',
      options: [
        { text: 'Fraktur som syns på röntgen', correct: false },
        { text: 'Fraktur med kommunikation mellan frakturhematom och yttre miljön', correct: true },
        { text: 'Fraktur med mer än 2 fragment', correct: false },
        { text: 'Fraktur som går genom hela benet', correct: false },
      ],
      explanation: 'En öppen fraktur definieras av kommunikation mellan frakturhematomet och den yttre miljön, oavsett sårets storlek.',
      reference: 'Gustilo RB et al. JBJS 1984',
    },
    {
      code: 'PRE-9',
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är tibiafrakturer mer benägna att bli öppna än femurfrakturer?',
      options: [
        { text: 'Tibia är ett svagare ben', correct: false },
        { text: 'Tibia har mindre mjukdelstäckning anteriort', correct: true },
        { text: 'Tibia har sämre blodförsörjning', correct: false },
        { text: 'Femur har tjockare periost', correct: false },
      ],
      explanation: 'Tibias anteriora yta är subkutan utan muskulär täckning, vilket gör den mer utsatt för öppna frakturer.',
      reference: 'Rockwood & Green\'s Fractures in Adults',
    },
    {
      code: 'PRE-10',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken klassifikation används för öppna frakturer?',
      options: [
        { text: 'AO-klassifikationen', correct: false },
        { text: 'Gustilo-Anderson klassifikationen', correct: true },
        { text: 'Garden-klassifikationen', correct: false },
        { text: 'Neer-klassifikationen', correct: false },
      ],
      explanation: 'Gustilo-Anderson är standardklassifikationen för öppna frakturer med grad I-IIIC baserat på sårvidd och mjukdelsskada.',
      reference: 'Gustilo RB et al. JBJS 1984',
    },

    // Fysiologi
    {
      code: 'PRE-11',
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är det viktigt att undvika hypotermi vid trauma?',
      options: [
        { text: 'Patienten fryser', correct: false },
        { text: 'Hypotermi försämrar koagulationen och ökar blödningsrisken', correct: true },
        { text: 'Hypotermi ger bradykardi', correct: false },
        { text: 'Hypotermi påverkar röntgenbilder', correct: false },
      ],
      explanation: 'Hypotermi (<35°C) är del av "trauma-triaden" (hypotermi, acidos, koagulopati) och försämrar trombocytfunktion och koagulationsfaktorer.',
      reference: 'ATLS 10th Edition; Jurkovich GJ J Trauma 1987',
    },
    {
      code: 'PRE-12',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är normalvärdet för ankel-brachialindex (ABI)?',
      options: [
        { text: '0.5-0.7', correct: false },
        { text: '0.7-0.9', correct: false },
        { text: '0.9-1.3', correct: true },
        { text: '1.5-2.0', correct: false },
      ],
      explanation: 'Normalt ABI är 0.9-1.3. ABI <0.9 indikerar nedsatt arteriell perfusion och kräver vidare utredning vid trauma.',
      reference: 'EAST Guidelines 2012; Johansen K J Trauma 1991',
    },

    // Sårläkning och infektion
    {
      code: 'PRE-13',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken bakterie är den vanligaste orsaken till infektion vid öppna frakturer?',
      options: [
        { text: 'Escherichia coli', correct: false },
        { text: 'Staphylococcus aureus', correct: true },
        { text: 'Pseudomonas aeruginosa', correct: false },
        { text: 'Clostridium perfringens', correct: false },
      ],
      explanation: 'S. aureus är den vanligaste patogenen vid ortopediska infektioner, inklusive öppna frakturer.',
      reference: 'BOA/BAPRAS Open Fracture Guidelines 2020',
    },
    {
      code: 'PRE-14',
      bloomLevel: 'KNOWLEDGE',
      question: 'Inom vilken tid bör antibiotika ges vid öppen fraktur?',
      options: [
        { text: 'Inom 6 timmar', correct: false },
        { text: 'Inom 3 timmar', correct: false },
        { text: 'Inom 1 timme', correct: true },
        { text: 'Inom 30 minuter', correct: false },
      ],
      explanation: 'Antibiotika ska ges så snart som möjligt, helst inom 1 timme, för att minska infektionsrisken vid öppna frakturer.',
      reference: 'BOA/BAPRAS 2020; Patzakis MJ JBJS 1974',
    },

    // Akut handläggning
    {
      code: 'PRE-15',
      bloomLevel: 'APPLICATION',
      question: 'En patient kommer in med kraftig blödning från en extremitetsskada. Direkttryck räcker inte. Vad är nästa åtgärd?',
      options: [
        { text: 'Applicera tourniquet', correct: true },
        { text: 'Ge tranexamsyra IV', correct: false },
        { text: 'Höj extremiteten', correct: false },
        { text: 'Applicera hemostatiskt förband', correct: false },
      ],
      explanation: 'Vid livshotande extremitetsblödning där direkttryck inte räcker är tourniquet nästa steg enligt TCCC/ATLS.',
      reference: 'TCCC Guidelines 2023; ATLS 10th Edition',
    },
    {
      code: 'PRE-16',
      bloomLevel: 'APPLICATION',
      question: 'Hur kontrollerar du distal cirkulation vid en extremitetsskada?',
      options: [
        { text: 'Enbart genom att känna temperaturen', correct: false },
        { text: 'Enbart genom kapillär återfyllnad', correct: false },
        { text: 'Puls, kapillär återfyllnad, färg, temperatur och sensation', correct: true },
        { text: 'Enbart genom att fråga om domningar', correct: false },
      ],
      explanation: 'Neurovaskulär status inkluderar bedömning av puls, kapillär återfyllnad, hudfärg, temperatur och sensorisk/motorisk funktion.',
      reference: 'ATLS 10th Edition, Musculoskeletal Trauma',
    },

    // Immobilisering
    {
      code: 'PRE-17',
      bloomLevel: 'KNOWLEDGE',
      question: 'Varför ska en fraktur immobiliseras?',
      options: [
        { text: 'Enbart för patientens komfort', correct: false },
        { text: 'För att minska smärta, blödning och risk för ytterligare skada', correct: true },
        { text: 'Enbart för transport', correct: false },
        { text: 'För att underlätta röntgen', correct: false },
      ],
      explanation: 'Immobilisering minskar smärta, begränsar blödning, förhindrar ytterligare mjukdels- och kärlskada, och underlättar transport.',
      reference: 'ATLS 10th Edition',
    },
    {
      code: 'PRE-18',
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka leder ska inkluderas vid immobilisering av en fraktur?',
      options: [
        { text: 'Endast leden närmast frakturen', correct: false },
        { text: 'Leden ovanför och nedan om frakturen', correct: true },
        { text: 'Alla leder på extremiteten', correct: false },
        { text: 'Inga leder, endast frakturstället', correct: false },
      ],
      explanation: 'Grundprincipen är att immobilisera leden ovanför och nedan om frakturen för att förhindra rörelse i frakturstället.',
      reference: 'ATLS 10th Edition; Prehospital Trauma Life Support',
    },

    // Bilddiagnostik
    {
      code: 'PRE-19',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken röntgenundersökning är förstahandsval vid akut extremitetstrauma?',
      options: [
        { text: 'CT', correct: false },
        { text: 'MR', correct: false },
        { text: 'Slätröntgen i minst två projektioner', correct: true },
        { text: 'Ultraljud', correct: false },
      ],
      explanation: 'Slätröntgen i två projektioner (vanligen frontal och lateral) är förstahandsundersökning vid misstänkt fraktur.',
      reference: 'ACR Appropriateness Criteria',
    },
    {
      code: 'PRE-20',
      bloomLevel: 'COMPREHENSION',
      question: 'När är CT-angiografi indicerad vid extremitetstrauma?',
      options: [
        { text: 'Vid alla frakturer', correct: false },
        { text: 'Vid misstänkt kärlskada (hard/soft signs)', correct: true },
        { text: 'Enbart vid öppna frakturer', correct: false },
        { text: 'Enbart prehospitalt', correct: false },
      ],
      explanation: 'CTA är indicerad vid klinisk misstanke om kärlskada, särskilt vid soft signs. Hard signs leder ofta direkt till operation.',
      reference: 'EAST Guidelines 2012',
    },

    // Grundläggande farmakologi
    {
      code: 'PRE-21',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken analgetikagrupp bör användas med försiktighet vid akut trauma?',
      options: [
        { text: 'Paracetamol', correct: false },
        { text: 'Opioider', correct: false },
        { text: 'NSAID', correct: true },
        { text: 'Lokalanestetika', correct: false },
      ],
      explanation: 'NSAID påverkar trombocytfunktion och njurfunktion, vilket kan vara problematiskt vid hypovolemi och blödning.',
      reference: 'ATLS 10th Edition; WHO Pain Guidelines',
    },
    {
      code: 'PRE-22',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är mekanismen för tranexamsyra vid trauma?',
      options: [
        { text: 'Ökar trombocytproduktion', correct: false },
        { text: 'Hämmar fibrinolys', correct: true },
        { text: 'Aktiverar koagulationskaskaden', correct: false },
        { text: 'Ökar fibrinogensyntes', correct: false },
      ],
      explanation: 'Tranexamsyra är en antifibrinolytisk substans som hämmar plasminogen-till-plasmin-konvertering.',
      reference: 'CRASH-2 Trial, Lancet 2010',
    },

    // Patientbedömning
    {
      code: 'PRE-23',
      bloomLevel: 'APPLICATION',
      question: 'En traumapatient är vid medvetande men svarar inte på frågor. Enligt GCS, vilken verbal poäng får patienten?',
      options: [
        { text: '1 - Inget svar', correct: true },
        { text: '2 - Obegripliga ljud', correct: false },
        { text: '3 - Osammanhängande ord', correct: false },
        { text: '4 - Förvirrad', correct: false },
      ],
      explanation: 'GCS verbal: 1=inget svar, 2=obegripliga ljud, 3=osammanhängande ord, 4=förvirrad, 5=orienterad.',
      reference: 'Teasdale G, Lancet 1974; ATLS 10th Edition',
    },
    {
      code: 'PRE-24',
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står ISS för inom traumavård?',
      options: [
        { text: 'Initial Severity Score', correct: false },
        { text: 'Injury Severity Score', correct: true },
        { text: 'International Shock Scale', correct: false },
        { text: 'Integrated Survival Score', correct: false },
      ],
      explanation: 'ISS (Injury Severity Score) är ett anatomiskt poängsystem för att gradera traumats svårighetsgrad. ISS >15 = major trauma.',
      reference: 'Baker SP et al. J Trauma 1974',
    },
    {
      code: 'PRE-25',
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken patientgrupp har ofta atypiska reaktioner på hypovolemi?',
      options: [
        { text: 'Unga vuxna', correct: false },
        { text: 'Äldre patienter och patienter på betablockerare', correct: true },
        { text: 'Barn under 5 år', correct: false },
        { text: 'Gravida i första trimestern', correct: false },
      ],
      explanation: 'Äldre kan ha förändrat fysiologiskt svar och betablockerare förhindrar kompensatorisk takykardi vid blödning.',
      reference: 'ATLS 10th Edition, Special Populations',
    },
  ];
}

// ============================================
// QUICK REFERENCE CARDS - SNABBREFERENSKORT
// ============================================

function getQRCTourniquetSVG(): string {
  return `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 18px sans-serif; fill: #fff; }
    .section { font: bold 12px sans-serif; fill: #2c3e50; }
    .text { font: 11px sans-serif; fill: #333; }
    .critical { font: bold 11px sans-serif; fill: #c0392b; }
    .time { font: bold 14px sans-serif; fill: #e74c3c; }
    .ref { font: italic 9px sans-serif; fill: #7f8c8d; }
  </style>

  <!-- Header -->
  <rect width="400" height="50" fill="#c0392b"/>
  <text x="200" y="32" text-anchor="middle" class="title">🩸 TOURNIQUET SNABBKORT</text>

  <!-- Indikationer -->
  <rect x="10" y="60" width="380" height="70" fill="#ffeaa7" rx="5"/>
  <text x="20" y="80" class="section">INDIKATIONER</text>
  <text x="20" y="97" class="text">✓ Livshotande blödning från extremitet</text>
  <text x="20" y="112" class="text">✓ Direkt tryck otillräckligt eller ej möjligt</text>
  <text x="20" y="127" class="critical">✓ Massiv blödning: >250 ml/min = död inom 3 min</text>

  <!-- Applicering -->
  <rect x="10" y="140" width="380" height="110" fill="#dfe6e9" rx="5"/>
  <text x="20" y="160" class="section">KORREKT APPLICERING</text>
  <text x="20" y="180" class="text">1. Placera 5-7 cm proximalt om blödningskällan</text>
  <text x="20" y="195" class="text">2. Dra åt tills blödningen HELT upphör</text>
  <text x="20" y="210" class="text">3. Palpera - ingen distal puls ska kännas</text>
  <text x="20" y="225" class="text">4. Dokumentera tid - skriv på hud eller tejp</text>
  <text x="20" y="240" class="critical">⚠ Används EJ på led, skriv "T" på patientens panna</text>

  <!-- Tidsgränser -->
  <rect x="10" y="260" width="380" height="100" fill="#fab1a0" rx="5"/>
  <text x="20" y="280" class="section">TIDSGRÄNSER</text>
  <rect x="20" y="290" width="170" height="60" fill="#fff" rx="3"/>
  <text x="105" y="310" text-anchor="middle" class="time">&lt;2 timmar</text>
  <text x="105" y="330" text-anchor="middle" class="text">Säkert - minimal</text>
  <text x="105" y="345" text-anchor="middle" class="text">vävnadsskada</text>

  <rect x="200" y="290" width="180" height="60" fill="#fff" rx="3"/>
  <text x="290" y="310" text-anchor="middle" class="time">2-6 timmar</text>
  <text x="290" y="330" text-anchor="middle" class="text">Acceptabelt vid</text>
  <text x="290" y="345" text-anchor="middle" class="text">livshotande blödning</text>

  <!-- Lossa aldrig -->
  <rect x="10" y="370" width="380" height="60" fill="#2c3e50" rx="5"/>
  <text x="200" y="395" text-anchor="middle" class="title">⛔ LOSSA ALDRIG PREHOSPITALT</text>
  <text x="200" y="415" text-anchor="middle" style="font:11px sans-serif;fill:#fff">Behåll tills kirurgisk blödningskontroll är möjlig</text>

  <!-- Referenser -->
  <text x="200" y="450" text-anchor="middle" class="ref">Kragh JF et al. J Trauma 2008;64:S38-50</text>
  <text x="200" y="465" text-anchor="middle" class="ref">TCCC Guidelines 2023, ATLS 10th ed</text>
  <text x="200" y="480" text-anchor="middle" class="ref">B-ORTIM Kursbok Kapitel 4</text>
</svg>`;
}

function getQRCCompartmentSVG(): string {
  return `<svg viewBox="0 0 400 550" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 18px sans-serif; fill: #fff; }
    .section { font: bold 12px sans-serif; fill: #2c3e50; }
    .text { font: 11px sans-serif; fill: #333; }
    .critical { font: bold 11px sans-serif; fill: #c0392b; }
    .warning { font: bold 12px sans-serif; fill: #e67e22; }
    .green { fill: #27ae60; }
    .red { fill: #e74c3c; }
    .ref { font: italic 9px sans-serif; fill: #7f8c8d; }
  </style>

  <!-- Header -->
  <rect width="400" height="50" fill="#8e44ad"/>
  <text x="200" y="32" text-anchor="middle" class="title">⚡ KOMPARTMENTSYNDROM</text>

  <!-- 6 P -->
  <rect x="10" y="60" width="380" height="130" fill="#d5dbdb" rx="5"/>
  <text x="20" y="80" class="section">DE 6 P:na - KLINISKA TECKEN</text>

  <text x="30" y="100" class="text">1. <tspan font-weight="bold">Pain</tspan> - Smärta vid passiv töjning (tidigt tecken)</text>
  <text x="30" y="118" class="text">2. <tspan font-weight="bold">Pressure</tspan> - Spänd, palpationsöm loge</text>
  <text x="30" y="136" class="text">3. <tspan font-weight="bold">Paresthesia</tspan> - Domningar, stickningar</text>
  <text x="30" y="154" class="text">4. <tspan font-weight="bold">Paralysis</tspan> - Svaghet (sent tecken)</text>
  <text x="30" y="172" class="text">5. <tspan font-weight="bold">Pallor</tspan> - Blekhet (osäkert tecken)</text>
  <text x="30" y="190" class="critical">6. <tspan font-weight="bold">Pulselessness</tspan> - Pulslöshet = för sent!</text>

  <!-- Tryckmätning -->
  <rect x="10" y="200" width="380" height="100" fill="#ffeaa7" rx="5"/>
  <text x="20" y="220" class="section">TRYCKMÄTNING (Delta-P)</text>
  <text x="30" y="240" class="text">Delta-P = Diastoliskt BT - Kompartmenttryck</text>

  <rect x="30" y="255" width="160" height="35" fill="#27ae60" rx="3"/>
  <text x="110" y="278" text-anchor="middle" style="font:bold 12px sans-serif;fill:#fff">ΔP &gt;30 mmHg = OK</text>

  <rect x="200" y="255" width="180" height="35" fill="#e74c3c" rx="3"/>
  <text x="290" y="278" text-anchor="middle" style="font:bold 12px sans-serif;fill:#fff">ΔP ≤30 mmHg = FASCIOTOMI</text>

  <!-- Högriskpatienter -->
  <rect x="10" y="310" width="380" height="80" fill="#fab1a0" rx="5"/>
  <text x="20" y="330" class="section">HÖGRISKPATIENTER</text>
  <text x="30" y="350" class="text">• Tibiafraktur (särskilt proximal)</text>
  <text x="200" y="350" class="text">• Crushing injury</text>
  <text x="30" y="368" class="text">• Underarmsrevask.</text>
  <text x="200" y="368" class="text">• Medvetslös patient</text>
  <text x="30" y="386" class="critical">⚠ Diagnos svår hos sederade/medvetslösa - mät!</text>

  <!-- Tidsfönster -->
  <rect x="10" y="400" width="380" height="70" fill="#2c3e50" rx="5"/>
  <text x="200" y="425" text-anchor="middle" class="title">⏱ TIDSFÖNSTER: 6-8 TIMMAR</text>
  <text x="200" y="450" text-anchor="middle" style="font:11px sans-serif;fill:#fff">Efter 6-8h: irreversibel muskelskada → Volkmann-kontraktur</text>
  <text x="200" y="465" text-anchor="middle" style="font:11px sans-serif;fill:#ffd700">Fasciotomi inom 6h: 94% återhämtning vs 6h: &lt;20%</text>

  <!-- Referenser -->
  <text x="200" y="500" text-anchor="middle" class="ref">McQueen MM, et al. JBJS Br 2000;82:200-203</text>
  <text x="200" y="515" text-anchor="middle" class="ref">Whitesides TE. Clin Orthop 1975;113:43-51</text>
  <text x="200" y="530" text-anchor="middle" class="ref">B-ORTIM Kursbok Kapitel 6</text>
</svg>`;
}

function getQRCAmputationSVG(): string {
  return `<svg viewBox="0 0 400 550" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 18px sans-serif; fill: #fff; }
    .section { font: bold 12px sans-serif; fill: #2c3e50; }
    .text { font: 11px sans-serif; fill: #333; }
    .critical { font: bold 11px sans-serif; fill: #c0392b; }
    .time { font: bold 14px sans-serif; fill: #e74c3c; }
    .green { fill: #27ae60; }
    .ref { font: italic 9px sans-serif; fill: #7f8c8d; }
  </style>

  <!-- Header -->
  <rect width="400" height="50" fill="#e74c3c"/>
  <text x="200" y="32" text-anchor="middle" class="title">✂️ TRAUMATISK AMPUTATION</text>

  <!-- Stumpvård -->
  <rect x="10" y="60" width="185" height="140" fill="#dfe6e9" rx="5"/>
  <text x="20" y="80" class="section">STUMPVÅRD</text>
  <text x="20" y="100" class="text">1. Blödningskontroll</text>
  <text x="25" y="115" class="text">   - Tourniquet vid massiv</text>
  <text x="25" y="130" class="text">   - Direkt tryck vid lindrig</text>
  <text x="20" y="150" class="text">2. Sterilt förband</text>
  <text x="20" y="170" class="text">3. Polstra, immobilisera</text>
  <text x="20" y="190" class="critical">⚠ Ligera EJ artärer blint</text>

  <!-- Amputatvård -->
  <rect x="205" y="60" width="185" height="140" fill="#d5f5e3" rx="5"/>
  <text x="215" y="80" class="section">AMPUTATVÅRD</text>
  <text x="215" y="100" class="text">1. Sköljning NaCl/Ringer</text>
  <text x="215" y="118" class="text">2. Fuktig kompress runt</text>
  <text x="215" y="136" class="text">3. I plastpåse</text>
  <text x="215" y="154" class="text">4. I större påse med is</text>
  <text x="215" y="175" class="critical">⚠ Aldrig direkt på is!</text>
  <text x="215" y="190" class="critical">⚠ Aldrig i vatten!</text>

  <!-- Ischemitider -->
  <rect x="10" y="210" width="380" height="120" fill="#ffeaa7" rx="5"/>
  <text x="20" y="230" class="section">ISCHEMITIDER FÖR REPLANTATION</text>

  <rect x="20" y="245" width="175" height="75" fill="#fff" rx="3"/>
  <text x="107" y="265" text-anchor="middle" class="section">VARM ISCHEMI</text>
  <text x="107" y="285" text-anchor="middle" class="text">Finger: 12 timmar</text>
  <text x="107" y="300" text-anchor="middle" class="text">Hand/arm: 6 timmar</text>
  <text x="107" y="315" text-anchor="middle" class="critical">Större muskelmassa=kortare</text>

  <rect x="205" y="245" width="175" height="75" fill="#fff" rx="3"/>
  <text x="292" y="265" text-anchor="middle" class="section">KALL ISCHEMI</text>
  <text x="292" y="285" text-anchor="middle" class="text">Finger: 24 timmar</text>
  <text x="292" y="300" text-anchor="middle" class="text">Hand/arm: 12 timmar</text>
  <text x="292" y="315" text-anchor="middle" class="green" style="font-weight:bold">Kyla förlänger tid!</text>

  <!-- Replantationsindikationer -->
  <rect x="10" y="340" width="380" height="100" fill="#dfe6e9" rx="5"/>
  <text x="20" y="360" class="section">REPLANTATIONSINDIKATIONER</text>
  <text x="30" y="380" class="text">• Tumme (viktigast)</text>
  <text x="200" y="380" class="text">• Barn (alla nivåer)</text>
  <text x="30" y="398" class="text">• Multipla fingrar</text>
  <text x="200" y="398" class="text">• Handflata/handled</text>
  <text x="30" y="416" class="text">• Sharp/guillotine-amputation</text>
  <text x="30" y="434" class="critical">⚠ Kontakta replantationscentrum tidigt!</text>

  <!-- Kontakt -->
  <rect x="10" y="450" width="380" height="40" fill="#2c3e50" rx="5"/>
  <text x="200" y="475" text-anchor="middle" class="title">📞 RING HANDKIRURG TIDIGT</text>

  <!-- Referenser -->
  <text x="200" y="510" text-anchor="middle" class="ref">Soucacos PN, et al. Microsurgery 2001;21:240-248</text>
  <text x="200" y="525" text-anchor="middle" class="ref">Morrison WA. Hand Clin 2007;23:1-13</text>
  <text x="200" y="540" text-anchor="middle" class="ref">B-ORTIM Kursbok Kapitel 9</text>
</svg>`;
}

function getQRCOpenFxSVG(): string {
  return `<svg viewBox="0 0 400 580" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 18px sans-serif; fill: #fff; }
    .section { font: bold 12px sans-serif; fill: #2c3e50; }
    .text { font: 11px sans-serif; fill: #333; }
    .critical { font: bold 11px sans-serif; fill: #c0392b; }
    .time { font: bold 14px sans-serif; fill: #e74c3c; }
    .grade { font: bold 11px sans-serif; }
    .ref { font: italic 9px sans-serif; fill: #7f8c8d; }
  </style>

  <!-- Header -->
  <rect width="400" height="50" fill="#d35400"/>
  <text x="200" y="32" text-anchor="middle" class="title">🦴 ÖPPEN FRAKTUR SNABBKORT</text>

  <!-- Gustilo-Anderson -->
  <rect x="10" y="60" width="380" height="150" fill="#ffeaa7" rx="5"/>
  <text x="20" y="80" class="section">GUSTILO-ANDERSON KLASSIFIKATION</text>

  <rect x="20" y="90" width="110" height="55" fill="#27ae60" rx="3"/>
  <text x="75" y="108" text-anchor="middle" class="grade" style="fill:#fff">Grad I</text>
  <text x="75" y="123" text-anchor="middle" class="text" style="fill:#fff">&lt;1 cm sår</text>
  <text x="75" y="138" text-anchor="middle" class="text" style="fill:#fff">Ren, minimal</text>

  <rect x="140" y="90" width="110" height="55" fill="#f39c12" rx="3"/>
  <text x="195" y="108" text-anchor="middle" class="grade" style="fill:#fff">Grad II</text>
  <text x="195" y="123" text-anchor="middle" class="text" style="fill:#fff">1-10 cm sår</text>
  <text x="195" y="138" text-anchor="middle" class="text" style="fill:#fff">Moderat kontam.</text>

  <rect x="260" y="90" width="120" height="55" fill="#c0392b" rx="3"/>
  <text x="320" y="108" text-anchor="middle" class="grade" style="fill:#fff">Grad III</text>
  <text x="320" y="123" text-anchor="middle" class="text" style="fill:#fff">&gt;10 cm/crushing</text>
  <text x="320" y="138" text-anchor="middle" class="text" style="fill:#fff">Omfattande skada</text>

  <text x="30" y="165" class="text"><tspan font-weight="bold">IIIA:</tspan> Mjukdel täcker ben</text>
  <text x="30" y="180" class="text"><tspan font-weight="bold">IIIB:</tspan> Periost-stripping, kräver lapp</text>
  <text x="30" y="195" class="critical"><tspan font-weight="bold">IIIC:</tspan> Kärlskada som kräver repair</text>

  <!-- Initial åtgärd -->
  <rect x="10" y="220" width="380" height="120" fill="#dfe6e9" rx="5"/>
  <text x="20" y="240" class="section">INITIAL ÅTGÄRD (AKUTMOTTAGNINGEN)</text>
  <text x="30" y="260" class="text">1. Foto av såret innan förband</text>
  <text x="30" y="278" class="text">2. Spola med NaCl - avlägsna grov kontamination</text>
  <text x="30" y="296" class="text">3. Sterilt förband - öppna INTE upprepat</text>
  <text x="30" y="314" class="text">4. Tetanusprofylax - kontrollera status</text>
  <text x="30" y="332" class="critical">5. Antibiotika IV inom 1 timme!</text>

  <!-- Antibiotika -->
  <rect x="10" y="350" width="380" height="100" fill="#d5f5e3" rx="5"/>
  <text x="20" y="370" class="section">ANTIBIOTIKA (BOA/BAPRAS 2020)</text>
  <text x="30" y="390" class="text"><tspan font-weight="bold">Grad I-II:</tspan> Kloxacillin 2g x 3 IV</text>
  <text x="30" y="410" class="text"><tspan font-weight="bold">Grad III:</tspan> Kloxacillin 2g x 3 + Gentamicin 5mg/kg x 1</text>
  <text x="30" y="430" class="text"><tspan font-weight="bold">Jordkontamination:</tspan> Lägg till Penicillin G</text>
  <text x="30" y="445" class="critical">Pc-allergi: Klindamycin 600mg x 3</text>

  <!-- Tidsgränser -->
  <rect x="10" y="460" width="380" height="60" fill="#2c3e50" rx="5"/>
  <text x="200" y="485" text-anchor="middle" class="title">⏱ DEBRIDERING INOM 12-24H</text>
  <text x="200" y="505" text-anchor="middle" style="font:11px sans-serif;fill:#fff">Grad IIIB/C: inom 12h | Grad I-II: inom 24h</text>

  <!-- Referenser -->
  <text x="200" y="540" text-anchor="middle" class="ref">BOA/BAPRAS Standards for Open Fractures 2020</text>
  <text x="200" y="555" text-anchor="middle" class="ref">Gustilo RB, et al. JBJS Am 1984;66:427-430</text>
  <text x="200" y="570" text-anchor="middle" class="ref">B-ORTIM Kursbok Kapitel 7</text>
</svg>`;
}

function getQRCPelvicSVG(): string {
  return `<svg viewBox="0 0 400 550" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 18px sans-serif; fill: #fff; }
    .section { font: bold 12px sans-serif; fill: #2c3e50; }
    .text { font: 11px sans-serif; fill: #333; }
    .critical { font: bold 11px sans-serif; fill: #c0392b; }
    .time { font: bold 14px sans-serif; fill: #e74c3c; }
    .step { font: bold 14px sans-serif; fill: #fff; }
    .ref { font: italic 9px sans-serif; fill: #7f8c8d; }
  </style>

  <!-- Header -->
  <rect width="400" height="50" fill="#9b59b6"/>
  <text x="200" y="32" text-anchor="middle" class="title">🦴 BÄCKENBLÖDNING SNABBKORT</text>

  <!-- Blödningskällor -->
  <rect x="10" y="60" width="380" height="80" fill="#ffeaa7" rx="5"/>
  <text x="20" y="80" class="section">BLÖDNINGSKÄLLOR (prioritet)</text>
  <text x="30" y="100" class="text"><tspan font-weight="bold">80%</tspan> Venös plexus + frakturytor</text>
  <text x="30" y="118" class="text"><tspan font-weight="bold">15%</tspan> Arteriell (a. iliaca int. grenar)</text>
  <text x="30" y="136" class="critical"><tspan font-weight="bold">5%</tspan> Stora kärl (a/v iliaca communis) → operation direkt</text>

  <!-- Steg för steg -->
  <rect x="10" y="150" width="380" height="200" fill="#dfe6e9" rx="5"/>
  <text x="20" y="170" class="section">STEG-FÖR-STEG HANDLÄGGNING</text>

  <circle cx="30" cy="195" r="12" fill="#27ae60"/>
  <text x="30" y="200" text-anchor="middle" class="step">1</text>
  <text x="50" y="200" class="text"><tspan font-weight="bold">BÄCKENBÄLTE</tspan> - Applicera på olycksplatsen/akuten</text>

  <circle cx="30" cy="230" r="12" fill="#f39c12"/>
  <text x="30" y="235" text-anchor="middle" class="step">2</text>
  <text x="50" y="235" class="text"><tspan font-weight="bold">BLODPRODUKTER</tspan> - Massiv transfusionsprotokoll</text>

  <circle cx="30" cy="265" r="12" fill="#e74c3c"/>
  <text x="30" y="270" text-anchor="middle" class="step">3</text>
  <text x="50" y="270" class="text"><tspan font-weight="bold">CT</tspan> - Om hemodynamisk stabilitet, annars direkt OP</text>

  <circle cx="30" cy="300" r="12" fill="#8e44ad"/>
  <text x="30" y="305" text-anchor="middle" class="step">4</text>
  <text x="50" y="305" class="text"><tspan font-weight="bold">ANGIOEMBOLISERING</tspan> - Vid arteriell blush på CT</text>

  <circle cx="30" cy="335" r="12" fill="#2c3e50"/>
  <text x="30" y="340" text-anchor="middle" class="step">5</text>
  <text x="50" y="340" class="text"><tspan font-weight="bold">PREPERITONEAL PACKING</tspan> - Vid refraktär blödning</text>

  <!-- Bäckenbälte placering -->
  <rect x="10" y="360" width="185" height="90" fill="#d5f5e3" rx="5"/>
  <text x="20" y="380" class="section">BÄCKENBÄLTE</text>
  <text x="20" y="400" class="text">• Placera över trochanter</text>
  <text x="20" y="418" class="text">• Spänn med knäna ihop</text>
  <text x="20" y="436" class="text">• Medialiserar SI-leder</text>
  <text x="20" y="448" class="critical">Max 24h</text>

  <!-- Kontraindikationer -->
  <rect x="205" y="360" width="185" height="90" fill="#fab1a0" rx="5"/>
  <text x="215" y="380" class="section">KONTRA PPP</text>
  <text x="215" y="400" class="text">• Öppen bäckenfraktur</text>
  <text x="215" y="418" class="text">• Urologisk skada</text>
  <text x="215" y="436" class="text">• Tarmskada</text>
  <text x="215" y="448" class="critical">→ Angioembolisering</text>

  <!-- Tidsgräns -->
  <rect x="10" y="460" width="380" height="40" fill="#2c3e50" rx="5"/>
  <text x="200" y="487" text-anchor="middle" class="title">⏱ &lt;30 MIN TILL BLÖDNINGSKONTROLL</text>

  <!-- Referenser -->
  <text x="200" y="520" text-anchor="middle" class="ref">WSES Guidelines Pelvic Trauma 2017</text>
  <text x="200" y="535" text-anchor="middle" class="ref">ATLS 10th edition, Croce MA J Trauma 2007</text>
  <text x="200" y="550" text-anchor="middle" class="ref">B-ORTIM Kursbok Kapitel 8</text>
</svg>`;
}

function getQRCVascularSVG(): string {
  return `<svg viewBox="0 0 400 580" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 18px sans-serif; fill: #fff; }
    .section { font: bold 12px sans-serif; fill: #2c3e50; }
    .text { font: 11px sans-serif; fill: #333; }
    .critical { font: bold 11px sans-serif; fill: #c0392b; }
    .hard { font: bold 11px sans-serif; fill: #fff; }
    .soft { font: 11px sans-serif; fill: #fff; }
    .ref { font: italic 9px sans-serif; fill: #7f8c8d; }
  </style>

  <!-- Header -->
  <rect width="400" height="50" fill="#3498db"/>
  <text x="200" y="32" text-anchor="middle" class="title">🩸 KÄRLSKADA SNABBKORT</text>

  <!-- Hard signs -->
  <rect x="10" y="60" width="185" height="150" fill="#c0392b" rx="5"/>
  <text x="100" y="82" text-anchor="middle" class="title" style="font-size:14px">HARD SIGNS</text>
  <text x="20" y="105" class="hard">✓ Aktiv pulsatil blödning</text>
  <text x="20" y="125" class="hard">✓ Expanderande hematom</text>
  <text x="20" y="145" class="hard">✓ Avsaknad distal puls</text>
  <text x="20" y="165" class="hard">✓ Ischemi (6 P)</text>
  <text x="20" y="185" class="hard">✓ Bruit/thrill</text>
  <rect x="20" y="193" width="165" height="12" fill="#fff" rx="2"/>
  <text x="100" y="203" text-anchor="middle" class="critical" style="font-size:10px">→ DIREKT OPERATION</text>

  <!-- Soft signs -->
  <rect x="205" y="60" width="185" height="150" fill="#f39c12" rx="5"/>
  <text x="297" y="82" text-anchor="middle" class="title" style="font-size:14px">SOFT SIGNS</text>
  <text x="215" y="105" class="soft">• Kärlnära penetrerande skada</text>
  <text x="215" y="125" class="soft">• Litet, icke-pulserande hematom</text>
  <text x="215" y="145" class="soft">• Neurologiskt bortfall</text>
  <text x="215" y="165" class="soft">• Anatomisk närhet till kärl</text>
  <text x="215" y="185" class="soft">• Misstanke pga mekanism</text>
  <rect x="215" y="193" width="165" height="12" fill="#fff" rx="2"/>
  <text x="297" y="203" text-anchor="middle" style="font:bold 10px sans-serif;fill:#f39c12">→ UTRED MED ABI/CTA</text>

  <!-- ABI -->
  <rect x="10" y="220" width="380" height="100" fill="#dfe6e9" rx="5"/>
  <text x="20" y="240" class="section">ANKLE-BRACHIAL INDEX (ABI)</text>
  <text x="30" y="260" class="text">ABI = Ankeltryck / Armtryck (doppler)</text>

  <rect x="30" y="275" width="160" height="35" fill="#27ae60" rx="3"/>
  <text x="110" y="298" text-anchor="middle" style="font:bold 12px sans-serif;fill:#fff">ABI ≥0.9 = Normal</text>

  <rect x="200" y="275" width="180" height="35" fill="#e74c3c" rx="3"/>
  <text x="290" y="298" text-anchor="middle" style="font:bold 12px sans-serif;fill:#fff">ABI &lt;0.9 = CTA</text>

  <!-- Högriskskador -->
  <rect x="10" y="330" width="380" height="100" fill="#ffeaa7" rx="5"/>
  <text x="20" y="350" class="section">HÖGRISKSKADOR - Utred med CTA</text>
  <text x="30" y="370" class="text">• Knäledsluxation (40-50% popliteaskada)</text>
  <text x="30" y="388" class="text">• Posterior höftluxation</text>
  <text x="30" y="406" class="text">• Suprakondylär humerusfraktur (barn)</text>
  <text x="30" y="424" class="critical">⚠ Även efter spontan reposition!</text>

  <!-- Ischemitid -->
  <rect x="10" y="440" width="380" height="80" fill="#2c3e50" rx="5"/>
  <text x="200" y="465" text-anchor="middle" class="title">⏱ VARM ISCHEMITID</text>
  <text x="200" y="490" text-anchor="middle" style="font:12px sans-serif;fill:#fff">&lt;6 timmar: Limb salvage möjlig</text>
  <text x="200" y="510" text-anchor="middle" style="font:12px sans-serif;fill:#ffd700">&gt;6 timmar: Amputation ökar dramatiskt</text>

  <!-- Referenser -->
  <text x="200" y="540" text-anchor="middle" class="ref">EAST Guidelines Vascular Injury 2012</text>
  <text x="200" y="555" text-anchor="middle" class="ref">Mills WJ et al. J Bone Joint Surg Am 2004</text>
  <text x="200" y="570" text-anchor="middle" class="ref">B-ORTIM Kursbok Kapitel 5</text>
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
