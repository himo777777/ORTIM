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
      question: 'Kompartmenttryck mäts till 35 mmHg och diastoliskt blodtryck är 70 mmHg. Delta-tryck är 35 mmHg. Behövs fasciotomi?',
      options: [
        { text: 'Ja, delta-tryck ≤30 mmHg indikerar fasciotomi', correct: true },
        { text: 'Nej, normalvärde', correct: false },
        { text: 'Avvakta och mät om', correct: false },
        { text: 'Endast om patienten har symtom', correct: false },
      ],
      explanation: 'Delta-tryck = diastoliskt BT minus kompartmenttryck. Delta-tryck ≤30 mmHg indikerar fasciotomi (här: 70-35=35, men om det var 30 eller lägre krävs fasciotomi).',
      reference: 'B-ORTIM Kursbok, Kapitel 6; McQueen MM JBJS 1996',
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
