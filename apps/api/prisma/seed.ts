import 'dotenv/config';
import { PrismaClient, UserRole, BloomLevel } from '@prisma/client';

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
      totalXP: 25000,
      level: 42,
      currentStreak: 120,
      longestStreak: 150,
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
      totalXP: 18500,
      level: 35,
      currentStreak: 45,
      longestStreak: 90,
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
      totalXP: 4500,
      level: 12,
      currentStreak: 7,
      longestStreak: 21,
    },
  });

  console.log('✅ Users created');

  // Create badges for gamification
  const badges = [
    // PROGRESS badges
    { code: 'FIRST_CHAPTER', name: 'Första steget', description: 'Slutförde ditt första kapitel', category: 'PROGRESS', xpReward: 50, sortOrder: 1 },
    { code: 'FIVE_CHAPTERS', name: 'På god väg', description: 'Slutförde 5 kapitel', category: 'PROGRESS', xpReward: 100, sortOrder: 2 },
    { code: 'TEN_CHAPTERS', name: 'Halvvägs', description: 'Slutförde 10 kapitel', category: 'PROGRESS', xpReward: 200, sortOrder: 3 },
    { code: 'ALL_CHAPTERS', name: 'Kursexpert', description: 'Slutförde alla 17 kapitel', category: 'PROGRESS', xpReward: 500, sortOrder: 4 },

    // ACHIEVEMENT badges
    { code: 'PERFECT_QUIZ', name: 'Perfekt poäng', description: 'Fick 100% på ett quiz', category: 'ACHIEVEMENT', xpReward: 150, sortOrder: 10 },
    { code: 'SPEED_DEMON', name: 'Snabbtänkt', description: 'Klarade ett quiz på under 2 minuter med godkänt resultat', category: 'ACHIEVEMENT', xpReward: 100, sortOrder: 11 },
    { code: 'ALGORITHM_MASTER', name: 'Algoritmexpert', description: 'Studerade alla 10 algoritmer', category: 'ACHIEVEMENT', xpReward: 200, sortOrder: 12 },
    { code: 'CERTIFIED', name: 'Certifierad', description: 'Erhöll ORTAC-certifikat', category: 'ACHIEVEMENT', xpReward: 1000, sortOrder: 13 },

    // STREAK badges
    { code: 'STREAK_3', name: 'Tredagars streak', description: 'Studerade 3 dagar i rad', category: 'STREAK', xpReward: 30, sortOrder: 20 },
    { code: 'STREAK_7', name: 'Veckostreak', description: 'Studerade 7 dagar i rad', category: 'STREAK', xpReward: 100, sortOrder: 21 },
    { code: 'STREAK_30', name: 'Månadsstreak', description: 'Studerade 30 dagar i rad', category: 'STREAK', xpReward: 500, sortOrder: 22 },
    { code: 'STREAK_100', name: 'Hängiven student', description: 'Studerade 100 dagar i rad', category: 'STREAK', xpReward: 1500, sortOrder: 23 },

    // SPECIAL badges
    { code: 'EARLY_BIRD', name: 'Morgonpigga', description: 'Studerade före kl 07:00', category: 'SPECIAL', xpReward: 50, sortOrder: 30 },
    { code: 'NIGHT_OWL', name: 'Nattugla', description: 'Studerade efter kl 23:00', category: 'SPECIAL', xpReward: 50, sortOrder: 31 },
    { code: 'WEEKEND_WARRIOR', name: 'Helgkrigare', description: 'Studerade både lördag och söndag', category: 'SPECIAL', xpReward: 75, sortOrder: 32 },
    { code: 'COMEBACK', name: 'Välkommen tillbaka', description: 'Återvände efter 30+ dagars frånvaro', category: 'SPECIAL', xpReward: 100, sortOrder: 33 },

    // LIMB LEVEL badges - Progression system
    { code: 'LIMB_NOVICE', name: 'LIMB Novice', description: 'Påbörjat ORTAC-kursen', category: 'LIMB_LEVEL', xpReward: 0, sortOrder: 40, requirement: { type: 'course_started' } },
    { code: 'LIMB_PRACTITIONER', name: 'LIMB Practitioner', description: 'Genomfört 10 case-övningar', category: 'LIMB_LEVEL', xpReward: 200, sortOrder: 41, requirement: { caseExercises: 10 } },
    { code: 'LIMB_PROFICIENT', name: 'LIMB Proficient', description: 'Genomfört refresher-kurs', category: 'LIMB_LEVEL', xpReward: 500, sortOrder: 42, requirement: { refresherCourse: true } },
    { code: 'LIMB_EXPERT', name: 'LIMB Expert', description: 'Avancerad kurs + 50 case-övningar', category: 'LIMB_LEVEL', xpReward: 1000, sortOrder: 43, requirement: { advancedCourse: true, caseExercises: 50 } },
    { code: 'LIMB_MASTER', name: 'LIMB Master', description: 'Instruktörscertifiering uppnådd', category: 'LIMB_LEVEL', xpReward: 2000, sortOrder: 44, requirement: { instructorCertified: true } },

    // COMPETENCE badges - Topic mastery
    { code: 'FRACTURE_FINDER', name: 'Frakturfinnaren', description: '20 öppna fraktur-frågor korrekt', category: 'COMPETENCE', xpReward: 150, sortOrder: 50, requirement: { topicCorrect: 'open_fracture', count: 20 } },
    { code: 'VASCULAR_VIGILANT', name: 'Kärlvakten', description: '100% på kärlskador-kapitlet', category: 'COMPETENCE', xpReward: 200, sortOrder: 51, requirement: { chapterPerfect: 'karlskador' } },
    { code: 'COMPARTMENT_COMMANDER', name: 'Kompartmentkommendören', description: 'Perfekt på kompartment-quiz', category: 'COMPETENCE', xpReward: 200, sortOrder: 52, requirement: { quizPerfect: 'kompartmentsyndrom' } },
    { code: 'SPLINT_SPECIALIST', name: 'Fixeringsexperten', description: 'Praktiska färdigheter godkänd', category: 'COMPETENCE', xpReward: 250, sortOrder: 53, requirement: { practicalPassed: true } },
    { code: 'PELVIC_PRO', name: 'Bäckenproffset', description: '100% på bäckenringskador', category: 'COMPETENCE', xpReward: 200, sortOrder: 54, requirement: { chapterPerfect: 'backenringskador' } },
    { code: 'PEDIATRIC_PROTECTOR', name: 'Barntraumaexperten', description: 'Alla pediatrik-frågor rätt', category: 'COMPETENCE', xpReward: 200, sortOrder: 55, requirement: { chapterPerfect: 'pediatrik' } },

    // ENGAGEMENT badges
    { code: 'CASE_CRUSHER', name: 'Case-krossaren', description: 'Genomfört 100 case-övningar', category: 'ENGAGEMENT', xpReward: 300, sortOrder: 60, requirement: { caseExercises: 100 } },
    { code: 'COMMUNITY_CHAMPION', name: 'Communityhjälten', description: 'Delat 10 case-diskussioner', category: 'ENGAGEMENT', xpReward: 150, sortOrder: 61, requirement: { discussionsShared: 10 } },
    { code: 'STUDY_MARATHON', name: 'Studiemaraton', description: 'Studerat 4+ timmar på en dag', category: 'ENGAGEMENT', xpReward: 100, sortOrder: 62, requirement: { dailyStudyHours: 4 } },
    { code: 'QUIZ_CHAMPION', name: 'Quizmästaren', description: 'Genomfört 50 quiz', category: 'ENGAGEMENT', xpReward: 200, sortOrder: 63, requirement: { quizCount: 50 } },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {},
      create: badge,
    });
  }

  console.log('✅ Badges created');

  // Assign some badges to test users
  const firstChapterBadge = await prisma.badge.findUnique({ where: { code: 'FIRST_CHAPTER' } });
  const fiveChaptersBadge = await prisma.badge.findUnique({ where: { code: 'FIVE_CHAPTERS' } });
  const streak7Badge = await prisma.badge.findUnique({ where: { code: 'STREAK_7' } });
  const streak30Badge = await prisma.badge.findUnique({ where: { code: 'STREAK_30' } });
  const certifiedBadge = await prisma.badge.findUnique({ where: { code: 'CERTIFIED' } });

  if (firstChapterBadge && participantUser) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: participantUser.id, badgeId: firstChapterBadge.id } },
      update: {},
      create: { userId: participantUser.id, badgeId: firstChapterBadge.id },
    });
  }

  if (fiveChaptersBadge && instructorUser) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: instructorUser.id, badgeId: fiveChaptersBadge.id } },
      update: {},
      create: { userId: instructorUser.id, badgeId: fiveChaptersBadge.id },
    });
  }

  if (streak7Badge && participantUser) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: participantUser.id, badgeId: streak7Badge.id } },
      update: {},
      create: { userId: participantUser.id, badgeId: streak7Badge.id },
    });
  }

  if (streak30Badge && instructorUser) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: instructorUser.id, badgeId: streak30Badge.id } },
      update: {},
      create: { userId: instructorUser.id, badgeId: streak30Badge.id },
    });
  }

  if (certifiedBadge && adminUser) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: adminUser.id, badgeId: certifiedBadge.id } },
      update: {},
      create: { userId: adminUser.id, badgeId: certifiedBadge.id },
    });
  }

  console.log('✅ User badges assigned');

  // Create course
  const course = await prisma.course.upsert({
    where: { code: 'ORTAC-2025' },
    update: {},
    create: {
      code: 'ORTAC-2025',
      name: 'ORTAC',
      fullName: 'Orthopaedic Resuscitation and Trauma Acute Care',
      version: '1.0',
      description: 'Certifieringskurs för läkare inom ortopedisk traumavård. Fokus på tidskritiska tillstånd: massiv blödning, kärlskador, kompartmentsyndrom och öppna frakturer.',
      estimatedHours: 16,
      passingScore: 70,
      isActive: true,
    },
  });

  console.log('✅ Course created');

  // Create exam criteria for ORTAC
  await prisma.courseExamCriteria.upsert({
    where: { courseId: course.id },
    update: {},
    create: {
      courseId: course.id,
      // Quiz/Posttest
      quizPassingScore: 70,
      quizRetakeAllowed: 2,
      quizRetakeWaitDays: 7,
      // OSCE - 6 av 8 stationer
      osceMinStationsPassed: 6,
      osceTotalStations: 8,
      osceAllowRetake: true,
      osceRetakeWaitDays: 14,
      // EPA - minst nivå 3 på alla
      epaMinEntrustment: 3,
      epaAllRequired: true,
      // Kritiska fel = automatiskt underkänt
      criticalErrorPolicy: 'AUTO_FAIL',
    },
  });

  console.log('✅ Exam criteria created');

  // Create certificate template for ORTAC
  await prisma.certificateTemplate.upsert({
    where: { courseId: course.id },
    update: {},
    create: {
      courseId: course.id,
      title: 'ORTAC Certifikat',
      subtitle: 'Orthopaedic Resuscitation and Trauma Acute Care',
      description: `Innehavaren har genomgått ORTAC-kursen och demonstrerat kompetens inom:
• Systematisk bedömning av ortopediskt trauma (LIMB-protokollet)
• Hantering av tidskritiska tillstånd: massiv blödning, kärlskador, kompartmentsyndrom, öppna frakturer
• Praktiska färdigheter (OSCE): tourniquet, bäckenbälte, neurovaskulär bedömning
• Teamkommunikation enligt SBAR och CRM-principer`,
      validityYears: 3,
      recertRequired: true,
      recertCourseName: 'ORTAC Uppdateringskurs',
      recertValidityYears: 3,
      signerName: 'Kursansvarig',
      signerTitle: 'ORTAC Kursledning',
    },
  });

  console.log('✅ Certificate template created');

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
    { partIndex: 0, chapterNumber: 1, title: 'Introduktion – Varför ORTAC?', slug: 'introduktion', estimatedMinutes: 20, content: getChapterContent(1) },
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
      update: {
        // Update content when chapter exists
        content: chapter.content,
        title: chapter.title,
        estimatedMinutes: chapter.estimatedMinutes,
        sortOrder: i + 1,
      },
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

  // Create learning objectives for all chapters
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

  // Create algorithms
  const algorithms = [
    { code: 'LIMB', title: 'LIMB-algoritmen', description: 'Systematisk bedömning av extremitetsskador', svg: getLIMBAlgorithmSVG() },
    { code: 'ABI-FLOW', title: 'ABI-flödesschema', description: 'Beslutsstöd för ankel-brachialindex', svg: getABIFlowSVG() },
    { code: 'COMPARTMENT', title: 'Kompartmentsyndrom', description: 'Diagnos och behandling av kompartmentsyndrom', svg: getCompartmentSVG() },
    { code: 'OPEN-FX', title: 'Öppna frakturer', description: 'Gustilo-Anderson klassifikation och handläggning', svg: getOpenFractureSVG() },
    { code: 'PELVIC', title: 'Bäckenringskador', description: 'Klassifikation och initial handläggning', svg: getPelvicSVG() },
    { code: 'DCO', title: 'DCO-beslutsträd', description: 'Damage Control Orthopaedics beslutsstöd', svg: getDCOSVG() },
    { code: 'SALTER-HARRIS', title: 'Salter-Harris klassifikation', description: 'Klassifikation av pediatriska fyseolys', svg: getSalterHarrisSVG() },
    { code: 'CRUSH', title: 'Crush syndrome-hantering', description: 'Tidslinje och behandling vid crush syndrome', svg: getCrushSyndromeSVG() },
    { code: 'TRANSPORT', title: 'Transport-beslutsträd', description: 'Immobilisering och överflyttning vid trauma', svg: getTransportSVG() },
    { code: 'OSCE', title: 'OSCE-bedömningsflöde', description: 'Praktisk examination och stationer', svg: getOSCESVG() },
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

  // Seed EPAs (Entrustable Professional Activities)
  const epas = getEPAs();
  for (const epa of epas) {
    await prisma.ePA.upsert({
      where: { code: epa.code },
      update: {},
      create: {
        code: epa.code,
        title: epa.title,
        description: epa.description,
        objectives: epa.objectives,
        criteria: epa.criteria,
        sortOrder: epa.sortOrder,
        isActive: true,
      },
    });
  }
  console.log('✅ 12 EPAs created');

  // Seed OSCE Stations
  const osceStations = getOSCEStations();
  for (const station of osceStations) {
    await prisma.oSCEStation.upsert({
      where: { code: station.code },
      update: {},
      create: {
        code: station.code,
        title: station.title,
        scenario: station.scenario,
        checklist: station.checklist,
        criticalErrors: station.criticalErrors,
        timeLimit: station.timeLimit,
        sortOrder: station.sortOrder,
        isActive: true,
      },
    });
  }
  console.log('✅ 8 OSCE Stations created');

  // Seed Instructor Guides
  const instructorGuides = getInstructorGuides();
  for (const guide of instructorGuides) {
    await prisma.instructorGuide.upsert({
      where: { id: guide.id },
      update: {},
      create: {
        id: guide.id,
        courseId: course.id,
        type: guide.type,
        title: guide.title,
        content: guide.content,
        sortOrder: guide.sortOrder,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${instructorGuides.length} Instructor Guides created`);

  // Log Pilot Protocol (informational, not stored in DB)
  const pilotProtocol = getPilotProtocol();
  console.log(`✅ Kirkpatrick Pilot Protocol defined (${pilotProtocol.length} assessment types across 4 levels)`);

  // ============================================
  // INSTRUCTOR COURSE: ORTAC TTT
  // ============================================
  const instructorCourse = await prisma.course.upsert({
    where: { code: 'ORTAC-TTT-2025' },
    update: {
      instructorOnly: true,
    },
    create: {
      code: 'ORTAC-TTT-2025',
      name: 'ORTAC Instruktörsutbildning',
      fullName: 'Train-the-Trainer Kurs för ORTAC Instruktörer',
      version: '1.0',
      description: 'Komplett instruktörsutbildning för ORTAC-kursen. Inkluderar TTT-workshop (2 dagar), examinatorkurs (4h), kursledarutbildning (1 dag) och referensmaterial för svåra situationer.',
      estimatedHours: 24,
      passingScore: 80,
      instructorOnly: true,
      isActive: true,
    },
  });

  // Create instructor course parts
  const tttParts = [
    { partNumber: 1, title: 'Train-the-Trainer Workshop', description: '2-dagars pedagogisk grundkurs för nya instruktörer', sortOrder: 1 },
    { partNumber: 2, title: 'Specialistkurser', description: 'Fördjupningskurser för examinatorer och kursledare', sortOrder: 2 },
    { partNumber: 3, title: 'Referensmaterial', description: 'Casebook och verktyg för instruktörer', sortOrder: 3 },
  ];

  const createdTTTParts = [];
  for (const part of tttParts) {
    const created = await prisma.coursePart.upsert({
      where: { courseId_partNumber: { courseId: instructorCourse.id, partNumber: part.partNumber } },
      update: {},
      create: { ...part, courseId: instructorCourse.id },
    });
    createdTTTParts.push(created);
  }

  // Create instructor course chapters
  const tttChapters = [
    { partIndex: 0, chapterNumber: 1, title: 'TTT Workshop Manual', slug: 'ttt-workshop-manual', estimatedMinutes: 120, content: getTTTWorkshopContent() },
    { partIndex: 1, chapterNumber: 2, title: 'Examinatorkurs (4h)', slug: 'examinatorkurs', estimatedMinutes: 60, content: getExaminatorkursContent() },
    { partIndex: 1, chapterNumber: 3, title: 'Kursledarutbildning (1 dag)', slug: 'kursledarutbildning', estimatedMinutes: 90, content: getKursledarutbildningContent() },
    { partIndex: 2, chapterNumber: 4, title: 'Svåra Situationer Casebook', slug: 'svara-situationer-casebook', estimatedMinutes: 45, content: getSvaraSituationerContent() },
  ];

  const createdTTTChapters = [];
  for (let i = 0; i < tttChapters.length; i++) {
    const chapter = tttChapters[i];
    const part = createdTTTParts[chapter.partIndex];
    const created = await prisma.chapter.upsert({
      where: { slug: chapter.slug },
      update: {
        content: chapter.content,
        title: chapter.title,
        estimatedMinutes: chapter.estimatedMinutes,
        sortOrder: i + 1,
      },
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
    createdTTTChapters.push(created);
  }

  // Create certificate template for instructor course
  await prisma.certificateTemplate.upsert({
    where: { courseId: instructorCourse.id },
    update: {},
    create: {
      courseId: instructorCourse.id,
      title: 'ORTAC Instruktörscertifikat',
      subtitle: 'Train-the-Trainer Certification',
      description: `Innehavaren har genomfört ORTAC Instruktörsutbildning och demonstrerat kompetens inom:

• Vuxenpedagogiska principer (Knowles, Kolb, Miller)
• Feedbackmodeller (Pendleton, SET-GO)
• Färdighetsträning med Peyton 4-stegsmodellen
• Simuleringspedagogik och GAS-debriefing
• OSCE-examination och kalibrering
• Kursplanering och instruktörsledning
• Hantering av svåra situationer`,
      validityYears: 3,
      recertRequired: true,
      recertCourseName: 'ORTAC Instruktörsuppdatering',
      recertValidityYears: 3,
      signerName: 'Utbildningsansvarig',
      signerTitle: 'ORTAC Kursledning',
    },
  });

  // Create quiz questions for instructor course
  const instructorQuestions = getInstructorQuizQuestions();
  for (const q of instructorQuestions) {
    const chapter = createdTTTChapters.find(c => c.chapterNumber === q.chapterNumber);

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
        isExamQuestion: false, // Instructor course questions are not exam questions
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

  console.log(`✅ Instructor course created with ${createdTTTChapters.length} chapters and ${instructorQuestions.length} quiz questions`);

  // Create learning objectives for instructor course chapters
  const instructorLOs = getInstructorLearningObjectives();
  for (const obj of instructorLOs) {
    const chapter = createdTTTChapters.find(c => c.chapterNumber === obj.chapterNumber);
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

  console.log(`✅ Instructor learning objectives created (${instructorLOs.length} LOs)`);

  // ============================================
  // TTT COHORT FOR INSTRUCTOR TRAINING
  // ============================================
  const tttCohort = await prisma.cohort.upsert({
    where: { id: 'cohort-ttt-training' },
    update: {},
    create: {
      id: 'cohort-ttt-training',
      courseId: instructorCourse.id,
      instructorId: adminUser.id, // Admin leads the instructor training
      name: 'Instruktörsträning 2025',
      description: 'Löpande instruktörsutbildning för nya ORTAC instruktörer',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      maxParticipants: 20,
      isActive: true,
    },
  });

  // Enroll instructor user in TTT cohort (so they can complete their training)
  await prisma.enrollment.upsert({
    where: { userId_cohortId: { userId: instructorUser.id, cohortId: tttCohort.id } },
    update: {},
    create: {
      userId: instructorUser.id,
      cohortId: tttCohort.id,
      status: 'active',
    },
  });

  console.log('✅ TTT cohort created and instructor enrolled');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest accounts:');
  console.log('  Admin: 199001011234');
  console.log('  Instructor: 198505152345');
  console.log('  Participant: 199203203456');
  console.log('\nORTAC Content:');
  console.log(`  - ${createdChapters.length} chapters`);
  console.log(`  - ${epas.length} EPAs`);
  console.log(`  - ${osceStations.length} OSCE Stations`);
}

// Helper functions for content
function getChapterContent(chapterNumber: number): string {
  const contents: Record<number, string> = {
    1: `# Introduktion – Varför ORTAC?

## Bakgrund och globalt perspektiv

Trauma är den ledande dödsorsaken för personer under 45 år globalt. Enligt WHO:s rapport från 2024 orsakar traumatiska skador 4,4 miljoner dödsfall årligen – cirka 8% av alla dödsfall världen över (WHO Global Health Estimates 2024). I Sverige utgör trauma en betydande del av sjukvårdens belastning, med tusentals patienter årligen som behandlas för allvarliga extremitetsskador.

### Global traumaepidemiologi

| Region | Traumarelaterade dödsfall/år | Andel av alla dödsfall |
|--------|----------------------------|----------------------|
| Globalt | 4,4 miljoner | 8% |
| Europa | ~350 000 | 5-6% |
| Sverige | ~4 000 | ~4% |

### Förebyggbara dödsfall

> "National Academy of Sciences, Engineering, and Medicine uppskattade 2016 att minst 20% av alla traumarelaterade dödsfall är förebyggbara. Nyare studier tyder på att andelen kan vara ännu högre." (NASEM 2016; Drake et al. 2020)

**Huvudorsaker till förebyggbar traumamortalitet:**
1. **Blödning** – främsta orsaken till förebyggbar död (Eastridge BJ et al. J Trauma 2012)
2. **Fördröjd behandling** – prehospitala förseningar och väntetid till operation
3. **Felbedömning** – missade skador, särskilt tidskritiska tillstånd

En analys av 13 500 traumafall visade att fördröjd behandling (mediantid 73 min vs 54 min till sjukhus) och fördröjd operation (80 min vs 52 min) var oberoende riskfaktorer för förebyggbar mortalitet (MacKenzie EJ et al. J Trauma 1993; JAMA Surgery 2024).

## Extremitetstrauma – specifik epidemiologi

### Incidens i Sverige
- **Frakturer totalt:** ~100 000/år
- **Extremitetsfrakturer:** ~70% av alla frakturer
- **Allvarliga extremitetsskador (ISS >15):** ~3 000/år
- **Traumatiska amputationer:** ~500/år

### Extremitetstrauma som dödsorsak

Extremitetsskador orsakar sällan direkt död, men:
- **Massiv blödning** från extremiteter kan vara livshotande
- **20-40%** av traumadödsfallen har extremitetsskada som bidragande faktor
- **Bäckenfrakturer** med instabil hemodynamik har mortalitet upp till 60%

> "Extremitetsskador dödar genom blödning – snabb blödningskontroll är livräddande." (TCCC Guidelines 2024)

## De fyra tidskritiska tillstånden

ORTAC fokuserar på fyra tidskritiska ortopediska tillstånd där varje timme räknas:

### 1. Massiv blödning från extremitet
- **Tidsfönster:** Minuter
- **Risk:** Exsanguination inom 3-5 minuter vid okontrollerad blödning
- **Intervention:** Tourniquet, direkt tryck, TXA
- **Konsekvens vid försening:** Död

### 2. Arteriell kärlskada med ischemi
- **Tidsfönster:** 4-6 timmar (revaskularisering)
- **Risk:** Irreversibel nervskada efter 4h, muskelskada efter 6h
- **Intervention:** Shunting, revaskularisering, fasciotomi
- **Konsekvens vid försening:** Amputation, permanent funktionsnedsättning

### 3. Kompartmentsyndrom
- **Tidsfönster:** 4-6 timmar för fasciotomi (tidigare = bättre resultat)
- **Risk:** Irreversibel muskel- och nervskada, Volkmanns kontraktur
- **Intervention:** Fasciotomi
- **Konsekvens vid försening:** Amputation, kontraktur, njursvikt (rhabdomyolys)

### 4. Öppen fraktur
- **Tidsfönster:** Antibiotika inom 1 timme, debridering inom 24 timmar
- **Risk:** Infektion, osteomyelit
- **Intervention:** Antibiotika, debridering, stabilisering
- **Konsekvens vid försening:** Djup infektion (5-50% beroende på Gustilo-grad)

## ATLS och extremitetstrauma

Advanced Trauma Life Support (ATLS) är den globala standarden för initial traumahandläggning. Kursen utvecklades av American College of Surgeons och har utbildat över 1 miljon läkare världen över (ACS ATLS 2024).

### ABCDE-principen

| Bokstav | Betydelse | Extremitetsrelevans |
|---------|-----------|---------------------|
| **A** | Airway | Indirekt – svår smärta kan påverka luftväg |
| **B** | Breathing | Indirekt |
| **C** | Circulation | **DIREKT** – massiv extremitetsblödning |
| **D** | Disability | Neurologisk status i extremiteter |
| **E** | Exposure | Fullständig inspektion av extremiteter |

### Sekundär undersökning

I den sekundära undersökningen (efter stabilisering) görs systematisk genomgång av extremiteterna:
- Felställningar
- Öppna skador
- Pulsar
- Neurologisk status
- Mjukdelsstatus

## Lärandemål för ORTAC

Efter genomgången kurs ska deltagaren kunna:

1. **Identifiera** de fyra tidskritiska tillstånden
2. **Prioritera** extremitetsskador i relation till ABCDE
3. **Initiera** omedelbar behandling av livshotande blödning
4. **Bedöma** cirkulationsstatus med kliniska metoder och ABI
5. **Känna igen** tidiga tecken på kompartmentsyndrom
6. **Handlägga** öppna frakturer enligt BOAST-riktlinjer
7. **Dokumentera** tidskritisk information korrekt
8. **Kommunicera** effektivt med trauma- och ortopedteam

## Kursens uppbyggnad

ORTAC-kursen är strukturerad i tre delar:

### Del I: Principer och systematik (Kapitel 1-3)
- Introduktion och bakgrund
- Primärundersökning (LIMB-protokollet)
- Prioritering av extremitetsskador

### Del II: Specifika tillstånd (Kapitel 4-13)
- Massiv blödning (Kap 4)
- Kärlskador (Kap 5)
- Kompartmentsyndrom (Kap 6)
- Öppna frakturer (Kap 7)
- Bäckenringskador (Kap 8)
- Amputationsskador (Kap 9)
- Barntrauma (Kap 10)
- Crush-syndrom (Kap 11)
- Speciella patientgrupper (Kap 12)
- Damage Control Orthopaedics (Kap 13)

### Del III: Praktisk tillämpning (Kapitel 14-17)
- Prehospital vård och transport (Kap 14)
- Dokumentation och rapportering (Kap 15)
- Teamarbete och kommunikation (Kap 16)
- Examination och certifiering (Kap 17)

## Sammanfattning – Nyckelbudskap

1. **Trauma dödar** – 4,4 miljoner globalt per år, 8% av alla dödsfall
2. **Minst 20% av traumadödsfall är förebyggbara** – ofta genom snabbare behandling
3. **Blödning är främsta orsaken till förebyggbar död** – kräver omedelbar intervention
4. **Tid är vävnad** – varje minut räknas vid tidskritiska tillstånd
5. **Strukturerad handläggning räddar liv** – ATLS och ORTAC-principer

## Referenser

- WHO Global Health Estimates 2024
- ATLS Advanced Trauma Life Support. 11th ed. American College of Surgeons 2023
- National Academy of Sciences, Engineering, and Medicine. A National Trauma Care System. 2016
- Drake SA et al. Potentially preventable mortality. Injury 2020;51:2048-2055
- Eastridge BJ et al. Death on the battlefield. J Trauma 2012;73:S431-S437
- MacKenzie EJ et al. A national evaluation of trauma care. JAMA Surgery 2024
- TCCC Guidelines 25 January 2024
`,
    2: `# Den ortopediska primärundersökningen

## Bakgrund

En systematisk primärundersökning av extremiteter är avgörande för att identifiera tidskritiska skador. LIMB-protokollet är en minnesregel som säkerställer att alla väsentliga aspekter av extremitetsundersökningen genomförs strukturerat.

> "En missad kärlskada eller tidigt kompartmentsyndrom kan leda till amputation. Systematisk undersökning förhindrar att livshotande och extremitetshotande skador missas." (ATLS 11th Ed. 2023)

## Relation till ATLS

LIMB-protokollet kompletterar ATLS genom att ge en detaljerad struktur för extremitetsundersökning under den sekundära undersökningen:

| ATLS-fas | Extremitetsaspekt |
|----------|-------------------|
| Primary survey (C) | Identifiera/stoppa massiv blödning |
| Primary survey (D) | Grovneurologisk extremitetsbedömning |
| Primary survey (E) | Avklädd inspektion av extremiteter |
| **Secondary survey** | **Fullständig LIMB-undersökning** |

## LIMB-protokollet

LIMB är en strukturerad metod för bedömning av extremitetsskador:

| Bokstav | Betydelse | Huvudfokus |
|---------|-----------|------------|
| **L** | Look (Inspektion) | Synliga skador, deformiteter |
| **I** | Ischemia (Cirkulation) | Kärlstatus, perfusion |
| **M** | Movement (Rörlighet) | Motorik, neurologi, kompartment |
| **B** | Bones & soft tissue | Skelett, mjukdelar, öppna skador |

---

## L – Look (Inspektion)

### Systematisk inspektion

Börja med att inspektera extremiteten FÖRE palpation:

**Checklista:**
- [ ] Felställning/deformitet (angulering, förkortning, rotation)
- [ ] Svullnad (lokaliserad vs generaliserad)
- [ ] Hudskador (sår, kontusioner, blåsor)
- [ ] Blödning (aktiv, koagel)
- [ ] Färgförändringar (blekhet, cyanos, marmorering)
- [ ] Jämförelse med kontralaterala sidan

### Varningssignaler vid inspektion

| Fynd | Möjlig betydelse | Åtgärd |
|------|------------------|--------|
| Grov felställning | Fraktur/luxation | Immobilisering, röntgen |
| Blek extremitet | Kärlskada | Omedelbar kärlbedömning |
| Cyanotisk extremitet | Venös obstruktion eller sent arteriellt | Akut kärlkirurg |
| Spänd svullnad | Kompartmentsyndrom | Tryckmätning, fasciotomiberedskap |
| Öppet sår + fraktur | Öppen fraktur | Antibiotika inom 1h, steril täckning |

### Fotodokumentation

> "Fotografera alla öppna skador FÖRE rengöring. Undvik upprepade sårundersökningar som ökar infektionsrisken." (BOAST 4 2017)

---

## I – Ischemia (Cirkulation)

### Kärlbedömningens betydelse

Kärlskada förekommer vid:
- 1-3% av alla extremitetsfrakturer
- 15-20% av knäluxationer (a. poplitea)
- 5-10% av suprakondylära humerusfrakturer hos barn (a. brachialis)
- 30-40% av penetrerande extremitetstrauma

### Hard vs Soft signs av kärlskada

**Hard signs (kräver omedelbar åtgärd):**
| Tecken | Betydelse |
|--------|-----------|
| Pulslöshet | Komplett arteriell ocklusion |
| Palpabel thrill | Arteriovenös fistel |
| Expanderande hematom | Aktiv arteriell blödning |
| Pulserande blödning | Arteriell skada |
| Uppenbar ischemi (6 P) | Kritisk ischemi |

**Soft signs (kräver vidare utredning):**
| Tecken | Åtgärd |
|--------|--------|
| Nedsatt puls | ABI, CT-angio |
| Litet, icke-expanderande hematom | Observation, serial-ABI |
| Nervskada i närheten av kärl | CT-angio |
| Fraktur med hög kärlskaderisk | ABI, CT-angio vid behov |

### Cirkulationsbedömning – Steg för steg

**1. Kapillär återfyllnad (CRT)**
- Normal: < 2 sekunder
- Fördröjd: 2-5 sekunder (suspekt)
- Utsläckt: > 5 sekunder eller frånvarande (ischemi)

**2. Perifera pulsar**

| Extremitet | Pulsar att bedöma |
|------------|-------------------|
| Övre extremitet | A. radialis, a. ulnaris, a. brachialis |
| Nedre extremitet | A. femoralis, a. poplitea, a. dorsalis pedis, a. tibialis posterior |

**Gradering:**
- 2+ = Normal
- 1+ = Svag
- 0 = Frånvarande

**3. Hudfärg och temperatur**
- Blek + kall = arteriell insufficiens
- Cyanotisk + varm = venös obstruktion
- Jämför alltid med kontralaterala sidan

**4. Ankle-Brachial Index (ABI)**

\`\`\`
ABI = Systoliskt ankeltryck / Systoliskt armtryck
\`\`\`

| ABI-värde | Tolkning | Åtgärd |
|-----------|----------|--------|
| 1.0–1.3 | Normal | Observation |
| 0.9–0.99 | Gränsvärde | Upprepad mätning |
| **< 0.9** | Abnormt | CT-angiografi |
| < 0.5 | Kritisk ischemi | Akut kärlkirurg |

> "Ett ABI < 0.9 har >90% sensitivitet och specificitet för signifikant kärlskada." (Mills WJ et al. J Trauma 2004)

**Klinisk tolkning av ABI-trösklar:**
- **ABI < 0.9** = standardtröskel med hög sensitivitet (rekommenderas för screening)
- **ABI < 0.7** = högre specificitet (91%) utan att missa reparationskrävande skador (J Vasc Surg 2020)
- Vid ABI 0.7-0.9: överväg klinisk bild, skademekanism och upprepade mätningar

### Högriskfrakturer för kärlskada

| Fraktur | Riskartär | Åtgärd |
|---------|-----------|--------|
| Knäluxation | A. poplitea (15-20%) | ABI + CT-angio rutinmässigt |
| Suprakondylär humerusfraktur | A. brachialis (5-10%) | Noggrann pulskontroll |
| Proximal tibiafraktur | A. poplitea | ABI vid nedsatt puls |
| Suprakondylär femurfraktur | A. femoralis superficialis | ABI vid nedsatt puls |
| Klaukulafraktur (medial) | A. subclavia | Klinisk bedömning |

---

## M – Movement (Rörlighet)

### Neurologisk bedömning

**1. Aktiv rörlighet**
- Patientens egen förmåga att röra extremiteten
- Dokumentera muskelstyrka enligt MRC-skalan (0-5)

**MRC-skala:**
| Grad | Beskrivning |
|------|-------------|
| 0 | Ingen kontraktion |
| 1 | Synlig/palpabel kontraktion utan rörelse |
| 2 | Rörelse utan tyngdkraftsmotstånd |
| 3 | Rörelse mot tyngdkraften |
| 4 | Rörelse mot visst motstånd |
| 5 | Normal styrka |

**2. Passiv rörlighet**
- Undersökarens rörelse av leden
- Viktigt för att bedöma ledinvolvering vid fraktur

**3. Smärta vid passiv töjning – KOMPARTMENTTECKEN**

> "Smärta vid passiv töjning av musklerna i ett kompartment är det mest sensitiva kliniska tecknet på kompartmentsyndrom." (McQueen MM et al. JBJS Br 2000)

| Kompartment | Test |
|-------------|------|
| Anteriort underben | Passiv plantarflexion av fot/tår |
| Djupt posteriort underben | Passiv dorsalflexion av fot/tår |
| Volart underarm | Passiv extension av fingrar/handled |

**4. Sensorisk undersökning**

| Nerv | Sensoriskt område | Motoriskt test |
|------|-------------------|----------------|
| N. radialis | Dorsalt 1:a mellanrum | Handledsextension |
| N. medianus | Palmar sida dig 1-3.5 | Tumopposition |
| N. ulnaris | Dig 4.5 + ulnarsidan | Fingerabduktion |
| N. peroneus | Dorsalt fot, 1:a mellanrum | Dorsalflexion fot |
| N. tibialis | Plantar fot | Plantarflexion fot |

---

## B – Bones & Soft Tissue

### Skelettundersökning

**1. Stabilitetsbedömning**
- ALDRIG aktivt stresstesta misstänkt fraktur
- Bedöm genom försiktig palpation

**2. Krepitationer**
- Gnisslande känsla vid frakturrörelse
- Smärtsamt – undvik onödig undersökning om fraktur är uppenbar

**3. Punktsömhet**
- Lokaliserad ömhet över skelett = frakturmisstanke
- Dokumentera exakt lokalisation

### Mjukdelsbedömning

**1. Svullnad**
- Lokaliserad: trauma till specifik vävnad
- Generaliserad: venös obstruktion, blödning

**2. Hudstatus**
- Intakt vs skadad
- Spänning (kompartment?)
- Blåsor (ofta vid svår svullnad)

**3. Öppna skador**
- Dokumentera storlek, lokalisation
- Kommunikation med fraktur = öppen fraktur
- Steril täckning omedelbart

### Bedömning av öppen fraktur

Vid misstanke om öppen fraktur:

1. **Anta att det är en öppen fraktur** om sår + fraktur i samma område
2. **Fotodokumentation** INNAN rengöring
3. **Steril fuktig kompress** – täck omedelbart
4. **Antibiotika inom 1 timme**
5. **Tetanusprofylax**
6. **Gustilo-klassifikation** slutgiltigt på operationsbordet

---

## Dokumentation

### Obligatorisk dokumentation

| Information | Exempel |
|-------------|---------|
| Tidpunkt för skada | "kl 14:30" |
| Tidpunkt för undersökning | "kl 15:45" |
| Skademekanism | "MC-olycka, 60 km/h" |
| L – Inspektion | "Grov felställning underben, 10 cm sår medialt" |
| I – Cirkulation | "Dorsalis pedis 1+, ABI 0.85" |
| M – Rörlighet | "Dorsalflexion 3/5, smärta passiv töjning" |
| B – Skelett/mjukdelar | "Öppen fraktur, span, stabil proximal tibia" |
| Vidtagna åtgärder | "Tourniquet kl 15:00, Kloxacillin kl 15:20" |

---

## Sammanfattning – LIMB-checklista

| Steg | Fråga | Röd flagga |
|------|-------|------------|
| **L** | Hur ser extremiteten ut? | Felställning, blekhet, öppen skada |
| **I** | Är cirkulationen intakt? | Pulslös, ABI < 0.9, kall extremitet |
| **M** | Fungerar neurologi + motorik? | Pares, smärta passiv töjning |
| **B** | Skelett + mjukdelar intakta? | Instabilitet, öppen fraktur |

## Referenser

- ATLS Advanced Trauma Life Support. 11th ed. American College of Surgeons 2023
- Mills WJ et al. The value of ABI in detecting occult vascular injury. J Trauma 2004;56:814-9
- McQueen MM et al. Acute compartment syndrome. JBJS Br 2000;82:200-3
- BOAST 4: The Management of Severe Open Lower Limb Fractures. BOA 2017 (uppdaterad 2020 med tillägg om "Best Practice Tariff" och kvalitetskrav)
- Medical Research Council. Aids to examination of the peripheral nervous system. 1976
`,
    3: `# Extremitetsskador och prioritering

## Bakgrund

Vid trauma med multipla skador är korrekt prioritering avgörande för patientens överlevnad och funktionella utfall. ATLS-principen "treat first what kills first" gäller även för extremitetsskador, där livshotande blödning måste åtgärdas omedelbart, ofta parallellt med andra livräddande åtgärder.

> "Extremitetsskador dödar sällan direkt – men blödning från extremiteter kan vara livshotande och måste behandlas redan under primär survey." (ATLS 11th Ed. 2023)

## Prioriteringshierarkin

### Övergripande princip

| Prioritet | Kategori | Tidsfönster | Exempel |
|-----------|----------|-------------|---------|
| **1** | Livshotande | Omedelbart | ABCDE-hot, massiv blödning |
| **2** | Extremitetshotande | Timmar | Ischemi, kompartment |
| **3** | Akuta/brådskande | Samma dag | Frakturer, luxationer |
| **4** | Övriga | Planerat | Mindre mjukdelsskador |

### Prioritet 1: Livshotande skador (minuter)

Dessa skador behandlas under **primär survey (ABCDE)**:

| Bokstav | Livshotande skada | Extremitetsrelevans |
|---------|-------------------|---------------------|
| A | Luftvägsobstruktion | Indirekt (smärta kan påverka) |
| B | Ventilationsproblem | Indirekt |
| **C** | **Massiv blödning** | **DIREKT – extremitetsblödning kan vara livshotande** |
| D | Neurologisk skada | Indirekt (spinaltrauma påverkar extremiteter) |
| E | Hypotermi | Ökad blödningsrisk vid hypotermi |

**Massiv extremitetsblödning:**
- Tourniquet appliceras under "C" i primär survey
- Kan föregå annan behandling vid katastrofal blödning
- "MARCH" (Massive hemorrhage, Airway, Respiration, Circulation, Hypothermia) – blödningskontroll först vid prehospital vård

> "Stop the bleeding – blödning som dödar snabbast prioriteras först. En katastrofal extremitetsblödning behandlas INNAN eller SAMTIDIGT med luftvägssäkring om resurserna tillåter." (TCCC Guidelines 2024)

### Prioritet 2: Extremitetshotande skador (timmar)

Dessa skador behandlas efter att patienten stabiliserats men kräver snabb intervention:

| Tillstånd | Tidsgräns | Konsekvens vid försening |
|-----------|-----------|-------------------------|
| **Arteriell kärlskada med ischemi** | 4-6 timmar | Amputation |
| **Kompartmentsyndrom** | 6 timmar | Volkmanns kontraktur, amputation |
| **Öppen fraktur (antibiotika)** | 1 timme | Ökad infektionsrisk |
| **Knäluxation** | 4-6 timmar | Amputation (a. poplitea) |
| **Traumatisk amputation** | Replantation: 6-12 h | Förlorad replantationsmöjlighet |

### Prioritet 3: Akuta skador (samma dag)

| Tillstånd | Tidsgräns | Motivering |
|-----------|-----------|------------|
| Fraktur med nervpåverkan | < 24 timmar | Förhindra permanent skada |
| Luxation (höft, axel) | < 6 timmar | Caputnekros (höft), mjukdelsskada |
| Irreponibel fraktur | < 24 timmar | Mjukdelsskada, hudnekros |
| Öppen fraktur (debridering) | < 24 timmar | Infektionskontroll |

### Prioritet 4: Övriga skador (planerat)

- Stabila slutna frakturer
- Mindre ligamentskador
- Kontusioner utan komplikation

## Extremitetshotande tillstånd – detaljerad genomgång

### 1. Massiv blödning (Prioritet 1-2)

**Definition:** Blödning som hotar livet eller extremiteten

**Handläggning:**
1. **Direkt tryck** – omedelbart
2. **Tourniquet** – om direkt tryck otillräckligt
3. **Hemostatiska medel** – junktionella blödningar
4. **TXA** – inom 3 timmar från skada

**Tidsgräns:** Minuter (livshotande)

### 2. Arteriell kärlskada med ischemi (Prioritet 2)

**6 P för ischemi:**
1. Pain (smärta)
2. Pallor (blekhet)
3. Pulselessness (pulslöshet)
4. Paresthesia (domningar)
5. Paralysis (förlamning)
6. Poikilothermia (kyla)

**Tidsgränser:**
- Varm ischemi (muskelvävnad): 4-6 timmar
- Kall ischemi (nerv): 4 timmar

**Handläggning:**
1. Repositionera felställd fraktur
2. ABI-mätning
3. CT-angiografi eller direkt operation
4. Shunting eller definitiv reparation
5. Överväg fasciotomi

### 3. Kompartmentsyndrom (Prioritet 2)

**Mest sensitiva tecknet:** Smärta vid passiv töjning av musklerna

**McQueens delta-tryck:**
- ΔP = Diastoliskt BT − Kompartmenttryck
- ΔP < 30 mmHg → Fasciotomi indicerad

**Tidsgräns:** Fasciotomi inom 4-6 timmar för bästa chans till funktionsåterhämtning (tidigare är bättre)

> "Kompartmentsyndrom är en klinisk diagnos. Vänta inte på tryckmätning hos en vaken patient med klassiska tecken." (McQueen MM et al. JBJS Br 2000)

### 4. Öppen fraktur (Prioritet 2-3)

**Kritiska tidsgränser:**
| Åtgärd | Tidsmål |
|--------|---------|
| Antibiotika | < 1 timme från skada |
| Debridering | < 24 timmar (Gustilo III: < 12h) |
| Fix-and-flap | < 72 timmar |

> "Antibiotika inom 1 timme är den viktigaste enskilda faktorn för att förhindra infektion vid öppen fraktur." (BOAST 4 2017)

### 5. Luxation av stora leder (Prioritet 2-3)

**Höftluxation:**
- Tidsgräns: Reposition inom 6 timmar
- Risk: Caputnekros (avaskulär nekros)
- Incidens caputnekros: 5% vid snabb reposition, >50% vid > 6 timmar

**Knäluxation:**
- Tidsgräns: Omedelbar reposition
- Risk: A. poplitea-skada (15-20%)
- ALLA knäluxationer kräver ABI + CT-angio

**Axelluxation:**
- Tidsgräns: Reposition inom 24 timmar
- Risk: Plexus brachialis-skada, Hill-Sachs-lesion
- Äldre > 40 år: Hög risk för rotatorkuffskada

## Multitrauma och DCO-principen

### Damage Control Orthopaedics (DCO)

Vid svårt multitrauma kan definitiv frakturfixation förvärra den fysiologiska belastningen ("second hit"). DCO-principen innebär temporär stabilisering med definitiv fixation senare.

**Indikationer för DCO:**
- ISS > 25
- Hypotension vid ankomst
- Hypotermi (< 35°C)
- Koagulopati
- Svår lungkontusion
- Traumatisk hjärnskada

**DCO-behandling:**
1. **Akut fas (0-24h):** Temporär extern fixation, blödningskontroll
2. **Fönsterfas (dag 2-5):** Fysiologisk stabilisering
3. **Definitiv fas (> dag 5):** Konvertering till intern fixation

> "Hos den kritiskt sjuka traumapatienten kan en lång operation för definitiv frakturfixation vara dödlig. DCO räddar liv." (Pape HC et al. J Trauma 2002)

## Prioritering vid multipla extremitetsskador

### Samma patient – flera extremitetsskador

| Prioritetsordning | Skada | Motivering |
|-------------------|-------|------------|
| 1 | Öppen fraktur med kärlskada | Livshotande + extremitetshotande |
| 2 | Sluten fraktur med ischemi | Extremitetshotande |
| 3 | Öppen fraktur utan ischemi | Antibiotika prioritet |
| 4 | Sluten fraktur med kompartmentrisk | Tät övervakning |
| 5 | Stabil sluten fraktur | Kan vänta |

### Två patienter – begränsade resurser (triage)

| Triage-kategori | Beskrivning | Färg |
|-----------------|-------------|------|
| Omedelbar | Livshotande men räddningsbar | RÖD |
| Fördröjd | Allvarlig men stabil | GUL |
| Minimal | Lindrig skada | GRÖN |
| Expectant | Överväldigande skada, dålig prognos | SVART |

## Dokumentation av prioritering

### Obligatorisk dokumentation

| Information | Varför viktigt |
|-------------|----------------|
| Tidpunkt för skada | Beräkna ischemitid |
| Tidpunkt för tourniquet | Total ischemitid |
| Tidpunkt för antibiotika | Verifiering av tidig gåva |
| Prioriteringsbeslut | Juridisk dokumentation |
| Vidtagna åtgärder | Vårdkedjan |

### SBAR-rapportering

Vid överrapportering till nästa vårdnivå:

| Komponent | Innehåll |
|-----------|----------|
| **S** (Situation) | "45-årig man med öppen tibiafraktur efter MC-olycka" |
| **B** (Background) | "Skadades kl 14:00, tourniquet sedan 14:15" |
| **A** (Assessment) | "Gustilo IIIB, ABI 0.7, misstänkt kärlskada" |
| **R** (Recommendation) | "Behöver akut kärlkirurgbedömning och debridering" |

## Sammanfattning – Prioriteringsnyckel

| Tidsfönster | Tillstånd | Åtgärd |
|-------------|-----------|--------|
| **MINUTER** | Massiv blödning | Tourniquet, direkt tryck |
| **1 TIMME** | Öppen fraktur | Antibiotika |
| **4-6 TIMMAR** | Kärlskada, höftlux | Reposition, revaskularisering |
| **4-6 TIMMAR** | Kompartment | Fasciotomi (tidigare = bättre) |
| **24 TIMMAR** | Öppen fraktur debridering | Operation |
| **72 TIMMAR** | Fix-and-flap | Mjukdelstäckning |

## Referenser

- ATLS Advanced Trauma Life Support. 11th ed. American College of Surgeons 2023
- TCCC Guidelines 25 January 2024
- BOAST 4: The Management of Severe Open Lower Limb Fractures. BOA 2017
- McQueen MM et al. Acute compartment syndrome. JBJS Br 2000;82:200-3
- Pape HC et al. Damage control orthopaedics. J Trauma 2002;53:452-62
- Mills WJ et al. The value of ABI. J Trauma 2004;56:814-9
`,
    4: `# Massiv blödning från extremitet

## Bakgrund och epidemiologi

Okontrollerad blödning är den främsta orsaken till förebyggbar död vid trauma, både civilt och militärt (Eastridge BJ et al. J Trauma 2012). En patient med massiv blödning kan förblöda inom 3-5 minuter utan adekvat intervention (TCCC Guidelines 2024). Erfarenheter från konflikterna i Afghanistan och Irak visade att korrekt tourniquet-användning dramatiskt minskade mortaliteten vid extremitetsblödningar utan signifikant morbiditet från ischemisk skada (Kragh JF et al. J Trauma 2009).

## Definition

Massiv blödning definieras som:
- Blödning som är livshotande och kräver omedelbar intervention
- Uppskattad blodförlust >1500 ml (klass III-IV chock enligt ATLS)
- Blödning som kräver blodtransfusion inom 24 timmar
- Systoliskt blodtryck <90 mmHg med synlig extern blödning

## Steg-för-steg handläggning

### Steg 1: Direkt tryck (0-60 sekunder)

Applicera omedelbart direkt tryck över blödningskällan (TCCC Guidelines 2024):

| Metod | Indikation | Teknik |
|-------|------------|--------|
| Manuellt tryck | Första åtgärd | Handflata direkt på såret |
| Tryckförband | Stabiliserad blödning | Steril kompress + elastisk linda |
| Packad kompress | Djupa sår | Packa sårhålan med kompress |

**Effektivitet:** Direkt tryck kontrollerar ca 90% av externa blödningar (Stop the Bleed, ACS 2024).

### Steg 2: Tourniquet-applikation

#### Indikationer (TCCC Guidelines 2024)
- Direkt tryck kontrollerar inte blödningen inom 60 sekunder
- Amputationsskada
- Multipla blödningskällor på samma extremitet
- Taktisk situation kräver fria händer
- Junktionella områden otillgängliga

#### Korrekt applicering

**Placering:**
- Applicera 5-7 cm (2-3 inches) proximalt om blödningskällan, direkt på huden (Stop the Bleed 2024)
- Om blödningskällan INTE är uppenbar: "High and tight" – så proximalt som möjligt på extremiteten (TCCC Guidelines 2024)
- ALDRIG över en led (risk för nervskada vid n. peroneus eller n. ulnaris)

**Åtdragning:**
1. Dra åt windlass/skruven tills blödningen upphör helt
2. Distal puls ska EJ vara palpabel
3. Om första tourniqueten inte räcker: applicera en andra sida-vid-sida proximalt om första (TCCC Guidelines 2024)

**Tidsgränser:**
| Tid | Åtgärd |
|-----|--------|
| <1 min | Blödningen ska vara kontrollerad |
| <3 min | Tourniqueten ska vara fullt säkrad |
| <2 tim | Konvertering till hemostatiskt förband om möjligt |
| >6 tim | Lossa EJ utan labbkapacitet och övervakning |

#### Konvertering (TCCC Guidelines 2024)

Tourniquet kan konverteras till hemostatiskt förband om ALLA tre kriterier är uppfyllda:
1. Patienten är INTE i chock
2. Såret kan övervakas noggrant
3. Tourniqueten används INTE för amputationsskada

### Steg 3: Hemostatiska medel

#### Combat Gauze (förstahandsval enligt CoTCCC)

**Applicering:**
1. Packa sårhålan tätt med Combat Gauze
2. Applicera direkt tryck i minst 3 minuter (TCCC Guidelines 2024)
3. Säkra med tryckförband

**Indikationer:**
- Junktionella blödningar (ljumske, axill, nacke)
- Komplement vid tourniquet-konvertering
- Sår ej lämpade för tourniquet

### Steg 4: Tranexamsyra (TXA)

#### Dosering (CRASH-2 Trial; Joint Position Statement NAEMSP/ACS-COT/ACEP 2024-2025)

| Population | Bolusdos | Underhåll |
|------------|----------|-----------|
| Vuxna | 1g IV över 10 min | 1g IV över 8 timmar |
| Alternativ | 2g IV som bolus | - |
| Barn (<12 år eller <50 kg) | 15 mg/kg (max 1g) | 2 mg/kg/h i 8 timmar |

#### Tidskritisk administration

> "Varje 15 minuters fördröjning minskar den relativa överlevnadseffekten med 10%. Ingen effekt ses efter 3 timmar." (CRASH-2 Trial, Lancet 2011)

**Rekommendation:** Ge TXA så tidigt som möjligt, helst inom 1 timme från skada. Ge INTE TXA >3 timmar efter skada (Joint Position Statement 2024-2025).

#### Kontraindikationer
- >3 timmar sedan skada
- Ingen kliniskt signifikant blödning
- Känd tromboembolisk sjukdom (relativ)

## Junktionell blödning

Blödning från ljumske, axill, bäcken eller nacke kräver särskild approach (TCCC Guidelines 2024):

1. **Applicera junktionell tourniquet** (t.ex. SAM Junctional Tourniquet) om tillgänglig
2. **Hemostatiskt förband + direkt tryck** om junktionell tourniquet ej finns
3. **Wound packing:** Packa sårhålan tätt, applicera tryck i minst 3 minuter

## Komplikationer

### Tourniquet-relaterade komplikationer

| Komplikation | Riskfaktor | Prevention |
|--------------|------------|------------|
| Nervskada | Tid >2 tim, placering över led | Tidig konvertering, korrekt placering |
| Kompartmentsyndrom | Reperfusion efter lång ischemi | Fasciotomiberedskap |
| Reperfusionsskada | >6 tim tourniquet-tid | Gradvis reperfusion med övervakning |
| Muskelskada | Otillräcklig åtdragning → venös stas | Fullständig arteriell ocklusion |

**Viktigt:** Modern evidens visar att rätt applicerad tourniquet i upp till 2 timmar sällan ger bestående skada (Kragh JF et al. J Trauma 2009).

## Dokumentation

Dokumentera ALLTID (TCCC Guidelines 2024):
- Tidpunkt för tourniquet-applikation (skriv på tourniqueten med permanent märkpenna)
- Tidpunkt för eventuell omapplikation
- Tidpunkt för konvertering
- Tidpunkt för avlägsnande
- Total ischemitid

## Sammanfattning – nyckelbudskap

1. **Tid är kritiskt** – en patient kan förblöda inom 3 minuter
2. **Tourniquet räddar liv** – tveka inte att applicera vid massiv extremitetsblödning
3. **Placering:** 5-7 cm proximalt om skada, eller "high and tight" om oklar källa
4. **TXA inom 1 timme** – signifikant mortalitetsreduktion
5. **Dokumentera tiden** – kritiskt för vidare handläggning

## Referenser

- TCCC Guidelines 25 January 2024
- Stop the Bleed, American College of Surgeons 2024
- CRASH-2 Trial. Lancet 2011;377:1096-1101
- Joint Position Statement NAEMSP/ACS-COT/ACEP 2024-2025
- Kragh JF et al. J Trauma 2009;66:S38-S40
- Eastridge BJ et al. J Trauma 2012;73:S431-S437
`,
    5: `# Arteriella kärlskador

## Bakgrund och epidemiologi

Arteriella kärlskador vid extremitetstrauma utgör 1-3% av alla traumapatienter men medför hög risk för amputation om de missas eller behandlas sent (Feliciano DV et al. J Trauma 2011). Majoriteten av kärlskador uppstår vid penetrerande trauma, men trubbigt våld (särskilt knäluxation och suprakondylär humerusfraktur) kan också orsaka allvarlig kärlskada.

## Skademekanismer

| Mekanism | Typiska skador | Riskfakturer |
|----------|----------------|--------------|
| Penetrerande | Laceration, transsektion | Skottskada, stickvapen |
| Trubbigt | Kontusion, intimal flap, trombos | Knäluxation, fraktur nära kärl |
| Iatrogen | Punktion, dissektion | Kateterisering, kirurgi |

## Klassifikation

### Typ av kärlskada

| Typ | Beskrivning | Klinisk bild |
|-----|-------------|--------------|
| Kontusion | Intimal skada utan ruptur | Trombos, nedsatt flöde |
| Laceration | Partiell väggskada | Blödning, hematom |
| Transsektion | Komplett avskärning | Massiv blödning eller trombos |
| Pseudoaneurysm | Innehållande hematom | Pulserande svullnad |
| AV-fistel | Artär-ven-kommunikation | Biljud, "thrill" |

### Rutherford-klassifikation av akut extremitetsischemi

| Grad | Beskrivning | Kapillär återfyllnad | Motorik | Sensorik | Prognos |
|------|-------------|---------------------|---------|----------|---------|
| I - Viable | Ej omedelbart hotad | Normal | Normal | Normal | Ej akut |
| IIa - Marginellt hotad | Räddningsbar vid snabb behandling | Förlångsammad | Normal | Mild nedsättning (tår) | Revaskularisering inom 6h |
| IIb - Omedelbart hotad | Räddningsbar vid omedelbar behandling | Förlångsammad/utsläckt | Mild-måttlig pares | Mer än tår | AKUT revaskularisering |
| III - Irreversibel | Ej räddningsbar | Utsläckt | Paralys, rigiditet | Anestesi | Amputation |

## Kliniska tecken ("Hard signs" och "Soft signs")

### Hårda tecken (kräver omedelbar åtgärd)
- Pulslös extremitet
- Aktivt pulserande blödning
- Expanderande hematom
- Palpabelt "thrill" eller hörbart biljud
- Synliga tecken på ischemi (blek, kall, marmorerad)

**Vid hårda tecken:** Direkt till operation – ingen ytterligare bilddiagnostik behövs (ESVS Guidelines 2019).

### Mjuka tecken (kräver vidare utredning)
- Liten till måttlig blödning som har stannat
- Nedsatt (men palpabel) puls
- Nervskada i närheten av kärl
- Proximitet till stora kärl
- Hematom (ej expanderande)

## Diagnostik

### Ankel-Brachial Index (ABI)

ABI är ett enkelt, icke-invasivt test som är hörnstenen för initial kärlbedömning (ACC/AHA Guidelines 2024).

**Metod:**
1. Mät systoliskt blodtryck i a. brachialis bilateralt
2. Mät systoliskt blodtryck i a. tibialis posterior OCH a. dorsalis pedis
3. ABI = Högsta ankeltryck / Högsta armtryck

**Tolkning:**

| ABI-värde | Tolkning | Åtgärd |
|-----------|----------|--------|
| 1.0-1.3 | Normal | Observation, serialmätning |
| 0.9-0.99 | Gråzon | Upprepad mätning, överväg CTA |
| <0.9 | Abnormt – misstänkt kärlskada | CT-angiografi indicerad |
| <0.5 | Allvarlig ischemi | AKUT kärlkirurgisk bedömning |
| >1.3 | Icke-kompressibla kärl (diabetes, njursvikt) | Ej tillförlitligt |

**Evidens:** Ett ABI <0.9 har >90% sensitivitet och specificitet för att detektera kärlskada jämfört med angiografi (Mills WJ et al. J Trauma 2004).

**Observera:** Nyare forskning har visat att ABI-tröskeln 0.7 kan ha högst diagnostisk noggrannhet (sensitivitet 83%, specificitet 91%) utan att missa fler skador som kräver reparation (J Vasc Surg 2020).

### Bilddiagnostik

| Modalitet | Indikation | Fördelar | Nackdelar |
|-----------|------------|----------|-----------|
| CT-angiografi | Förstahandsval vid mjuka tecken | Snabb, icke-invasiv, hög sensitivitet | Kontrastmedel, strålning |
| Konventionell angiografi | Interventionell behandling planerad | Terapeutisk möjlighet | Invasiv, tidskrävande |
| Duplex ultraljud | Uppföljning, ytliga kärl | Ingen strålning, portabel | Operatörsberoende |

## Tidsgränser – "The Golden Hours"

> "Tid är muskel" – irreversibel muskelskada börjar redan efter 3 timmar vid komplett ischemi.

| Typ av ischemi | Maximal tolerabel tid | Konsekvens vid överskridande |
|----------------|----------------------|------------------------------|
| Varm ischemi (>20°C) | 6 timmar | Irreversibel muskel-/nervskada |
| Kall ischemi (4-10°C) | 12 timmar | Förlängd tolerans vid kylning |
| Inkomplett ischemi | Längre | Beroende på kollateralcirkulation |

**Klinisk implikation:** Beslut om revaskularisering ska fattas inom 4 timmar för att ge tid till operation före 6-timmarsgränsen (ESVS Guidelines 2019).

## Behandling

### Prehospitalt/akutmottagning
1. **Blödningskontroll** – direkt tryck, tourniquet vid behov
2. **Undvik** manipulation av extremiteten
3. **Dokumentera** neurovaskulär status före och efter åtgärder
4. **Tidig kontakt** med kärlkirurg

### Temporära åtgärder

#### Shunting
- **Indikation:** Kärlskada som kräver reparation, men patienten behöver annan akut kirurgi först (t.ex. laparotomi)
- **Teknik:** Intraluminal shunt (t.ex. Javid, Sundt, Argyle)
- **Fördel:** Återställer distalt flöde temporärt
- **Tidsgräns:** Shunt kan sitta i upp till 24-48 timmar med antikoagulation

#### Fasciotomi
- **Profylaktisk fasciotomi** rekommenderas vid:
  - Ischemitid >4-6 timmar
  - Kombinerad artär- och venskada
  - Omfattande mjukdelsskada
  - Svullnad/spänd muskulatur

### Definitiv behandling

| Skadetyp | Behandling |
|----------|------------|
| Mindre laceration | Primär sutur, lateral sutur |
| Transsektion <2 cm defekt | End-to-end anastomos |
| Större defekt | Interpositionsgraft (ven eller syntetisk) |
| Pseudoaneurysm | Exklusion + bypass, endovaskulär stent |
| AV-fistel | Fistelexcision + kärlreparation |

### Endovaskulär behandling
Allt vanligare vid:
- Pseudoaneurysm
- AV-fistlar
- Intimal flaps
- Patienter med hög operationsrisk

## Komplikationer

### Akuta
- Amputation (vid missad diagnos eller sen behandling)
- Kompartmentsyndrom (reperfusionsskada)
- Tromboembolism

### Sena
- Stenos vid anastomos
- Graftocklusion
- Claudicatio
- Pseudoaneurysm

## Prognos

| Faktor | God prognos | Dålig prognos |
|--------|-------------|---------------|
| Tid till revaskularisering | <6 timmar | >6 timmar |
| Skadetyp | Isolerad kärlskada | Kombinerad kärl+ben+mjukdel |
| Ischemityp | Inkomplett | Komplett |
| Profylaktisk fasciotomi | Ja, vid behov | Missad indikation |

## Sammanfattning – nyckelbudskap

1. **Hårda tecken = direkt till operation** – ingen bilddiagnostik behövs
2. **ABI <0.9 = misstänkt kärlskada** – CT-angiografi indicerad
3. **6 timmars gräns** för varm ischemi – inkludera tid för transport och operation
4. **Profylaktisk fasciotomi** vid ischemitid >4-6 timmar
5. **Shunting** möjliggör temporär perfusion vid multitrauma

## Referenser

- ESVS Clinical Practice Guidelines on the Management of Vascular Trauma 2019
- ACC/AHA Guidelines for Management of PAD 2024
- Mills WJ et al. J Trauma 2004;56:814-819
- Feliciano DV et al. J Trauma 2011;70:S21-S26
- Journal of Vascular Surgery 2020 (ABI threshold study)
`,
    6: `# Kompartmentsyndrom

## Bakgrund och epidemiologi

Akut kompartmentsyndrom (ACS) är ett kirurgiskt nödfall där ökat tryck i ett slutet osseofasciellt utrymme komprometterar vävnadsperfusionen och leder till irreversibel muskel- och nervskada om det inte behandlas i tid (Via AG et al. J Am Acad Orthop Surg 2015).

### Incidens
- Tibiafraktur: 1-10% utvecklar ACS (McQueen MM et al. JBJS Br 2000)
- Underarmsfraktur: 3% hos vuxna, högre hos barn
- Män drabbas 10 gånger oftare än kvinnor
- Medianålder: 30 år (McQueen MM, Court-Brown CM. JBJS Br 1996)

### Vanligaste orsakerna
| Orsak | Andel |
|-------|-------|
| Fraktur (69% tibiadiafysfrakturer) | ~70% |
| Mjukdelsskada utan fraktur | ~20% |
| Iatrogen (gips, positionering) | ~5% |
| Vaskulär skada/reperfusion | ~3% |
| Övrigt (brännskador, ormbett) | ~2% |

## Patofysiologi

### Mekanismen steg för steg

1. **Initialt trauma** → Blödning och ödem i det slutna kompartmentet
2. **Ökat intrakompartmentellt tryck** → Komprimerar venöst utflöde först
3. **Venös kongestion** → Ytterligare ödem, ökad kapillär permeabilitet
4. **Arteriell insufficiens** → När trycket närmar sig arteriellt perfusionstryck
5. **Cellulär ischemi** → Muskel och nerv börjar ta skada efter 2-4 timmar
6. **Irreversibel skada** → Efter 6-8 timmar (Matsen FA 3rd. CORR 1975)

> "Kritisk ischemi uppstår när det lokala perfusionstrycket (diastoliskt blodtryck minus kompartmenttryck) faller under 30 mmHg." (McQueen MM et al. JBJS Br 2000)

### Tidsgränser för vävnadsskada

| Ischemitid | Konsekvens |
|------------|------------|
| < 4 timmar | Reversibel skada, fullständig återhämtning möjlig |
| 4-6 timmar | Partiell skada, viss funktionsnedsättning |
| 6-8 timmar | Betydande permanent skada |
| > 8 timmar | Irreversibel myonekros och nervskada |

**Kliniskt viktigt:** Nerv är känsligast och tar skada före muskel. Motorik återkommer sällan efter 12 timmars ischemi (Rorabeck CH. JBJS Br 1984).

## De 6 P:na – Kliniska tecken

Klassiska tecken presenteras i **ungefärlig kronologisk ordning**:

| Tecken | Beskrivning | Tidpunkt | Sensitivitet |
|--------|-------------|----------|--------------|
| 1. **Pain** | Smärta oproportionerlig till den synliga skadan | Tidigt | Hög |
| 2. **Pain on passive stretch** | Intensifierad smärta vid passiv töjning av musklerna i kompartmentet | Tidigt | HÖGST (~95%) |
| 3. **Pressure** | Spänt, ömt, svullet kompartment vid palpation | Tidigt-mellan | Måttlig |
| 4. **Paresthesia** | Stickningar, domningar i nervernas distributionsområde | Mellan | Måttlig |
| 5. **Paralysis** | Oförmåga att aktivt röra musklerna | Sent | Låg (sen) |
| 6. **Pulselessness** | Avsaknad av palpabel puls distalt | Mycket sent | Mycket låg |

### Kritisk observation

> "Pulsar är nästan alltid bevarade vid kompartmentsyndrom eftersom systoliskt tryck överstiger kompartmenttrycket. Avsaknad av puls indikerar antingen extremt avancerat kompartmentsyndrom eller samtidig kärlskada." (Olson SA, Glasgow RR. J Am Acad Orthop Surg 2005)

**VARNING:** Att vänta på paralys eller pulslöshet innan diagnos leder till irreversibel skada!

## Diagnostik

### Klinisk bedömning – Guldstandard

Vid **medvetandesänkt patient eller osäker klinik** krävs objektiv mätning, men hos vaken patient är klinisk bedömning primär:

**Mest tillförlitliga kliniska tecken (i prioritetsordning):**
1. Smärta vid passiv töjning av musklerna i det drabbade kompartmentet
2. Smärta oproportionerlig till skadan som inte lindras av analgetika
3. Spänt, svullet kompartment vid palpation
4. Sensoriskt bortfall i nervernas distributionsområde

### Objektiv tryckmätning

**Indikationer för tryckmätning:**
- Medvetslös eller sederad patient
- Ryggmärgsskada med nedsatt sensorik
- Barn som inte kan kommunicera
- Tveksam klinik där objektiv mätning behövs

**McQueens Delta-tryck (ΔP)**

\`\`\`
ΔP = Diastoliskt blodtryck − Kompartmenttryck
\`\`\`

| ΔP-värde | Tolkning | Åtgärd |
|----------|----------|--------|
| > 30 mmHg | Normal perfusion | Observation, serialmätning |
| 20-30 mmHg | Gråzon | Tät observation, upprepad mätning var 30 min |
| < 30 mmHg | Hotad perfusion | **FASCIOTOMI INDICERAD** |

> "En ΔP < 30 mmHg har 94% sensitivitet och 98% specificitet för att identifiera patienter som behöver fasciotomi." (McQueen MM et al. JBJS Br 2000)

**Alternativ: Absolut tryckmätning**
- > 30 mmHg: Diagnostiskt för ACS (Whitesides TE et al. CORR 1975)
- Dock mindre tillförlitligt hos hypotensiva patienter

### Mätteknik

1. Använd validerat mätinstrument (t.ex. Stryker Intra-Compartmental Pressure Monitor)
2. Mät i **alla kompartment** som misstänks
3. Mät inom **5 cm från frakturstället** (högst tryck lokalt)
4. Vid tveksamma värden: upprepa mätningen efter 30-60 minuter

## Anatomiska kompartment

### Underbenet (4 kompartment)

| Kompartment | Muskler | Nerv | Passiv töjning |
|-------------|---------|------|----------------|
| **Anteriort** | Tibialis anterior, EHL, EDL | N. peroneus profundus | Plantarflexion av fot och tår |
| **Lateralt** | Peroneus longus & brevis | N. peroneus superficialis | Inversion och plantarflexion |
| **Ytligt posteriort** | Gastrocnemius, soleus | N. suralis | Dorsalflexion av fot |
| **Djupt posteriort** | Tibialis posterior, FHL, FDL | N. tibialis | Dorsalflexion av fot och tår |

### Underarmen (3 kompartment)

| Kompartment | Muskler | Passiv töjning |
|-------------|---------|----------------|
| **Volart** | Flexorer | Extension av handled och fingrar |
| **Dorsalt** | Extensorer | Flexion av handled och fingrar |
| **Lateralt (mobilt vad)** | Brachioradialis, ECRL | Pronation och flexion |

### Låret (3 kompartment)

| Kompartment | Muskler |
|-------------|---------|
| **Anteriort** | Quadriceps |
| **Posteriort** | Hamstrings |
| **Medialt** | Adduktorer |

### Handen (10 kompartment)

- 4 interosseuskompartment dorsalt
- 3 interosseuskompartment volart
- Thenar, hypothenar, carpal tunnel

### Foten (9 kompartment)

- Medialt, lateralt, centralt ytligt, centralt djupt
- 4 interosseösa kompartment
- Calcaneal kompartment

## Behandling

### Konservativa åtgärder (medan fasciotomi förbereds)

1. **Ta bort allt cirkulärt förband** – gips, bandage, ortoser
2. **Extremiteten i hjärtnivå** – varken elevation eller nedsänkning
3. **Korrigera hypotension** – optimera perfusionstrycket
4. **Undvik hypotermi** – försämrar mikrocirkulationen
5. **Adekvat analgesi** – men fortsätt monitorera smärta

> "Gipsborttagning kan sänka kompartmenttrycket med upp till 65%." (Garfin SR et al. JBJS Am 1981)

### Fasciotomi – Definitiv behandling

**Indikationer för akut fasciotomi:**
- Kliniskt misstänkt kompartmentsyndrom hos vaken patient
- ΔP < 30 mmHg hos medvetslös eller osäker patient
- Absolut kompartmenttryck > 30 mmHg i kombination med kliniska tecken

**Tekniska principer:**
1. **Alla involverade kompartment** måste öppnas genom adekvata incisioner
2. **Inga kompromisser** – för korta eller för få incisioner är vanligaste felet
3. **Inspektion av muskelvitalitet** – levande muskel blöder och kontraherar vid stimulering
4. **Såren lämnas öppna** – täcks med fuktig steril kompress eller VAC
5. **Sekundär förslutning** – efter 48-72 timmar när ödemet minskat

### Underbensfasciotomi – Dubbelincisionsteknik

**Lateralt snitt (öppnar anteriort + lateralt kompartment):**
- Incision 2 cm lateralt om tibiakanten
- Från fibulahuvudet till laterala malleolen
- Identifiera septum mellan anteriort och lateralt kompartment

**Medialt snitt (öppnar ytligt + djupt posteriort kompartment):**
- Incision 2 cm posteriort om mediala tibiakanten
- Undvik saphenusnerven (belägen anteriort om incisionen)
- Frisläpp soleusbron för åtkomst till djupt posteriort kompartment

### Postoperativ vård

- **Dagliga sårrevisioner** tills sekundär förslutning eller hudtransplantation
- **VAC-behandling** kan användas för att minska ödem och främja förslutning
- **Antibiotika** vid öppna sår
- **Fysioterapi** tidigt för att förebygga kontrakturer

## Komplikationer och prognos

### Om fasciotomi utförs tidigt (< 4-6 timmar)

- > 90% fullständig funktionsåterhämtning (Finkelstein JA et al. J Orthop Trauma 1996)
- Minimal permanent neurologisk skada

### Om fasciotomi fördröjs (> 12 timmar) eller missas

**Akuta komplikationer:**
- Rhabdomyolys med myoglobinuri
- Akut njursvikt (10-30% av patienter med rhabdomyolys)
- Hyperkalemi med risk för arytmier
- Metabol acidos

**Sena komplikationer – Volkmanns ischemiska kontraktur:**
- Irreversibel fibrös omvandling av ischemisk muskulatur
- Klassisk "klohand" vid underarmsengagemang
- Behandling: tenolys, tendonförlängning, funktionell rekonstruktion

### Mortalitet

- Vid missad diagnos och etablerad rhabdomyolys: 5-15% mortalitet
- Vid tidig diagnos och behandling: < 1% mortalitet

## Sammanfattning – VIKTIGASTE punkterna

1. **Kompartmentsyndrom är en KLINISK DIAGNOS** – vänta inte på tryckmätning hos vaken patient
2. **Smärta vid passiv töjning** är det mest sensitiva tecknet
3. **Pulsar är nästan alltid bevarade** – pulslöshet är ett mycket sent tecken
4. **ΔP < 30 mmHg** = fasciotomi indicerat (McQueen-kriteriet)
5. **Tid är muskelvävnad** – fasciotomi inom 4-6 timmar för bästa resultat (tidigare är bättre)
6. **Alla kompartment måste öppnas** – halvhjärtade ingrepp leder till missad diagnos

## Referenser

- McQueen MM, Court-Brown CM. Compartment monitoring in tibial fractures. JBJS Br 1996;78:99-104
- McQueen MM et al. Acute compartment syndrome: Who is at risk? JBJS Br 2000;82:200-203
- Via AG et al. Acute compartment syndrome. Orthopedics 2015;38:e535-43
- Whitesides TE et al. Tissue pressure measurements as a determinant for the need of fasciotomy. CORR 1975;113:43-51
- Matsen FA 3rd. Compartmental syndrome. A unified concept. CORR 1975;113:8-14
- Rorabeck CH. The treatment of compartment syndromes of the leg. JBJS Br 1984;66:93-97
- Finkelstein JA et al. Compartment syndrome of the lower leg. J Orthop Trauma 1996;10:104-9
`,
    7: `# Öppna frakturer

## Bakgrund och epidemiologi

En öppen fraktur föreligger när det finns en direkt kommunikation mellan frakturen och den yttre miljön genom ett sår i hud och mjukdelar. Detta innebär kontaminering av frakturen och ökad risk för infektion (Gustilo RB, Anderson JT. JBJS Am 1976).

### Incidens och etiologi
- Öppna frakturer utgör cirka 3-4% av alla frakturer
- Tibia är den vanligaste lokalisationen (40% av alla öppna frakturer)
- Högenergitrauma (trafikolyckor, fall från höjd) dominerar hos yngre
- Lågenergiskador ökar hos äldre med osteoporos

### Infektionsrisk utan adekvat behandling

| Gustilo-grad | Infektionsrisk utan antibiotika | Med adekvat behandling |
|--------------|--------------------------------|------------------------|
| Typ I | 0-2% | <1% |
| Typ II | 2-10% | 2-4% |
| Typ IIIA | 10-25% | 5-10% |
| Typ IIIB | 25-50% | 10-25% |
| Typ IIIC | 25-50% | 10-50% |

(Gustilo RB et al. JBJS Am 1984; Patzakis MJ, Wilkins J. CORR 1989)

## Gustilo-Anderson klassifikation

Klassifikationssystemet utvecklades av Ramón Gustilo och Anderson 1976, och utvidgades 1984 med subtyper för grad III (Gustilo RB et al. JBJS Am 1984).

### Komplett klassifikation

| Typ | Sårstorlek | Mjukdelsskada | Energinivå | Kontaminering |
|-----|------------|---------------|------------|---------------|
| **I** | < 1 cm | Minimal | Låg | Minimal |
| **II** | 1-10 cm | Måttlig, ingen crushing | Måttlig | Måttlig |
| **IIIA** | > 10 cm | Omfattande men adekvat täckning möjlig | Hög | Betydande |
| **IIIB** | > 10 cm | Massiv, kräver lambå/transplantat | Hög | Betydande |
| **IIIC** | Oavsett | + Kärlskada som kräver reparation | Hög | Betydande |

### Detaljerade beskrivningar

**Typ I - Lågenergisskada**
- Punktionssår < 1 cm, oftast inifrån-ut (benfragment perforerar huden)
- Minimal mjukdelsskada
- Enkel frakturkonfiguration
- Minimal kontaminering

**Typ II - Medelhög energi**
- Laceration 1-10 cm
- Måttlig mjukdelsskada utan devitalisering
- Ingen extensiv crushing eller flapping
- Fraktur kan vara måttligt komminut

**Typ IIIA - Högenergi med mjukdelstäckning**
- Omfattande mjukdelsskada men periostet intakt
- Adekvat primär täckning av frakturen är möjlig
- Ofta segmentella eller svårt kominuta frakturer
- Inkluderar höghastighetsskottskador oavsett sårstorlek

**Typ IIIB - Massiv mjukdelsskada**
- Extensiv mjukdelsförlust med exponerat ben
- Periosteal stripping och bendevaskularisering
- Kräver lambåplastik eller hudtransplantat för täckning
- Ofta grovt kontaminerade

**Typ IIIC - Kärlskada**
- Arteriell skada som kräver reparation för extremitetens viabilitet
- Klassificeras som IIIC oavsett mjukdelsskadans omfattning
- Extremt hög risk för amputation (25-50%)

> "Interobservatörsreliabiliteten för Gustilo-klassifikationen är cirka 60% (42-92%), vilket understryker vikten av att den slutliga klassifikationen görs på operationsbordet." (Brumback RJ, Jones AL. JBJS Am 1994)

## Patofysiologi - Varför infektion uppstår

### "Golden period"-konceptet (historiskt)

Traditionellt ansågs att kontaminering övergår till infektion efter 6 timmar ("the golden period"). Modern forskning visar att denna tidsgräns är överförenklad:

> "Infektionsrisken är inte binär vid 6 timmar. Bakteriell tillväxt börjar omedelbart, men immunförsvarets kapacitet och antibiotikagåva är de viktigaste faktorerna." (BOAST 4 Guidelines 2017)

### Faktorer som ökar infektionsrisk

| Faktor | Relativ riskökning |
|--------|-------------------|
| Fördröjd antibiotikagåva > 1 timme | 2-3x |
| Gustilo III vs I | 10-25x |
| Diabetes mellitus | 2-4x |
| Rökning | 2-3x |
| Ökat BMI > 30 | 1.5-2x |
| Kontaminering (jord, vatten) | 2-5x |
| Ålder > 65 år | 1.5x |

(Patzakis MJ, Wilkins J. CORR 1989; BOAST 4 2017)

## Initial handläggning - Akutmottagningen

### Steg 1: Primär bedömning (ABCDE)

Öppna frakturer är ofta associerade med multitrauma. Följ ATLS-principer:
- Livräddande åtgärder prioriteras
- Blödningskontroll vid behov
- Neurovaskulär status dokumenteras före åtgärd

### Steg 2: Sårbedömning och dokumentation

**Fotodokumentation är obligatorisk:**
- Ta bilder INNAN rengöring
- Dokumentera sårets storlek, lokalisation, kontaminering
- Undvik upprepade sårundersökningar (ökar infektionsrisk)

> "Varje sårundersökning ökar den bakteriella kontamineringen. Efter initial dokumentation ska såret täckas sterilt och inte exponeras förrän debridering på operation." (BOAST 4 Guidelines 2017)

### Steg 3: Antibiotika - INOM 1 TIMME

**Antibiotikaval enligt BOAST 4 / Svenska rekommendationer:**

| Gustilo-typ | Förstahandsval | Alternativ (penicillinallergi) | Duration |
|-------------|----------------|-------------------------------|----------|
| **I-II** | Kloxacillin 2g IV x 3 eller Cefuroxim 1.5g IV x 3 | Klindamycin 600mg IV x 3 | 24-72 timmar |
| **III** | Cefuroxim 1.5g IV x 3 + ev. Gentamicin* | Klindamycin + Ciprofloxacin | 72 timmar |
| **Jordkontaminerad** | + Bensylpenicillin 3g IV x 3 | + Metronidazol 500mg IV x 3 | 72 timmar |

*Aminoglykosider (gentamicin) är traditionellt rekommenderade för Typ III, men nyare evidens ifrågasätter nyttan och pekar på njurtoxicitet (EAST Guidelines 2023).

**Kritisk evidens för tidig antibiotikagåva:**

> "Historiska studier visade infektionsfördel vid antibiotikagåva inom 3 timmar (Patzakis 1989). Modern konsensus (BOAST 4 2017, EAST 2023) rekommenderar nu **antibiotika inom 1 timme** då varje timmes fördröjning ökar infektionsrisken signifikant."

### Steg 4: Tetanusprofylax

| Vaccinationsstatus | Ren skada | Kontaminerad/Öppen fraktur |
|-------------------|-----------|---------------------------|
| < 3 doser eller okänt | Tetanusvaccin | Tetanusvaccin + Tetanusimmunglobulin |
| ≥ 3 doser, > 10 år sedan | Tetanusvaccin | Tetanusvaccin |
| ≥ 3 doser, < 10 år sedan | Ingen åtgärd | Ingen åtgärd |
| ≥ 3 doser, < 5 år sedan | Ingen åtgärd | Ingen åtgärd |

### Steg 5: Sårförband och stabilisering

1. **Avlägsna grov kontaminering** (synligt skräp) - försiktig spolning
2. **Steril fuktig kompress** - NaCl-indränkt
3. **Ocklusive förband** - förhindrar uttorkning och ytterligare kontaminering
4. **Tillfällig stabilisering:**
   - Gipsskena eller
   - Extern fixation vid grav instabilitet
   - Traktion vid femurkaftfraktur

### Steg 6: Smärtlindring och övrig vård

- Adekvat analgesi (morfin vid behov)
- Extremiteten i neutral position, lätt elevation
- Kontinuerlig neurovaskulär övervakning

## Operativ behandling

### Tidpunkt för debridering

**BOAST 4 rekommendationer (2017):**

| Gustilo-typ | Rekommenderad tid till debridering |
|-------------|-----------------------------------|
| IIIA, IIIB, IIIC | Inom 12-24 timmar |
| I, II | Inom 24 timmar (kan vänta till ordinarie operationsprogram) |

> "Evidensen stödjer inte längre den absoluta 6-timmarsregeln för debridering. Viktigare är tidig antibiotikagåva och att debrideringen utförs av erfaret team under optimala förhållanden." (BOAST 4 2017; Schenker ML et al. JBJS Am 2012)

**Notera:** BOAST Open Fractures uppdaterades 2020 med förtydliganden kring debridering. Uppdateringen betonar att "best practice" timing avgörs av tillgänglig expertis och resurser snarare än rigida tidsgränser, samt understryker vikten av multidisciplinärt omhändertagande (ortoped + plastikkirurg) för Typ IIIB/IIIC.

### Debrideringsprinciper

**Mål:** Avlägsna all devitaliserad vävnad och kontaminering

**Systematisk genomgång - "Outside-In":**
1. **Hud** - Excidera devitaliserade kanter sparsamt
2. **Subcutis** - Avlägsna kontaminerat fett
3. **Fascia** - Öppna generöst vid svullnad
4. **Muskel** - Bedöm vitalitet enligt 4 C:
   - **C**olor (färg)
   - **C**ontractility (kontraktilitet vid stimulering)
   - **C**onsistency (konsistens)
   - **C**apillary bleeding (blödning)
5. **Ben** - Avlägsna lösa, devaskulariserade fragment
6. **Bevara** periostet när möjligt

### Irrigation

**Volym och tryck:**
- Lågtrycksirrigation (< 2 psi) rekommenderas
- Volym: 3L för Typ I, 6L för Typ II, 9L för Typ III (tumregel)
- NaCl är lika effektivt som tillsatsmedel (FLOW-studie, NEJM 2015)

> "Högtrycksirrigation (> 14 psi) kan driva in bakterier djupare i vävnaden och skada viabelt ben. Lågtryck med stora volymer föredras." (Bhandari M et al. NEJM 2015)

### Frakturstabilisering

| Frakturtyp | Initial stabilisering | Definitiv fixation |
|------------|----------------------|-------------------|
| Typ I | Intern fixation möjlig primärt | Intern fixation |
| Typ II | Extern fixation eller intern | Intern fixation |
| Typ IIIA | Extern fixation ofta | Sekventiell konvertering |
| Typ IIIB | Extern fixation | Ofta extern till definitiv |
| Typ IIIC | Temporär shunt, extern fixation | Komplex rekonstruktion |

### Mjukdelstäckning - Tidsgränser

**Fix-and-flap enligt BOAST 4:**

| Situation | Målsättning |
|-----------|-------------|
| Definitiv fixation + mjukdelstäckning | Inom 72 timmar |
| Fri lambå vid Typ IIIB | Inom 72 timmar (sämre utfall vid > 7 dagar) |

> "Tidig definitiv fixation och mjukdelstäckning ('fix and flap') inom 72 timmar minskar infektionsfrekvensen signifikant jämfört med fördröjd behandling." (Godina M. Plast Reconstr Surg 1986; BOAST 4 2017)

## Särskilda överväganden

### Typ IIIC - Kärlskada

**Prioriteringsordning:**
1. Temporär vaskulär shunt om ischemitid > 4-6 timmar
2. Frakturfixation (extern)
3. Definitiv kärlrekonstruktion
4. Fasciotomi (profylaktisk vid > 4 timmar ischemi)

**Amputation vs räddningsförsök:**
- MESS-score (Mangled Extremity Severity Score) kan vägleda
- MESS ≥ 7 predicerar ofta amputation
- Patientens fysiologiska status avgörande

### Skottskador

- Låghastighetsskott (< 600 m/s): Behandlas som Typ I-II
- Höghastighetsskott (> 600 m/s): Automatiskt Typ III
- Kavitationseffekt orsakar extensiv mjukdelsskada
- Generös debridering nödvändig

### Jordkontaminering - Clostridiumrisk

- Lantbruksolyckor, trädgårdsarbete
- Clostridium perfringens (gasgangrän) och C. tetani
- Tillägg av bensylpenicillin obligatoriskt
- Överväg hyperbar syrgasbehandling vid manifest gasgangrän

## Uppföljning och komplikationer

### Komplikationer

| Komplikation | Incidens | Prevention/Behandling |
|--------------|----------|----------------------|
| Ytlig infektion | 5-10% | Antibiotika, lokal sårvård |
| Djup infektion/Osteomyelit | 2-15% | Kirurgisk revision, långtidsantibiotika |
| Nonunion (utebliven läkning) | 5-20% | Revision, bengraft |
| Malunion (felläkning) | 5-10% | Korrektionsosteotomi |
| Nervskada | 5-15% | Expectans, rekonstruktion |

### Långtidsuppföljning

- Klinisk och radiologisk kontroll tills frakturläkning
- Screening för osteomyelit vid tecken på infektion
- Rehabilitering och fysioterapi

## Sammanfattning - Nyckelbudskap

1. **Antibiotika inom 1 timme** - viktigaste enskilda faktorn för att förhindra infektion
2. **Fotodokumentation** - undvik upprepade sårundersökningar
3. **Gustilo-klassifikation** görs slutligt på operationsbordet
4. **Lågtrycksirrigation** med stora volymer
5. **Fix-and-flap inom 72 timmar** för Typ IIIB-skador
6. **Tetanusprofylax** ska inte glömmas
7. **Clostridium-täckning** vid jordkontaminering

## Referenser

- BOAST 4: The Management of Severe Open Lower Limb Fractures. British Orthopaedic Association 2017
- Gustilo RB, Anderson JT. Prevention of infection in the treatment of 1025 open fractures. JBJS Am 1976;58:453-8
- Gustilo RB, Mendoza RM, Williams DN. Problems in the management of type III open fractures. J Trauma 1984;24:742-6
- Patzakis MJ, Wilkins J. Factors influencing infection rate in open fracture wounds. CORR 1989;243:36-40
- Bhandari M et al. (FLOW Investigators). A trial of wound irrigation in the initial management of open fracture wounds. NEJM 2015;373:2629-41
- EAST Practice Management Guidelines: Open Fractures (2023 Update)
- Godina M. Early microsurgical reconstruction of complex trauma of the extremities. Plast Reconstr Surg 1986;78:285-92
`,
    8: `# Bäckenringskador

## Bakgrund och epidemiologi

Bäckenfrakturer förekommer hos cirka 10% av patienter med trubbigt trauma och är ofta associerade med högenergitrauma som trafikolyckor, fall från höjd eller motorcykelolyckor (Tile M. Fractures of the Pelvis and Acetabulum. 3rd ed. 2003).

### Incidens och mortalitet
- Bäckenfrakturer: ~3% av alla frakturer
- Livshotande blödning vid 1-4% av alla bäckentrauma
- Mortalitet vid instabil bäckenfraktur: 10-30%
- Mortalitet vid "open book" + hemodynamisk instabilitet: upp till 60% (Papathanasopoulos A et al. JBJS Br 2011)

### Blödningskällor vid bäckentrauma

| Källa | Andel | Karakteristik |
|-------|-------|---------------|
| **Venös (presacral plexus)** | 80-90% | Diffus, svåråtkomlig för embolisering |
| **Arteriell (a. iliaca interna grenar)** | 10-20% | Punktblödning, åtkomlig för embolisering |
| **Ben (cancellöst ben)** | Bidragande | Minskar med stabilisering |

> "Den viktigaste insikten är att majoriteten av blödningen vid bäckentrauma är venös. Bäckenbälte och packning adresserar detta, medan angioembolisering endast behandlar arteriell blödning." (WSES Guidelines 2017)

## Anatomi och biomekanik

### Bäckenringens komponenter
- **Os sacrum** - Bär kroppsvikten och fördelar den till båda hemibäckena
- **Två ossa coxae** (ilium, ischium, pubis)
- **Symfysis pubis** - Främre förbindelse (fibrokartilaginös)
- **Sakroiliaklederna (SI-lederna)** - Bakre förbindelse (stark ligamentär fixation)

### Ligamentära strukturer - Stabilitetsgradering

| Ligament | Funktion | Skada = |
|----------|----------|---------|
| **Främre SI-ligament** | Rotationsstabilitet | Rotationsinstabilitet |
| **Bakre SI-ligament** | Vertikal stabilitet | VERTIKAL instabilitet |
| **Lig. sacrospinale** | Motverkar extern rotation | "Open book" vid ruptur |
| **Lig. sacrotuberale** | Motverkar vertikal förskjutning | Vertikal instabilitet |
| **Symfysligament** | Främre integritet | Diastasis pubis |

> "Det bakre SI-ligamentkomplexet är den primära stabiliseraren mot vertikal förskjutning. Intakt bakre ligament = vertikalt stabil fraktur." (Tile M. 2003)

## Young-Burgess klassifikation

Klassifikationssystemet baseras på skademekanism och predicerar blödningsrisk och instabilitet (Young JW, Burgess AR. Pelvic Fractures 1987).

### Översikt

| Typ | Mekanism | Exempel | Blödningsrisk | Stabilitet |
|-----|----------|---------|---------------|------------|
| **LC** | Lateral kompression | Fotgängare träffad från sidan | Låg-måttlig | Vanligen stabil |
| **APC** | Anteroposterior kompression | Motorcykelolycka (frontalkollision) | HÖG | Rotations-/vertikalt instabil |
| **VS** | Vertikal skjuvning | Fall från höjd | MYCKET HÖG | Helt instabil |
| **CM** | Kombinerad mekanism | Multipla krafter | HÖG | Helt instabil |

### LC (Lateral Compression) - 60-70% av alla bäckenfrakturer

**LC-I: Stabil**
- Transversella ramifrakturer + ipsilateral sakral impaktionsfraktur
- Ingen ligamentskada posteriort
- Intern rotation av hemibäckenet
- **Låg blödningsrisk**
- Behandling: Konservativt (belastning efter smärta)

**LC-II: Rotationsinstabil**
- LC-I + bakre SI-ligamentskada eller iliumfraktur ("crescent fracture")
- Rotationsinstabilitet men vertikalt stabil
- **Måttlig blödningsrisk**
- Behandling: Oftast kirurgisk (SI-skruvfixation)

**LC-III: Helt instabil ("windswept pelvis")**
- LC-II ipsilateralt + kontralateral APC-skada
- Kombinerad intern + extern rotation
- **HÖG blödningsrisk**
- Behandling: Akut stabilisering, kirurgisk fixation

### APC (Anterior-Posterior Compression) - "Open Book"

**APC-I: Stabil**
- Diastasis < 2.5 cm
- Symfysruptur men intakta SI-ligament och bäckenbotten
- **Låg blödningsrisk**
- Behandling: Konservativt eller plattostesyntes av symfysen

**APC-II: Rotationsinstabil**
- Diastasis > 2.5 cm
- Ruptur av lig. sacrospinale + sacrotuberale
- Främre SI-ligament skadat, bakre intakt
- **HÖG blödningsrisk** (40% transfusionsbehov)
- Behandling: Extern fixation akut, senare definitiv fixation

**APC-III: Helt instabil**
- Komplett bakre SI-ligamentskada
- Vertikal + rotationsinstabilitet
- **MYCKET HÖG blödningsrisk**
- Behandling: Akut stabilisering + blödningskontroll, komplex rekonstruktion

### VS (Vertical Shear)

- Vertikal förskjutning av hemibäckenet (cranial migration)
- Komplett ruptur av alla bakre ligament
- Ofta associerad med sakrumfraktur eller SI-ledsluxation
- **MYCKET HÖG blödningsrisk**
- Behandling: Skeletttraktion akut, senare bakre fixation + främre stabilisering

### CM (Combined Mechanism)

- Passar inte in i övriga kategorier
- Ofta massiv skada med multipla frakturer
- Behandlas individuellt

## Initial handläggning

### Steg 1: Misstänk bäckenfraktur

**Högrisksituationer:**
- Högenergitrauma (trafikolycka > 50 km/h, fall > 3 meter)
- Fotgängare/cyklist påkörd av bil
- Motorcykelolycka
- Klämskada

**Kliniska tecken:**
- Hemodynamisk instabilitet utan annan förklaring
- Bäckensmärta
- Benförkortning eller rotation utan femurfraktur
- Blod vid meatus urethrae (20% av instabila bäckenfrakturer)
- Skrotal- eller labialhematom
- Rektal blödning

> "Vid högenergitrauma med hemodynamisk instabilitet – applicera bäckenbälte INNAN röntgen. Det finns ingen nackdel med bäckenbälte vid osäkerhet." (ATLS 11th Ed. 2023)

### Steg 2: Bäckenbälte - OMEDELBART

**Indikationer:**
- Alla misstänkta instabila bäckenfrakturer
- Hemodynamiskt instabil traumapatient
- Rutinmässigt vid högenergitrauma prehospitalt

**Korrekt placering:**
1. Placera över **trochanter major** (INTE över cristae!)
2. Fötterna i neutral rotation, bundna tillsammans
3. Dra åt tills PALPABEL kompression av trochantrarna
4. Lämna på tills definitiv stabilisering

**Effekt:**
- Reducerar bäckenvolymen med 10-20%
- Ökar intrapelvint tryck → tamponadeffekt
- Stabiliserar ben → minskar blödning från frakturspalter

> "Bäckenbälte reducerar bäckenvolymen och återskapar tamponadeffekten. Korrekt placering över trochantrarna är kritiskt." (Cullinane DC et al. J Trauma 2011)

**OBS vid LC-skador:**
- LC-skador har redan komprimerat bäckenet
- Överdriven kompression kan förvärra skadan
- Applicera ändå bälte men undvik överåtdragning

### Steg 3: Primär bedömning (ABCDE)

Bäckenfraktur är ofta en del av multitrauma:
- A: Luftväg
- B: Andning
- C: Cirkulation → **bäckenblödning är en C-problematik**
- D: Disability
- E: Exposure

### Steg 4: Blödningskontroll vid hemodynamisk instabilitet

**Behandlingsstege enligt WSES Guidelines (2017):**

| Steg | Åtgärd | Tidsmål |
|------|--------|---------|
| 1 | Bäckenbälte | Prehospitalt / akutrummet |
| 2 | Massiv transfusion (MTP) | Omedelbart |
| 3 | TXA 1g IV | Inom 3 timmar |
| 4 | REBOA (zon III)* | Bridge till definitiv behandling |
| 5 | Preperitoneal packing** | Inom 30-60 min om fortsatt instabil |
| 6 | Angioembolisering | Efter initial stabilisering |

*REBOA = Resuscitative Endovascular Balloon Occlusion of the Aorta

**Preperitoneal packing:**
- Snabb procedur (15-20 min)
- Adresserar venös blödning (80-90% av blödningen)
- Kan utföras av traumakirurg utan specialutrustning
- Mortalitet 23% vs 32% för enbart angioembolisering (Coccolini F et al. World J Emerg Surg 2017)

**Angioembolisering:**
- Indikation: Arteriell kontrastextravasering på CT, eller fortsatt instabilitet efter packing
- Effektiv för arteriell blödning (10-20%)
- Tidskrävande (medeltid 131 min vs 60 min för packing)
- Kräver interventionsradiolog dygnet runt

### Steg 5: Associerade skador

| Skada | Incidens vid instabil bäckenfraktur | Åtgärd |
|-------|-------------------------------------|--------|
| Urethraskada (♂) | 10-20% | ALDRIG KAD innan retrograd uretrografi |
| Blåsskada | 5-10% | CT-cystografi |
| Rektumskada | 1-5% | Rektalundersökning, sigmoideostomi vid skada |
| Vaginalskada (♀) | 5% | Gynekologisk undersökning |
| Nervskada (L5, S1-S3) | 10-15% | Neurologisk undersökning |

**"Blod vid meatus-regeln":**
> "Blod vid meatus urethrae = misstänk urethraskada. Ingen urinkateter förrän urethraskada uteslutits med retrograd uretrografi." (ATLS 11th Ed. 2023)

## REBOA vid bäckenblödning

REBOA (Resuscitative Endovascular Balloon Occlusion of the Aorta) är en minimalt invasiv teknik för temporär blödningskontroll.

### Zoner

| Zon | Lokalisation | Indikation |
|-----|--------------|------------|
| I | Nedanför vänster subclavia till truncus coeliacus | Bukblödning |
| **III** | Infrarenalt till aortabifurkationen | **Bäckenblödning** |

### Praktiska riktlinjer

- Femoralisåtkomst (5-7 Fr sheath)
- Placeras i zon III vid bäckenblödning
- Korrekt placering verifieras genom förlust av kontralateral femoralispuls
- Partiell REBOA eller intermittent deflation för att minska ischemitid
- Tidsbegränsat: max 60-90 minuter

> "REBOA är en bridge till definitiv behandling – inte en definitiv behandling i sig." (Coccolini F et al. World J Emerg Surg 2020)

## Definitiv behandling

### Icke-operativ behandling

**Indikationer:**
- LC-I frakturer
- APC-I frakturer
- Stabil fraktur hos äldre med osteoporos

**Rehabilitering:**
- Belastning efter smärta
- Trombosprofylax
- Fysioterapi

### Operativ behandling

**Akuta procedurer (< 24 timmar):**
- Extern fixation vid hemodynamisk instabilitet
- Preperitoneal packing

**Subakuta procedurer (24-72 timmar):**
- Bakre fixation med SI-skruvar (perkutana)
- Symfysfixation med platta

**Definitiva procedurer:**
- Anterior internal fixation (ORIF av symfysen)
- Posterior internal fixation (SI-skruvar, transiliac-transacral screws)
- Ibland kombinerat med extern fixation

## Komplikationer

### Akuta
- Död genom exsanguination
- DVT/LE (20-60% utan profylax)
- Infektion (särskilt vid öppen fraktur)

### Sena
- Kronisk smärta (30-50%)
- Sexuell dysfunktion (20-30%)
- Urologiska problem
- Benlängdsskillnad
- SI-ledsartros

## Sammanfattning - Nyckelbudskap

1. **Bäckenbälte på alla misstänkta** - placeras över trochantrarna
2. **80-90% av blödningen är venös** - bälte och packing adresserar detta
3. **APC och VS har HÖGST blödningsrisk** - LC är vanligast men oftast stabil
4. **Blod vid meatus = ingen KAD** - uteslut urethraskada först
5. **Preperitoneal packing** är snabbare och effektivare för venös blödning än angioembolisering
6. **REBOA är en bridge** - inte definitiv behandling

## Referenser

- Young JW, Burgess AR. Radiologic Management of Pelvic Ring Fractures. Urban & Schwarzenberg 1987
- Tile M. Fractures of the Pelvis and Acetabulum. 3rd ed. Lippincott Williams & Wilkins 2003
- WSES Guidelines for the management of pelvic trauma. World J Emerg Surg 2017;12:5
- ATLS Advanced Trauma Life Support. 10th ed. American College of Surgeons 2018
- Coccolini F et al. Pelvic trauma: WSES classification and guidelines. World J Emerg Surg 2017;12:5
- Cullinane DC et al. Eastern Association for the Surgery of Trauma practice management guidelines. J Trauma 2011;71:1850-68
- Papathanasopoulos A et al. Unstable pelvic ring injuries. JBJS Br 2011;93:970-7
`,
    9: `# Amputationsskador

## Bakgrund och epidemiologi

Traumatiska amputationer är relativt ovanliga men dramatiska skador som kräver omedelbar korrekt handläggning för att maximera chansen till replantation eller optimal stumpvård.

### Incidens
- ~500 traumatiska amputationer per år i Sverige
- Fingrar och händer: 70% av alla amputationer
- Arbetsrelaterade skador (maskiner, jordbruk): 60%
- Trafikolyckor: 20%
- Manlig dominans: 4:1

## Klassifikation

### Total amputation
- Fullständig avskiljning utan någon vävnadsbro
- Amputatet helt separerat från kroppen
- Kräver korrekt förvaring för replantation

### Subtotal amputation
- Viss vävnadsbro kvar (hud, kärl, senor)
- Ofta bättre prognos om blodförsörjning intakt
- Bedöm viabilitet av vävnadsbryggan

### Klassificering av skadenivå

| Nivå | Anatomisk struktur | Replantationsprognos |
|------|-------------------|---------------------|
| Distalt om DIP | Fingertipp | God om ren skärskada |
| DIP-PIP | Mittfalang | God |
| Proximalt om PIP | Grundfalang | Varierande |
| Hand/handled | Proximalt | Komplex, god potential |
| Underarm/arm | Majoramputation | Krävande, selekterad |

## Ischemitolerans – kritiska tidsgränser

### Klassiska riktlinjer

| Struktur | Varm ischemi | Kall ischemi |
|----------|--------------|--------------|
| **Fingrar (utan muskulatur)** | 12 timmar | 24 timmar |
| **Hand (med muskulatur)** | 6 timmar | 12 timmar |
| **Arm/ben (stor muskelmassa)** | 4-6 timmar | 8-12 timmar |

> "1 timme varm ischemi motsvarar cirka 6 timmar kall ischemi. Korrekt kylning förlänger replantationsfönstret avsevärt." (Hayhurst JW et al. 1975)

### Modern evidens

Nyare studier visar att fingrar kan tolerera längre ischemitider än traditionellt antagits:
- Framgångsrik replantation rapporterad efter 33 timmars varm ischemi (finger)
- Framgångsrik replantation efter 94 timmars kall ischemi (finger)
- Avsaknad av muskulatur gör fingrar mer toleranta (Waikakul S et al. 2000)

**Dock:** Resultaten försämras med ökad ischemitid – sträva alltid efter kortast möjliga tid.

## Initial handläggning

### Stumsidan – Blödningskontroll FÖRST

**Prioritetsordning:**
1. **Direkt tryck** – förstahandsval, effektivt i de flesta fall
2. **Kompressionsförband** – bibehåll trycket
3. **Tourniquet** – vid okontrollerad blödning
4. **Elevation** – komplement, ej ensam behandling

**Dokumentation:**
- Tidpunkt för skada
- Tidpunkt för tourniquet (om applicerad)
- Skademekanism (skär, kross, avulsion)
- Kontamineringsgrad

### Amputatets förvaring – "DRY, WRAP, BAG, ICE"

**Steg-för-steg:**

1. **Skölj försiktigt** – NaCl eller rent vatten (ta bort synlig kontaminering)
2. **Linda in** – fuktig (EJ våt) steril kompress
3. **Placera i plastpåse** – förslut påsen
4. **Kyl** – plastpåsen placeras i isbad eller isvatten

**KRITISKA FEL ATT UNDVIKA:**
- ❌ ALDRIG direkt kontakt mellan amputation och is (frostskada)
- ❌ ALDRIG förvaring i vatten eller vätska direkt (macerering)
- ❌ ALDRIG förvaring i frys (kristallbildning)
- ❌ ALDRIG torr förvaring utan fukt (uttorkning)

> "Amputatet ska vara kylt men inte fruset. Direkt kontakt med is orsakar irreversibel cellskada." (BSSH Guidelines)

### Transport

- Amputatet ska följa med patienten
- Märk tydligt "AMPUTAT" och tidpunkt
- Kontakta replantationscentrum FÖRE transport
- Ring alltid – även vid tveksamma fall

## Replantationsindikationer

### Absoluta indikationer (replantation rekommenderas starkt)

| Indikation | Motivering |
|------------|-----------|
| **Tumme** | 50% av handens funktion |
| **Flera fingrar** | Funktionellt viktigt |
| **Hand/handled** | Stor funktionsvinst |
| **Barn (alla nivåer)** | Utmärkt regenerationspotential |
| **Avulsion av tumme** | Även vid sämre prognos |

### Relativa indikationer (individuell bedömning)

| Situation | Överväganden |
|-----------|--------------|
| Enstaka finger (dig 2-5) | Bättre prognos distalt om FDS-insertion |
| Proximala amputationer vuxna | Lång rehabilitering, osäker funktion |
| Partiell handamputation | Bedöm funktionell nytta |
| Äldre patient med gott allmäntillstånd | Individualiserat |

### Kontraindikationer

**Absoluta kontraindikationer:**
- Multitrauma med hemodynamisk instabilitet
- Allvarlig krossamputation med destruerad vävnad
- Multipla amputationsnivåer på samma finger ("segmenterad")
- Svår komorbiditet som omöjliggör lång operation

**Relativa kontraindikationer:**
- Rökning (kraftigt försämrad prognos)
- Psykisk ohälsa som omöjliggör rehabilitering
- Mycket lång varm ischemitid
- Kraftig kontaminering
- Enstaka finger proximalt om FDS

### Prognosfaktorer

| Faktor | Bättre prognos | Sämre prognos |
|--------|----------------|---------------|
| **Skadenivå** | Distal | Proximal |
| **Skadetyp** | Ren skärskada | Krossning, avulsion |
| **Ischemitid** | Kort, kall | Lång, varm |
| **Ålder** | Barn | Äldre |
| **Rökning** | Icke-rökare | Rökare |
| **Kontaminering** | Minimal | Grov |

## Kirurgisk teknik – översikt

### Ordningsföljd vid replantation

1. **Debridering** – skära till friska vävnadskanter
2. **Benförkortning** – möjliggör spänningsfri anastomos
3. **Osteosyntesis** – K-tråd eller miniplatta
4. **Sensutur** – extensor och flexor
5. **Artärsutur** – mikrokirurgisk teknik
6. **Nervsutur** – epineurial sutur
7. **Vensutur** – minst 2:1 ratio (vener:artärer)
8. **Hudförslutning** – spänningsfri, ev. hudtransplantat

### Postoperativ vård

- Strikt sängläge 5-7 dagar
- Handledare/ortosbehandling
- Antikoagulation (heparin → ASA/LMWH)
- Temperaturmonitorering av replantatet
- Absolut rökförbud (nikotin orsakar vasospasm)
- Frekvent kontroll av perfusion (kapillär återfyllnad, färg, temperatur)

## Stumpvård vid primär amputation

Om replantation inte är möjlig:

### Principer
- Bevara så mycket längd som möjligt
- Säkerställ adekvat mjukdelstäckning
- Bevara känsliga hudområden
- Bevara leder när möjligt

### Specifika nivåer

| Nivå | Överväganden |
|------|--------------|
| Finger | Bevara PIP-led om möjligt |
| Tumme | Varje millimeter räknas |
| Hand | Bevara karpometakarpala leder |
| Underarm | Bevara >5 cm distalt om armbågen |
| Överarm | Bevara > 8 cm proximalt om armbågen |

## Sammanfattning – Nyckelbudskap

1. **Kyl amputatet** – "Dry, wrap, bag, ice" – ALDRIG direkt iskontakt
2. **Tumme och barn** – alltid replantationsindikation
3. **Ischemitid:** Finger 12h varm/24h kall, hand 6h/12h
4. **Kontakta replantationscentrum** – ring alltid vid tveksamhet
5. **Rökstopp** – nikotinkärlspasm hotar replantatet

## Referenser

- Hayhurst JW et al. Digit replantation. J Hand Surg Am 1975;1:1-7
- Waikakul S et al. Results of 1018 digital replantations. J Hand Surg Am 2000;25:170-7
- BSSH (British Society for Surgery of the Hand) Guidelines
- Chang J et al. Current trends in digital replantation. Ann Transl Med 2023
- Medscape: Replantation in Emergency Medicine, updated 2024
`,
    10: `# Extremitetstrauma hos barn

## Bakgrund och epidemiologi

Extremitetstrauma hos barn skiljer sig fundamentalt från vuxna på grund av det växande skelettet. Fysskador (tillväxtzonskador) är unika för barn och kräver särskild kunskap för korrekt handläggning.

### Incidens
- Fysskador utgör 15-30% av alla skelettskador hos barn (Peterson HA. J Pediatr Orthop 1994)
- Pojkar drabbas oftare (2:1) på grund av högriskaktiviteter
- Flickor drabbas tidigare (11-12 år) än pojkar (12-14 år) – relaterat till tidigare skelettmognad
- Distala radius är vanligaste lokalisationen (30%)

### Åldersfördelning
| Ålder | Typisk skademekanism |
|-------|---------------------|
| 0-2 år | Barnmisshandel, fallolyckor |
| 2-6 år | Lekplatsolyckor, fall |
| 6-12 år | Sportskador, cykelolyckor |
| 12-16 år | Kontaktsporter, motorfordon |

## Anatomiska skillnader hos barn

### Det växande skelettet

| Struktur | Barnets skelett | Klinisk konsekvens |
|----------|-----------------|-------------------|
| **Fysen (tillväxtzonen)** | Svagaste punkten | Fraktur genom fysen vanligare än ligamentskada |
| **Periost** | Tjockare, starkare | "Greenstick"-frakturer, snabbare läkning |
| **Ben** | Mer poröst, plastiskt | Buckle-frakturer, böjningsfrakturer |
| **Ligament** | Starkare relativt ben | Avulsionsfrakturer istället för ligamentrupturer |

> "Ligament hos barn är starkare än fysen. Där en vuxen får en ligamentskada får ett barn ofta en fysskada." (Salter RB, Harris WR. JBJS Am 1963)

### Remodeleringspotential

Barnets skelett har förmåga att spontant korrigera felställningar under fortsatt tillväxt:

| Faktor | Bättre remodeling | Sämre remodeling |
|--------|-------------------|------------------|
| **Ålder** | Yngre barn | Äldre barn/tonåringar |
| **Avstånd till fys** | Nära fysen | Diafysärt |
| **Felställningsplan** | Sagittalt (flexion/extension) | Rotation, varus/valgus |
| **Återstående tillväxt** | Mycket | Lite |

**Tumregel:** Ju yngre barnet och ju närmare fysen, desto bättre remodeleringspotential.

## Barnspecifika frakturtyper

### Buckle-fraktur (Torusfraktur)
- Kompression av kortikalis utan komplett fraktur
- Typiskt distala radius vid fall på utsträckt hand
- Stabil skada, behandlas med gips 3-4 veckor
- Utmärkt prognos

### Greenstick-fraktur
- Inkomplett fraktur – ena kortikalis intakt
- "Som att bryta en grön kvist"
- Risk för refraktur om inte adekvat immobilisering
- Kan behöva reponeras och ev. kompletteras kirurgiskt

### Böjningsfraktur (Plastic deformation)
- Ben böjt utan synlig frakturlinje
- Vanligt i underarm
- Kan kräva reposition under narkos
- Risk att missa på röntgen

### Avulsionsfraktur
- Ligament/sena river loss benfragment
- Typiskt: tibial eminence (ACL), ASIS (sartorius), tuberositas tibiae
- Ofta kirurgisk indikation om dislokation

## Salter-Harris klassifikation

Klassifikationssystemet beskrevs 1963 av Robert Salter och Robert Harris och är fortfarande standardklassifikationen för fysskador (Salter RB, Harris WR. JBJS Am 1963).

### SALTR-minnesregel

| Typ | Minnesord | Frakturlinje | Incidens | Prognos |
|-----|-----------|--------------|----------|---------|
| **I** | **S**traight across | Genom fysen endast | 5% | God |
| **II** | **A**bove | Fys + metafys | 75% | God |
| **III** | **L**ower | Fys + epifys (intraartikulär) | 10% | Risk tillväxtstörning |
| **IV** | **T**hrough | Metafys + fys + epifys | 10% | Hög risk |
| **V** | **R**ammed (crush) | Kompression av fys | < 1% | Mycket hög risk |

### Detaljerade beskrivningar

**Typ I – Separation genom fysen**
- Epifysen separeras från metafysen
- Röntgen kan vara normal (endast breddad fysspalt)
- Diagnos ofta klinisk (ömhet över fysen)
- Behandling: Gips, god prognos

**Typ II – Vanligaste typen (75%)**
- Frakturen går genom fysen och ut genom metafysen
- "Thurston-Holland-fragment" = metafysärt fragment
- God prognos, sällan tillväxtpåverkan
- Behandling: Sluten reposition + gips oftast tillräckligt

**Typ III – Intraartikulär**
- Frakturen går genom fysen och ut genom epifysen till leden
- Kräver anatomisk reposition (< 2 mm stegreduktion)
- Ökad risk för tillväxtpåverkan och artros
- Behandling: Ofta kirurgisk (ORIF) om dislokation

**Typ IV – Genom alla tre**
- Frakturen korsar metafys, fys och epifys
- HÖGST risk för tillväxtstörning (bony bar formation)
- Kräver ANATOMISK reposition för att undvika benbrygga
- Behandling: Kirurgisk i de flesta fall

**Typ V – Kompressionsskada**
- Axiell kraft komprimerar fysen
- Ofta retrospektiv diagnos (normal initialt röntgen → tillväxtstopp)
- Dålig prognos – tidig partiell eller total tillväxtstopp
- Initial röntgen kan vara normal – klinisk misstanke viktigt

### Komplikationer av fysskador

| Komplikation | Risk vid typ | Konsekvens |
|--------------|--------------|------------|
| **Komplett tillväxtstopp** | III-V | Förkortning av extremitet |
| **Partiell tillväxtstopp (bony bar)** | III-IV | Angulär deformitet |
| **Artros** | III-IV | Ledpåverkan |
| **Avaskulär nekros** | Specifika lokalisationer | Bennekros |

## Handläggning

### Akut bedömning

**Smärtbedömning hos barn:**
> "Smärta hos barn är ofta underskattat. Använd åldersanpassade smärtskalor (FLACC, Wong-Baker) och behandla generöst." (APLS Guidelines)

**LIMB-protokollet anpassat för barn:**
- L: Inspektion – även för tecken på barnmisshandel
- I: Cirkulation – kapillär återfyllnad, pulsar
- M: Rörlighet – passiv rörlighet för fysbedömning
- B: Ben – punktömhet över fysen även utan röntgenfynd

### Röntgen hos barn

**Viktigt att veta:**
- Epifysära ossifikationskärnor kan misstolkas som frakturer
- Jämförande bilder av kontralateral sida kan behövas
- Normal röntgen utesluter INTE fysskada (SH typ I och V)

**Fysslinjen syns inte på röntgen** – diagnosen är klinisk vid ömhet över fysen!

### Behandlingsprinciper

**Typ I-II (lågriskfrakturer):**
- Sluten reposition om felställning
- Gipsbehandling 3-6 veckor
- Uppföljning med röntgen för att utesluta tillväxtpåverkan

**Typ III-IV (högriskfrakturer):**
- Ortopedkonsult obligatoriskt
- Anatomisk reposition krävs (stegreduktion < 2 mm)
- Ofta kirurgisk stabilisering (K-tråd, skruvar)
- Lång uppföljning (2 år) för tillväxtkontroll

**Typ V:**
- Klinisk misstanke vid axiellt trauma
- Immobilisering och tät uppföljning
- Förväntad tillväxtstörning – informera föräldrar

### Uppföljning av fysskador

| Tidsintervall | Åtgärd |
|---------------|--------|
| 1 vecka | Röntgenkontroll av position |
| 4-6 veckor | Läkningskontroll, gipsborttagning |
| 3 månader | Klinisk kontroll |
| 6 månader | Röntgen för tillväxtkontroll |
| 12-24 månader | Slutkontroll, längdmätning |

## Specifika lokalisationer

### Suprakondylär humerusfraktur
- Vanligaste armbågsfrakturen hos barn (5-8 år)
- **Gartland-klassifikation** I-III
- Risk: A. brachialis-skada, nervskada (n. medianus, n. radialis)
- Typ III kräver kirurgi (K-tråd)

### Distala radiusfrakturen
- Vanligaste frakturen hos barn
- Buckle-fraktur: Gips 3-4 veckor
- SH II: Reposition + gips, god prognos

### Femurskaftfraktur
- Hos barn < 2 år: UTESLUT BARNMISSHANDEL
- Behandling beroende på ålder:
  - < 6 mån: Pavlik-sele
  - 6 mån-5 år: Höftgips (spica cast)
  - > 5 år: Flexibel märgspikning (TEN)

## Barnmisshandel – varningssignaler

**Röda flaggor:**
- Fraktur hos icke-mobilt barn (< 1 år)
- Multipla frakturer i olika läkningsstadier
- Metafysära "corner fractures" (klassiskt tecken)
- Inkonsekvent anamnes
- Fördröjd vårdkontakt
- Tidigare misstanke dokumenterad

> "En femurfraktur hos ett icke-gående barn är barnmisshandel tills motsatsen bevisats." (Barnsäkerhetsprincipen)

**Åtgärd vid misstanke:**
- Dokumentera noggrant
- Skelettscreening
- Anmälningsplikt enligt SoL 14 kap

## Sammanfattning – Nyckelbudskap

1. **Fysen är svagaste punkten** – barn får fysskador, inte ligamentskador
2. **Salter-Harris II** är vanligast (75%) och har god prognos
3. **Typ III-IV kräver anatomisk reposition** – risk för tillväxtstörning
4. **Normal röntgen utesluter inte fysskada** – diagnosen är klinisk
5. **Yngre barn remodellerar bättre** – acceptera mer felställning
6. **Femurfraktur hos barn < 2 år** – uteslut barnmisshandel
7. **Uppföljning 2 år** för att utesluta tillväxtpåverkan

## Referenser

- Salter RB, Harris WR. Injuries involving the epiphyseal plate. JBJS Am 1963;45:587-622
- Peterson HA. Physeal fractures: Part 2. J Pediatr Orthop 1994;14:423-30
- Beaty JH, Kasser JR. Rockwood and Wilkins' Fractures in Children. 8th ed. Lippincott 2015
- APLS: Advanced Paediatric Life Support. 6th ed. BMJ Books 2016
- POSNA (Pediatric Orthopaedic Society of North America) Guidelines
`,
    11: `# Crush syndrome

## Bakgrund och epidemiologi

Crush syndrome (traumatisk rhabdomyolys) är ett livshotande tillstånd som uppstår vid prolongerad kompression av muskelvävnad, typiskt vid jordbävningar, byggnadskollapser och industriolyckor. Rätt handläggning redan före friläggning kan vara livräddande.

### Historik
- Första gången beskrivet efter "The Blitz" i London 1940-1941
- Bywaters och Beall beskrev syndromet hos offer som frigjordes ur rasmassor
- Klassisk beskrivning: "Personen ser välmående ut vid friläggning men utvecklar chock och njursvikt inom timmar"

### Incidens
- Upp till 20% av överlevande vid jordbävningar utvecklar crush syndrome
- 50% av dessa drabbas av akut njursvikt
- Mortalitet: 5-15% vid adekvat behandling, upp till 50% utan

## Definition

Crush syndrome är de systemiska manifestationerna av traumatisk rhabdomyolys som uppstår vid reperfusion efter prolongerad muskelkompression (typiskt > 1 timme).

**Skillnad crush injury vs crush syndrome:**
- **Crush injury:** Lokal muskelskada vid kompression
- **Crush syndrome:** Systemiska konsekvenser av crush injury, särskilt vid friläggning

## Patofysiologi

### Händelsekedja

**Under kompression:**
1. Muskelischemi → ATP-uttömning → cellmembransvikt
2. Na+/K+-ATPas slutar fungera → kalium läcker ut
3. Ca2+ strömmar in i cellen → kontraktur och cellskada
4. Proteinnedbrytning → myoglobinfrisättning

**Vid friläggning (reperfusion):**
1. Plötslig frisättning av toxiner till systemcirkulationen
2. Massiv hypovolemi (vätska "tredje rummet" till skadad muskel)
3. Toxiner når hjärta, njurar och andra organ

### Frisatta toxiner och deras effekter

| Toxin | Källa | Systemisk effekt |
|-------|-------|-----------------|
| **Kalium (K+)** | Intracellulär frisättning | Arytmier, hjärtstillestånd |
| **Myoglobin** | Muskelprotein | Njurtubulär ocklusion → AKI |
| **Fosfat (PO4)** | Intracellulär | Hypokalcemi, arytmier |
| **Laktat** | Anaerob metabolism | Metabol acidos |
| **Urat** | Purinnedbrytning | Njurskada |
| **Trombo-plastinliknande substanser** | Vävnadsskada | DIC |

### Tredje rummets förluster

> "Skadad muskulatur kan ackumulera 10-18 liter vätska per dag. Denna massiva redistribution leder till hypovolemisk chock trots synbart blygsam yttre skada." (Better OS, Stein JH. Kidney Int 1990)

## Klinisk bild

### Riskfaktorer för crush syndrome

| Faktor | Hög risk |
|--------|----------|
| Kompressonstid | > 4-6 timmar |
| Komprimerad kroppsdel | Lår, sätesmuskulatur (stor muskelmassa) |
| Multipla extremiteter | Kraftigt ökad risk |
| Hypovolemi vid kompression | Försämrad prognos |

### Lokala tecken

- Svullnad (kan vara massiv)
- Spänd extremitet
- Smärta (ofta oproportionerlig)
- Hudförändringar (blåsor, ekkymoser)
- Sensibilitetsnedsättning
- Förlamning
- Pulslöshet kan förekomma vid svår svullnad

### Systemiska manifestationer

**Kardiella (LIVSHOTANDE):**
- Hyperkalemi → ventrikelflimmer, hjärtstillestånd
- Hypokalcemi → arytmier
- EKG-förändringar: höga T-vågor, breddökade QRS, PR-förlängning

**Renala:**
- Myoglobinuri ("cola-färgad urin")
- Akut njursvikt (50% av patienter med crush syndrome)
- Oliguri/anuri

**Metabola:**
- Metabol acidos (laktat, fosfat, urat)
- Hyperfosfatemi
- Hypocalcemi (kalcium binds till skadad muskel)
- Hyperurikemi

**Vaskulära:**
- Hypovolemisk chock
- DIC
- Ödembildning

## Behandling

### Pre-release behandling (INNAN friläggning) – KRITISKT

> "Pre-release vätskebehandling är den viktigaste enskilda åtgärden vid crush syndrome. Vätska ska ges INNAN eller UNDER friläggning, inte efter." (NAEMSP Position Statement 2024; INSARAG Medical Guidelines)

**Steg-för-steg:**

1. **IV-access** – etablera innan friläggning om möjligt
2. **Aggressiv vätskebehandling** – BÖRJA OMEDELBART

| Patientkategori | Vätskeinfusion |
|-----------------|----------------|
| Vuxna | 1-1.5 L/timme de första 3-4 timmarna |
| Barn | 20 ml/kg/timme |

3. **Vätskeval:**
   - NaCl 0.9% – förstahandsval (kaliumfritt!)
   - Alternativt Ringer-laktat (bättre pH-effekt)
   - Undvik kaliuminnehållande lösningar

4. **EKG-monitorering** – hyperkalemitecken
5. **Kaliumreducerande åtgärder** vid EKG-förändringar:
   - Kalciumglukonat 10% 10-20 ml IV (kardioprotektion)
   - Natriumbikarbonat 50-100 mmol IV
   - Insulin 10 E + Glukos 50% 50 ml IV
   - Nebuliserad salbutamol

**VARNING:**
> "Friläggning av en patient med crush syndrome UTAN pågående vätskebehandling kan leda till omedelbart hjärtstillestånd från hyperkalemi. Pre-release vätska är livräddande." (INSARAG)

### Post-release behandling

**Mål för vätskebehandling:**
- Urinproduktion > 200-300 ml/timme (vuxna)
- Fortsatt infusion: 400-1000 ml/timme beroende på svårighetsgrad
- Kan kräva > 12 liter/dygn första dygnen

**Alkalinisering av urin:**
- Mål: Urin-pH > 6.5 (minskar myoglobintoxicitet)
- Natriumbikarbonat tillsats till infusion
- Kontraindikation: Svår hypokalcemi (bikarbonat sänker ytterligare)

**Forcerad diures:**
- Mål: Urinproduktion 200-300 ml/timme
- Mannitol 20% 1-2 g/kg (osmotisk diures)
- Loop-diuretika kan övervägas men kontroversiellt

**Elektrolytkorrigering:**
- Följ K+, Ca2+, PO4 var 2-4:e timme initialt
- Hyperkalemi: Behandla aggressivt (se ovan)
- Hypokalcemi: Endast symptomatisk behandling (kalcium binds till skadad muskel)

**Njurersättningsterapi:**
- Indikation: Oligurisk njursvikt trots adekvat vätsketerapi
- Tidig dialys vid refraktär hyperkalemi, övervätskning, svår acidos
- Kontinuerlig venovenös hemodialys (CVVHD) ofta föredraget

### Lokal extremitetsbehandling

- Fasciotomi vid misstänkt kompartmentsyndrom
- Observera att fasciotomi vid crush syndrome ökar infektionsrisk och vätskebehov
- Individuell bedömning: kompression + ischemi = hög risk

## Laboratorieprover

| Prov | Fynd | Klinisk betydelse |
|------|------|-------------------|
| **CK (Kreatinkinas)** | Kraftigt förhöjt (>10 000 U/L) | Grad av muskelskada |
| **Myoglobin** | Förhöjt | Njurtoxiskt |
| **Kalium** | Förhöjt | Arytmirisk |
| **Kreatinin** | Förhöjt | Njurfunktion |
| **Fosfat** | Förhöjt | Sekundär hypokalcemi |
| **Kalcium** | Sänkt | Arytmirisk |
| **Urinsticka** | Positiv för blod, negativ mikroskopi | Myoglobinuri |

## Komplikationer

### Akuta
- Hjärtstillestånd (hyperkalemi)
- Akut njursvikt (50%)
- ARDS
- DIC
- Multiorgan

### Sena
- Kronisk njursvikt (5-10%)
- Kontrakturer
- Funktionsnedsättning
- PTSD

## Prognos

| Faktor | Påverkan |
|--------|----------|
| Tidig vätskebehandling | Dramatiskt förbättrad överlevnad |
| Dialystillgång | Kritiskt vid njursvikt |
| Mängd skadad muskelmassa | Större massa = sämre prognos |
| Kompressonstid | Längre tid = sämre prognos |

## Sammanfattning – Nyckelbudskap

1. **PRE-RELEASE VÄTSKA ÄR LIVRÄDDANDE** – börja INNAN friläggning
2. **Ge 1-1.5 L/timme** till vuxna under friläggning
3. **Undvik kaliuminnehållande lösningar** – hyperkalemi är dödlig
4. **EKG-monitorering** – hyperkalemi kan orsaka hjärtstillestånd
5. **Mål: Urinproduktion > 200-300 ml/timme**
6. **Tidig dialys** vid refraktär hyperkalemi eller oliguri

## Referenser

- Better OS, Stein JH. Early management of shock and prophylaxis of acute renal failure in traumatic rhabdomyolysis. NEJM 1990;322:825-9
- Sever MS et al. Lessons learned from the catastrophic Marmara earthquake. Kidney Int 2012;62:S96-S103
- NAEMSP Position Statement: Management of the Entrapped Patient. Prehospital Emergency Care 2024
- INSARAG Medical Guidelines (International Search and Rescue Advisory Group)
- AAST Critical Care Committee Consensus: Rhabdomyolysis. J Trauma 2022
`,
    12: `# Speciella populationer

Vissa patientgrupper kräver särskild hänsyn vid ortopedisk traumavård på grund av förändrad fysiologi, läkemedelsinteraktioner eller unik riskprofil. Detta kapitel behandlar tre viktiga populationer: äldre patienter, gravida och immunsupprimerade (WSES Guidelines 2023; EAST Practice Management Guidelines).

---

## Äldre patienter (≥ 65-70 år)

### Epidemiologi och Definitioner

Geriatrisk trauma definieras olika beroende på källa:
- **ATLS**: > 55 år motiverar traumacenteröverföring
- **EAST**: ≥ 65 år räknas som äldre
- **WSES 2023**: ≥ 70 år baserat på mortalitetsdata justerat för ISS

Mortaliteten ökar signifikant vid 55, 77 och 82 års ålder enligt multicenterstudier (WSES Guidelines 2023; Trauma Registry DGU).

| Åldersgrupp | Relativ mortalitetsökning |
|-------------|---------------------------|
| 55-69 år | +30% jämfört med yngre |
| 70-79 år | +100% |
| ≥ 80 år | +200% |

### Fysiologiska Förändringar

Äldre har nedsatt fysiologisk reserv som påverkar traumarespons:

**Kardiovaskulärt:**
- Minskad hjärtfrekvensrespons på hypovolemi
- Stel vaskulatur – takykardi kan utebli trots blödning
- Pacemaker kan maskera arytmier

**Respiratoriskt:**
- Nedsatt lungcompliance
- Minskad hostreflex
- **3-4 revbensfrakturer** hos äldre ökar mortaliteten med 19% och pneumonirisken med 31% (WSES 2023)

**Muskuloskeletalt:**
- Osteoporos: frakturer vid lågenergitrauma
- 50% av cervikala kotfrakturer hos äldre är kliniskt instabila

### Antikoagulationshantering

**KRITISKT TEMA** – antikoagulantiabruk ökar blödnings- och mortalitetsrisken dramatiskt.

| Preparat | Reversering | Kommentar |
|----------|-------------|-----------|
| Warfarin | Vitamin K + 4-faktor PCC | INR > 1.5 → mortalitet 22.6% vs 8.2% |
| NOAK (Dabigatran) | Idarucizumab (Praxbind) | Reverserar inom minuter |
| NOAK (Xa-hämmare) | Andexanet alfa | Rivaroxaban, apixaban, edoxaban |
| LMWH | Protaminsulfat | Partiell reversering |
| ASA/Klopidogrel | Trombocyttransfusion | Vid allvarlig blödning |

**Handläggningsalgoritm:**
1. **Anamnes**: Alltid fråga om antikoagulantia/trombocythämmare
2. **Koagulationsprov**: PK-INR, APTT, trombocyter omedelbart
3. **Skallskada**: CT inom 1 timme vid antikoagulation (WSES 2023)
4. **Positiv CT**: Reversera koagulopati inom 2 timmar
5. **Negativ CT + antikoagulation**: 24 timmars observation + uppföljande CT vid 4-6 timmar

### Revbensfrakturer – Speciell Risk

> "Patients who are older with 3 to 4 rib fractures have a 19% increased mortality risk and 31% risk of pneumonia" (ACS Best Practices Guidelines 2023)

**Handläggning:**
- Regional anestesi tidigt (epidural/paravertebral block)
- Intensiv andningsgymnastik
- Lägre tröskel för IVA-övervakning
- Tidig mobilisering

### Höftfrakturer och Trombosprofylax

Perioperativ trombosprofylax är standard. Utmaningen är patienter som redan står på antikoagulantia:

**Timing av kirurgi:**
- Operation inom 24-48 timmar förbättrar överlevnad
- Fördröjning för antikoagulationsreversering måste vägas mot fördelarna med tidig kirurgi
- Multidisciplinär diskussion (ortoped, anestesi, kardiolog)

### Nutritionella Överväganden

- Malnutrition ökar komplikationsrisken dramatiskt
- Screening med Mini Nutritional Assessment (MNA)
- Tidigt näringsintag och proteinsubstitution

---

## Gravida

### Epidemiologi

- Trauma är den vanligaste icke-obstetriska dödsorsaken under graviditet
- 6-7% av alla graviditeter kompliceras av trauma
- Placentaavlossning är den vanligaste orsaken till fosterdöd (EAST Guidelines)

### Fysiologiska Förändringar

Graviditeten medför dramatiska fysiologiska förändringar som påverkar traumavård:

| Parameter | Förändring | Klinisk betydelse |
|-----------|------------|-------------------|
| Blodvolym | +40-50% | Kan förlora 1500 ml utan vitala tecken |
| Hjärtminutvolym | +30-50% | Ökat syrebehov |
| Hjärtfrekvens | +10-20 slag/min | Takykardi normalt |
| Blodtryck | Lätt sänkt | Hypotension kan maskeras |
| Uterus | Abdominalt fr.o.m. v12 | Sårbar för trauma |
| Andningsfrekvens | Oförändrad/lätt ökad | Lägre reserv |

### Ryggläges-Hypotensionssyndrom

> "Vena cava-kompression av gravid uterus kan minska venöst återflöde med 30% efter vecka 20" (ACOG)

**ALLTID:** Lägg gravida patienter i **15-30° vänstersidesläge** eller manuell uterusförflyttning åt vänster.

### Fosterövervakning – CTG

Fosterövervakning är central i traumahandläggning av gravida:

| Graviditetsvecka | Övervakningstyp | Duration |
|------------------|-----------------|----------|
| < 23 veckor | Doppler-auskultation | Intermittent |
| ≥ 23 veckor (viabelt) | Kontinuerlig CTG | Minst 4-6 timmar |

**Indikationer för förlängd övervakning (24 timmar):**
- Uterusömhet
- Signifikant buksmärta
- Vaginal blödning
- Kontraktioner > 1/10 minuter
- Avvikande CTG-mönster
- Fibrinogen < 200 mg/dL
- Högenergitrauma

> "100% av patienter med placentaavlossning hade ≥ 8 kontraktioner/timme under de första 4 timmarna" (EAST Guidelines)

### Placentaavlossning

**Kliniska tecken:**
- Vaginal blödning (kan vara frånvarande vid retroplacentärt hematom)
- Uterusömhet
- Fosterhjärtljudsavvikelser
- Ökade kontraktioner

**VIKTIGT:** Ultraljud är INTE sensitivt för placentaavlossning – klinisk misstanke ska inte fördröja handläggning i väntan på UL-bekräftelse (EAST Guidelines).

### Bilddiagnostik

> "Stråldos från en enskild diagnostisk undersökning medför inte skadliga fostereffekter" (ACOG Committee Opinion #299)

| Undersökning | Ungefärlig fosterdos | Säkerhet |
|--------------|---------------------|----------|
| Slätröntgen extremitet | < 0.01 mGy | Säker |
| Slätröntgen bäcken | 1-4 mGy | Acceptabel |
| CT buk | 10-50 mGy | Indicerad vid behov |
| CT skalle | < 0.01 mGy | Säker |

**Teratogen dos:** > 100 mGy (uppnås praktiskt aldrig vid diagnostik)

**Princip:** "Mother first" – adekvat diagnostik av modern får ALDRIG fördröjas av oro för strålning.

### Rhesusprofylax

Alla Rh-negativa gravida som utsätts för trauma ska få anti-D immunoglobulin inom 72 timmar (300 μg täcker ~30 ml fetalt blod).

### Perimortem Sectio

Vid hjärtstopp hos gravid ≥ 23 veckor:
- Påbörja HLR omedelbart
- **Sectio inom 5 minuter** efter hjärtstopp för att förbättra både maternell och fetal överlevnad
- Uterusevakuering förbättrar venöst återflöde och HLR-effektivitet

---

## Immunsupprimerade Patienter

### Definition och Riskgrupper

Immunsuppression kan vara primär eller sekundär:

**Iatrogen:**
- Organtransplanterade (calcineurinhämmare, steroider)
- Autoimmuna sjukdomar (metotrexat, TNF-α-hämmare)
- Cancerbehandling (cytostatika)
- Långvarig steroidbehandling (> 7.5 mg prednisolon/dag)

**Sjukdomsrelaterad:**
- HIV/AIDS (CD4 < 200)
- Diabetes mellitus
- Njursvikt
- Leversvikt
- Malnutrition

### Infektionsrisk vid Fraktur

> "Fracture-related infection (FRI) risk is elevated with diabetes, peripheral vascular disease, smoking, malnutrition, obesity, and immunosuppression" (Prevention of FRI: Multidisciplinary Care Package, International Orthopaedics 2017)

**Infektionsfrekvens efter ORIF:**
- Slutna frakturer: 1-2%
- Öppna frakturer: 0.4-16.1%
- Immunsupprimerade: Upp till 2-3x högre risk

### Preoperativ Hantering av Immunsuppression

WHO rekommenderar **individualiserat beslut** snarare än rutinmässigt uppehåll:

| Läkemedel | Rekommendation | Kommentar |
|-----------|----------------|-----------|
| Metotrexat | Fortsätt/individualisera | Moderna studier visar låg risk |
| TNF-α-hämmare | Uppehåll 1 doseringsintervall | Ökad infektionsrisk vid > 1 DMARD |
| Steroider | Fortsätt + stressdos | Addisonkris-risk vid utsättning |
| Kalcineurinhämmare | Fortsätt | Avstötningsrisk vid uppehåll |

### Profylaktisk Strategi

**Preoperativt:**
1. **Näsdekolonisering**: Mupirocin intranasalt x 3/dag i 5 dagar vid S. aureus-bärarskap
2. **Kroppstvätt**: Klorhexidintvål preoperativt
3. **Glukoskontroll**: HbA1c-optimering, peroperativ normoglykemi
4. **Nutrition**: Proteinoptimering, vitamin D-status

**Peroperativt:**
- Antibiotika inom 60 minuter före incision
- Förlängd profylax till 24 timmar (kan övervägas 48-72 h hos högriskpatienter)
- Noggrann hemostas och mjukdelshantering

**Postoperativt:**
- Tätare sårinspektion
- Lägre tröskel för sårodling
- Tidig konsultation av infektionsspecialist vid misstänkt infektion

### Sårhantering hos Immunsupprimerade

- Överväg partiell hudslutnng eller sekundär slutning
- Evidens för profylaktisk undertryckssårbehandling (NPWT) är osäker
- Multidisciplinär approach rekommenderas (ortoped, infektionsläkare, mikrobiolog)

---

## Sammanfattning – Nyckelbudskap

### Äldre
1. **Antikoagulantia** – anamnes + koagulationsstatus på ALLA äldre
2. **Reversera vid blödning** – särskilt vid skalltrauma
3. **≥ 3 revbensfrakturer** = hög risk för pneumoni
4. **Tidig mobilisering** och nutritionsoptimering

### Gravida
1. **Vänstersidesläge** – alltid efter v20
2. **CTG ≥ 4 timmar** vid viabelt foster
3. **Placentaavlossning** – diagnos är KLINISK, inte UL
4. **Röntga vid behov** – diagnostik viktigare än stråloro

### Immunsupprimerade
1. **Identifiera riskfaktorer** preoperativt
2. **Individualisera** läkemedelshantering
3. **Näsdekolonisering** hos S. aureus-bärare
4. **Låg tröskel** för infektionskonsult

## Referenser

- WSES Guidelines on Management of Trauma in Elderly and Frail Patients. World J Emerg Surg 2024;19:35
- ACS Best Practices Guidelines: Geriatric Trauma. Am Coll Surg 2023
- EAST Practice Management Guidelines: Pregnancy and Trauma. J Trauma 2010
- ACOG Committee Opinion #299: Guidelines for Diagnostic Imaging During Pregnancy. 2004 (reaffirmed 2017)
- Metsemakers WJ et al. Prevention of fracture-related infection. Int Orthop 2017;41:2457-2469
- Surgical site infection prevention in immunocompromised patients. World J Emerg Surg 2021;16:23
`,
    13: `# Damage Control Orthopaedics (DCO)

Damage Control Orthopaedics (DCO) är en strategisk approach för hantering av frakturer hos fysiologiskt instabila multitraumapatienter. Konceptet utvecklades för att undvika "second hit"-fenomenet där definitiv kirurgi förvärrar den inflammatoriska responsen och leder till organsvikt (Pape HC et al. Am J Surg 2002; Roberts CS et al. CORR 2005).

---

## Bakgrund och Rationale

### "Second Hit"-Fenomenet

Trauma orsakar en initial immunologisk/inflammatorisk respons ("first hit"). Definitiv kirurgi inom denna sårbarhetsfas kan utlösa en "second hit" som leder till:
- ARDS (Acute Respiratory Distress Syndrome)
- MODS (Multiple Organ Dysfunction Syndrome)
- DIC (Disseminerad Intravasal Koagulation)
- Död

> "The second hit theory postulates that a patient who has sustained major trauma is immunologically primed, and a second insult (such as prolonged surgery) can trigger a systemic inflammatory response" (Pape HC, Am J Surg 2002)

### Historisk Utveckling

| Period | Paradigm | Princip |
|--------|----------|---------|
| 1970-80-tal | Expectant management | Avvaktande behandling |
| 1980-90-tal | Early Total Care (ETC) | Tidig definitiv fixation |
| 2000-talet | Damage Control Orthopaedics | Temporär stabilisering |
| 2010-talet | Early Appropriate Care (EAC) | Individualiserad approach |

---

## Early Total Care (ETC) vs. DCO

### Early Total Care (ETC)

**Indikationer (Giannoudis-kriterierna):**
- Stabil hemodynamik
- Normal syresättning
- Laktat < 2 mmol/L
- Ingen koagulopati
- Normal temperatur (> 35°C)
- Urinproduktion > 1 ml/kg/timme
- Inget inotropt stöd

**Fördelar med ETC:**
- Tidig mobilisering
- Kortare vårdtid
- Bättre smärtkontroll
- Effektivare resursutnyttjande

### Damage Control Orthopaedics (DCO)

**Indikationer:**
- Fysiologisk instabilitet
- "Unstable" eller "In extremis"-patienter enligt Pape-klassifikation
- Pågående massiv transfusion
- Svår skallskada med ICP-problem
- Thorakal skada med respiratorisk insufficiens

---

## Papes Klassifikationssystem

Pape beskrev fyra patientkategorier baserat på fysiologisk status:

| Kategori | Definition | Rekommendation |
|----------|------------|----------------|
| **Stable** | Normal fysiologi | ETC möjlig |
| **Borderline** | Initial stabilitet, risk för försämring | Individuell bedömning |
| **Unstable** | Pågående instabilitet | DCO indikerat |
| **In extremis** | Livshotande tillstånd | Endast livräddande åtgärder |

### Fysiologiska Parametrar för Klassifikation

En patient klassificeras i en kategori om **≥ 3 av 4** parameterkategorier uppfylls:

| Parameter | Stable | Borderline | Unstable | In extremis |
|-----------|--------|------------|----------|-------------|
| **Blodtryck** | Normal | Transient respons | Kräver vasopressor | Refraktär hypotension |
| **Koagulation** | Normal | PLT 90-110, PT < 1.25 | PLT < 90, PT > 1.25 | Klinisk koagulopati |
| **Temperatur** | > 35°C | 33-35°C | < 33°C | < 32°C |
| **Mjukdel/skelett** | Enkel fraktur | ISS < 20, Stabil bäcken | ISS 20-40, Instabil bäcken | ISS > 40, Massiv kontusion |
| **Laktat** | Normal | 2-4 mmol/L | > 4 mmol/L | Stigande trots behandling |

### "Borderline"-Patienten

> "Borderline patients represent the most controversial category in which the choice between ETC and DCO remains uncertain" (Pape HC, J Trauma 2007)

**Riskfaktorer för försämring:**
- Bilateral femurfraktur
- Thoraxtrauma med lungkontusion
- Multipla långa rörbensfrakturer
- Svår bäckenskada
- Bukskada krävande laparotomi
- Extern blödning > 3 enheter under resuscitering
- Initial hypotension (SBP < 90 mmHg)

---

## DCO-Protokoll: Tre Faser

### Fas 1: Akut Resuscitering och Temporär Stabilisering (0-24 timmar)

**Mål:** Stoppa blödning, förhindra kontaminering, stabilisera frakturer temporärt

**Kirurgiska principer:**
- Operationstid < 90 minuter totalt
- Minimal blodförlust
- Ingen definitiv fixation
- Extern fixation för instabila frakturer

**Prioritering:**

| Prioritet | Åtgärd | Tidsgräns |
|-----------|--------|-----------|
| 1 | Blödningskontroll (bäcken, buk, thorax) | Omedelbar |
| 2 | Dekompression (fasciotomi, kraniotomi) | < 1 timme |
| 3 | Kärlreparation/shunt | < 6 timmar |
| 4 | Extern fixation av långa rörben | < 24 timmar |
| 5 | Sårrevision av öppna frakturer | < 24 timmar |

### Fas 2: Resuscitering på IVA (24-72 timmar)

**Mål:** Korrigera "lethal triad" och optimera fysiologi

**"Lethal Triad" – Dödens Triangel:**
1. **Hypotermi** → Mål: Temperatur > 36°C
2. **Koagulopati** → Mål: INR < 1.5, PLT > 100
3. **Acidos** → Mål: pH > 7.35, laktat < 2.5

**Endpoints för att avsluta Fas 2:**

| Parameter | Mål innan definitiv kirurgi |
|-----------|------------------------------|
| Laktat | < 2.5 mmol/L |
| BE (base excess) | > -5 mmol/L |
| Temperatur | > 36°C |
| Koagulation | INR < 1.5, APTT normaliserad |
| Hemodynamik | Stabil utan vasopressor |
| Urinproduktion | > 0.5 ml/kg/timme |

### Fas 3: Definitiv Rekonstruktion (> 72 timmar, "Window of Opportunity")

**Timing:**
- Optimalt: Dag 5-10 efter trauma
- Undvik dag 2-4 ("inflammatory peak")

**Procedurer:**
- Konvertering extern → intern fixation
- Definitiv frakturfixation
- Mjukdelsrekonstruktion (lambåer)
- Sekundär bukslutning

---

## Extern Fixation – Tekniska Aspekter

### Indikationer för Extern Fixation i DCO

- Öppna frakturer Gustilo IIIB/IIIC
- Frakturer med associerad kärlskada
- Bilateral femurfraktur hos instabil patient
- Bäckenringskada med instabilitet
- Periartikulära frakturer med mjukdelsskada
- Fysiologiskt instabil patient

### Pinplacering – Grundprinciper

**Generellt:**
- 2 pinnar per fragment minimum
- Pin-avstånd > 4 cm från frakturområde
- Undvik futura incisionslinje
- Safe corridor-teknik för att undvika neurovaskulära strukturer

**Regionspecifika säkra zoner:**

| Region | Säker zon | Varning |
|--------|-----------|---------|
| Femur proximal | Lateralt | N. femoralis anteriort |
| Femur distal | Lateralt | A/V poplitea posteriort |
| Tibia proximal | Anteromedialt | N. peroneus lateralt |
| Tibia distal | Anteromedialt/medialt | Neurovaskulärt posteriort |

### Konvertering till Intern Fixation

**Timing för säker konvertering:**
- Idealt < 2 veckor efter extern fixation
- Infektionsrisk ökar efter 2-3 veckor
- Pin-site-infektion = relativ kontraindikation

**Infektionsrisk vid konvertering:**

| Timing | Infektionsrisk |
|--------|----------------|
| < 2 veckor | 1-3% |
| 2-3 veckor | 5-10% |
| > 3 veckor | > 10% |

---

## Safe Definitive Surgery (SDS) – Modern Approach

Ett modernare koncept som kombinerar ETC och DCO baserat på dynamisk bedömning:

> "Safe Definitive Surgery is a dynamic synthesis of both strategies, employing clinical parameters and repeated assessment" (Journal of Anaesthesiology Clinical Pharmacology 2023)

**Principer:**
1. Kontinuerlig monitorering av fysiologiska parametrar
2. Beredskap att avbryta och konvertera till DCO
3. Intraoperativ kommunikation mellan team
4. Individualiserad behandlingsplan

---

## Sammanfattning – Nyckelbudskap

1. **DCO är för instabila patienter** – använd Papes klassifikation
2. **"Borderline"-patienter** kräver individuell bedömning
3. **Fas 1 < 90 minuter** – minimal kirurgi
4. **Korrigera "Lethal Triad"** innan definitiv kirurgi
5. **Window of Opportunity** – dag 5-10 för definitiv fixation
6. **Konvertera inom 2 veckor** för att minimera infektionsrisk
7. **Teamkommunikation** är avgörande för optimal timing

## Kliniskt Beslutsträd

\`\`\`
MULTITRAUMAPATIENT MED FRAKTUR
            │
            ▼
    Bedöm fysiologisk status
    (Papes klassifikation)
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
 STABLE  BORDERLINE  UNSTABLE/IN EXTREMIS
    │       │              │
    ▼       ▼              ▼
   ETC   Individ.        DCO
  möjlig  bedömn.      obligat
            │              │
            ▼              ▼
    Riskfaktorer?    Extern fixation
    - Thoraxtrauma   + IVA-resuscitering
    - Bilateral femur
    - ISS > 25
            │
      ┌─────┴─────┐
      ▼           ▼
    Ja          Nej
     │           │
     ▼           ▼
    DCO         ETC
\`\`\`

## Referenser

- Pape HC, Giannoudis P, Krettek C. The timing of fracture treatment in polytrauma patients. Am J Surg 2002;183:622-629
- Roberts CS et al. Damage control orthopaedics. CORR 2005;439:53-60
- Giannoudis PV et al. Damage control orthopaedics in unstable pelvic ring injuries. Injury 2004;35:671-677
- Damage control orthopedics or early total care. J Trauma Acute Care Surg 2024;96:e34-e40
- Journal of Anaesthesiology Clinical Pharmacology: Early Total Care to Early Appropriate Care. 2023;39:7-12
- Pape HC. Classification of patients with multiple injuries. J Trauma 2007;62(Suppl):S43
`,
    14: `# Transport och överflyttning

Säker transport av traumapatienter kräver noggrann planering, adekvat immobilisering och strukturerad kommunikation. Felaktigheter under transport kan förvärra skador och fördröja definitiv vård. Detta kapitel fokuserar på prehospital och interhospital transport av patienter med ortopediskt trauma (NAEMSP Prehospital Trauma Guidelines 2024; TCCC Handbook).

---

## Grundprinciper för Säker Transport

### "Do No Further Harm"

Transport ska aldrig förvärra patientens tillstånd. Grundläggande principer:

1. **Stabilisera INNAN transport**
   - ABCDE-bedömning och åtgärd
   - Blödningskontroll
   - Frakturimmobilisering

2. **Kontinuerlig monitorering UNDER transport**
   - Vitalparametrar
   - Neurovaskulär status distalt om frakturer
   - Medvetandegrad

3. **Förvarning TILL mottagande enhet**
   - Strukturerad rapport (MIST)
   - Estimerad ankomsttid
   - Resursbehov (blod, operation, intensivvård)

### Tidskritiska vs. Transportstabila Patienter

| Tillstånd | Prioritet | Transport |
|-----------|-----------|-----------|
| Livshotande blödning | Omedelbar | "Load and go" |
| Kärlskada med ischemi | Hög | Snabb transport, < 6 h till revaskularisering |
| Kompartmentsyndrom | Hög | Akut transport, fasciotomi inom 1-2 h |
| Öppen fraktur | Hög | Antibiotika start, transport inom timmar |
| Sluten fraktur | Standardprioritering | Efter stabilisering |

---

## Immobilisering

### Spinal Motion Restriction (SMR) – Modern Approach

> "Spinal motion restriction is now preferred over rigid immobilization due to evidence of harm from backboards" (NAEMSP 2024; PLOS One 2024)

**2024 års riktlinjer:**
- Semi-rigida kragrar har **tagits bort** från prehospital immobilisering i flera protokoll
- Vakuummadrass och bårimmobilisering föredras framför hård bräda
- **Self-extrication** rekommenderas för vakenmedverka patienter utan neurologiska bortfall

**Penetrerande trauma:**
> "Spine immobilization in penetrating trauma is associated with increased mortality" (EAST Guidelines 2018)

- Spinal immobilisering ska **INTE** utföras rutinmässigt vid penetrerande trauma

### NEXUS-Kriterier för Cervikalrygg

Cervikalkotkrage kan utelämnas om ALLA kriterier uppfylls:
- Ingen midline-palpationsömhet
- Ingen fokal neurologisk deficit
- Normal vakenhet
- Ingen intoxikation
- Ingen smärtsam distraherande skada

**OBS:** Äldre och sköra patienter har ökad risk för kotskador och kräver lägre tröskel för immobilisering (NAEMSP 2024).

### Extremitetsimmobilisering

**Grundprincip:** Immobilisera **en led ovan och en led nedan** frakturen.

| Region | Immobiliseringsmetod | Viktig detalj |
|--------|----------------------|---------------|
| Humerus | SAM-splint/vakuumskena | Kontrollera radialispuls |
| Underarm | Gipsskena/vakuumskena | Neutralläge handled |
| Femur | Traktion (Donway/Hare/Thomas) | 10% av kroppsvikt traktion |
| Tibia | Vakuumskena/gipsskena | Kontrollera dorsalis pedis |
| Fotled | Gipsskena U-form | Neutralläge |

### Bäckenimmobilisering

Vid misstänkt bäckenfraktur:
1. **Applicera bäckenbälte/T-POD** vid trokanternivå
2. Undvik upprepade rotationstest av bäckenet
3. Benen kan bindas ihop vid fotlederna för ytterligare stabilitet

**Kontraindikation för knäböjning:** Isolerad symfysruptur utan vertikal instabilitet.

### Praktiska Tips

- **Kontrollera neurovaskulär status före och efter** varje manipulation
- Dokumentera fynd
- Lossa omedelbart om distala pulsar försvagas
- Kylskada: Ta bort klockor/ringar distalt

---

## MIST-rapport – Strukturerad Överrapportering

MIST är den internationella standarden för prehospital traumarapportering:

### M – Mechanism (Skademekanism)

| Mekanism | Viktig information |
|----------|-------------------|
| Trafikolycka | Hastighet, bältesanvändning, airbag, intrångsskador, utdragstid |
| Fall | Höjd, landningsyta, landningsposition |
| Penetrerande | Vapentyp, skottavstånd, antal skador |
| Krossning | Komprimerad del, kompressionstid |

### I – Injuries (Skador)

Systematisk genomgång uppifrån och ned:
- Huvud/hals
- Thorax
- Buk
- Bäcken
- Extremiteter
- Rygg (om undersökt)

### S – Signs (Vitalparametrar/Tecken)

| Parameter | Normalt | Avvikande |
|-----------|---------|-----------|
| Medvetande | GCS 15 | Ange GCS |
| Andning | 12-20/min | Frekvens, symmetri |
| Cirkulation | Puls 60-100, BT > 90 sys | Anges exakt |
| Temperatur | 36-38°C | Om avvikande |

### T – Treatment (Given Behandling)

All behandling med **tidpunkt**:
- Tourniquet: applicerat kl. XX:XX
- Antibiotika: typ och dos
- Vätskor: volym och typ
- Analgesi
- Immobilisering

---

## Interhospital Transport – Indikationer

### Traumacenterkriterier

Patienter som bör transporteras till traumacenter/regionsjukhus:

**Fysiologiska kriterier:**
- GCS < 14
- Systoliskt BT < 90 mmHg
- Andningsfrekvens < 10 eller > 29/min

**Anatomiska kriterier:**
- Penetrerande skada huvud, hals, bål, extremiteter proximalt om knä/armbåge
- Bröstkorgsinstabilitet
- ≥ 2 proximala långa rörbensfrakturer
- Amputerad extremitet
- Bäckenfraktur
- Öppen eller nedtryckt skallfraktur
- Ryggmärgsskada (neurologi)

**Ortopediska kriterier för specialistcentrum:**
- Kärlskada krävande vaskulärkirurg
- Öppen fraktur Gustilo IIIB/IIIC
- Replantationsmöjlighet (amputation)
- Komplex bäckenkirurgi
- Multitrauma med DCO-behov

### Transportmedel

| Avstånd/Tid | Föredraget | Kommentar |
|-------------|------------|-----------|
| < 30 min | Ambulans | Snabbast totalt |
| 30-60 min | Helikopter (om tillgänglig) | Väderberode |
| > 60 min | Helikopter | Tidsvinst signifikant |
| Instabil patient | Snabbaste tillgängliga | "Load and go" |

---

## Dokumentation Under Transport

### Obligatoriska Uppgifter

- Patientidentitet (om känd)
- Skadetyp och tidpunkt
- Alla vitalparametrar med klockslag
- Alla åtgärder med klockslag
- Läkemedel (typ, dos, tidpunkt)
- Neurovaskulär status före/efter immobilisering
- MIST-rapport given till mottagare

### Fotografisk Dokumentation

Mobilfoto kan användas för:
- Deformiteter före reponering
- Öppna sår (före täckning)
- Skademekanismen (fordon, fallhöjd)
- Sårlokalisation

---

## Fallgropar och Komplikationer

### Vanliga Misstag

| Problem | Konsekvens | Prevention |
|---------|------------|------------|
| Utebliven pulskonroll efter skening | Ischemi | Dokumentera före/efter |
| För stram immobilisering | Nervskada, tryckskada | Kontrollera sensation |
| Felplacerat bäckenbälte | Ineffektivt | Trokanternivå |
| Försenad transport vid kärlskada | Amputation | Direkttransport |

### Hypotermi

Traumapatienter kyls snabbt vid exponering:
- **Passiv uppvärmning**: Ta bort våta kläder, täck med filtar
- **Aktiv uppvärmning**: Värmetäcke, uppvärmda vätskor
- **Mål**: Temperatur > 35°C

---

## Sammanfattning – Nyckelbudskap

1. **Stabilisera före transport** – ABCDE + frakturimmobilisering
2. **SMR istället för rigid immobilisering** – vakuummadrass föredras
3. **NEXUS-kriterier** kan användas för att undvika onödig halskrage
4. **MIST-rapport** vid all överrapportering
5. **Neurovaskulär kontroll före och efter** all manipulation
6. **Traumacenteröverföring** vid kärlskada, öppen fraktur III, amputat
7. **Dokumentera ALLT** – tidpunkter är kritiska

## Referenser

- NAEMSP Prehospital Trauma Compendium: Spinal Cord Injuries. Prehospital Emergency Care 2025
- EAST Guidelines: Prehospital Spine Immobilization/SMR in Penetrating Trauma. J Trauma 2018
- Cervical spine immobilisation following blunt trauma: A systematic review. PLOS One 2024
- TCCC Handbook Version 5. Dept of Defense 2017 (updated 2023)
- Maryland EMS Protocols 2024: Spinal Motion Restriction
- ACS Committee on Trauma: Resources for Optimal Care of the Injured Patient. 2022
`,
    15: `# Dokumentation och juridik

God dokumentation är avgörande för patientsäkerhet, kvalitetsarbete och juridiskt skydd. Inom ortopedisk traumavård finns särskilda krav på tidsstämpling, neurovaskulär status och bilddiagnostik. Detta kapitel behandlar svensk lagstiftning, dokumentationskrav och kvalitetsregister (Hälso- och sjukvårdslagen; Patientdatalagen; SOSFS).

---

## Juridisk Ram i Sverige

### Relevanta Lagar

| Lag | Innehåll |
|-----|----------|
| **Hälso- och sjukvårdslagen (HSL)** | Krav på god vård, patientens behov i centrum |
| **Patientdatalagen (PDL)** | Journalföringsplikt, sekretess |
| **Patientlagen** | Informerat samtycke, delaktighet |
| **Patientsäkerhetslagen** | Vårdgivarens ansvar, anmälningsplikt |

### Legitimerad Personal

Dokumentationsskyldighet gäller ALL legitimerad personal:
- Läkare
- Sjuksköterskor
- Fysioterapeuter
- Arbetsterapeuter
- Röntgensjuksköterskor

---

## Dokumentationskrav vid Ortopediskt Trauma

### Grundläggande Krav

Varje journalanteckning ska innehålla:
- **Datum och klockslag**
- **Signatur** (namn + funktion)
- **Patientidentitet** (personnummer eller tillfälligt ID)
- **Sökordsord** (konsultationsorsak)

### Specifika Krav vid Trauma

| Dokumentationsområde | Innehåll |
|----------------------|----------|
| **Skademekanism** | Vem, vad, när, var, hur (M i MIST) |
| **Tidpunkter** | Skada → ankomst → undersökning → åtgärd |
| **Fynd** | Systematisk LIMB-dokumentation |
| **Neurovaskulär status** | ALLTID före och efter manipulation |
| **Beslut och plan** | Indikation, prioritering, planerad åtgärd |

### Tidsstämpling – Kritiskt Vid Trauma

> "Times matter in trauma" – dokumentera klockslag för:

| Händelse | Exempel |
|----------|---------|
| Skadetidpunkt | 14:23 (om känd) |
| Ankomst akutmottagning | 15:02 |
| Första läkarbedömning | 15:15 |
| Tourniquet-applikation | 14:35 (prehospitalt) |
| Antibiotikados | 15:20 |
| Operationsstart | 16:45 |
| Fasciotomi | 17:10 |

### LIMB-Dokumentation

Standardiserat sätt att dokumentera extremitetsundersökning:

\`\`\`
Höger underben:
L – Svullnad anterolateralt, hudspricka 3 cm öppet sår medialt
I – Dorsalis pedis palpabel, kapillär refill 2 sek, tibialis posterior svag
M – Smärta vid passiv dorsalflexion av tår, aktiv rörlighet nedsatt
B – Palpabel felställning tibiaskaftet, krepitationer
\`\`\`

---

## Fotografisk Dokumentation

### Indikationer

- Öppna frakturer (före täckning av sår)
- Hudskador (skrubbsår, blåmärken)
- Felställningar före reponering
- Kliniskt viktiga fynd (kompartment, perfusion)

### Riktlinjer för Medicinsk Fotografi

1. **Patient-ID på bilden** (eller kopplad till journal)
2. **Måttstock/referens** om möjligt
3. **Standardiserade vinklar** (anteroposterior, lateral)
4. **Tidsstämpel**
5. **Sparas i journalen**, inte på privat telefon

### Bildrätt och Samtycke

- Samtycke krävs vid icke-akut fotografi
- Vid akut handläggning: dokumentera att foto togs utan samtycke p.g.a. medvetslöshet
- Bilder är journalhandlingar = sekretess gäller

---

## Informerat Samtycke

### Grundprincip

> "Vård får ges endast om patienten samtycker till det" (Patientlagen 4 kap 2§)

### Krav för Giltigt Samtycke

1. **Information** om:
   - Diagnos
   - Föreslagna behandlingar
   - Alternativa behandlingar
   - Risker och komplikationer
   - Förväntad prognos

2. **Förståelse** – anpassad information

3. **Frivillighet** – ingen press

4. **Kompetens** – patient kan fatta beslut

### Dokumentation av Samtycke

Skriv i journalen:
- "Patienten informerad om diagnos [X], behandling [Y] med risker [Z]. Patienten samtycker till behandling."
- Alternativt: standardiserat samtyckesformulär (för större ingrepp)

### Nödsituationer – Nödrätt

Vid livs- eller extremitetshotande tillstånd där samtycke ej kan inhämtas:

> "Presumerat samtycke gäller – de flesta hade samtyckt till livräddande behandling"

**Dokumentera:**
- "Patienten medvetslös/förvirrad, samtycke kunde ej inhämtas"
- "Akut operation utförd p.g.a. livshotande blödning enligt nödrätt"

### Underåriga (< 18 år)

- Vårdnadshavare samtycker normalt
- Barn med tillräcklig mognad kan samtycka själva
- Vid akut fara: behandla först, samtycke senare

---

## Sekretess och Informationsdelning

### Huvudregel

Sekretess gäller för uppgifter om enskildas hälsotillstånd och personliga förhållanden inom hälso- och sjukvården.

### Undantag – När Information FÅR Lämnas

| Mottagare | Krav |
|-----------|------|
| Annan vårdgivare | Patients samtycke ELLER nödvändigt för vården |
| Anhöriga | Patients samtycke ELLER presumerat samtycke vid medvetslöshet |
| Polis | Endast vid misstanke om brott med fängelse > 1 år |
| Försäkringsbolag | ALLTID patients skriftliga medgivande |

### Sammanhållen Journalföring

I Region [X] kan vårdgivare ta del av varandras journaler om:
- Det finns vårdrelation
- Patienten inte har spärrat informationen

---

## Kvalitetsregister

### Svenska Traumaregistret (SweTrau)

**Syfte:** Registrera alla svårt skadade patienter för kvalitetsuppföljning

**Inklusionskriterier:**
- Traumalarm eller motsvarande
- ISS > 9
- IVA-vård > 24 timmar
- Död inom 30 dagar

**Registrerade variabler:**
- Skademekanism och tid
- Vitalparametrar vid ankomst
- Skador (AIS-kodning)
- Åtgärder med tider
- Utfall (mortalitet, vårdtid)

### Svenska Frakturregistret (SFR)

Registrerar frakturer behandlade vid svenska sjukhus:
- Frakturtyp och klassifikation
- Behandlingsmetod
- Komplikationer
- Patient-rapporterade utfall (PROM)

### Rikshöft

Registrerar höftfrakturer och höftprotesoperationer:
- Väntetid till operation
- Operationsmetod
- Komplikationer
- Reoperationer

---

## Avvikelserapportering

### Lex Maria

Skyldighet att anmäla till IVO (Inspektionen för Vård och Omsorg) vid:
- Allvarlig vårdskada
- Risk för allvarlig vårdskada
- Händelser som medfört eller kunde medfört allvarlig vårdskada

**Exempel inom ortopedisk trauma:**
- Försenad diagnos av kompartmentsyndrom ledande till amputation
- Felaktig tourniquet-applicering orsakande nervskada
- Utebliven antibiotikaprofylax vid öppen fraktur ledande till osteomyelit

### Intern Avvikelserapportering

Alla avvikelser ska rapporteras internt oavsett allvarlighetsgrad:
- Patientnära avvikelser
- "Near misses" (nära-händelser)
- Systemfel

---

## Medico-legala Överväganden

### Vanliga Dokumentationsbrister

| Brist | Risk |
|-------|------|
| Utebliven tidsdokumentation | Svårt bevisa adekvat handläggning |
| Saknad neurovaskulär status | Omöjligt avgöra om skada fanns före behandling |
| Oklart samtycke | Juridisk sårbarhet |
| Bristande uppföljningsdokumentation | Ansvarsfråga vid sen komplikation |

### "Om det inte är dokumenterat, hände det inte"

I rättslig prövning gäller journalen som bevis. Odokumenterade åtgärder betraktas som icke utförda.

---

## Sammanfattning – Nyckelbudskap

1. **Tidsstämpla** alla händelser och åtgärder
2. **Dokumentera neurovaskulär status** före och efter varje manipulation
3. **Fotografera** öppna sår och deformiteter
4. **Inhämta samtycke** – eller dokumentera varför det inte kunde inhämtas
5. **Rapportera avvikelser** – både allvarliga och "near misses"
6. **Registrera i SweTrau** vid svår skada

## Praktisk Checklista

✓ Skadetidpunkt dokumenterad?
✓ Ankomsttid dokumenterad?
✓ LIMB-status dokumenterad?
✓ Neurovaskulär status före/efter intervention?
✓ Tidpunkt för antibiotika (öppen fraktur)?
✓ Tidpunkt för tourniquet?
✓ Samtycke dokumenterat (eller nödrätt)?
✓ Foto av öppet sår?

## Referenser

- Hälso- och sjukvårdslagen (2017:30)
- Patientdatalagen (2008:355)
- Patientlagen (2014:821)
- Patientsäkerhetslagen (2010:659)
- SOSFS 2008:14 (Informationshantering och journalföring)
- Svenska Traumaregistret (SweTrau): www.swetrau.se
- Svenska Frakturregistret: www.sfr.registercentrum.se
`,
    16: `# Teamarbete och kommunikation

Effektivt teamarbete är avgörande för patientutfall vid trauma. Kommunikationsbrister är en av de vanligaste orsakerna till vårdskador. Detta kapitel beskriver evidensbaserade strategier för teamkommunikation baserade på TeamSTEPPS®, CRM och traumateamprinciper (AHRQ TeamSTEPPS® 2024; Salas E et al. Qual Saf Health Care 2005).

---

## Traumateamets Struktur

### Grundläggande Roller

| Roll | Ansvar | Position |
|------|--------|----------|
| **Teamledare** | Överblick, beslut, prioritering | Fotändan av båren |
| **Airway** | Luftväg, intubation, ventilation | Huvudändan |
| **Cirkulation 1** | IV-access, blodprover, vätskor | Höger sida |
| **Cirkulation 2** | Blodtryck, EKG, monitorering | Vänster sida |
| **Ortopedi** | Extremitetsbedömning, LIMB | Bredvid patienten |
| **Dokumentatör** | Tidpunkter, åtgärder, protokoll | Ej patientnära |

### Teamledarens Uppgifter

> "The trauma team leader should maintain an overview and NOT perform procedures" (ATLS 11th Ed.)

**Före ankomst:**
- Aktivera team baserat på förhandsinformation
- Tilldela roller
- Säkerställ utrustningsberedskap

**Under omhändertagande:**
- Övervaka ABCDE-progression
- Fatta behandlingsbeslut
- Prioritera åtgärder
- Samordna konsulter

**Efter stabilisering:**
- Summera handläggning
- Besluta om disposition
- Leda debriefing

---

## Kommunikationsverktyg

### SBAR – Strukturerad Kommunikation

> "SBAR provides a vehicle for individuals to speak up and express concern in a concise manner" (AHRQ TeamSTEPPS® 2024)

| Bokstav | Betydelse | Exempel (trauma) |
|---------|-----------|------------------|
| **S** – Situation | Vad händer just nu? | "45-årig man från trafikolycka, GCS 14, hypotensiv" |
| **B** – Background | Relevant bakgrund | "Var bilförare, 80 km/h frontalkolission, ej bälte" |
| **A** – Assessment | Min bedömning | "Misstänkt bäckeninstabilitet, troligen blödning" |
| **R** – Recommendation | Vad behövs? | "Behöver bäckenbälte, blod på standby, CT-beredskap" |

**Varianter:**
- **ISBAR**: Identitet tillagd först
- **SBARA**: Action/Åtgärd tillagd sist

### Call-outs – Högt och Tydligt

Vid kritisk information:
- **Säg högt till hela teamet**
- "Blodtryck 70 systoliskt!"
- "Tourniquet applicerat kl 15:23!"
- "Puls 130!"

### Check-backs – Bekräftelse

> "Check-backs ensure that information conveyed by the sender is understood by the receiver as intended" (TeamSTEPPS®)

**Struktur:**
1. **Sändare**: "Ge 2 gram TXA IV"
2. **Mottagare**: "2 gram TXA IV, bekräftat"
3. **Utförande**: Ger läkemedlet
4. **Återrapportering**: "TXA 2 gram givet kl 15:25"

### Closed-Loop Kommunikation

\`\`\`
TEAMLEDARE: "Anna, ge cefuroxim 1.5 gram IV"
           ↓
ANNA: "Bekräftat, cefuroxim 1.5 gram IV"
           ↓
       [Ger antibiotika]
           ↓
ANNA: "Cefuroxim 1.5 gram givet klockan 15:32"
           ↓
DOKUMENTATÖR: "Noterat, cefuroxim 15:32"
\`\`\`

---

## TeamSTEPPS® – Evidensbaserat Ramverk

TeamSTEPPS® (Team Strategies and Tools to Enhance Performance and Patient Safety) är AHRQ:s evidensbaserade program för teamträning.

### Kärnkompetenser

| Kompetens | Beskrivning | Verktyg |
|-----------|-------------|---------|
| **Teamstruktur** | Definierade roller och ansvar | Traumateamslista |
| **Kommunikation** | Klar, koncis, strukturerad | SBAR, call-outs, check-backs |
| **Ledarskap** | Koordinering, beslut | Briefing, huddle, debriefing |
| **Situationsmedvetenhet** | Shared mental model | Crossmonitoring, STEP |
| **Ömsesidigt stöd** | Hjälpa och rätta varandra | CUS, Two-Challenge Rule |

### CUS – Säga Ifrån

När du är orolig:
- **C** – "I am **Concerned**"
- **U** – "I am **Uncomfortable**"
- **S** – "This is a **Safety** issue"

**Exempel:**
"Jag är bekymrad – patientens ben är vitare nu. Jag tror det är ett cirkulationsproblem."

### Two-Challenge Rule

Om din första oro inte blir hörd:
1. **Första utmaningen**: Uttryck oro
2. **Andra utmaningen**: Om ignorerad, säg igen tydligare
3. **Eskalera**: Om fortfarande ignorerad, gå till högre nivå

> "Stop the line mentality – anyone can stop the procedure if safety is at risk"

---

## Crisis Resource Management (CRM)

### Ursprung

CRM utvecklades inom flygindustrin efter olyckor orsakade av mänskliga faktorer. Principerna är nu standard inom akutsjukvård.

### Nyckelprinciper

| Princip | Tillämpning i trauma |
|---------|----------------------|
| **Know the environment** | Bekanta dig med akutrummet, utrustning |
| **Anticipate and plan** | Förbered för förväntade komplikationer |
| **Call for help early** | Larma specialister tidigt, inte för sent |
| **Exercise leadership** | Tydlig teamledare, delegera uppgifter |
| **Distribute workload** | Fördela arbete jämnt |
| **Mobilize all resources** | Använd alla tillgängliga resurser |
| **Communicate effectively** | SBAR, closed-loop |
| **Use cognitive aids** | Checklistor, algoritmer |
| **Re-evaluate repeatedly** | Loop back – stämmer planen? |
| **Use good teamwork** | Ömsesidig respekt, stöd |

### Fixeringsfel – Tunnel Vision

**Risk:** Fokusera på en skada och missa andra

**Prevention:**
- Systematisk ABCDE-loop
- Teamledaren håller överblick
- "Step back" och omvärdera

---

## Briefing, Huddle, Debriefing

### Briefing – Före Ankomst

**Syfte:** Förbereda teamet

**Innehåll:**
- Förhandsinformation (MIST från ambulans)
- Rollfördelning
- Förväntade åtgärder
- Potentiella problem

**Exempel:**
"Vi får en 25-årig kvinna, mc-olycka, misstänkt öppen underbenfraktur och bäckensmärta. Maria tar airway, Johan cirkulation, jag är teamledare. Bäckenbälte och blod på standby. Frågor?"

### Huddle – Under Resuscitering

**Syfte:** Kort avstämning mitt i handläggningen

**Tidpunkt:** Vid statusförändring eller osäkerhet

**Exempel:**
"Stopp! Var är vi? Airway – ok. Cirkulation – BT nu 85 trots 2 liter. Nästa steg – massiv transfusion aktiveras. Frågor?"

### Debriefing – Efter Avslut

> "Debriefing improves team performance by 25%" (Tannenbaum & Cerasoli 2013)

**Struktur:**

| Fas | Frågor |
|-----|--------|
| **Vad hände?** | Kort summering av fallet |
| **Vad gick bra?** | Positiv feedback |
| **Vad kan förbättras?** | Konstruktiv kritik |
| **Handlingsplan** | Konkreta förbättringsåtgärder |

**Regler:**
- Alla deltar
- Ingen skuld – fokus på system
- Kort (5-10 minuter)
- Dokumentera lärdomar

---

## Handoff – Säker Överrapportering

### Situationer för Handoff

- Ambulans → Akutmottagning
- Akutmottagning → Operation
- Operation → IVA
- IVA → Vårdavdelning

### I-PASS Framework

| Bokstav | Betydelse | Innehåll |
|---------|-----------|----------|
| **I** | Illness severity | Stabil/instabil/kritisk |
| **P** | Patient summary | Kort sammanfattning |
| **A** | Action list | Pågående/planerade åtgärder |
| **S** | Situational awareness | Vad kan hända/förändras? |
| **S** | Synthesis by receiver | Mottagaren sammanfattar |

### Vanliga Handoff-Fel

| Fel | Konsekvens | Prevention |
|----|------------|------------|
| Avbruten rapport | Missad information | Ostörd miljö |
| Muntlig utan skriftlig | Glömda detaljer | Dokumentation + muntlig |
| Ensidig rapport | Missförstånd | Check-back |
| Utelämnad plan | Oklart ansvar | Explicit handlingsplan |

---

## Mänskliga Faktorer

### Stress och Prestation

> "Performance under stress follows an inverted U-curve – moderate stress optimizes performance, excessive stress impairs it" (Yerkes-Dodson Law)

**Tecken på överväldigande stress:**
- Tunnelseende
- Försvårad kommunikation
- Impulsiva beslut
- Stelhet/frysning

### Fatigue och Trauma

Trötthet påverkar:
- Beslutsfattande
- Kommunikation
- Situationsmedvetenhet
- Tekniska färdigheter

**Prevention:**
- Schemaläggning för vila
- Uppmuntra till att säga ifrån
- Stöd vid trötthetsrelaterade fel

---

## Sammanfattning – Nyckelbudskap

1. **Tydlig teamledare** som INTE utför procedurer
2. **SBAR** för all strukturerad kommunikation
3. **Closed-loop** med check-backs
4. **CUS** – våga säga ifrån vid säkerhetsoro
5. **Briefing** före, **huddle** under, **debriefing** efter
6. **Systematisk handoff** med I-PASS eller liknande

## Träning

Regelbunden teamträning förbättrar utfall:
- In-situ simulering
- Scenariobaserade övningar
- Video-debriefing
- Multidisciplinär träning

## Referenser

- AHRQ TeamSTEPPS® 2.0 Curriculum. https://www.ahrq.gov/teamstepps
- AHA TeamSTEPPS Pocket Guide 2024
- Salas E et al. Marking the Unmarkable: Development of a Taxonomy of CRM Skills. Qual Saf Health Care 2005
- Tannenbaum SI, Cerasoli CP. Do team and individual debriefs enhance performance? Human Factors 2013;55:231-45
- ATLS 11th Edition: Team Leadership in Trauma
- Incorporating TeamSTEPPS training in emergency and trauma center. Int Emerg Nurs 2021;54:100941
`,
    17: `# Examination och certifiering

ORTAC-certifieringen säkerställer att vårdpersonal har kunskapen och färdigheterna att hantera tidskritiskt ortopediskt trauma. Examinationen kombinerar teoretisk kunskap (MCQ) med praktiska färdigheter (OSCE) enligt etablerade pedagogiska principer (Miller GE. Academic Medicine 1990; LIPUS examinationsriktlinjer).

---

## Millers Pyramid – Teoretisk Grund

Examinationen baseras på Millers klassiska pyramidmodell för klinisk kompetens:

\`\`\`
           /\\
          /  \\
         / DOES \\      ← Arbetsplatsbedömning
        /--------\\
       / SHOWS HOW \\   ← OSCE
      /--------------\\
     /  KNOWS HOW  \\   ← Tillämpad MCQ
    /------------------\\
   /      KNOWS       \\  ← Faktakunskap
  /----------------------\\
\`\`\`

| Nivå | Beskrivning | Examinationsmetod |
|------|-------------|-------------------|
| **Knows** | Faktakunskap | Kunskaps-MCQ |
| **Knows how** | Tillämpad kunskap | Scenario-MCQ |
| **Shows how** | Demonstrerad kompetens | OSCE |
| **Does** | Verklig prestation | Arbetsplatsbedömning |

---

## Teoretisk Examination (MCQ)

### Format

| Parameter | Specifikation |
|-----------|---------------|
| Antal frågor | 60 |
| Tid | 60 minuter |
| Godkänt | ≥ 70% (42 rätt) |
| Frågetyp | Single best answer (SBA) |

### Blooms Taxonomi – Frågenivåer

Frågorna kategoriseras enligt Blooms taxonomi för kognitiva nivåer:

| Nivå | Andel | Exempel |
|------|-------|---------|
| **Knowledge** (1) | 20% | "Vad står LIMB för?" |
| **Comprehension** (2) | 25% | "Vad indikerar ABI < 0.9?" |
| **Application** (3) | 35% | "Patient med... Vad gör du?" |
| **Analysis** (4) | 15% | "Vilken diagnos passar bäst?" |
| **Synthesis/Evaluation** (5-6) | 5% | Komplexa prioriteringsbeslut |

### Ämnesfördelning

| Ämne | Andel | Antal frågor |
|------|-------|--------------|
| Massiv blödning & tourniquet | 15% | 9 |
| Kärlskador & ischemi | 15% | 9 |
| Kompartmentsyndrom | 15% | 9 |
| Öppna frakturer | 15% | 9 |
| Bäckenskador | 10% | 6 |
| DCO & prioritering | 10% | 6 |
| Speciella populationer | 5% | 3 |
| Transport & dokumentation | 5% | 3 |
| Teamarbete & kommunikation | 5% | 3 |
| Barn/speciella situationer | 5% | 3 |

### Förberedelsestrategi

**Rekommenderad studieplan:**

1. **Vecka 1-2**: Läs alla kapitel systematiskt
2. **Vecka 3**: Gör övningsquiz, identifiera kunskapsluckor
3. **Vecka 4**: Repetition av svaga områden
4. **Löpande**: Använd spaced repetition (digitala flashcards)

**Studie-tips:**
- Fokusera på **tidsgränser** (6h ischemi, 1h antibiotika, etc.)
- Lär dig **klassifikationer** (Gustilo, Rutherford, Pape)
- Öva **prioriteringsfrågor** – dessa är ofta svårast

---

## Praktisk Examination (OSCE)

### Format

**OSCE** = Objective Structured Clinical Examination

| Parameter | Specifikation |
|-----------|---------------|
| Antal stationer | 6 |
| Tid per station | 7-10 minuter |
| Total tid | ~60 minuter |
| Godkänt | Alla stationer godkända |

### Stationer

#### Station 1: Tourniquet-applikation

**Scenario:** Patient med massiv extremitetsblödning

**Bedömningskriterier:**
- [ ] Identifierar indikation för tourniquet
- [ ] Väljer korrekt placering (5-7 cm proximalt)
- [ ] Applicerar med korrekt spänning
- [ ] Dokumenterar tidpunkt
- [ ] Överväger second tourniquet vid behov
- [ ] Adekvat säkerhetsåtgärd/fixering

**Kritiska fel (automatiskt underkänt):**
- Placerar tourniquet över led
- Placerar tourniquet direkt på sår
- Glömmer dokumentera tid

#### Station 2: ABI-mätning

**Scenario:** Patient med misstänkt kärlskada

**Bedömningskriterier:**
- [ ] Förbereder utrustning korrekt (doppler, manschett)
- [ ] Mäter systoliskt armtryck korrekt
- [ ] Lokaliserar dorsalis pedis/tibialis posterior
- [ ] Mäter systoliskt ankeltryck korrekt
- [ ] Beräknar ABI korrekt
- [ ] Tolkar resultat (< 0.9 = misstänkt kärlskada)

**Kritiska fel:**
- Felaktig beräkning (ankel delat på arm)
- Feltolkning av resultat

#### Station 3: Bäckenbälte

**Scenario:** Patient med misstänkt bäckeninstabilitet

**Bedömningskriterier:**
- [ ] Identifierar indikation
- [ ] Minimerar bäckenmanipulation
- [ ] Placerar bältet på korrekt nivå (trokanter)
- [ ] Spänner adekvat (inte för hårt/löst)
- [ ] Kontrollerar distal cirkulation efter
- [ ] Kommunicerar med patient/team

**Kritiska fel:**
- Upprepad bäckenmanipulation
- Felplacering (för högt/lågt)

#### Station 4: Kompartment-bedömning

**Scenario:** Patient med underbensfraktur och tilltagande smärta

**Bedömningskriterier:**
- [ ] Anamnes: smärtkaraktär, progress
- [ ] Passiv töjning av muskulatur
- [ ] Palpation av kompartment (spändhet)
- [ ] Distal neurologi (sensation)
- [ ] Distal cirkulation (kapillär refill, pulsar)
- [ ] Korrekt handläggningsbeslut

**Kritiska fel:**
- Missar indikation för fasciotomi
- Fördröjer diagnos vid klassisk presentation

#### Station 5: LIMB-bedömning

**Scenario:** Dokumentera fullständig extremitetsstatus

**Bedömningskriterier:**
- [ ] **L – Look**: Systematisk inspektion (sår, deformitet, svullnad, färg)
- [ ] **I – Ischemia**: Pulsar, kapillär refill, temperatur
- [ ] **M – Movement**: Aktiv/passiv rörlighet, smärta vid passiv töjning
- [ ] **B – Bones & soft tissue**: Palpation, stabilitet
- [ ] Korrekt dokumentation
- [ ] Identifierar fynd krävande åtgärd

**Kritiska fel:**
- Ofullständig undersökning
- Missar öppet sår/kärlskada

#### Station 6: SBAR-kommunikation

**Scenario:** Överrapportera traumapatient till nästa vårdnivå

**Bedömningskriterier:**
- [ ] **S** – Situation: Klar presentation av akut problem
- [ ] **B** – Background: Relevant anamnes och mekanism
- [ ] **A** – Assessment: Egen bedömning av prioritet/diagnos
- [ ] **R** – Recommendation: Tydlig plan och förväntningar
- [ ] Strukturerad presentation
- [ ] Besvarar frågor adekvat

**Kritiska fel:**
- Utelämnar kritisk information
- Felaktig prioritering

---

## Bedömningsprinciper

### Checklista vs. Global Rating Scale

OSCE-stationer använder **kombinerad bedömning**:

1. **Checklista**: Specifika handlingar utförda/ej utförda
2. **Global Rating Scale**: Övergripande kompetensintryck (1-5)

| Betyg | Beskrivning |
|-------|-------------|
| 1 | Klart underkänd – allvarliga brister |
| 2 | Gränsfall – flera brister |
| 3 | Godkänd – uppfyller minimikrav |
| 4 | Över förväntan – god kompetens |
| 5 | Exceptionell – expertliknande |

### Standard Setting

Gränsen för godkänt fastställs med **Modified Angoff-metod**:
- Expertpanel bedömer "minsta godtagbara kandidat"
- Statistisk validering efter genomförande

---

## Certifiering

### Krav för ORTAC-certifikat

| Krav | Specifikation |
|------|---------------|
| MCQ-prov | ≥ 70% rätt |
| OSCE | Alla stationer godkända |
| LIPUS-utvärdering | Genomförd |
| Närvaro | 100% av kursmoment |

### Giltighetstid och Recertifiering

| Parameter | Detaljer |
|-----------|----------|
| Giltighetstid | 4 år |
| Recertifiering | Uppdateringskurs + förkortad examination |
| Förlängning vid förhinder | Ansökan till kursadministration |

### LIPUS-Certifiering

ORTAC är LIPUS-certifierad (Läkarnas Institut för Professionell Utveckling i Sjukvården):

- **Dokumenterad kvalitet** enligt nationella kriterier
- **CME-poäng** registreras automatiskt
- **Nationell erkännande** av certifikatet

---

## Förberedelse – Praktisk Träning

### Tourniquet-träning

**Utrustning:** CAT, SOFTT-W, eller liknande godkänd tourniquet

**Övningar:**
1. Applicera på egen arm (inom 30 sekunder)
2. Applicera på träningsdocka
3. Applicera under stress (tidsbegränsning)

### ABI-träning

**Utrustning:** Handhållen doppler, blodtrycksmanschett

**Övningar:**
1. Öva på dig själv eller kollega
2. Hitta dorsalis pedis och tibialis posterior
3. Öva beräkning och tolkning

### Kommunikationsträning

**Metod:** Parövning med scenariokort

**Övningar:**
1. SBAR-rapporter (3 minuter per scenario)
2. Closed-loop kommunikation
3. CUS-träning ("säga ifrån")

---

## Misslyckad Examination

### Vid underkänt MCQ

- Möjlighet till **omtentering** inom 3 månader
- Maximal 2 omtenteringar
- Vid tredje underkänt: repetera hela kursen

### Vid underkänt OSCE

- Möjlighet till **omprov på underkända stationer**
- Rekommenderad praktisk träning innan omprov
- Vid upprepat underkänt: handledarledd träning obligatorisk

---

## Sammanfattning – Examinationstips

### MCQ
1. Läs frågan **noggrant** – vad frågas egentligen?
2. **Eliminera** uppenbart felaktiga alternativ
3. Tidsgränser och klassifikationer – lär utantill
4. "Single best answer" – välj **bästa** alternativet, inte perfekt

### OSCE
1. **Kommunicera högt** – examinatorn behöver höra ditt resonemang
2. **Strukturera** – LIMB, SBAR, etc.
3. **Glöm inte säkerhet** – handsprit, handskar om relevant
4. **Be om förtydligande** om scenariot är oklart
5. **Avsluta med sammanfattning** – visar professionalism

## Referenser

- Miller GE. The assessment of clinical skills/competence/performance. Academic Medicine 1990;65(9):S63-S67
- LIPUS Examinationsriktlinjer: www.lipus.se
- Khan KZ et al. The Objective Structured Clinical Examination (OSCE): AMEE Guide No. 81. Med Teach 2013;35:e1437-46
- Bloom BS. Taxonomy of Educational Objectives. 1956
- ATLS 11th Edition: Course Assessment Methods
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
      question: 'Vilka är de fyra tidskritiska ortopediska tillstånden som ORTAC fokuserar på?',
      options: [
        { text: 'Massiv blödning, kärlskador, kompartmentsyndrom, öppna frakturer', correct: true },
        { text: 'Frakturer, luxationer, ligamentskador, senskador', correct: false },
        { text: 'Ryggmärgsskador, skalltrauma, thoraxskador, buktrauma', correct: false },
        { text: 'Brännskador, köldskador, etsningsskador, tryckskador', correct: false },
      ],
      explanation: 'ORTAC fokuserar på fyra tidskritiska tillstånd: massiv blödning, kärlskador (arteriella), kompartmentsyndrom och öppna frakturer.',
      reference: 'ATLS 11th Ed. (2018); European Trauma Course Guidelines',
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
      reference: 'ATLS 11th Ed. 2023 Ch. 8; Trauma.org Orthopedic Assessment Protocol',
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
      reference: 'TCCC Guidelines 2024; Kragh JF et al. J Trauma 2009;66:S38-S40',
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
      reference: 'Mills WJ et al. J Trauma 2004;56:814-819; ESVS Guidelines 2019',
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
      reference: 'McQueen MM et al. JBJS Br 2000;82:200-203; Via AG et al. Injury 2015',
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
      explanation: 'Klinisk diagnos är viktigast! Denna patient har tre klassiska tecken: tilltagande smärta trots adekvat analgesi, spänd vad, och smärta vid passiv dorsalflexion. Dessa kliniska fynd indikerar fasciotomi OAVSETT tryckmätningen. Delta-tryck (ΔP < 30 mmHg) är ett kompletterande verktyg vid oklar klinik, men ersätter aldrig klinisk bedömning.',
      reference: 'McQueen MM et al. JBJS Br 2000;82:200-203; Via AG et al. Injury 2015',
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
      reference: 'Gustilo RB et al. JBJS Am 1984;66:118; BOAST 4 Guidelines 2017',
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
      reference: 'Gustilo RB et al. JBJS Am 1984;66:118; BOAST 4 Guidelines 2017',
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
      reference: 'Young-Burgess Classification; Tile M. Fractures of the Pelvis 1984; ATLS 11th Ed. 2023',
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
      reference: 'Pape HC et al. J Trauma 2002;53:452; Giannoudis PV. Injury 2003;34:7-17',
    },
    // Kapitel 3: Extremitetsskador och prioritering
    {
      code: '3.1',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'I vilken ordning ska skador prioriteras vid multitrauma?',
      options: [
        { text: 'Livshotande skador (ABCDE), extremitetshotande skador, övriga skador', correct: true },
        { text: 'Extremitetshotande skador, livshotande skador, övriga skador', correct: false },
        { text: 'Alla skador behandlas samtidigt', correct: false },
        { text: 'Övriga skador, extremitetshotande skador, livshotande skador', correct: false },
      ],
      explanation: 'Vid multitrauma följs prioriteringsordningen: först livshotande skador enligt ABCDE, sedan extremitetshotande skador, och sist övriga skador.',
      reference: 'ATLS 11th Ed. 2023 Ch. 8; European Trauma Course; Socialstyrelsen Traumavård',
    },
    {
      code: '3.2',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken tidsgräns gäller för revaskularisering vid kärlskada med ischemi?',
      options: [
        { text: '< 6 timmar', correct: true },
        { text: '< 12 timmar', correct: false },
        { text: '< 24 timmar', correct: false },
        { text: '< 2 timmar', correct: false },
      ],
      explanation: 'Kärlskada med ischemi är ett extremitetshotande tillstånd med tidsgräns på < 6 timmar för revaskularisering (varm ischemi).',
      reference: 'ATLS 11th Ed. 2023 Ch. 8; European Trauma Course; Socialstyrelsen Traumavård',
    },
    {
      code: '3.3',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En patient inkommer med multipla skador: öppen underbensfraktur, instabil bäckenfraktur med pågående blödning och medvetslöshet. Vad prioriteras först?',
      options: [
        { text: 'ABCDE-genomgång och blödningskontroll från bäckenet', correct: true },
        { text: 'Behandling av öppna underbensfrakturen', correct: false },
        { text: 'Röntgen av alla skador', correct: false },
        { text: 'Smärtlindring', correct: false },
      ],
      explanation: 'Livshotande skador prioriteras först. Instabil bäckenfraktur med blödning och medvetslöshet är livshotande och kräver omedelbar ABCDE-genomgång och blödningskontroll.',
      reference: 'ATLS 11th Ed. 2023 Ch. 8; European Trauma Course; Socialstyrelsen Traumavård',
    },
    {
      code: '3.4',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken tidsgräns gäller för behandling av öppen fraktur för att minimera infektionsrisk?',
      options: [
        { text: '< 6-8 timmar', correct: true },
        { text: '< 24 timmar', correct: false },
        { text: '< 2 timmar', correct: false },
        { text: '< 48 timmar', correct: false },
      ],
      explanation: 'Öppna frakturer bör behandlas inom 6-8 timmar för att minimera infektionsrisken. Antibiotika ska dock ges inom 1 timme.',
      reference: 'ATLS 11th Ed. 2023 Ch. 8; European Trauma Course; Socialstyrelsen Traumavård',
    },
    // Kapitel 9: Amputationsskador
    {
      code: '9.1',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur ska ett amputat förvaras för optimal preservation?',
      options: [
        { text: 'Fuktig kompress i plastpåse, plastpåsen i isbad - aldrig direkt kontakt med is', correct: true },
        { text: 'Direkt på is för maximal kylning', correct: false },
        { text: 'I rumstemperatur inlindat i torr kompress', correct: false },
        { text: 'Nedsänkt i koksaltlösning', correct: false },
      ],
      explanation: 'Amputatet ska sköljas med koksalt, lindas i fuktig kompress, placeras i plastpåse som sedan läggs i isbad. Direkt kontakt med is skadar vävnaden.',
      reference: 'Pederson WC. Hand Clin 2001;17:389; BSSH Replantation Guidelines 2019',
    },
    {
      code: '9.2',
      chapterNumber: 9,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka är de ABSOLUTA indikationerna för replantation?',
      options: [
        { text: 'Tumme, flera fingrar, hand/handled, barn (alla nivåer)', correct: true },
        { text: 'Endast tumme och pekfinger', correct: false },
        { text: 'Alla amputationer hos vuxna', correct: false },
        { text: 'Endast amputationer under armbågen', correct: false },
      ],
      explanation: 'Absoluta indikationer för replantation inkluderar: tumme (viktig för greppfunktion), flera fingrar, hand/handled, och alla amputationsnivåer hos barn.',
      reference: 'Pederson WC. Hand Clin 2001;17:389; BSSH Replantation Guidelines 2019',
    },
    {
      code: '9.3',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Ett 8-årigt barn inkommer med traumatisk amputation av pekfingret. Vilken åtgärd är MEST korrekt?',
      options: [
        { text: 'Kontakta replantationscentrum - barn har absolut indikation för replantation', correct: true },
        { text: 'Konservativ behandling - enstaka finger replanteras inte', correct: false },
        { text: 'Avvakta och observera stumpens läkning', correct: false },
        { text: 'Primär stumprevision utan replantationsförsök', correct: false },
      ],
      explanation: 'Hos barn är alla amputationsnivåer absoluta indikationer för replantation på grund av bättre läkningsförmåga och lång förväntad livslängd.',
      reference: 'Pederson WC. Hand Clin 2001;17:389; BSSH Replantation Guidelines 2019',
    },
    {
      code: '9.4',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är kontraindikationer för replantation?',
      options: [
        { text: 'Multitrauma med instabilitet, svår krossamputation, lång varm ischemitid, allvarlig komorbiditet', correct: true },
        { text: 'Endast ålder över 65 år', correct: false },
        { text: 'Alla proximala amputationer', correct: false },
        { text: 'Amputationer orsakade av skärande våld', correct: false },
      ],
      explanation: 'Kontraindikationer inkluderar: multitrauma med instabilitet, svår krossamputation, lång varm ischemitid och allvarlig komorbiditet.',
      reference: 'Pederson WC. Hand Clin 2001;17:389; BSSH Replantation Guidelines 2019',
    },
    // Kapitel 10: Extremitetstrauma hos barn
    {
      code: '10.1',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken Salter-Harris-typ innebär fraktur genom fysen OCH epifysen?',
      options: [
        { text: 'Typ III', correct: true },
        { text: 'Typ I', correct: false },
        { text: 'Typ II', correct: false },
        { text: 'Typ V', correct: false },
      ],
      explanation: 'Salter-Harris typ III går genom fysen och epifysen, vilket ger risk för tillväxtrubbning. Typ I går endast genom fysen, typ II genom fys + metafys.',
      reference: 'Salter RB, Harris WR. JBJS Am 1963;45:587; POSNA Pediatric Fractures',
    },
    {
      code: '10.2',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är fyseolys vanligare än ligamentskador hos barn?',
      options: [
        { text: 'Tillväxtzonerna (fyserna) är svagare än ligamenten hos barn', correct: true },
        { text: 'Barn har starkare ligament än vuxna', correct: false },
        { text: 'Barns ben är hårdare och mer kompakta', correct: false },
        { text: 'Ligamenten har ännu inte utvecklats hos barn', correct: false },
      ],
      explanation: 'Hos barn är fyserna (tillväxtzonerna) den svagaste länken i muskuloskeletala systemet, svagare än ligamenten, varför skador ofta drabbar fysen snarare än ligament.',
      reference: 'Salter RB, Harris WR. JBJS Am 1963;45:587; POSNA Pediatric Fractures',
    },
    {
      code: '10.3',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Ett 6-årigt barn har en handledsradiusfraktur som går genom fysen och metafysen (dorsalt fragment). Vilken Salter-Harris-typ är detta?',
      options: [
        { text: 'Typ II', correct: true },
        { text: 'Typ I', correct: false },
        { text: 'Typ III', correct: false },
        { text: 'Typ IV', correct: false },
      ],
      explanation: 'Salter-Harris typ II är vanligast och innebär fraktur genom fysen med ett metafysärt fragment. Har generellt god prognos.',
      reference: 'Salter RB, Harris WR. JBJS Am 1963;45:587; POSNA Pediatric Fractures',
    },
    {
      code: '10.4',
      chapterNumber: 10,
      bloomLevel: 'ANALYSIS',
      question: 'Vilken Salter-Harris-typ har HÖGST risk för tillväxtrubbning?',
      options: [
        { text: 'Typ IV och V', correct: true },
        { text: 'Typ I och II', correct: false },
        { text: 'Endast typ III', correct: false },
        { text: 'Alla typer har lika hög risk', correct: false },
      ],
      explanation: 'Typ IV (genom alla tre: fys, metafys, epifys) och typ V (kompression av fysen) har högst risk för tillväxtrubbning.',
      reference: 'Salter RB, Harris WR. JBJS Am 1963;45:587; POSNA Pediatric Fractures',
    },
    // Kapitel 11: Crush syndrome
    {
      code: '11.1',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de huvudsakliga systemiska komplikationerna vid crush syndrome?',
      options: [
        { text: 'Hyperkalemi, myoglobinuri (njursvikt), metabol acidos, hypovolemi', correct: true },
        { text: 'Hypokalemi, alkalos, hypervolemi', correct: false },
        { text: 'Endast lokal svullnad och smärta', correct: false },
        { text: 'Hyponatremi och hypoglykemi', correct: false },
      ],
      explanation: 'Crush syndrome orsakar frisättning av myoglobin (njursvikt), kalium (arytmirisk), fosfat, samt metabol acidos och hypovolemi vid reperfusion.',
      reference: 'Better OS et al. NEJM 1990;322:825; Sever MS et al. Kidney Int 2012;82:129',
    },
    {
      code: '11.2',
      chapterNumber: 11,
      bloomLevel: 'APPLICATION',
      question: 'En patient har varit fastklämd under en betongplatta i 4 timmar. Räddningstjänsten är redo att lyfta bort plattan. Vilka åtgärder ska vidtas INNAN friläggning?',
      options: [
        { text: 'IV-access, aggressiv vätskebehandling (1-1.5 L/h), EKG-övervakning', correct: true },
        { text: 'Omedelbar friläggning utan förberedelse', correct: false },
        { text: 'Endast smärtlindring', correct: false },
        { text: 'Vänta på sjukhustransport före friläggning', correct: false },
      ],
      explanation: 'Före friläggning (pre-release) ska IV-access etableras, aggressiv vätskebehandling påbörjas (1-1.5 L/timme) och EKG-övervakning startas för att hantera den kommande reperfusionen.',
      reference: 'Better OS et al. NEJM 1990;322:825; Sever MS et al. Kidney Int 2012;82:129',
    },
    {
      code: '11.3',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är hyperkalemi särskilt farligt vid crush syndrome?',
      options: [
        { text: 'Det orsakar livshotande hjärtarytmier', correct: true },
        { text: 'Det leder till leversvikt', correct: false },
        { text: 'Det orsakar hypotension', correct: false },
        { text: 'Det förvärrar den lokala skadan', correct: false },
      ],
      explanation: 'Hyperkalemi vid crush syndrome kan orsaka livshotande hjärtarytmier (ventrikelflimmer, asystoli), vilket gör EKG-övervakning och snabb behandling essentiellt.',
      reference: 'Better OS et al. NEJM 1990;322:825; Sever MS et al. Kidney Int 2012;82:129',
    },
    {
      code: '11.4',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken behandling ges för att skydda njurarna vid crush syndrome?',
      options: [
        { text: 'Aggressiv vätsketerapi, alkalinisering av urin, forcerad diures', correct: true },
        { text: 'Vätskekarens för att minska ödem', correct: false },
        { text: 'Endast antibiotika', correct: false },
        { text: 'Kortisonbehandling', correct: false },
      ],
      explanation: 'Njurskydd vid crush syndrome inkluderar aggressiv vätskebehandling, alkalinisering av urinen (bikarbonat) och forcerad diures för att förhindra myoglobininducerad njurskada.',
      reference: 'Better OS et al. NEJM 1990;322:825; Sever MS et al. Kidney Int 2012;82:129',
    },
    // Kapitel 12: Speciella populationer
    {
      code: '12.1',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka särskilda överväganden gäller för äldre traumapatienter?',
      options: [
        { text: 'Polyfarmaci (antikoagulantia), nedsatt fysiologisk reserv, atypisk presentation, osteoporos', correct: true },
        { text: 'Ökad läkningshastighet', correct: false },
        { text: 'Minskad blödningsrisk', correct: false },
        { text: 'Bättre tolerans för operation', correct: false },
      ],
      explanation: 'Äldre patienter har ofta polyfarmaci (speciellt antikoagulantia), nedsatt fysiologisk reserv, kan ha atypisk presentation och underliggande osteoporos.',
      reference: 'WSES Guidelines 2023; ATLS 11th Ed.; ACOG Committee Opinion 723',
    },
    {
      code: '12.2',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'En gravid kvinna i vecka 28 inkommer med underbensfraktur efter trafikolycka. Hur ska hon positioneras under undersökning?',
      options: [
        { text: 'Vänstersidesläge för att undvika vena cava-kompression', correct: true },
        { text: 'Platt ryggläge', correct: false },
        { text: 'Högersidesläge', correct: false },
        { text: 'Sittande position', correct: false },
      ],
      explanation: 'Gravida i andra och tredje trimestern ska positioneras i vänstersidesläge för att undvika kompression av vena cava inferior från den gravida livmodern.',
      reference: 'WSES Guidelines 2023; ATLS 11th Ed.; ACOG Committee Opinion 723',
    },
    {
      code: '12.3',
      chapterNumber: 12,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken princip gäller för behandling av gravida traumapatienter?',
      options: [
        { text: 'Fostret prioriteras genom att behandla modern optimalt', correct: true },
        { text: 'Fostret ska alltid prioriteras före modern', correct: false },
        { text: 'Modern ska alltid prioriteras före fostret', correct: false },
        { text: 'Ingen specifik behandling krävs', correct: false },
      ],
      explanation: 'Principen är att fostret prioriteras GENOM att behandla modern - optimal maternal behandling ger bäst fosterutfall.',
      reference: 'WSES Guidelines 2023; ATLS 11th Ed.; ACOG Committee Opinion 723',
    },
    {
      code: '12.4',
      chapterNumber: 12,
      bloomLevel: 'APPLICATION',
      question: 'En 78-årig patient på Waran inkommer med lårbenshalsfraktur. Vad är MEST angeläget att kontrollera?',
      options: [
        { text: 'PK(INR) och planera eventuell reversering av antikoagulation', correct: true },
        { text: 'Endast smärtlindring', correct: false },
        { text: 'Avvakta med all behandling tills PK normaliserats', correct: false },
        { text: 'Ignorera antikoagulationen vid frakturer', correct: false },
      ],
      explanation: 'Hos äldre på antikoagulantia är det kritiskt att identifiera typ av behandling: Warfarin (kontrollera PK/INR, reversera med Vitamin K + 4-faktor PCC) eller DOAC/NOAK (kontrollera tid sedan senaste dos, specifika antidoter: idarucizumab för dabigatran, andexanet alfa för Xa-hämmare). Planera reversering innan operation för att minska blödningsrisk.',
      reference: 'WSES Guidelines 2023; ATLS 11th Ed.; ACOG Committee Opinion 723',
    },
    // Kapitel 14: Transport och överflyttning
    {
      code: '14.1',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står MIST för vid traumaöverrapportering?',
      options: [
        { text: 'Mechanism, Injuries, Signs, Treatment', correct: true },
        { text: 'Medical, Intervention, Status, Time', correct: false },
        { text: 'Monitor, Inspect, Stabilize, Transfer', correct: false },
        { text: 'Mobility, Integrity, Severity, Triage', correct: false },
      ],
      explanation: 'MIST står för: Mechanism (skademekanism), Injuries (skador), Signs (vitalparametrar), Treatment (given behandling).',
      reference: 'PHTLS 9th Ed.; NAEMT Guidelines; Scandinavian Guidelines for Prehospital Care',
    },
    {
      code: '14.2',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken grundprincip gäller vid frakturimmobilisering?',
      options: [
        { text: 'Immobilisera leden ovanför och nedanför frakturen', correct: true },
        { text: 'Endast immobilisera själva frakturstället', correct: false },
        { text: 'Immobilisera hela extremiteten alltid', correct: false },
        { text: 'Immobilisering behövs inte vid transport', correct: false },
      ],
      explanation: 'Vid frakturimmobilisering ska leden ovanför och leden nedanför frakturen immobiliseras för att minimera rörelse i frakturstället.',
      reference: 'PHTLS 9th Ed.; NAEMT Guidelines; Scandinavian Guidelines for Prehospital Care',
    },
    {
      code: '14.3',
      chapterNumber: 14,
      bloomLevel: 'APPLICATION',
      question: 'En patient med femurfraktur ska transporteras. Vilken typ av immobilisering är MEST lämplig?',
      options: [
        { text: 'Traktionsskena (Thomas-skena)', correct: true },
        { text: 'Endast gipsskena', correct: false },
        { text: 'Ingen immobilisering behövs', correct: false },
        { text: 'Bäckenbälte', correct: false },
      ],
      explanation: 'Femurfrakturer immobiliseras bäst med traktionsskena (t.ex. Thomas-skena) som ger både immobilisering och traktion för smärtlindring.',
      reference: 'PHTLS 9th Ed.; NAEMT Guidelines; Scandinavian Guidelines for Prehospital Care',
    },
    {
      code: '14.4',
      chapterNumber: 14,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka patienter bör transporteras till traumacenter?',
      options: [
        { text: 'Multipla frakturer, kärlskada, öppen fraktur typ III, bäckeninstabilitet', correct: true },
        { text: 'Endast patienter med öppna frakturer', correct: false },
        { text: 'Alla patienter med extremitetsskador', correct: false },
        { text: 'Endast medvetslösa patienter', correct: false },
      ],
      explanation: 'Patienter som bör transporteras till traumacenter inkluderar de med multipla frakturer, kärlskada, öppen fraktur typ III och bäckeninstabilitet.',
      reference: 'PHTLS 9th Ed.; NAEMT Guidelines; Scandinavian Guidelines for Prehospital Care',
    },
    // Kapitel 15: Dokumentation och juridik
    {
      code: '15.1',
      chapterNumber: 15,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka aspekter ska dokumenteras vid initial traumabedömning?',
      options: [
        { text: 'Tidpunkt för ankomst, skademekanism, fynd vid undersökning, neurovaskulär status, behandling, tidpunkter', correct: true },
        { text: 'Endast diagnos och behandling', correct: false },
        { text: 'Endast patientens subjektiva symtom', correct: false },
        { text: 'Endast vitalparametrar', correct: false },
      ],
      explanation: 'Komplett dokumentation inkluderar: tidpunkt för ankomst, skademekanism, fynd vid undersökning, neurovaskulär status, given behandling och tidpunkter för åtgärder.',
      reference: 'Patientdatalagen (2008:355); Patientsäkerhetslagen; SweTrau Riktlinjer',
    },
    {
      code: '15.2',
      chapterNumber: 15,
      bloomLevel: 'COMPREHENSION',
      question: 'När kan behandling ges utan informerat samtycke?',
      options: [
        { text: 'Vid livs- eller extremitetshotande tillstånd enligt nödrätten', correct: true },
        { text: 'Aldrig', correct: false },
        { text: 'Alltid vid akuta skador', correct: false },
        { text: 'Endast vid medvetslöshet', correct: false },
      ],
      explanation: 'Enligt nödrätten kan behandling ges utan samtycke vid livs- eller extremitetshotande tillstånd när samtycke inte kan inhämtas. Detta ska dokumenteras.',
      reference: 'Patientdatalagen (2008:355); Patientsäkerhetslagen; SweTrau Riktlinjer',
    },
    {
      code: '15.3',
      chapterNumber: 15,
      bloomLevel: 'APPLICATION',
      question: 'En medvetslös patient inkommer med öppen fraktur typ IIIC. Anhöriga går inte att nå. Vad gäller?',
      options: [
        { text: 'Behandla enligt nödrätten och dokumentera att samtycke ej kunde inhämtas', correct: true },
        { text: 'Avvakta tills anhöriga kontaktats', correct: false },
        { text: 'Behandla inte utan skriftligt samtycke', correct: false },
        { text: 'Kontakta socialtjänsten för beslut', correct: false },
      ],
      explanation: 'Vid extremitetshotande tillstånd hos medvetslös patient där samtycke inte kan inhämtas, behandlas patienten enligt nödrätten. Dokumentera att samtycke ej kunde inhämtas.',
      reference: 'Patientdatalagen (2008:355); Patientsäkerhetslagen; SweTrau Riktlinjer',
    },
    {
      code: '15.4',
      chapterNumber: 15,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad ska fotograferas vid öppna frakturer?',
      options: [
        { text: 'Såret före täckning, deformiteter och hudstatus', correct: true },
        { text: 'Endast efter operation', correct: false },
        { text: 'Endast patientens ansikte för identifiering', correct: false },
        { text: 'Fotografering är inte tillåten', correct: false },
      ],
      explanation: 'Vid öppna frakturer ska såret fotograferas FÖRE täckning för dokumentation, samt deformiteter och hudstatus.',
      reference: 'Patientdatalagen (2008:355); Patientsäkerhetslagen; SweTrau Riktlinjer',
    },
    // Kapitel 16: Teamarbete och kommunikation
    {
      code: '16.1',
      chapterNumber: 16,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad står SBAR för?',
      options: [
        { text: 'Situation, Background, Assessment, Recommendation', correct: true },
        { text: 'Status, Breathing, Airway, Response', correct: false },
        { text: 'Stabilize, Bandage, Assess, Report', correct: false },
        { text: 'Scene, Body, Action, Result', correct: false },
      ],
      explanation: 'SBAR är en kommunikationsstruktur: Situation, Background (bakgrund), Assessment (bedömning), Recommendation (rekommendation).',
      reference: 'TeamSTEPPS; Salas E et al. Hum Factors 2005;47:76; CRM Principles in Medicine',
    },
    {
      code: '16.2',
      chapterNumber: 16,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär closed-loop kommunikation?',
      options: [
        { text: 'Teamledare ger order, mottagare bekräftar, utför uppgift, rapporterar genomfört', correct: true },
        { text: 'Endast teamledaren kommunicerar', correct: false },
        { text: 'Kommunikation sker endast skriftligt', correct: false },
        { text: 'Alla pratar samtidigt', correct: false },
      ],
      explanation: 'Closed-loop kommunikation säkerställer att information mottagits korrekt: order ges, bekräftas, utförs och rapporteras tillbaka.',
      reference: 'TeamSTEPPS; Salas E et al. Hum Factors 2005;47:76; CRM Principles in Medicine',
    },
    {
      code: '16.3',
      chapterNumber: 16,
      bloomLevel: 'APPLICATION',
      question: 'Under traumamottagning säger teamledaren "Ge 1 liter Ringer". Vad är korrekt respons enligt closed-loop?',
      options: [
        { text: '"1 liter Ringer bekräftat" följt av "1 liter Ringer given" när administrerat', correct: true },
        { text: 'Ge vätskan tyst utan bekräftelse', correct: false },
        { text: 'Fråga "Varför?"', correct: false },
        { text: 'Nicka och ge vätskan', correct: false },
      ],
      explanation: 'Closed-loop: mottagaren bekräftar ordern muntligt, utför uppgiften, och rapporterar tillbaka att den är genomförd.',
      reference: 'TeamSTEPPS; Salas E et al. Hum Factors 2005;47:76; CRM Principles in Medicine',
    },
    {
      code: '16.4',
      chapterNumber: 16,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken roll har teamledaren i traumateamet?',
      options: [
        { text: 'Överblick och beslut - koordinerar teamet utan att utföra praktiska uppgifter', correct: true },
        { text: 'Utför alla praktiska uppgifter själv', correct: false },
        { text: 'Endast dokumentation', correct: false },
        { text: 'Ansvarar endast för luftvägen', correct: false },
      ],
      explanation: 'Teamledarens roll är att ha överblick, fatta beslut och koordinera teamet. Teamledaren bör undvika att utföra praktiska uppgifter för att behålla överblicken.',
      reference: 'TeamSTEPPS; Salas E et al. Hum Factors 2005;47:76; CRM Principles in Medicine',
    },
    {
      code: '16.5',
      chapterNumber: 16,
      bloomLevel: 'SYNTHESIS',
      question: 'Vilka frågor bör ställas vid debriefing efter ett traumafall?',
      options: [
        { text: 'Vad gick bra? Vad kan förbättras? Handlingsplan för förbättring?', correct: true },
        { text: 'Endast vem som gjorde fel', correct: false },
        { text: 'Debriefing behövs inte', correct: false },
        { text: 'Endast diskussion om diagnosen', correct: false },
      ],
      explanation: 'Strukturerad debriefing fokuserar på: vad gick bra, vad kan förbättras, och konkret handlingsplan för förbättring - inte skuldbeläggning.',
      reference: 'TeamSTEPPS; Salas E et al. Hum Factors 2005;47:76; CRM Principles in Medicine',
    },
    // Kapitel 17: Fallbaserad examination
    {
      code: '17.1',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka komponenter ingår i ORTAC-examinationen?',
      options: [
        { text: 'Teoretiskt prov (MCQ) och praktiska stationer (OSCE)', correct: true },
        { text: 'Endast skriftligt prov', correct: false },
        { text: 'Endast praktiska stationer', correct: false },
        { text: 'Muntlig examination endast', correct: false },
      ],
      explanation: 'ORTAC-examinationen består av två delar: teoretiskt prov med MCQ-frågor och praktiska OSCE-stationer.',
      reference: 'LIPUS Examination Standards; Miller GE. Acad Med 1990;65:S63; OSCE Guidelines',
    },
    {
      code: '17.2',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad krävs för godkänt på ORTAC-examinationen?',
      options: [
        { text: 'Godkänd teori (≥70%), godkända OSCE-stationer och genomförd LIPUS-utvärdering', correct: true },
        { text: 'Endast 50% på teoridelen', correct: false },
        { text: 'Endast godkända praktiska stationer', correct: false },
        { text: 'Ingen minimigräns finns', correct: false },
      ],
      explanation: 'För certifikat krävs: godkänd teori (≥70%), godkända OSCE-stationer och genomförd LIPUS-utvärdering.',
      reference: 'LIPUS Examination Standards; Miller GE. Acad Med 1990;65:S63; OSCE Guidelines',
    },
    {
      code: '17.3',
      chapterNumber: 17,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilka praktiska färdigheter examineras på OSCE-stationerna?',
      options: [
        { text: 'Tourniquet-applikation, ABI-mätning, bäckenbälte, passiv töjningstest, LIMB-bedömning, SBAR', correct: true },
        { text: 'Endast skriftlig dokumentation', correct: false },
        { text: 'Endast teoretiska frågor', correct: false },
        { text: 'Endast kirurgiska färdigheter', correct: false },
      ],
      explanation: 'OSCE-stationerna examinerar praktiska färdigheter: tourniquet, ABI-mätning, bäckenbälte, passiv töjningstest, LIMB-bedömning och SBAR-kommunikation.',
      reference: 'LIPUS Examination Standards; Miller GE. Acad Med 1990;65:S63; OSCE Guidelines',
    },
    {
      code: '17.4',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur länge är ORTAC-certifikatet giltigt?',
      options: [
        { text: '4 år med möjlighet till recertifiering', correct: true },
        { text: 'Livstid', correct: false },
        { text: '1 år', correct: false },
        { text: '10 år', correct: false },
      ],
      explanation: 'ORTAC-certifikatet gäller i 4 år, därefter krävs recertifiering.',
      reference: 'LIPUS Examination Standards; Miller GE. Acad Med 1990;65:S63; OSCE Guidelines',
    },
    // ============================================
    // ORTAC MCQ-BANK IMPORT (Frågor 1-170)
    // ============================================
    // Kapitel 1: Introduktion
    {
      code: 'B1.1',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är huvudsyftet med ORTAC-kursen?',
      options: [
        { text: 'Att ge icke-ortopeder verktyg för initial handläggning av extremitetstrauma', correct: true },
        { text: 'Att utbilda ortopeder i avancerad frakturkirurgi', correct: false },
        { text: 'Att ersätta ATLS-kursen', correct: false },
        { text: 'Att certifiera läkare för självständig frakturkirurgi', correct: false },
      ],
      explanation: 'ORTAC fyller gapet mellan ATLS och ortopedisk specialistutbildning genom att ge icke-ortopeder strukturerade verktyg för initial hantering av extremitetsskador.',
    },
    {
      code: 'B1.2',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad menas med "The right care at the right time by the right person"?',
      options: [
        { text: 'Rätt kompetens på rätt nivå i vårdkedjan', correct: true },
        { text: 'Endast ortopeder ska behandla frakturer', correct: false },
        { text: 'Alla läkare ska kunna operera frakturer', correct: false },
        { text: 'Patienter ska vänta på specialist innan behandling påbörjas', correct: false },
      ],
      explanation: 'Kursfilosofin betonar att icke-ortopeder ska kunna identifiera, initiera behandling och eskalera korrekt – inte operera själva.',
    },
    // Kapitel 2: LIMB-algoritmen (utökad)
    {
      code: 'B2.1',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'En 25-årig man inkommer efter MC-olycka med massiv blödning från höger lår. Vad är första åtgärd enligt LIMB?',
      options: [
        { text: 'Tourniquet', correct: true },
        { text: 'Röntgen av femur', correct: false },
        { text: 'ABI-mätning', correct: false },
        { text: 'Kontakta ortopedjouren', correct: false },
      ],
      explanation: 'L (Life & Limb threats) kommer först – massiv blödning kräver omedelbar tourniquet.',
    },
    {
      code: 'B2.2',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka är de "hårda tecknen" på kärlskada?',
      options: [
        { text: 'Pulserande blödning, expanderande hematom, pulslöshet, kyla/blekhet, thrill/blåsljud', correct: true },
        { text: 'Svullnad och ömhet', correct: false },
        { text: 'Smärta och rörelseinskränkning', correct: false },
        { text: 'Nedsatt sensorik', correct: false },
      ],
      explanation: 'Hårda tecken kräver omedelbar intervention utan ytterligare diagnostik.',
    },
    {
      code: 'B2.3',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken tidsgräns gäller för revaskularisering vid akut extremitetsischemi?',
      options: [
        { text: '6 timmar (warm ischemia)', correct: true },
        { text: '1 timme', correct: false },
        { text: '3 timmar', correct: false },
        { text: '12 timmar', correct: false },
      ],
      explanation: 'Skelettmuskel tolererar ca 6 timmars warm ischemia innan irreversibel skada uppstår.',
    },
    // Kapitel 3: Primär Survey
    {
      code: 'B3.1',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Under vilken del av ATLS primär survey adresseras massiv extremitetsblödning?',
      options: [
        { text: 'C - Circulation', correct: true },
        { text: 'A - Airway', correct: false },
        { text: 'B - Breathing', correct: false },
        { text: 'D - Disability', correct: false },
      ],
      explanation: 'Blödningskontroll, inklusive tourniquet och bäckenbälte, hanteras under C (Circulation).',
    },
    {
      code: 'B3.2',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Uppskattad blodförlust vid en sluten femurfraktur är:',
      options: [
        { text: '1000-2000 ml', correct: true },
        { text: '150-250 ml', correct: false },
        { text: '500-750 ml', correct: false },
        { text: '3000-4000 ml', correct: false },
      ],
      explanation: 'En femurfraktur kan orsaka 1000-2000 ml blodförlust i det slutna utrymmet.',
    },
    {
      code: 'B3.3',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken åtgärd är INTE indicerad under primär survey?',
      options: [
        { text: 'Definitiv frakturfixation', correct: true },
        { text: 'Tourniquet vid massiv extremitetsblödning', correct: false },
        { text: 'Bäckenbälte vid instabilt bäcken', correct: false },
        { text: 'Reposition av grov felställning med hudhotande', correct: false },
      ],
      explanation: 'Primär survey fokuserar på livräddande åtgärder. Definitiv kirurgi sker efter stabilisering.',
    },
    {
      code: 'B3.4',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En patient med bäckenfraktur har blod vid uretramynningen. Vad gör du?',
      options: [
        { text: 'Avstår KAD, överväger suprapubisk kateter efter urethrografi', correct: true },
        { text: 'Sätter KAD direkt', correct: false },
        { text: 'Ignorerar fyndet och fortsätter med primär survey', correct: false },
        { text: 'Konsulterar urolog efter operation av frakturen', correct: false },
      ],
      explanation: 'Blod vid meatus indikerar möjlig urethraskada. KAD är kontraindicerat före urethrografi.',
    },
    // Kapitel 4: Sekundär Survey / Nervtest
    {
      code: 'B4.1',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket fynd vid kapillär återfyllnad anses normalt?',
      options: [
        { text: '<2 sekunder', correct: true },
        { text: '2-4 sekunder', correct: false },
        { text: '4-6 sekunder', correct: false },
        { text: '>6 sekunder', correct: false },
      ],
      explanation: 'Normal kapillär återfyllnad är under 2 sekunder.',
    },
    {
      code: 'B4.2',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv testas genom att be patienten spreta fingrarna?',
      options: [
        { text: 'N. ulnaris', correct: true },
        { text: 'N. medianus', correct: false },
        { text: 'N. radialis', correct: false },
        { text: 'N. musculocutaneus', correct: false },
      ],
      explanation: 'N. ulnaris innerverar interosseimusklerna som möjliggör fingerspretning.',
    },
    {
      code: 'B4.3',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur testas n. peroneus motoriskt?',
      options: [
        { text: 'Dorsalflexion av fot och tår', correct: true },
        { text: 'Knäextension', correct: false },
        { text: 'Plantarflexion', correct: false },
        { text: 'Höftflexion', correct: false },
      ],
      explanation: 'N. peroneus innerverar dorsalflexorerna i underbenet.',
    },
    {
      code: 'B4.4',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är korrekt sensoriskt testområde för n. radialis?',
      options: [
        { text: 'Första interosseumutrymmet dorsalt', correct: true },
        { text: 'Volara pekfingerpulpan', correct: false },
        { text: 'Ulnara lillfingret', correct: false },
        { text: 'Fotsulan', correct: false },
      ],
      explanation: 'N. radialis sensoriska område inkluderar dorsalsidan av första interosseumutrymmet.',
    },
    // Kapitel 5: Bilddiagnostik
    {
      code: 'B5.1',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken bildmodalitet är förstahandsval vid misstänkt extremitetsfraktur?',
      options: [
        { text: 'Konventionell röntgen', correct: true },
        { text: 'MR', correct: false },
        { text: 'Ultraljud', correct: false },
        { text: 'CT', correct: false },
      ],
      explanation: 'Konventionell röntgen är snabb, tillgänglig och ger god bendetaljering.',
    },
    {
      code: 'B5.2',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför ska röntgen vid frakturmisstanke inkludera leden ovan och nedan?',
      options: [
        { text: 'För att identifiera associerade ledskador eller luxationer', correct: true },
        { text: 'För att mäta benlängd', correct: false },
        { text: 'För att bedöma blodförsörjning', correct: false },
        { text: 'Det behövs inte', correct: false },
      ],
      explanation: 'Associerade skador i angränsande leder (t.ex. Monteggia, Galeazzi) måste uteslutas.',
    },
    {
      code: 'B5.3',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad används FAST-ultraljud för vid trauma?',
      options: [
        { text: 'Fri vätska i buk och perikard', correct: true },
        { text: 'Frakturdiagnostik', correct: false },
        { text: 'Kärlskada i extremitet', correct: false },
        { text: 'Kompartmenttryckmätning', correct: false },
      ],
      explanation: 'FAST (Focused Assessment with Sonography for Trauma) detekterar fri vätska.',
    },
    // Kapitel 6: DCO (Damage Control Orthopaedics)
    {
      code: 'B6.1',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är den "letala triaden" vid polytrauma?',
      options: [
        { text: 'Hypotermi, acidos, koagulopati', correct: true },
        { text: 'Fraktur, blödning, smärta', correct: false },
        { text: 'Hypotension, bradykardi, hypoxemi', correct: false },
        { text: 'Infektion, sepsis, organsvikt', correct: false },
      ],
      explanation: 'Den letala triaden förvärras av omfattande kirurgi hos instabila patienter.',
    },
    {
      code: 'B6.2',
      chapterNumber: 13,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken patientkategori ska ha DCO (Damage Control Orthopedics)?',
      options: [
        { text: 'Instabil patient', correct: true },
        { text: 'Stabil patient', correct: false },
        { text: 'Borderline patient', correct: false },
        { text: 'Patient med isolerad underarmsfraktur', correct: false },
      ],
      explanation: 'Instabila patienter ska ha temporär stabilisering (DCO), inte definitiv fixation.',
    },
    {
      code: 'B6.3',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket ISS-värde räknas generellt som polytrauma?',
      options: [
        { text: 'ISS ≥ 16', correct: true },
        { text: 'ISS > 5', correct: false },
        { text: 'ISS > 10', correct: false },
        { text: 'ISS > 25', correct: false },
      ],
      explanation: 'ISS ≥ 16 definieras ofta som polytrauma.',
    },
    {
      code: 'B6.4',
      chapterNumber: 13,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är fördelen med extern fixation vid DCO?',
      options: [
        { text: 'Snabbt, minimalt invasivt, låg blodförlust', correct: true },
        { text: 'Kortare total sjukhusvistelse', correct: false },
        { text: 'Bättre slutresultat', correct: false },
        { text: 'Billigare', correct: false },
      ],
      explanation: 'Extern fixation är snabb och orsakar minimal fysiologisk påfrestning.',
    },
    {
      code: 'B6.5',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'När bör konvertering från extern fixation till definitiv fixation ske?',
      options: [
        { text: 'Dag 5-10 ("window of opportunity")', correct: true },
        { text: 'Inom 24 timmar', correct: false },
        { text: 'Dag 2-3', correct: false },
        { text: 'Efter 3 veckor', correct: false },
      ],
      explanation: 'Efter initial stabilisering väntar man på fysiologisk optimering, typiskt dag 5-10.',
    },
    // Kapitel 7: Öppna frakturer (utökad)
    {
      code: 'B7.1',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken fraktur klassificeras som Gustilo-Anderson typ II?',
      options: [
        { text: 'Sår 1-10 cm, måttlig mjukdelsskada', correct: true },
        { text: 'Sår <1 cm, minimal mjukdelsskada', correct: false },
        { text: 'Sår >10 cm, omfattande skada', correct: false },
        { text: 'Fraktur med kärlskada som kräver reparation', correct: false },
      ],
      explanation: 'Typ II har sår 1-10 cm med måttlig kontamination och mjukdelsskada.',
    },
    {
      code: 'B7.2',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Vilken antibiotika rekommenderas vid Gustilo typ I-II öppen fraktur?',
      options: [
        { text: 'Cefazolin 2g IV', correct: true },
        { text: 'Penicillin V', correct: false },
        { text: 'Gentamicin', correct: false },
        { text: 'Metronidazol', correct: false },
      ],
      explanation: 'Cefazolin (eller kloxacillin) täcker grampositiva hudpatogener.',
    },
    {
      code: 'B7.3',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Vid Gustilo typ III-fraktur, vad ska läggas till utöver cefazolin?',
      options: [
        { text: 'Gentamicin', correct: true },
        { text: 'Penicillin', correct: false },
        { text: 'Klindamycin', correct: false },
        { text: 'Metronidazol', correct: false },
      ],
      explanation: 'Gentamicin läggs till för gramnegativ täckning vid svåra öppna frakturer.',
    },
    {
      code: 'B7.4',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken tilläggsantibiotika ges vid jordkontaminerad öppen fraktur?',
      options: [
        { text: 'Penicillin G', correct: true },
        { text: 'Ciprofloxacin', correct: false },
        { text: 'Vancomycin', correct: false },
        { text: 'Doxycyklin', correct: false },
      ],
      explanation: 'Penicillin täcker Clostridium-arter som finns i jord.',
    },
    {
      code: 'B7.5',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Hur ofta ska en öppen fraktur inspekteras på akutmottagningen?',
      options: [
        { text: 'Inte alls – täck med steril kompress och rör ej', correct: true },
        { text: 'Var 15:e minut', correct: false },
        { text: 'Var timme', correct: false },
        { text: 'Så ofta som möjligt för att bedöma kontamination', correct: false },
      ],
      explanation: 'Upprepade inspektioner ökar kontaminationsrisken. Täck såret efter initial bedömning.',
    },
    {
      code: 'B7.6',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är målsättningen för definitiv mjukdelstäckning vid öppen fraktur?',
      options: [
        { text: 'Inom 72 timmar', correct: true },
        { text: 'Inom 24 timmar', correct: false },
        { text: 'Inom 1 vecka', correct: false },
        { text: 'Inom 2 veckor', correct: false },
      ],
      explanation: 'Tidig mjukdelstäckning (inom 72h) minskar infektionsrisken.',
    },
    // Kapitel 8: Kompartmentsyndrom (utökad)
    {
      code: 'B8.1',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste lokalisationen för kompartmentsyndrom?',
      options: [
        { text: 'Underbenet (anteriora kompartmentet)', correct: true },
        { text: 'Låret', correct: false },
        { text: 'Underarmen', correct: false },
        { text: 'Foten', correct: false },
      ],
      explanation: 'Anteriora kompartmentet i underbenet är vanligast, ofta efter tibiafraktur.',
    },
    {
      code: 'B8.2',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv drabbas först vid anteriort kompartmentsyndrom i underbenet?',
      options: [
        { text: 'N. peroneus profundus', correct: true },
        { text: 'N. tibialis', correct: false },
        { text: 'N. suralis', correct: false },
        { text: 'N. saphenus', correct: false },
      ],
      explanation: 'N. peroneus profundus löper genom anteriora kompartmentet.',
    },
    {
      code: 'B8.3',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är normalt kompartmenttryck?',
      options: [
        { text: '0-8 mmHg', correct: true },
        { text: '15-20 mmHg', correct: false },
        { text: '25-30 mmHg', correct: false },
        { text: '35-40 mmHg', correct: false },
      ],
      explanation: 'Normalt kompartmenttryck är under 10 mmHg.',
    },
    {
      code: 'B8.4',
      chapterNumber: 6,
      bloomLevel: 'COMPREHENSION',
      question: 'Varför är pulslöshet ett sent tecken vid kompartmentsyndrom?',
      options: [
        { text: 'Artärtrycket överstiger kompartmenttrycket tills sent i förloppet', correct: true },
        { text: 'Pulsen påverkas inte av kompartmentsyndrom', correct: false },
        { text: 'Pulsen mäts alltid fel', correct: false },
        { text: 'Pulslöshet uppträder först', correct: false },
      ],
      explanation: 'Artärtrycket (ca 80-120 mmHg) överstiger kompartmenttrycket (30-40 mmHg) länge.',
    },
    {
      code: 'B8.5',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'Vad är första åtgärden vid misstänkt kompartmentsyndrom hos gipsad patient?',
      options: [
        { text: 'Klipp upp gipset helt (dela och sprida)', correct: true },
        { text: 'Ge morfin', correct: false },
        { text: 'Ta röntgen', correct: false },
        { text: 'Vänta och se', correct: false },
      ],
      explanation: 'Cirkulärt gips ska alltid klippas upp vid misstanke om kompartmentsyndrom.',
    },
    // Kärlskador (Kapitel 9 i ORTAC)
    {
      code: 'B9.1',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur beräknas ABI (Ankle-Brachial Index)?',
      options: [
        { text: 'Systoliskt ankeltryck / Systoliskt armtryck', correct: true },
        { text: 'Diastoliskt ankeltryck / Systoliskt armtryck', correct: false },
        { text: 'Systoliskt armtryck / Systoliskt ankeltryck', correct: false },
        { text: 'Medelartärtryck ankel / Medelartärtryck arm', correct: false },
      ],
      explanation: 'ABI = Systoliskt ankeltryck / Systoliskt armtryck. Normalt 0.9-1.3.',
    },
    {
      code: 'B9.2',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Vid vilken skademekanism är risken för popliteakärlskada högst?',
      options: [
        { text: 'Knäluxation', correct: true },
        { text: 'Underbensfraktur', correct: false },
        { text: 'Höftfraktur', correct: false },
        { text: 'Fotledsfraktur', correct: false },
      ],
      explanation: 'Knäluxation har 15-40% risk för popliteakärlskada.',
    },
    {
      code: 'B9.3',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: '"Pink pulseless hand" efter suprakondylär humerusfraktur hos barn – vad är korrekt handläggning?',
      options: [
        { text: 'Omedelbar reposition, om kvarvarande puls-bortfall: akut exploration', correct: true },
        { text: 'Vänta och se', correct: false },
        { text: 'Endast gipsning', correct: false },
        { text: 'Angiografi först', correct: false },
      ],
      explanation: 'Pink pulseless hand kräver snabb reposition. Kvarstående bortfall indikerar kärlskada.',
    },
    // Bäckenringskador (Kapitel 10 i ORTAC)
    {
      code: 'B10.1',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken struktur är viktigast för bäckenringens stabilitet?',
      options: [
        { text: 'Bakre ligamentkomplexet (sacroiliaca-lederna)', correct: true },
        { text: 'Symfysen', correct: false },
        { text: 'Höftlederna', correct: false },
        { text: 'Muskulaturen', correct: false },
      ],
      explanation: 'Bakre ligamentkomplexet står för 60% av stabiliteten.',
    },
    {
      code: 'B10.2',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Enligt Tile-klassifikationen, vilken typ är både rotations- och vertikalt instabil?',
      options: [
        { text: 'Typ C', correct: true },
        { text: 'Typ A', correct: false },
        { text: 'Typ B', correct: false },
        { text: 'Typ D', correct: false },
      ],
      explanation: 'Typ C innebär komplett instabilitet (rotations- och vertikal).',
    },
    {
      code: 'B10.3',
      chapterNumber: 8,
      bloomLevel: 'APPLICATION',
      question: 'Var ska bäckenbältet placeras?',
      options: [
        { text: 'I nivå med trochanter major', correct: true },
        { text: 'I midjan', correct: false },
        { text: 'Över crista iliaca', correct: false },
        { text: 'Över symfysen', correct: false },
      ],
      explanation: 'Korrekt placering är 2-3 cm ovanför trochanter major.',
    },
    {
      code: 'B10.4',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste blödningskällan vid bäckenfraktur?',
      options: [
        { text: 'Venös blödning från presakralt plexus och frakturytor', correct: true },
        { text: 'Arteriell blödning från iliaca interna', correct: false },
        { text: 'Blödning från urinblåsan', correct: false },
        { text: 'Blödning från tarmen', correct: false },
      ],
      explanation: '80-90% av blödningar är venösa. Arteriella blödningar är allvarligare men ovanligare.',
    },
    // Femurfrakturer (Kapitel 11 i ORTAC - HELT SAKNADE)
    {
      code: 'B11.1',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste komplikationen vid femurskaftfraktur?',
      options: [
        { text: 'Blödning och hypovolemi', correct: true },
        { text: 'Infektion', correct: false },
        { text: 'Nervskada', correct: false },
        { text: 'Kompartmentsyndrom', correct: false },
      ],
      explanation: 'Femurfrakturen blöder 1-2 liter och är en vanlig orsak till traumatisk chock.',
    },
    {
      code: 'B11.2',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Vilken temporär stabilisering rekommenderas för femurskaftfraktur prehospitalt?',
      options: [
        { text: 'Traktionsspjäla (Thomas splint eller liknande)', correct: true },
        { text: 'Gipsning', correct: false },
        { text: 'Elastisk binda', correct: false },
        { text: 'Ingen stabilisering behövs', correct: false },
      ],
      explanation: 'Traktionsspjäla minskar smärta, blödning och förkortning.',
    },
    {
      code: 'B11.3',
      chapterNumber: 4,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken nerv kan skadas vid distal femurfraktur?',
      options: [
        { text: 'N. peroneus communis', correct: true },
        { text: 'N. femoralis', correct: false },
        { text: 'N. ischiadicus', correct: false },
        { text: 'N. obturatorius', correct: false },
      ],
      explanation: 'N. peroneus löper nära fibulahalsen och kan skadas vid traktion/manipulation.',
    },
    // Tibiafrakturer (Kapitel 12 i ORTAC - HELT SAKNADE)
    {
      code: 'B12.1',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Varför är tibiafrakturer särskilt känsliga för kompartmentsyndrom?',
      options: [
        { text: 'Underbenet har trånga fasciekompartment och begränsad vävnadsexpansion', correct: true },
        { text: 'Tibian har dålig blodförsörjning', correct: false },
        { text: 'Tibiafrakturer blöder mer', correct: false },
        { text: 'Det stämmer inte – tibiafrakturer ger sällan kompartmentsyndrom', correct: false },
      ],
      explanation: 'Underbenet har 4 trånga kompartment som snabbt får förhöjt tryck vid svullnad.',
    },
    {
      code: 'B12.2',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv kan skadas vid lateral malleolfraktur?',
      options: [
        { text: 'N. peroneus superficialis', correct: true },
        { text: 'N. tibialis', correct: false },
        { text: 'N. suralis', correct: false },
        { text: 'N. saphenus', correct: false },
      ],
      explanation: 'N. peroneus superficialis löper nära laterala malleolen.',
    },
    // Övre extremitet (Kapitel 13 i ORTAC - HELT SAKNADE)
    {
      code: 'B13.1',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Monteggia-fraktur?',
      options: [
        { text: 'Ulnafraktur + radiushuvudsluxation', correct: true },
        { text: 'Radiusfraktur + distal ulnaluxation', correct: false },
        { text: 'Bilateral underarmsfraktur', correct: false },
        { text: 'Fraktur av båda underarmsben', correct: false },
      ],
      explanation: 'Monteggia: ulnaskaftfraktur + proximal radiusluxation.',
    },
    {
      code: 'B13.2',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Galeazzi-fraktur?',
      options: [
        { text: 'Radiusfraktur + distal ulnaluxation (DRUJ)', correct: true },
        { text: 'Ulnafraktur + radiushuvudsluxation', correct: false },
        { text: 'Bilateral fraktur', correct: false },
        { text: 'Fraktur av os scaphoideum', correct: false },
      ],
      explanation: 'Galeazzi: radiusskaftfraktur + distal radioulnarledsluxation.',
    },
    {
      code: 'B13.3',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Vad är Hill-Sachs-lesion?',
      options: [
        { text: 'Impressionsfraktur på humerushuvudet', correct: true },
        { text: 'Labrumskada', correct: false },
        { text: 'Rotatorkuffruptur', correct: false },
        { text: 'Akromioklavikularledsskada', correct: false },
      ],
      explanation: 'Hill-Sachs är en impressionsfraktur posteriort på humerushuvudet vid anterior luxation.',
    },
    {
      code: 'B13.4',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Bankart-lesion?',
      options: [
        { text: 'Labrumavlösning anteriort-inferiort', correct: true },
        { text: 'Humerusfraktur', correct: false },
        { text: 'Rotatorkuffskada', correct: false },
        { text: 'Klavikelfraktur', correct: false },
      ],
      explanation: 'Bankart: avlösning av anteriora-inferiora labrum vid anterior axelluxation.',
    },
    {
      code: 'B13.5',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken struktur löper störst risk att skadas vid midskaftshumerusfraktur?',
      options: [
        { text: 'N. radialis', correct: true },
        { text: 'N. medianus', correct: false },
        { text: 'N. ulnaris', correct: false },
        { text: 'A. brachialis', correct: false },
      ],
      explanation: 'N. radialis löper i spiralrännan på humerus och är känslig vid midskaftsfrakturer.',
    },
    // Pediatriskt trauma (Kapitel 14 i ORTAC)
    {
      code: 'B14.1',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är "pulled elbow" (barnflickealbåge)?',
      options: [
        { text: 'Radiushuvudsubluxation', correct: true },
        { text: 'Olecranonfraktur', correct: false },
        { text: 'Suprakondylär fraktur', correct: false },
        { text: 'Monteggia-fraktur', correct: false },
      ],
      explanation: 'Pulled elbow är subluxation av radiushuvudet under lig. anulare.',
    },
    {
      code: 'B14.2',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Hur behandlas pulled elbow?',
      options: [
        { text: 'Supination och flexion av armbågen', correct: true },
        { text: 'Operation', correct: false },
        { text: 'Gipsning i 6 veckor', correct: false },
        { text: 'Observation', correct: false },
      ],
      explanation: 'Snabb repositionsmanöver: supination + flexion ger direkt lindring.',
    },
    {
      code: 'B14.3',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken ålder slutar remodellering av frakturer hos barn?',
      options: [
        { text: 'Vid tillväxtzonernas slutning (ca 14-18 år)', correct: true },
        { text: '5 år', correct: false },
        { text: '10 år', correct: false },
        { text: '25 år', correct: false },
      ],
      explanation: 'Remodellering sker så länge tillväxtzonerna är öppna.',
    },
    // Polytrauma/klassifikation
    {
      code: 'B15.1',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är AIS?',
      options: [
        { text: 'Abbreviated Injury Scale', correct: true },
        { text: 'Advanced Injury Score', correct: false },
        { text: 'Anatomical Injury System', correct: false },
        { text: 'Acute Illness Severity', correct: false },
      ],
      explanation: 'AIS graderar enskilda skadors allvarlighetsgrad (1-6).',
    },
    {
      code: 'B15.2',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär ISS > 40?',
      options: [
        { text: 'Svår skada med hög mortalitetsrisk', correct: true },
        { text: 'Lindrig skada', correct: false },
        { text: 'Måttlig skada', correct: false },
        { text: 'Dödlig skada', correct: false },
      ],
      explanation: 'ISS > 25-40 indikerar mycket allvarlig skadebild med hög mortalitet.',
    },
    // Fördjupning: Rabdomyolys
    {
      code: 'B16.1',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken elektrolytrubbning är farligast vid rabdomyolys?',
      options: [
        { text: 'Hyperkaliemi', correct: true },
        { text: 'Hyponatremi', correct: false },
        { text: 'Hypokalcemi', correct: false },
        { text: 'Hyperfosfatemi', correct: false },
      ],
      explanation: 'Hyperkaliemi kan ge livshotande arytmier.',
    },
    {
      code: 'B16.2',
      chapterNumber: 11,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är principen bakom traktion vid femurfraktur?',
      options: [
        { text: 'Återställa längd, minska blödning och smärta', correct: true },
        { text: 'Minska smärta genom att öka förkortningen', correct: false },
        { text: 'Öka blodcirkulation', correct: false },
        { text: 'Förhindra infektion', correct: false },
      ],
      explanation: 'Traktion minskar volym för blödning och stabiliserar frakturen.',
    },
    // Fördjupning: Frakturläkning
    {
      code: 'B17.1',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är definitionen av pseudartros?',
      options: [
        { text: 'Utebliven frakturläkning >6 månader utan tecken på progression', correct: true },
        { text: 'Frakturläkning inom normal tid', correct: false },
        { text: 'Felläkt fraktur', correct: false },
        { text: 'Infektion i frakturen', correct: false },
      ],
      explanation: 'Pseudartros är icke-läkning trots tillräcklig tid (>6 mån).',
    },
    {
      code: 'B17.2',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken faktor ökar risken för pseudartros?',
      options: [
        { text: 'Rökning, infektion, instabilitet', correct: true },
        { text: 'Tidig mobilisering', correct: false },
        { text: 'Ung ålder', correct: false },
        { text: 'Stabil fixation', correct: false },
      ],
      explanation: 'Rökning försämrar mikrocirkulation och läkning.',
    },
    {
      code: 'B17.3',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den viktigaste faktorn för framgångsrik frakturläkning?',
      options: [
        { text: 'Stabil fixation och god blodförsörjning', correct: true },
        { text: 'Patientens kön', correct: false },
        { text: 'Antibiotikabehandling', correct: false },
        { text: 'Fysioterapi', correct: false },
      ],
      explanation: 'Stabilitet + vaskularitet = lyckad läkning.',
    },
    // ============================================
    // KLINISKA SCENARION (91-100)
    // ============================================
    {
      code: 'B91',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'En 30-årig kvinna inkommer efter fall från cykel. Hon har smärta i höger underben med synlig angulation. Vid undersökning noteras ett 2 cm sår anteriort med synligt ben. Distala pulsar är palpabla. Vad är första prioritet?',
      options: [
        { text: 'Antibiotika', correct: true },
        { text: 'Röntgen', correct: false },
        { text: 'Gipsning', correct: false },
        { text: 'MR-undersökning', correct: false },
      ],
      explanation: 'Öppen fraktur (Gustilo II) – antibiotika inom 1 timme (max 3h) är tidskritiskt.',
    },
    {
      code: 'B92',
      chapterNumber: 6,
      bloomLevel: 'APPLICATION',
      question: 'En 45-årig man med tibiafraktur i gips utvecklar tilltagande smärta 6 timmar efter gipsningen. Smärtan lindras inte av morfin. Vid undersökning: uttalad smärta vid passiv dorsalflexion av tår. Vad är nästa steg?',
      options: [
        { text: 'Omgående dela gipset och kontakta ortoped', correct: true },
        { text: 'Öka morfinsdosen', correct: false },
        { text: 'Röntgenkontroll', correct: false },
        { text: 'Avvakta till morgonronden', correct: false },
      ],
      explanation: 'Klassiskt kompartmentsyndrom – omedelbar gipsdelning och ortopedkontakt för ställningstagande till fasciotomi.',
    },
    {
      code: 'B93',
      chapterNumber: 13,
      bloomLevel: 'ANALYSIS',
      question: 'En 20-årig man inkommer efter MC-olycka med felställd vänster femur och höger tibia öppen fraktur. BT 85/60, puls 120. Vad är rätt strategi?',
      options: [
        { text: 'DCO – temporär extern fixation av båda', correct: true },
        { text: 'ETC – operera båda frakturerna definitivt nu', correct: false },
        { text: 'Konservativ behandling', correct: false },
        { text: 'Operera bara tibian', correct: false },
      ],
      explanation: 'Hypotensiv patient = instabil → DCO-strategi med temporär stabilisering.',
    },
    {
      code: 'B94',
      chapterNumber: 5,
      bloomLevel: 'APPLICATION',
      question: 'Ett 6-årigt barn faller från klätterställning. Röntgen visar suprakondylär humerusfraktur Gartland III. Efter sluten reposition är armen blek och puls ej palpabel. Vad gör du?',
      options: [
        { text: 'Omedelbar exploration av a. brachialis', correct: true },
        { text: 'Observerar och mäter ABI om 2 timmar', correct: false },
        { text: 'Accepterar situationen – barnet har kollateraler', correct: false },
        { text: 'Ger enbart smärtlindring och avvaktar', correct: false },
      ],
      explanation: '"White pulseless hand" kräver omedelbar intervention, till skillnad från "pink pulseless" där observation kan vara acceptabelt.',
    },
    {
      code: 'B95',
      chapterNumber: 8,
      bloomLevel: 'ANALYSIS',
      question: 'En 55-årig kvinna med bäckenfraktur efter trafikolycka. Hon är hypotensiv (BT 75/50) trots 2 enheter blod. Blod ses vid vaginal inspektion. Vilka åtgärder är korrekta?',
      options: [
        { text: 'Bäckenbälte, bred antibiotika, MTP, överväg embolisering/packning', correct: true },
        { text: 'Endast antibiotika', correct: false },
        { text: 'CT-buk först', correct: false },
        { text: 'Vänta med åtgärder tills patienten stabiliserats', correct: false },
      ],
      explanation: 'Instabil bäckenfraktur med tecken på öppen fraktur (vaginal laceration) kräver mekanisk stabilisering, bred antibiotika, blödningskontroll.',
    },
    {
      code: 'B96',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'En 35-årig man har drabbats av knäluxation vid fotbollsspel. Luxationen har reponerat spontant. ABI uppmäts till 0.95. Vad rekommenderar du?',
      options: [
        { text: 'Inläggning med upprepad pulskontroll var 2:a timme i 24 h', correct: true },
        { text: 'Patienten kan åka hem, ingen ytterligare åtgärd', correct: false },
        { text: 'Röntgen och hemgång', correct: false },
        { text: 'Omedelbar operation', correct: false },
      ],
      explanation: 'Trots normalt ABI är knäluxation högrisk för fördröjd kärlskada (intimal flap). Observation i 24h är standard.',
    },
    {
      code: 'B97',
      chapterNumber: 10,
      bloomLevel: 'COMPREHENSION',
      question: 'En 8-årig pojke vill inte stödja på höger ben efter ett lindrigt fall på dagis. Röntgen är normal. Vad misstänker du?',
      options: [
        { text: 'Toddler\'s fracture (spiral tibiafraktur)', correct: true },
        { text: 'Simulering', correct: false },
        { text: 'Leukemi', correct: false },
        { text: 'Höftledsinfektion', correct: false },
      ],
      explanation: 'Klassiskt scenario för toddler\'s fracture – kan vara svår att se på röntgen initialt.',
    },
    {
      code: 'B98',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En patient med underarmsfraktur har nedsatt fingerextension och domningar över dorsalt handryggen. Vilken nerv är skadad?',
      options: [
        { text: 'N. radialis', correct: true },
        { text: 'N. medianus', correct: false },
        { text: 'N. ulnaris', correct: false },
        { text: 'N. musculocutaneus', correct: false },
      ],
      explanation: 'N. radialis innerverar extensorer och sensibilitet dorsalt.',
    },
    {
      code: 'B99',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken pO2 börjar syreupptaget i vävnaden påverkas kritiskt?',
      options: [
        { text: '<60 mmHg', correct: true },
        { text: '<95 mmHg', correct: false },
        { text: '<80 mmHg', correct: false },
        { text: '<40 mmHg', correct: false },
      ],
      explanation: 'Under 60 mmHg (ca 90% saturation) minskar syrgasavgivningen till vävnad kraftigt (syrgasdissociationskurvan).',
    },
    {
      code: 'B100',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'En 40-årig man faller 3 meter från stege och landar på fötterna. Han klagar över ryggsmärta. Vad ska misstänkas och åtgärdas?',
      options: [
        { text: 'Calcaneusfraktur med möjlig associerad kotfraktur', correct: true },
        { text: 'Endast frakturer i fötterna', correct: false },
        { text: 'Mjukdelsskada i ryggen', correct: false },
        { text: 'Inget speciellt', correct: false },
      ],
      explanation: 'Fall från höjd med landning på fötter → misstänk calcaneusfraktur + associerad thorakolumbal kotfraktur (10-15% av fallen).',
    },
    // ============================================
    // FÖRDJUPNINGSFRÅGOR (101-170)
    // ============================================
    {
      code: 'B101',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är definitionen av polytrauma enligt ISS?',
      options: [
        { text: 'ISS ≥ 16', correct: true },
        { text: 'ISS > 5', correct: false },
        { text: 'ISS > 10', correct: false },
        { text: 'ISS > 25', correct: false },
      ],
      explanation: 'Polytrauma definieras som ISS ≥ 16.',
    },
    {
      code: 'B102',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken klassifikation används för tibiaplatåfrakturer?',
      options: [
        { text: 'Schatzker', correct: true },
        { text: 'Gustilo-Anderson', correct: false },
        { text: 'Tile', correct: false },
        { text: 'AO/OTA endast', correct: false },
      ],
      explanation: 'Schatzker-klassifikationen är standard för tibiaplatåfrakturer.',
    },
    {
      code: 'B103',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur mycket blod kan förloras vid en sluten bäckenfraktur?',
      options: [
        { text: '1000-5000+ ml', correct: true },
        { text: '100-500 ml', correct: false },
        { text: '500-1000 ml', correct: false },
        { text: 'Max 500 ml', correct: false },
      ],
      explanation: 'Bäckenfrakturer kan ge massiv blödning upp till 5 liter eller mer.',
    },
    {
      code: 'B104',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken frakturtyp ses typiskt "dinner fork"-deformitet?',
      options: [
        { text: 'Collesfraktur', correct: true },
        { text: 'Smithfraktur', correct: false },
        { text: 'Galeazzifraktur', correct: false },
        { text: 'Monteggifraktur', correct: false },
      ],
      explanation: 'Collesfraktur (dorsalt angulerad distal radiusfraktur) ger "dinner fork"-deformitet.',
    },
    {
      code: 'B105',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär REBOA?',
      options: [
        { text: 'Endovaskulär ballongocklusion av aorta', correct: true },
        { text: 'Typ av extern fixation', correct: false },
        { text: 'Klassifikation av bäckenfrakturer', correct: false },
        { text: 'Rehabiliteringsprotokoll', correct: false },
      ],
      explanation: 'REBOA = Resuscitative Endovascular Balloon Occlusion of the Aorta.',
    },
    {
      code: 'B106',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste nervskadan vid proximal humerusfraktur?',
      options: [
        { text: 'N. axillaris', correct: true },
        { text: 'N. medianus', correct: false },
        { text: 'N. ulnaris', correct: false },
        { text: 'N. radialis', correct: false },
      ],
      explanation: 'N. axillaris löper nära proximala humerus och är vanligast skadad.',
    },
    {
      code: 'B107',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur snabbt ska en fasciotomi utföras vid konstaterat kompartmentsyndrom?',
      options: [
        { text: 'Inom 6 timmar', correct: true },
        { text: 'Inom 30 minuter', correct: false },
        { text: 'Inom 12 timmar', correct: false },
        { text: 'Inom 24 timmar', correct: false },
      ],
      explanation: 'Fasciotomi ska utföras inom 6 timmar för att undvika irreversibel skada.',
    },
    {
      code: 'B108',
      chapterNumber: 14,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken position av överarmen ökar risken för n. axillaris-skada vid axelluxation?',
      options: [
        { text: 'Abduktion och utåtrotation', correct: true },
        { text: 'Adduktion och inåtrotation', correct: false },
        { text: 'Flexion', correct: false },
        { text: 'Extension', correct: false },
      ],
      explanation: 'Abduktion och utåtrotation spänner nerven över caput humeri.',
    },
    {
      code: 'B109',
      chapterNumber: 13,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är "second hit" vid polytrauma?',
      options: [
        { text: 'Fysiologisk stress från omfattande kirurgi', correct: true },
        { text: 'En andra traumatisk händelse', correct: false },
        { text: 'Reinfektion', correct: false },
        { text: 'Tromboembolism', correct: false },
      ],
      explanation: '"Second hit" är den extra fysiologiska belastningen från omfattande operationer.',
    },
    {
      code: 'B110',
      chapterNumber: 7,
      bloomLevel: 'APPLICATION',
      question: 'Vilken antibiotikabehandling rekommenderas vid PC-allergi och Gustilo typ I öppen fraktur?',
      options: [
        { text: 'Klindamycin', correct: true },
        { text: 'Cefazolin', correct: false },
        { text: 'Penicillin', correct: false },
        { text: 'Metronidazol', correct: false },
      ],
      explanation: 'Klindamycin är förstahandsalternativ vid PC-allergi.',
    },
    {
      code: 'B111',
      chapterNumber: 4,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken temperatur anses patienten hypoterm vid trauma?',
      options: [
        { text: '<35°C', correct: true },
        { text: '<37°C', correct: false },
        { text: '<36°C', correct: false },
        { text: '<34°C', correct: false },
      ],
      explanation: 'Hypotermi vid trauma definieras som <35°C.',
    },
    {
      code: 'B112',
      chapterNumber: 5,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är risken för kärlskada vid suprakondylär femurfraktur?',
      options: [
        { text: '20-30%', correct: true },
        { text: '<1%', correct: false },
        { text: '5-10%', correct: false },
        { text: '>50%', correct: false },
      ],
      explanation: 'Suprakondylära femurfrakturer har hög kärlskaderisk på 20-30%.',
    },
    {
      code: 'B113',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken struktur skadas ofta vid acetabulumfraktur?',
      options: [
        { text: 'N. ischiadicus', correct: true },
        { text: 'N. femoralis', correct: false },
        { text: 'A. femoralis', correct: false },
        { text: 'N. obturatorius', correct: false },
      ],
      explanation: 'N. ischiadicus löper posteriort och är vanligast skadad.',
    },
    {
      code: 'B114',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Hur lång tid efter öppen fraktur ökar infektionsrisken signifikant?',
      options: [
        { text: '6 timmar', correct: true },
        { text: '1 timme', correct: false },
        { text: '3 timmar', correct: false },
        { text: '12 timmar', correct: false },
      ],
      explanation: 'Efter 6 timmar ökar infektionsrisken markant vid öppna frakturer.',
    },
    {
      code: 'B115',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken undersökning är förstahandsval vid misstänkt kotfraktur?',
      options: [
        { text: 'CT', correct: true },
        { text: 'Konventionell röntgen', correct: false },
        { text: 'MR', correct: false },
        { text: 'Ultraljud', correct: false },
      ],
      explanation: 'CT är förstahandsval för kotfrakturdiagnostik.',
    },
    {
      code: 'B116',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad kännetecknar en Smith-fraktur?',
      options: [
        { text: 'Volar angulation av distala radius', correct: true },
        { text: 'Dorsal angulation av distala radius', correct: false },
        { text: 'Proximal radiusfraktur', correct: false },
        { text: 'Kombinerad radius-ulnafraktur', correct: false },
      ],
      explanation: 'Smith-fraktur = omvänd Colles med volar angulation.',
    },
    {
      code: 'B117',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken ålder är greenstick-frakturer vanligast?',
      options: [
        { text: '4-10 år', correct: true },
        { text: '<2 år', correct: false },
        { text: '15-20 år', correct: false },
        { text: '>30 år', correct: false },
      ],
      explanation: 'Greenstick-frakturer är vanligast hos barn 4-10 år pga benets egenskaper.',
    },
    {
      code: 'B118',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är huvudindikationen för MR vid akut trauma?',
      options: [
        { text: 'Mjukdelsskada och ryggmärgspåverkan', correct: true },
        { text: 'Frakturdiagnostik', correct: false },
        { text: 'Kärlskada', correct: false },
        { text: 'Infektion', correct: false },
      ],
      explanation: 'MR är överlägset för mjukdelar och ryggmärgsskador.',
    },
    {
      code: 'B119',
      chapterNumber: 6,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilket kompartment i underarmen påverkas oftast vid kompartmentsyndrom?',
      options: [
        { text: 'Volara', correct: true },
        { text: 'Dorsala', correct: false },
        { text: 'Laterala', correct: false },
        { text: 'Mediala', correct: false },
      ],
      explanation: 'Volara kompartmentet innehåller mest muskulatur och påverkas oftast.',
    },
    {
      code: 'B120',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är typisk CK-nivå vid rabdomyolys?',
      options: [
        { text: '>10 000 U/L', correct: true },
        { text: '<500 U/L', correct: false },
        { text: '500-1000 U/L', correct: false },
        { text: '1000-5000 U/L', correct: false },
      ],
      explanation: 'CK >10 000 U/L är typiskt för rabdomyolys.',
    },
    {
      code: 'B121',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken behandling ges vid rabdomyolys?',
      options: [
        { text: 'Aggressiv vätsketillförsel', correct: true },
        { text: 'Antibiotika', correct: false },
        { text: 'Kortison', correct: false },
        { text: 'NSAID', correct: false },
      ],
      explanation: 'Aggressiv vätskebehandling skyddar njurarna från myoglobinprecipitation.',
    },
    {
      code: 'B122',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Hur testar man n. medianus sensoriskt?',
      options: [
        { text: 'Volara pekfingerpulpan', correct: true },
        { text: 'Dorsalt första interosseumutrymmet', correct: false },
        { text: 'Ulnara lillfingret', correct: false },
        { text: 'Laterala underarmen', correct: false },
      ],
      explanation: 'N. medianus sensibilitet testas bäst på volara pekfingret.',
    },
    {
      code: 'B123',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är mål-urinproduktion vid behandling av rabdomyolys?',
      options: [
        { text: '200 ml/h', correct: true },
        { text: '30 ml/h', correct: false },
        { text: '100 ml/h', correct: false },
        { text: '500 ml/h', correct: false },
      ],
      explanation: 'Mål 200 ml/h för att spola ut myoglobin och skydda njurarna.',
    },
    {
      code: 'B124',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken klassifikation används för öppna frakturer?',
      options: [
        { text: 'Gustilo-Anderson', correct: true },
        { text: 'Tile', correct: false },
        { text: 'Schatzker', correct: false },
        { text: 'Garden', correct: false },
      ],
      explanation: 'Gustilo-Anderson är standardklassifikationen för öppna frakturer.',
    },
    {
      code: 'B125',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "window of opportunity" vid DCO?',
      options: [
        { text: 'Dag 5-10', correct: true },
        { text: 'De första 6 timmarna', correct: false },
        { text: 'Dag 1-2', correct: false },
        { text: 'Dag 14-21', correct: false },
      ],
      explanation: '"Window of opportunity" är dag 5-10 när patienten stabiliserats.',
    },
    {
      code: 'B126',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken är den vanligaste komplikationen efter öppen tibiafraktur?',
      options: [
        { text: 'Infektion', correct: true },
        { text: 'DVT', correct: false },
        { text: 'Lungemboli', correct: false },
        { text: 'Fettembolisyndrom', correct: false },
      ],
      explanation: 'Infektion är den vanligaste komplikationen pga tibias dåliga mjukdelstäckning.',
    },
    {
      code: 'B127',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken typ av trauma är FAST mest användbart?',
      options: [
        { text: 'Buktrauma med misstänkt fri vätska', correct: true },
        { text: 'Isolerad extremitetsfraktur', correct: false },
        { text: 'Skalltrauma', correct: false },
        { text: 'Brännskada', correct: false },
      ],
      explanation: 'FAST (Focused Assessment with Sonography in Trauma) detekterar fri vätska i buken.',
    },
    {
      code: 'B128',
      chapterNumber: 3,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är korrekta indikationer för CT-kotpelare?',
      options: [
        { text: 'Högenergitrauma, midline tenderness, neurologiska symtom', correct: true },
        { text: 'Lindrig nacksmärta efter lågenergitrauma', correct: false },
        { text: 'Alla trafikolyckor oavsett symtom', correct: false },
        { text: 'Enbart vid medvetslöshet', correct: false },
      ],
      explanation: 'CT-kotpelare indiceras vid högenergitrauma och neurologiska fynd.',
    },
    {
      code: 'B129',
      chapterNumber: 8,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken struktur skadar man vid felaktig bäckenbältesplacering (för högt)?',
      options: [
        { text: 'Ingen skada, men ineffektivt', correct: true },
        { text: 'Blåsan', correct: false },
        { text: 'Njurarna', correct: false },
        { text: 'Levern', correct: false },
      ],
      explanation: 'För högt placerat bälte komprimerar inte bäckenringen effektivt.',
    },
    {
      code: 'B130',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är typisk behandlingstid för stabil tibiafraktur i gips?',
      options: [
        { text: '6-12 veckor', correct: true },
        { text: '2-4 veckor', correct: false },
        { text: '3-4 månader', correct: false },
        { text: '6 månader', correct: false },
      ],
      explanation: 'Stabila tibiafrakturer gipsbehandlas typiskt 6-12 veckor.',
    },
    {
      code: 'B131',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv kan skadas vid lateral malleolfraktur?',
      options: [
        { text: 'N. peroneus superficialis', correct: true },
        { text: 'N. tibialis', correct: false },
        { text: 'N. suralis', correct: false },
        { text: 'N. saphenus', correct: false },
      ],
      explanation: 'N. peroneus superficialis löper över laterala malleolen.',
    },
    {
      code: 'B132',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Hill-Sachs-lesion?',
      options: [
        { text: 'Impressionsfraktur på humerushuvudet', correct: true },
        { text: 'Labrumskada', correct: false },
        { text: 'Rotatorkuffruptur', correct: false },
        { text: 'Akromioklavikularledsskada', correct: false },
      ],
      explanation: 'Hill-Sachs är en impressionsfraktur på posterolaterala caput humeri vid anterior luxation.',
    },
    {
      code: 'B133',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är Bankart-lesion?',
      options: [
        { text: 'Labrumavlösning anteriort-inferiort', correct: true },
        { text: 'Humerusfraktur', correct: false },
        { text: 'Rotatorkuffskada', correct: false },
        { text: 'Klavikelfraktur', correct: false },
      ],
      explanation: 'Bankart-lesion är avlösning av anteriora-inferiora labrum vid axelluxation.',
    },
    {
      code: 'B134',
      chapterNumber: 14,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken position hålls armen typiskt i vid anterior axelluxation?',
      options: [
        { text: 'Abduktion och utåtrotation', correct: true },
        { text: 'Adduktion och inåtrotation', correct: false },
        { text: 'Flexion', correct: false },
        { text: 'Extension', correct: false },
      ],
      explanation: 'Anterior luxation ger typisk abducerad och utåtroterad armposition.',
    },
    {
      code: 'B135',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är förstahandsbehandling vid Gartland typ I suprakondylär humerusfraktur?',
      options: [
        { text: 'Gips', correct: true },
        { text: 'Operation', correct: false },
        { text: 'Extern fixation', correct: false },
        { text: 'Fysioterapi enbart', correct: false },
      ],
      explanation: 'Gartland I (odislocerad) behandlas konservativt med gips.',
    },
    {
      code: 'B136',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken mnemonic används för att minnas hantering vid barnmisshandel?',
      options: [
        { text: 'Dokumentera, rapportera, skydda barnet', correct: true },
        { text: 'ATLS', correct: false },
        { text: 'SBAR', correct: false },
        { text: 'LIMB', correct: false },
      ],
      explanation: 'Vid misstänkt barnmisshandel: dokumentera, rapportera till socialtjänsten, skydda barnet.',
    },
    {
      code: 'B137',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är den viktigaste åtgärden vid misstänkt barnmisshandel?',
      options: [
        { text: 'Anmäla till socialtjänsten', correct: true },
        { text: 'Konfrontera föräldrarna', correct: false },
        { text: 'Vänta på fler bevis', correct: false },
        { text: 'Skicka hem barnet', correct: false },
      ],
      explanation: 'Anmälningsplikt till socialtjänsten vid misstanke om barnmisshandel.',
    },
    {
      code: 'B138',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är AIS?',
      options: [
        { text: 'Abbreviated Injury Scale', correct: true },
        { text: 'Advanced Injury Score', correct: false },
        { text: 'Anatomical Injury System', correct: false },
        { text: 'Acute Illness Severity', correct: false },
      ],
      explanation: 'AIS = Abbreviated Injury Scale, grund för ISS-beräkning.',
    },
    {
      code: 'B139',
      chapterNumber: 13,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad innebär ISS > 40?',
      options: [
        { text: 'Svår skada med hög mortalitetsrisk', correct: true },
        { text: 'Lindrig skada', correct: false },
        { text: 'Måttlig skada', correct: false },
        { text: 'Dödlig skada', correct: false },
      ],
      explanation: 'ISS > 40 innebär mycket allvarlig skada med hög mortalitetsrisk.',
    },
    {
      code: 'B140',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken typ av extern fixation används oftast vid bäckenfraktur?',
      options: [
        { text: 'Anterior extern fixation (ramfixator)', correct: true },
        { text: 'Ilizarov', correct: false },
        { text: 'Monolateral fixator', correct: false },
        { text: 'Ringfixator', correct: false },
      ],
      explanation: 'Anterior ramfixation stabiliserar bäckenringen effektivt.',
    },
    {
      code: 'B141',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är preperitoneal packning?',
      options: [
        { text: 'Tamponad av venös bäckenblödning', correct: true },
        { text: 'Antibiotikabehandling', correct: false },
        { text: 'Kärlkirurgisk metod', correct: false },
        { text: 'Radiologisk intervention', correct: false },
      ],
      explanation: 'Preperitoneal packning komprimerar venösa blödningskällor.',
    },
    {
      code: 'B142',
      chapterNumber: 9,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken tidsgräns gäller för replantation vid traumatisk amputation (kall ischemi)?',
      options: [
        { text: '18-24 timmar', correct: true },
        { text: '6 timmar', correct: false },
        { text: '12 timmar', correct: false },
        { text: '48 timmar', correct: false },
      ],
      explanation: 'Med kall ischemi (kylning) kan replantation vara möjlig upp till 18-24 timmar.',
    },
    {
      code: 'B143',
      chapterNumber: 9,
      bloomLevel: 'APPLICATION',
      question: 'Hur förvaras en amputerad kroppsdel optimalt?',
      options: [
        { text: 'I fuktig kompress, i plastpåse, på is (indirekt kylning)', correct: true },
        { text: 'Direkt på is', correct: false },
        { text: 'I rumstemperatur', correct: false },
        { text: 'I varmt vatten', correct: false },
      ],
      explanation: 'Indirekt kylning: fuktig kompress → plastpåse → på is. Aldrig direkt iskontakt.',
    },
    {
      code: 'B144',
      chapterNumber: 13,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad innebär "floating elbow"?',
      options: [
        { text: 'Ipsilateral humerus- och underarmsfraktur', correct: true },
        { text: 'Armbågsluxation', correct: false },
        { text: 'Bilateral armbågsfraktur', correct: false },
        { text: 'Öppen armbågsfraktur', correct: false },
      ],
      explanation: 'Floating elbow = frakturer ovan och under armbågen på samma sida.',
    },
    {
      code: 'B145',
      chapterNumber: 7,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken faktor är viktigast för prognosen vid öppen fraktur?',
      options: [
        { text: 'Tid till antibiotika och mjukdelstäckning', correct: true },
        { text: 'Patientens ålder', correct: false },
        { text: 'Frakturmönster', correct: false },
        { text: 'Kön', correct: false },
      ],
      explanation: 'Tidig antibiotika och mjukdelstäckning är avgörande för prognosen.',
    },
    {
      code: 'B146',
      chapterNumber: 7,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är VAC-behandling?',
      options: [
        { text: 'Vakuumassisterad sårbehandling', correct: true },
        { text: 'Vaccination', correct: false },
        { text: 'Vaskulär access', correct: false },
        { text: 'Venös antikoagulation', correct: false },
      ],
      explanation: 'VAC = Vacuum-Assisted Closure, underlättar sårläkning.',
    },
    {
      code: 'B147',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken typ av fraktur används Ilizarov-teknik oftast?',
      options: [
        { text: 'Korrektionsosteotomi, pseudartros, benlängdning', correct: true },
        { text: 'Akut trauma', correct: false },
        { text: 'Handfrakturer', correct: false },
        { text: 'Kotfrakturer', correct: false },
      ],
      explanation: 'Ilizarov används för komplexa rekonstruktioner och benlängdning.',
    },
    {
      code: 'B148',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är typisk läkningstid för en humerusskaftfraktur?',
      options: [
        { text: '8-12 veckor', correct: true },
        { text: '4-6 veckor', correct: false },
        { text: '16-20 veckor', correct: false },
        { text: '6 månader', correct: false },
      ],
      explanation: 'Humerusskaftfrakturer läker typiskt på 8-12 veckor.',
    },
    {
      code: 'B149',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken elektrolytrubbning är farligast vid rabdomyolys?',
      options: [
        { text: 'Hyperkaliemi', correct: true },
        { text: 'Hyponatremi', correct: false },
        { text: 'Hypokalcemi', correct: false },
        { text: 'Hyperfosfatemi', correct: false },
      ],
      explanation: 'Hyperkaliemi kan ge livshotande arytmier.',
    },
    {
      code: 'B150',
      chapterNumber: 5,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är korrekt diagnos när ABI är 0.6?',
      options: [
        { text: 'Måttlig arteriell insufficiens', correct: true },
        { text: 'Normal', correct: false },
        { text: 'Svår ischemi', correct: false },
        { text: 'Kritisk ischemi', correct: false },
      ],
      explanation: 'ABI 0.5-0.9 = måttlig insufficiens, <0.5 = svår, <0.3 = kritisk.',
    },
    {
      code: 'B151',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken struktur löper störst risk att skadas vid midskaftshumerusfraktur?',
      options: [
        { text: 'N. radialis', correct: true },
        { text: 'N. medianus', correct: false },
        { text: 'N. ulnaris', correct: false },
        { text: 'A. brachialis', correct: false },
      ],
      explanation: 'N. radialis spiralar runt midskaftet och är mycket sårbar.',
    },
    {
      code: 'B152',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Hur behandlas en stabil buckle-fraktur hos barn?',
      options: [
        { text: 'Ortos/gips i 3-4 veckor', correct: true },
        { text: 'Operation', correct: false },
        { text: 'Ingen behandling', correct: false },
        { text: 'Extern fixation', correct: false },
      ],
      explanation: 'Buckle-frakturer är stabila och behandlas med kort immobilisering.',
    },
    {
      code: 'B153',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Vad ska man alltid utesluta vid calcaneusfraktur?',
      options: [
        { text: 'Associerad kotpelarhörfraktur', correct: true },
        { text: 'Fotledsfraktur', correct: false },
        { text: 'Knäskada', correct: false },
        { text: 'Höftfraktur', correct: false },
      ],
      explanation: 'Fall från höjd: 10-15% har samtidig thorakolumbal kotfraktur.',
    },
    {
      code: 'B154',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken ålder slutar remodellering av frakturer hos barn?',
      options: [
        { text: 'Vid tillväxtzonernas slutning (ca 14-18 år)', correct: true },
        { text: '5 år', correct: false },
        { text: '10 år', correct: false },
        { text: '25 år', correct: false },
      ],
      explanation: 'Remodellering sker tills fyscn sluter sig (14-18 år).',
    },
    {
      code: 'B155',
      chapterNumber: 10,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken typ av skada ses vid "pulled elbow" (barnflickealbåge)?',
      options: [
        { text: 'Radiushuvudsubluxation', correct: true },
        { text: 'Olecranonfraktur', correct: false },
        { text: 'Suprakondylär fraktur', correct: false },
        { text: 'Monteggia-fraktur', correct: false },
      ],
      explanation: 'Pulled elbow = subluxation av radiushuvudet ur lig. anulare.',
    },
    {
      code: 'B156',
      chapterNumber: 10,
      bloomLevel: 'APPLICATION',
      question: 'Hur behandlas pulled elbow?',
      options: [
        { text: 'Supination och flexion av armbågen', correct: true },
        { text: 'Operation', correct: false },
        { text: 'Gipsning i 6 veckor', correct: false },
        { text: 'Observation', correct: false },
      ],
      explanation: 'Enkel reposition med supination och flexion återställer ledanatomin.',
    },
    {
      code: 'B157',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken klassifikation används för acetabulumfrakturer?',
      options: [
        { text: 'Letournel-Judet', correct: true },
        { text: 'Tile', correct: false },
        { text: 'Schatzker', correct: false },
        { text: 'AO enbart', correct: false },
      ],
      explanation: 'Letournel-Judet är standardklassifikationen för acetabulumfrakturer.',
    },
    {
      code: 'B158',
      chapterNumber: 8,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är corona mortis?',
      options: [
        { text: 'Anastomos mellan iliaca externa och iliaca interna-system över ramus pubis', correct: true },
        { text: 'En typ av fraktur', correct: false },
        { text: 'Klassifikation', correct: false },
        { text: 'Operationsmetod', correct: false },
      ],
      explanation: 'Corona mortis = kärlförbindelse som kan blöda vid bäckenkirurgi.',
    },
    {
      code: 'B159',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken faktor ökar risken för fettembolisyndrom?',
      options: [
        { text: 'Multipla långa rörbensfrakturer', correct: true },
        { text: 'Isolerad handfraktur', correct: false },
        { text: 'Öppen fraktur', correct: false },
        { text: 'Fraktur hos äldre', correct: false },
      ],
      explanation: 'Multipla rörbensfrakturer ger högst risk för fettembolism.',
    },
    {
      code: 'B160',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är typiska symtom vid fettembolisyndrom?',
      options: [
        { text: 'Petekier, förvirring, andnöd', correct: true },
        { text: 'Lokala infektionstecken', correct: false },
        { text: 'Feber och frossa', correct: false },
        { text: 'Svullnad och rodnad', correct: false },
      ],
      explanation: 'Klassisk triad: petekier + CNS-symtom + respiratorisk insufficiens.',
    },
    {
      code: 'B161',
      chapterNumber: 11,
      bloomLevel: 'KNOWLEDGE',
      question: 'När uppstår typiskt fettembolisyndrom efter trauma?',
      options: [
        { text: '12-72 timmar', correct: true },
        { text: 'Direkt', correct: false },
        { text: '1 vecka', correct: false },
        { text: '2 veckor', correct: false },
      ],
      explanation: 'Fettembolisyndrom uppstår typiskt 12-72 timmar efter trauma.',
    },
    {
      code: 'B162',
      chapterNumber: 12,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är principen bakom traktion vid femurfraktur?',
      options: [
        { text: 'Återställa längd, minska blödning och smärta', correct: true },
        { text: 'Minska smärta genom att öka förkortningen', correct: false },
        { text: 'Öka blodcirkulation', correct: false },
        { text: 'Förhindra infektion', correct: false },
      ],
      explanation: 'Traktion återställer längd och minskar därigenom blödning och smärta.',
    },
    {
      code: 'B163',
      chapterNumber: 14,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken nerv kan skadas vid distal radiusfraktur?',
      options: [
        { text: 'N. medianus', correct: true },
        { text: 'N. radialis', correct: false },
        { text: 'N. ulnaris', correct: false },
        { text: 'N. musculocutaneus', correct: false },
      ],
      explanation: 'N. medianus löper i karpaltunneln och kan komprimeras vid frakturen.',
    },
    {
      code: 'B164',
      chapterNumber: 14,
      bloomLevel: 'APPLICATION',
      question: 'Vad är korrekt position för handled i gips vid Colles-fraktur?',
      options: [
        { text: 'Neutralposition till lätt volarflexion', correct: true },
        { text: 'Dorsalflexion', correct: false },
        { text: 'Maximal volarflexion', correct: false },
        { text: 'Maximal ulnardeviation', correct: false },
      ],
      explanation: 'Neutral till lätt volarflexion motverkar frakturens dorsala angulation.',
    },
    {
      code: 'B165',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vid vilken ålder är höftfrakturer vanligast?',
      options: [
        { text: '>70 år', correct: true },
        { text: '<20 år', correct: false },
        { text: '20-50 år', correct: false },
        { text: '50-70 år', correct: false },
      ],
      explanation: 'Höftfrakturer är vanligast hos äldre >70 år pga osteoporos.',
    },
    {
      code: 'B166',
      chapterNumber: 12,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken fraktur är vanligast vid osteoporos?',
      options: [
        { text: 'Handled, höft, kota', correct: true },
        { text: 'Tibiafraktur', correct: false },
        { text: 'Femurfraktur', correct: false },
        { text: 'Fibulafraktur', correct: false },
      ],
      explanation: 'Typiska osteoporosfrakturer: handled, höft och kotkompressionsfrakturer.',
    },
    {
      code: 'B167',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är definitionen av pseudartros?',
      options: [
        { text: 'Utebliven frakturläkning >6 månader utan tecken på progression', correct: true },
        { text: 'Frakturläkning inom normal tid', correct: false },
        { text: 'Felläkt fraktur', correct: false },
        { text: 'Infektion i frakturen', correct: false },
      ],
      explanation: 'Pseudartros = utebliven läkning efter >6 månader utan progression.',
    },
    {
      code: 'B168',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilken faktor ökar risken för pseudartros?',
      options: [
        { text: 'Rökning, infektion, instabilitet', correct: true },
        { text: 'Tidig mobilisering', correct: false },
        { text: 'Ung ålder', correct: false },
        { text: 'Stabil fixation', correct: false },
      ],
      explanation: 'Rökning, infektion och instabilitet är huvudriskfaktorer för pseudartros.',
    },
    {
      code: 'B169',
      chapterNumber: 17,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vad är malunion?',
      options: [
        { text: 'Läkning i felaktig position', correct: true },
        { text: 'Utebliven läkning', correct: false },
        { text: 'Infektion', correct: false },
        { text: 'Fördröjd läkning', correct: false },
      ],
      explanation: 'Malunion = frakturen har läkt men i fel position.',
    },
    {
      code: 'B170',
      chapterNumber: 17,
      bloomLevel: 'COMPREHENSION',
      question: 'Vilken är den viktigaste faktorn för framgångsrik frakturläkning?',
      options: [
        { text: 'Stabil fixation och god blodförsörjning', correct: true },
        { text: 'Patientens kön', correct: false },
        { text: 'Antibiotikabehandling', correct: false },
        { text: 'Fysioterapi', correct: false },
      ],
      explanation: 'Stabilitet + vaskularitet är grundpelarna för frakturläkning.',
    },
  ];
}

// Learning objectives for all chapters
function getLearningObjectives() {
  return [
    // Kapitel 1: Introduktion
    { chapterNumber: 1, code: 'LO-01-01', type: 'KNOWLEDGE', description: 'Förklara varför strukturerad handläggning av extremitetstrauma är viktig', sortOrder: 1 },
    { chapterNumber: 1, code: 'LO-01-02', type: 'KNOWLEDGE', description: 'Identifiera de fyra tidskritiska ortopediska tillstånden i ORTAC', sortOrder: 2 },
    { chapterNumber: 1, code: 'LO-01-03', type: 'COMPREHENSION', description: 'Förstå konsekvenserna av försenad behandling vid extremitetstrauma', sortOrder: 3 },

    // Kapitel 2: Primärundersökningen
    { chapterNumber: 2, code: 'LO-02-01', type: 'KNOWLEDGE', description: 'Beskriva LIMB-protokollets fyra komponenter', sortOrder: 1 },
    { chapterNumber: 2, code: 'LO-02-02', type: 'APPLICATION', description: 'Genomföra en systematisk ortopedisk primärundersökning', sortOrder: 2 },
    { chapterNumber: 2, code: 'LO-02-03', type: 'APPLICATION', description: 'Bedöma cirkulationsstatus och identifiera tecken på ischemi', sortOrder: 3 },
    { chapterNumber: 2, code: 'LO-02-04', type: 'ANALYSIS', description: 'Identifiera varningssignaler som kräver omedelbar åtgärd', sortOrder: 4 },

    // Kapitel 3: Prioritering
    { chapterNumber: 3, code: 'LO-03-01', type: 'KNOWLEDGE', description: 'Beskriva prioriteringsordningen vid multitrauma', sortOrder: 1 },
    { chapterNumber: 3, code: 'LO-03-02', type: 'COMPREHENSION', description: 'Skilja mellan livshotande och extremitetshotande tillstånd', sortOrder: 2 },
    { chapterNumber: 3, code: 'LO-03-03', type: 'APPLICATION', description: 'Tillämpa tidsgränser för behandling av extremitetshotande tillstånd', sortOrder: 3 },
    { chapterNumber: 3, code: 'LO-03-04', type: 'ANALYSIS', description: 'Prioritera multipla skador hos en traumapatient', sortOrder: 4 },

    // Kapitel 4: Massiv blödning
    { chapterNumber: 4, code: 'LO-04-01', type: 'KNOWLEDGE', description: 'Definiera massiv blödning och dess kriterier', sortOrder: 1 },
    { chapterNumber: 4, code: 'LO-04-02', type: 'APPLICATION', description: 'Applicera korrekt teknik för direkt tryck och tryckförband', sortOrder: 2 },
    { chapterNumber: 4, code: 'LO-04-03', type: 'APPLICATION', description: 'Applicera tourniquet korrekt med rätt placering och dokumentation', sortOrder: 3 },
    { chapterNumber: 4, code: 'LO-04-04', type: 'COMPREHENSION', description: 'Förstå indikationer och komplikationer vid tourniquet-användning', sortOrder: 4 },

    // Kapitel 5: Kärlskador
    { chapterNumber: 5, code: 'LO-05-01', type: 'KNOWLEDGE', description: 'Klassificera kärlskador enligt typ och grad av ischemi', sortOrder: 1 },
    { chapterNumber: 5, code: 'LO-05-02', type: 'APPLICATION', description: 'Mäta och tolka Ankle-Brachial Index (ABI)', sortOrder: 2 },
    { chapterNumber: 5, code: 'LO-05-03', type: 'COMPREHENSION', description: 'Förklara tidsgränser för varm och kall ischemi', sortOrder: 3 },
    { chapterNumber: 5, code: 'LO-05-04', type: 'ANALYSIS', description: 'Välja lämplig diagnostik och initial behandling vid misstänkt kärlskada', sortOrder: 4 },

    // Kapitel 6: Kompartmentsyndrom
    { chapterNumber: 6, code: 'LO-06-01', type: 'KNOWLEDGE', description: 'Beskriva patofysiologin vid kompartmentsyndrom', sortOrder: 1 },
    { chapterNumber: 6, code: 'LO-06-02', type: 'KNOWLEDGE', description: 'Lista de 6 P:na i korrekt ordning efter uppträdande', sortOrder: 2 },
    { chapterNumber: 6, code: 'LO-06-03', type: 'APPLICATION', description: 'Utföra och tolka passiv töjningstest', sortOrder: 3 },
    { chapterNumber: 6, code: 'LO-06-04', type: 'APPLICATION', description: 'Tolka kompartmenttryck och delta-tryck för beslut om fasciotomi', sortOrder: 4 },
    { chapterNumber: 6, code: 'LO-06-05', type: 'ANALYSIS', description: 'Identifiera patienter med hög risk för kompartmentsyndrom', sortOrder: 5 },

    // Kapitel 7: Öppna frakturer
    { chapterNumber: 7, code: 'LO-07-01', type: 'KNOWLEDGE', description: 'Klassificera öppna frakturer enligt Gustilo-Anderson', sortOrder: 1 },
    { chapterNumber: 7, code: 'LO-07-02', type: 'APPLICATION', description: 'Genomföra initial handläggning av öppen fraktur inom 6 timmar', sortOrder: 2 },
    { chapterNumber: 7, code: 'LO-07-03', type: 'APPLICATION', description: 'Välja korrekt antibiotika baserat på frakturtyp', sortOrder: 3 },
    { chapterNumber: 7, code: 'LO-07-04', type: 'COMPREHENSION', description: 'Förstå betydelsen av tidig antibiotikabehandling och tidsgränser', sortOrder: 4 },

    // Kapitel 8: Bäckenringskador
    { chapterNumber: 8, code: 'LO-08-01', type: 'KNOWLEDGE', description: 'Klassificera bäckenringskador enligt Young-Burgess', sortOrder: 1 },
    { chapterNumber: 8, code: 'LO-08-02', type: 'APPLICATION', description: 'Applicera bäckenbälte korrekt', sortOrder: 2 },
    { chapterNumber: 8, code: 'LO-08-03', type: 'COMPREHENSION', description: 'Relatera skadetyp till blödningsrisk', sortOrder: 3 },
    { chapterNumber: 8, code: 'LO-08-04', type: 'ANALYSIS', description: 'Identifiera varningssignaler för bäckeninstabilitet', sortOrder: 4 },

    // Kapitel 9: Amputationsskador
    { chapterNumber: 9, code: 'LO-09-01', type: 'KNOWLEDGE', description: 'Beskriva korrekt hantering av amputat för optimal preservation', sortOrder: 1 },
    { chapterNumber: 9, code: 'LO-09-02', type: 'APPLICATION', description: 'Genomföra initial handläggning av amputationsskada', sortOrder: 2 },
    { chapterNumber: 9, code: 'LO-09-03', type: 'ANALYSIS', description: 'Bedöma indikationer och kontraindikationer för replantation', sortOrder: 3 },

    // Kapitel 10: Barn
    { chapterNumber: 10, code: 'LO-10-01', type: 'KNOWLEDGE', description: 'Klassificera fyseolys enligt Salter-Harris', sortOrder: 1 },
    { chapterNumber: 10, code: 'LO-10-02', type: 'COMPREHENSION', description: 'Förklara anatomiska skillnader mellan barns och vuxnas skelett', sortOrder: 2 },
    { chapterNumber: 10, code: 'LO-10-03', type: 'ANALYSIS', description: 'Bedöma risk för tillväxtrubbning baserat på Salter-Harris-typ', sortOrder: 3 },
    { chapterNumber: 10, code: 'LO-10-04', type: 'APPLICATION', description: 'Anpassa handläggning av extremitetstrauma för barn', sortOrder: 4 },

    // Kapitel 11: Crush syndrome
    { chapterNumber: 11, code: 'LO-11-01', type: 'KNOWLEDGE', description: 'Beskriva patofysiologin vid crush syndrome', sortOrder: 1 },
    { chapterNumber: 11, code: 'LO-11-02', type: 'KNOWLEDGE', description: 'Lista systemiska komplikationer vid crush syndrome', sortOrder: 2 },
    { chapterNumber: 11, code: 'LO-11-03', type: 'APPLICATION', description: 'Genomföra pre-release förberedelser före friläggning', sortOrder: 3 },
    { chapterNumber: 11, code: 'LO-11-04', type: 'APPLICATION', description: 'Implementera njurskyddande behandling vid crush syndrome', sortOrder: 4 },

    // Kapitel 12: Speciella populationer
    { chapterNumber: 12, code: 'LO-12-01', type: 'KNOWLEDGE', description: 'Identifiera särskilda överväganden för äldre traumapatienter', sortOrder: 1 },
    { chapterNumber: 12, code: 'LO-12-02', type: 'APPLICATION', description: 'Anpassa handläggning för gravida traumapatienter', sortOrder: 2 },
    { chapterNumber: 12, code: 'LO-12-03', type: 'COMPREHENSION', description: 'Förstå risker hos immunsupprimerade patienter', sortOrder: 3 },
    { chapterNumber: 12, code: 'LO-12-04', type: 'APPLICATION', description: 'Hantera antikoagulantia hos äldre traumapatienter', sortOrder: 4 },

    // Kapitel 13: DCO
    { chapterNumber: 13, code: 'LO-13-01', type: 'KNOWLEDGE', description: 'Beskriva principen bakom Damage Control Orthopaedics', sortOrder: 1 },
    { chapterNumber: 13, code: 'LO-13-02', type: 'KNOWLEDGE', description: 'Lista fysiologiska och skadefaktorer som indikerar DCO', sortOrder: 2 },
    { chapterNumber: 13, code: 'LO-13-03', type: 'ANALYSIS', description: 'Besluta om DCO vs. definitivkirurgi baserat på patientens fysiologi', sortOrder: 3 },
    { chapterNumber: 13, code: 'LO-13-04', type: 'COMPREHENSION', description: 'Förklara de tre faserna i Damage Control Surgery', sortOrder: 4 },

    // Kapitel 14: Transport
    { chapterNumber: 14, code: 'LO-14-01', type: 'KNOWLEDGE', description: 'Beskriva MIST-rapportens komponenter', sortOrder: 1 },
    { chapterNumber: 14, code: 'LO-14-02', type: 'APPLICATION', description: 'Immobilisera frakturer korrekt för transport', sortOrder: 2 },
    { chapterNumber: 14, code: 'LO-14-03', type: 'APPLICATION', description: 'Välja rätt immobiliseringshjälpmedel för olika skadetyper', sortOrder: 3 },
    { chapterNumber: 14, code: 'LO-14-04', type: 'ANALYSIS', description: 'Bedöma behov av transport till traumacenter', sortOrder: 4 },

    // Kapitel 15: Dokumentation
    { chapterNumber: 15, code: 'LO-15-01', type: 'KNOWLEDGE', description: 'Lista vilka aspekter som ska dokumenteras vid initial traumabedömning', sortOrder: 1 },
    { chapterNumber: 15, code: 'LO-15-02', type: 'COMPREHENSION', description: 'Förstå juridiska aspekter av informerat samtycke och nödrätt', sortOrder: 2 },
    { chapterNumber: 15, code: 'LO-15-03', type: 'APPLICATION', description: 'Dokumentera neurovaskulär status korrekt', sortOrder: 3 },
    { chapterNumber: 15, code: 'LO-15-04', type: 'APPLICATION', description: 'Fotografera och dokumentera öppna sår enligt rutin', sortOrder: 4 },

    // Kapitel 16: Teamarbete
    { chapterNumber: 16, code: 'LO-16-01', type: 'KNOWLEDGE', description: 'Beskriva SBAR-strukturen för kommunikation', sortOrder: 1 },
    { chapterNumber: 16, code: 'LO-16-02', type: 'APPLICATION', description: 'Tillämpa closed-loop kommunikation i traumateam', sortOrder: 2 },
    { chapterNumber: 16, code: 'LO-16-03', type: 'COMPREHENSION', description: 'Förstå traumateamets roller och teamledarens ansvar', sortOrder: 3 },
    { chapterNumber: 16, code: 'LO-16-04', type: 'SYNTHESIS', description: 'Genomföra strukturerad debriefing efter traumafall', sortOrder: 4 },

    // Kapitel 17: Examination
    { chapterNumber: 17, code: 'LO-17-01', type: 'KNOWLEDGE', description: 'Beskriva ORTAC-examinationens upplägg och krav', sortOrder: 1 },
    { chapterNumber: 17, code: 'LO-17-02', type: 'APPLICATION', description: 'Demonstrera praktiska färdigheter på OSCE-stationer', sortOrder: 2 },
    { chapterNumber: 17, code: 'LO-17-03', type: 'SYNTHESIS', description: 'Integrera teoretisk kunskap och praktiska färdigheter i fallbaserad examination', sortOrder: 3 },
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

function getSalterHarrisSVG(): string {
  return `<svg viewBox="0 0 800 550" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: white; }
    .bone { fill: #f5f5dc; stroke: #8b7355; stroke-width: 2; }
    .physis { fill: #3498db; }
    .fracture { stroke: #e74c3c; stroke-width: 3; fill: none; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">Salter-Harris Klassifikation - Pediatriska Fyseolys</text>
  <text x="400" y="55" text-anchor="middle" style="font: 12px sans-serif; fill: #666;">SALTR: Same, Above, Lower, Through, Rammed</text>

  <!-- Type I -->
  <g transform="translate(50, 80)">
    <rect x="0" y="0" width="120" height="180" fill="#27ae60" rx="8"/>
    <text x="60" y="25" text-anchor="middle" class="header">TYP I</text>
    <rect x="35" y="40" width="50" height="50" class="bone"/>
    <rect x="30" y="90" width="60" height="8" class="physis"/>
    <rect x="25" y="98" width="70" height="60" class="bone"/>
    <path d="M25 94 L95 94" class="fracture"/>
    <text x="60" y="175" text-anchor="middle" class="text">Genom fysen</text>
  </g>

  <!-- Type II -->
  <g transform="translate(190, 80)">
    <rect x="0" y="0" width="120" height="180" fill="#2ecc71" rx="8"/>
    <text x="60" y="25" text-anchor="middle" class="header">TYP II</text>
    <rect x="35" y="40" width="50" height="50" class="bone"/>
    <rect x="30" y="90" width="60" height="8" class="physis"/>
    <rect x="25" y="98" width="70" height="60" class="bone"/>
    <path d="M25 94 L60 94 L85 130" class="fracture"/>
    <text x="60" y="175" text-anchor="middle" class="text">Fys + metafys</text>
  </g>

  <!-- Type III -->
  <g transform="translate(330, 80)">
    <rect x="0" y="0" width="120" height="180" fill="#f39c12" rx="8"/>
    <text x="60" y="25" text-anchor="middle" class="header">TYP III</text>
    <rect x="35" y="40" width="50" height="50" class="bone"/>
    <rect x="30" y="90" width="60" height="8" class="physis"/>
    <rect x="25" y="98" width="70" height="60" class="bone"/>
    <path d="M60 40 L60 94 L95 94" class="fracture"/>
    <text x="60" y="175" text-anchor="middle" class="text">Fys + epifys</text>
  </g>

  <!-- Type IV -->
  <g transform="translate(470, 80)">
    <rect x="0" y="0" width="120" height="180" fill="#e74c3c" rx="8"/>
    <text x="60" y="25" text-anchor="middle" class="header">TYP IV</text>
    <rect x="35" y="40" width="50" height="50" class="bone"/>
    <rect x="30" y="90" width="60" height="8" class="physis"/>
    <rect x="25" y="98" width="70" height="60" class="bone"/>
    <path d="M50 40 L60 94 L80 158" class="fracture"/>
    <text x="60" y="175" text-anchor="middle" class="text">Genom alla tre</text>
  </g>

  <!-- Type V -->
  <g transform="translate(610, 80)">
    <rect x="0" y="0" width="120" height="180" fill="#c0392b" rx="8"/>
    <text x="60" y="25" text-anchor="middle" class="header">TYP V</text>
    <rect x="35" y="40" width="50" height="50" class="bone"/>
    <rect x="30" y="85" width="60" height="16" class="physis" style="fill: #e74c3c;"/>
    <rect x="25" y="101" width="70" height="57" class="bone"/>
    <text x="60" y="175" text-anchor="middle" class="text">Kompression</text>
  </g>

  <!-- Prognosis table -->
  <rect x="50" y="290" width="700" height="120" fill="#1a5276" rx="8"/>
  <text x="400" y="320" text-anchor="middle" class="header">PROGNOS OCH RISK FÖR TILLVÄXTRUBBNING</text>
  <text x="70" y="350" class="text">Typ I-II:</text>
  <text x="140" y="350" class="text" style="fill: #2ecc71;">God prognos - låg risk</text>
  <text x="70" y="375" class="text">Typ III:</text>
  <text x="140" y="375" class="text" style="fill: #f39c12;">Risk för tillväxtrubbning - kräver uppföljning</text>
  <text x="70" y="400" class="text">Typ IV-V:</text>
  <text x="140" y="400" class="text" style="fill: #e74c3c;">HÖG risk - noggrann uppföljning krävs</text>

  <!-- Key message -->
  <rect x="50" y="430" width="700" height="50" fill="#e74c3c" rx="8"/>
  <text x="400" y="462" text-anchor="middle" class="header">Alla fysskador hos barn kräver uppföljning för att utesluta tillväxtrubbning!</text>
</svg>`;
}

function getCrushSyndromeSVG(): string {
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: white; }
    .timeline { stroke: #1a5276; stroke-width: 4; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">Crush Syndrome - Tidslinje och Behandling</text>

  <!-- Timeline -->
  <line x1="100" y1="100" x2="700" y2="100" class="timeline"/>
  <circle cx="100" cy="100" r="8" fill="#1a5276"/>
  <circle cx="300" cy="100" r="8" fill="#1a5276"/>
  <circle cx="500" cy="100" r="8" fill="#1a5276"/>
  <circle cx="700" cy="100" r="8" fill="#1a5276"/>

  <text x="100" y="85" text-anchor="middle" style="font: 12px sans-serif; fill: #333;">Kompression</text>
  <text x="300" y="85" text-anchor="middle" style="font: 12px sans-serif; fill: #333;">Pre-release</text>
  <text x="500" y="85" text-anchor="middle" style="font: 12px sans-serif; fill: #333;">Friläggning</text>
  <text x="700" y="85" text-anchor="middle" style="font: 12px sans-serif; fill: #333;">Post-release</text>

  <!-- Phase 1: During compression -->
  <rect x="50" y="130" width="200" height="140" fill="#3498db" rx="8"/>
  <text x="150" y="155" text-anchor="middle" class="header">UNDER KOMPRESSION</text>
  <text x="60" y="180" class="text">Patofysiologi:</text>
  <text x="60" y="200" class="text">• Muskelischemi</text>
  <text x="60" y="220" class="text">• Cellskada</text>
  <text x="60" y="240" class="text">• Frisättning av:</text>
  <text x="70" y="260" class="text">  Myoglobin, K+, fosfat</text>

  <!-- Phase 2: Pre-release -->
  <rect x="275" y="130" width="200" height="140" fill="#e74c3c" rx="8"/>
  <text x="375" y="155" text-anchor="middle" class="header">PRE-RELEASE (KRITISKT!)</text>
  <text x="285" y="180" class="text">INNAN friläggning:</text>
  <text x="285" y="200" class="text">✓ IV-access</text>
  <text x="285" y="220" class="text">✓ Vätska: 1-1.5 L/timme</text>
  <text x="285" y="240" class="text">✓ EKG-övervakning</text>
  <text x="285" y="260" class="text">✓ Bikarbonat vid acidos</text>

  <!-- Phase 3: Post-release -->
  <rect x="500" y="130" width="200" height="140" fill="#f39c12" rx="8"/>
  <text x="600" y="155" text-anchor="middle" class="header">POST-RELEASE</text>
  <text x="510" y="180" class="text">Systemiska risker:</text>
  <text x="510" y="200" class="text">⚠ Hyperkalemi → Arytmi</text>
  <text x="510" y="220" class="text">⚠ Myoglobinuri → Njursvikt</text>
  <text x="510" y="240" class="text">⚠ Metabol acidos</text>
  <text x="510" y="260" class="text">⚠ Hypovolemi</text>

  <!-- Treatment box -->
  <rect x="50" y="300" width="700" height="150" fill="#1a5276" rx="8"/>
  <text x="400" y="330" text-anchor="middle" class="header">BEHANDLING EFTER FRILÄGGNING</text>
  <text x="70" y="360" class="text">Njurskydd:</text>
  <text x="150" y="360" class="text">• Aggressiv vätskebehandling • Alkalinisering av urin • Forcerad diures</text>
  <text x="70" y="390" class="text">Monitorering:</text>
  <text x="150" y="390" class="text">• Kontinuerligt EKG • Elektrolyter var 2-4:e timme • Urinproduktion • CK/Myoglobin</text>
  <text x="70" y="420" class="text">Beredskap:</text>
  <text x="150" y="420" class="text">• Dialys • Kaliumsänkande behandling • Kalcium vid hyperkalemi</text>

  <!-- Warning -->
  <rect x="50" y="470" width="700" height="70" fill="#c0392b" rx="8"/>
  <text x="400" y="500" text-anchor="middle" class="header">⚠ VARNING: Dödlig hyperkalemi kan uppstå SEKUNDER efter friläggning!</text>
  <text x="400" y="525" text-anchor="middle" class="text">Förberedelse är KRITISKT - starta behandling INNAN plattan lyfts</text>
</svg>`;
}

function getTransportSVG(): string {
  return `<svg viewBox="0 0 800 550" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: white; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">Transport och Immobilisering - Beslutsträd</text>

  <!-- MIST Report -->
  <rect x="50" y="60" width="300" height="130" fill="#3498db" rx="8"/>
  <text x="200" y="85" text-anchor="middle" class="header">MIST-RAPPORT</text>
  <text x="60" y="110" class="text">M - Mechanism (skademekanism)</text>
  <text x="60" y="130" class="text">I - Injuries (skador)</text>
  <text x="60" y="150" class="text">S - Signs (vitalparametrar)</text>
  <text x="60" y="170" class="text">T - Treatment (given behandling)</text>

  <!-- Before transport -->
  <rect x="400" y="60" width="350" height="130" fill="#27ae60" rx="8"/>
  <text x="575" y="85" text-anchor="middle" class="header">FÖRE TRANSPORT - Checklista</text>
  <text x="410" y="110" class="text">✓ Alla frakturer immobiliserade</text>
  <text x="410" y="130" class="text">✓ Neurovaskulär status dokumenterad</text>
  <text x="410" y="150" class="text">✓ Mottagande enhet förvarnad</text>
  <text x="410" y="170" class="text">✓ Monitoreringsplan etablerad</text>

  <!-- Immobilization table -->
  <rect x="50" y="210" width="700" height="180" fill="#1a5276" rx="8"/>
  <text x="400" y="235" text-anchor="middle" class="header">IMMOBILISERINGSHJÄLPMEDEL</text>
  <text x="100" y="265" class="text" style="font-weight: bold;">SKADA</text>
  <text x="350" y="265" class="text" style="font-weight: bold;">HJÄLPMEDEL</text>
  <text x="550" y="265" class="text" style="font-weight: bold;">PRINCIP</text>
  <line x1="60" y1="275" x2="740" y2="275" stroke="white" stroke-width="1"/>
  <text x="70" y="300" class="text">Halsrygg</text>
  <text x="350" y="300" class="text">Halskrage + spinalboard</text>
  <text x="550" y="300" class="text">Neutral position</text>
  <text x="70" y="325" class="text">Bäcken</text>
  <text x="350" y="325" class="text">Bäckenbälte</text>
  <text x="550" y="325" class="text">Över trochantrarna</text>
  <text x="70" y="350" class="text">Lårben</text>
  <text x="350" y="350" class="text">Traktionsskena (Thomas)</text>
  <text x="550" y="350" class="text">Traktion + immob.</text>
  <text x="70" y="375" class="text">Underben</text>
  <text x="350" y="375" class="text">Gipsskena</text>
  <text x="550" y="375" class="text">Led ovan + nedan</text>

  <!-- Trauma center criteria -->
  <rect x="50" y="410" width="340" height="120" fill="#e74c3c" rx="8"/>
  <text x="220" y="435" text-anchor="middle" class="header">TRANSPORT TILL TRAUMACENTER</text>
  <text x="60" y="460" class="text">• Multipla frakturer</text>
  <text x="60" y="480" class="text">• Kärlskada</text>
  <text x="60" y="500" class="text">• Öppen fraktur typ III</text>
  <text x="60" y="520" class="text">• Bäckeninstabilitet</text>

  <!-- Key principle -->
  <rect x="410" y="410" width="340" height="120" fill="#f39c12" rx="8"/>
  <text x="580" y="435" text-anchor="middle" class="header">GRUNDPRINCIP</text>
  <text x="420" y="465" class="text" style="font: bold 14px sans-serif;">Immobilisera leden OVANFÖR och</text>
  <text x="420" y="490" class="text" style="font: bold 14px sans-serif;">NEDANFÖR frakturen</text>
  <text x="420" y="520" class="text">Dokumentera neurovaskulär status</text>
</svg>`;
}

function getOSCESVG(): string {
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 20px sans-serif; fill: #1a5276; }
    .header { font: bold 14px sans-serif; fill: white; }
    .text { font: 12px sans-serif; fill: white; }
    .station { rx: 8; ry: 8; }
  </style>

  <text x="400" y="30" text-anchor="middle" class="title">ORTAC OSCE - Praktiska Stationer</text>

  <!-- Station 1 -->
  <rect x="50" y="60" width="220" height="100" fill="#e74c3c" class="station"/>
  <text x="160" y="85" text-anchor="middle" class="header">STATION 1</text>
  <text x="160" y="105" text-anchor="middle" class="text">Tourniquet-applikation</text>
  <text x="60" y="130" class="text">• Korrekt placering 5-7 cm prox</text>
  <text x="60" y="150" class="text">• Dokumentera tid</text>

  <!-- Station 2 -->
  <rect x="290" y="60" width="220" height="100" fill="#3498db" class="station"/>
  <text x="400" y="85" text-anchor="middle" class="header">STATION 2</text>
  <text x="400" y="105" text-anchor="middle" class="text">ABI-mätning</text>
  <text x="300" y="130" class="text">• Korrekt blodtrycksteknik</text>
  <text x="300" y="150" class="text">• Tolkning av värden</text>

  <!-- Station 3 -->
  <rect x="530" y="60" width="220" height="100" fill="#27ae60" class="station"/>
  <text x="640" y="85" text-anchor="middle" class="header">STATION 3</text>
  <text x="640" y="105" text-anchor="middle" class="text">Bäckenbälte</text>
  <text x="540" y="130" class="text">• Placering över trochantrarna</text>
  <text x="540" y="150" class="text">• Rätt åtdragning</text>

  <!-- Station 4 -->
  <rect x="50" y="180" width="220" height="100" fill="#9b59b6" class="station"/>
  <text x="160" y="205" text-anchor="middle" class="header">STATION 4</text>
  <text x="160" y="225" text-anchor="middle" class="text">Passiv töjningstest</text>
  <text x="60" y="250" class="text">• Teknik för kompartment</text>
  <text x="60" y="270" class="text">• Tolkning av fynd</text>

  <!-- Station 5 -->
  <rect x="290" y="180" width="220" height="100" fill="#f39c12" class="station"/>
  <text x="400" y="205" text-anchor="middle" class="header">STATION 5</text>
  <text x="400" y="225" text-anchor="middle" class="text">LIMB-bedömning</text>
  <text x="300" y="250" class="text">• Systematisk undersökning</text>
  <text x="300" y="270" class="text">• Identifiera varningssignaler</text>

  <!-- Station 6 -->
  <rect x="530" y="180" width="220" height="100" fill="#1abc9c" class="station"/>
  <text x="640" y="205" text-anchor="middle" class="header">STATION 6</text>
  <text x="640" y="225" text-anchor="middle" class="text">SBAR-kommunikation</text>
  <text x="540" y="250" class="text">• Strukturerad rapport</text>
  <text x="540" y="270" class="text">• Closed-loop</text>

  <!-- Exam requirements -->
  <rect x="50" y="310" width="340" height="150" fill="#1a5276" rx="8"/>
  <text x="220" y="340" text-anchor="middle" class="header">EXAMENSKRAV</text>
  <text x="60" y="370" class="text">Teoretiskt prov (MCQ):</text>
  <text x="200" y="370" class="text">60 frågor, 70% för godkänt</text>
  <text x="60" y="400" class="text">OSCE-stationer:</text>
  <text x="200" y="400" class="text">Alla 6 måste godkännas</text>
  <text x="60" y="430" class="text">LIPUS-utvärdering:</text>
  <text x="200" y="430" class="text">Måste genomföras</text>

  <!-- Certificate info -->
  <rect x="410" y="310" width="340" height="150" fill="#27ae60" rx="8"/>
  <text x="580" y="340" text-anchor="middle" class="header">CERTIFIKAT</text>
  <text x="420" y="370" class="text">Giltighetstid: 4 år</text>
  <text x="420" y="400" class="text">Recertifiering möjlig</text>
  <text x="420" y="430" class="text">LIPUS-godkänd kurs</text>

  <!-- Preparation tips -->
  <rect x="50" y="480" width="700" height="80" fill="#f39c12" rx="8"/>
  <text x="400" y="510" text-anchor="middle" class="header">FÖRBEREDELSE</text>
  <text x="70" y="540" class="text">Teoretisk: Läs alla kapitel + övningsquiz + spaced repetition</text>
  <text x="450" y="540" class="text">Praktisk: Öva på docka + parträning</text>
</svg>`;
}

// ============================================
// EPA - ENTRUSTABLE PROFESSIONAL ACTIVITIES
// ============================================

interface EPAData {
  code: string;
  title: string;
  description: string;
  objectives: string[];
  criteria: string[];
  sortOrder: number;
}

function getEPAs(): EPAData[] {
  return [
    {
      code: 'EPA-01',
      title: 'Ortopedisk primär bedömning av extremitet och bäcken',
      description: `Genomföra en systematisk primär bedömning av extremiteter och bäcken vid trauma, identifiera tidskritiska tillstånd och initiera akuta åtgärder.

Denna EPA omfattar förmågan att snabbt och strukturerat bedöma skadeomfattning vid extremitets- och bäckentrauma, prioritera enligt ABCDE-principen och identifiera tillstånd som kräver omedelbar intervention.`,
      objectives: [
        'Utföra LIMB-protokollet systematiskt',
        'Identifiera tidskritiska tillstånd (massiv blödning, kärlskada, kompartment, öppen fraktur)',
        'Prioritera skador enligt svårighetsgrad och tidsfönster',
        'Dokumentera primär bedömning enligt strukturerat format'
      ],
      criteria: [
        'Genomför ABCDE-bedömning innan extremitetsfokuserad undersökning',
        'Identifierar synliga hot mot liv och extremitet inom 2 minuter',
        'Använder strukturerat format (LIMB) för bedömning',
        'Kommunicerar fynd tydligt till traumateam',
        'Initierar akuta åtgärder vid behov',
        'Dokumenterar fullständigt och korrekt'
      ],
      sortOrder: 1
    },
    {
      code: 'EPA-02',
      title: 'Neurovaskulär status och re-eval efter åtgärd',
      description: `Bedöma och dokumentera neurovaskulär status distalt om skada samt utföra systematisk re-evaluering efter intervention.

Kompetensen omfattar förmågan att identifiera nervskador, bedöma cirkulation med kliniska metoder och ABI, samt följa upp status efter reposition, immobilisering eller annan åtgärd.`,
      objectives: [
        'Utföra korrekt neurovaskulär undersökning',
        'Mäta och tolka ABI (Ankle-Brachial Index)',
        'Bedöma motorik och sensorik systematiskt',
        'Utföra re-evaluering efter alla interventioner'
      ],
      criteria: [
        'Kontrollerar puls, kapillär återfyllnad och hudtemperatur',
        'Utför korrekt ABI-mätning med rätt teknik',
        'Testar motorik och sensorik i alla relevanta dermatom/myotom',
        'Dokumenterar status FÖRE och EFTER varje åtgärd',
        'Identifierar försämring och eskalerar vid behov',
        'Använder doppler vid icke-palpabla pulsar'
      ],
      sortOrder: 2
    },
    {
      code: 'EPA-03',
      title: 'Initial handläggning av öppen fraktur',
      description: `Genomföra initial bedömning och behandling av öppen fraktur enligt BOAST-riktlinjer, inklusive antibiotikaadministration, såromhändertagande och stabilisering.

Kompetensen omfattar klassificering enligt Gustilo-Anderson, tidig antibiotikaadministration, korrekt sårförband och planering för kirurgisk behandling.`,
      objectives: [
        'Klassificera öppen fraktur enligt Gustilo-Anderson',
        'Administrera antibiotika inom 1 timme',
        'Utföra korrekt såromhändertagande',
        'Planera kirurgisk behandling enligt tidsfönster'
      ],
      criteria: [
        'Identifierar öppen fraktur korrekt (inkl. indirekta tecken)',
        'Ger IV antibiotika inom 60 minuter enligt protokoll',
        'Täcker sår med steril fuktad kompress',
        'Fotograferar sår före kompression (om möjligt)',
        'Immobiliserar fraktur i funktionellt läge',
        'Dokumenterar tid för antibiotika och sårhantering',
        'Planerar debridering inom 24 timmar för alla Gustilo-typer (BOAST 4 2017 - kvalitet viktigare än hastighet)'
      ],
      sortOrder: 3
    },
    {
      code: 'EPA-04',
      title: 'Temporär stabilisering och DCO för långbensfraktur',
      description: `Utföra temporär stabilisering av långbensfrakturer och tillämpa Damage Control Orthopaedics-principer vid polytrauma.

Kompetensen omfattar val av immobiliseringsmetod, principer för extern fixation som temporär åtgärd, och bedömning av patientens fysiologiska status för optimal timing av definitiv kirurgi.`,
      objectives: [
        'Välja lämplig immobiliseringsmetod',
        'Förstå indikationer för DCO',
        'Bedöma "safe definitive surgery" vs temporär stabilisering',
        'Planera definitiv behandling baserat på fysiologisk status'
      ],
      criteria: [
        'Väljer rätt immobilisering (gips, splint, traktion, extern fix)',
        'Kontrollerar rotation, längd och alignment',
        'Utvärderar Pape-kriterierna för DCO-behov',
        'Dokumenterar neurovaskulär status före/efter',
        'Kommunicerar plan för definitiv behandling',
        'Identifierar riskpatienter (borderline, unstable, in extremis)'
      ],
      sortOrder: 4
    },
    {
      code: 'EPA-05',
      title: 'Misstänkt compartment syndrome och akut åtgärdsplan',
      description: `Diagnostisera misstänkt kompartmentsyndrom, utföra tryckbedömning och eskalera till akut fasciotomi vid behov.

Kompetensen omfattar klinisk bedömning (6 P), kompartmenttryckmätning, tolkning av delta-tryck och omedelbar eskalering vid konstaterat eller misstänkt kompartmentsyndrom.`,
      objectives: [
        'Identifiera kliniska tecken på kompartmentsyndrom',
        'Utföra eller tolka kompartmenttryckmätning',
        'Förstå tidsfönster och konsekvenser',
        'Eskalera omedelbart vid misstanke'
      ],
      criteria: [
        'Kontrollerar 6 P systematiskt (Pain, Pressure, Passive stretch pain, Paresthesia, Paralysis, Pulselessness)',
        'Förstår att smärta vid passiv töjning är tidigt tecken',
        'Mäter kompartmenttryck vid oklarhet',
        'Tolkar delta-tryck korrekt (< 30 mmHg = fasciotomi)',
        'Eskalerar OMEDELBART vid klinisk misstanke',
        'Dokumenterar tidpunkter och status',
        'Förstår att pulsförlust är sent tecken'
      ],
      sortOrder: 5
    },
    {
      code: 'EPA-06',
      title: 'Misstänkt bäckenringfraktur med hemodynamisk påverkan',
      description: `Identifiera och initialt hantera instabil bäckenringfraktur med hemodynamisk påverkan, inklusive bäckenbälte och aktivering av massivt transfusionsprotokoll.

Kompetensen omfattar klinisk och radiologisk bedömning av bäckenstabilitet, korrekt applicering av bäckenbälte, och koordinering med traumateam för definitiv behandling.`,
      objectives: [
        'Identifiera instabil bäckenfraktur kliniskt och radiologiskt',
        'Applicera bäckenbälte korrekt',
        'Aktivera MTP vid behov',
        'Planera transport till traumacenter'
      ],
      criteria: [
        'Undviker upprepad bäckenmanipulation',
        'Placerar bäckenbälte över trochantrarna (EJ crista)',
        'Applicerar bälte inom minuter vid misstanke',
        'Aktiverar MTP vid hemodynamisk instabilitet + bäckenfraktur',
        'Koordinerar med kärlkirurg/interventionist',
        'Dokumenterar tidpunkt för bälte och hemodynamisk status'
      ],
      sortOrder: 6
    },
    {
      code: 'EPA-07',
      title: 'Akut ledluxation och reposition',
      description: `Utföra säker och effektiv reposition av akut ledluxation, med adekvat smärtlindring och neurovaskulär bedömning före och efter.

Kompetensen omfattar identifiering av luxation, planering för analgesi/sedering, repositionsteknik och efterföljande stabilisering och uppföljning.`,
      objectives: [
        'Identifiera luxation kliniskt och radiologiskt',
        'Planera adekvat smärtlindring/sedering',
        'Utföra skonsam reposition',
        'Bedöma och dokumentera neurovaskulär status före/efter'
      ],
      criteria: [
        'Dokumenterar neurovaskulär status före reposition',
        'Säkerställer adekvat analgesi enligt lokala rutiner',
        'Använder etablerad repositionsteknik',
        'Verifierar reposition kliniskt och radiologiskt',
        'Dokumenterar neurovaskulär status efter',
        'Immobiliserar led i stabilt läge',
        'Identifierar irreponibel luxation och eskalerar'
      ],
      sortOrder: 7
    },
    {
      code: 'EPA-08',
      title: 'Fraktur med hotad hud eller cirkulation',
      description: `Hantera fraktur med hotad hud (impending open fracture) eller cirkulationspåverkan, genom snabb reposition och stabilisering.

Kompetensen omfattar identifiering av hotad hud eller cirkulation, snabb men kontrollerad reposition, och eskalering till kärlkirurg vid kvarstående ischemi.`,
      objectives: [
        'Identifiera fraktur med hotad hud eller cirkulation',
        'Utföra snabb reposition/realignment',
        'Eskalera till kärlkirurg vid behov',
        'Dokumentera tidslinje för ischemi'
      ],
      criteria: [
        'Identifierar spänd/bleknad hud över fraktur',
        'Bedömer cirkulationsstatus systematiskt',
        'Utför snabb realignment vid cirkulationspåverkan',
        'Kontrollerar cirkulation efter reposition',
        'Eskalerar omedelbart vid kvarstående ischemi',
        'Dokumenterar ischemitid och status vid varje kontroll'
      ],
      sortOrder: 8
    },
    {
      code: 'EPA-09',
      title: 'Ortopedisk sekundär survey och skadepanoramaplan',
      description: `Utföra komplett ortopedisk sekundär undersökning och upprätta plan för skadepanorama vid polytrauma.

Kompetensen omfattar systematisk genomgång av alla extremiteter och ryggrad, identifiering av samtliga skador, och prioritering för behandling.`,
      objectives: [
        'Genomföra fullständig sekundär survey av extremiteter',
        'Identifiera samtliga skador inklusive missade primärt',
        'Upprätta prioriteringsplan för behandling',
        'Kommunicera plan till alla inblandade'
      ],
      criteria: [
        'Undersöker systematiskt alla extremiteter och ryggrad',
        'Dokumenterar alla skador med position och svårighetsgrad',
        'Beställer adekvat bilddiagnostik',
        'Prioriterar skador efter akuthet och tidsfönster',
        'Upprättar behandlingsplan med tidshorisont',
        'Kommunicerar plan till patient, team och anhöriga'
      ],
      sortOrder: 9
    },
    {
      code: 'EPA-10',
      title: 'Säker ortopedisk teamkommunikation',
      description: `Kommunicera effektivt inom traumateam och vid överrapportering med strukturerade format som SBAR och closed-loop.

Kompetensen omfattar strukturerad kommunikation, tydlig överrapportering, och förmåga att fungera i traumateam med god CRM.`,
      objectives: [
        'Använda SBAR-format vid rapportering',
        'Tillämpa closed-loop kommunikation',
        'Kommunicera effektivt i stressade situationer',
        'Leda eller delta i team brief och debrief'
      ],
      criteria: [
        'Strukturerar rapporter enligt SBAR',
        'Använder closed-loop konsekvent',
        'Speak-up vid observerade risker',
        'Deltar aktivt i team brief före procedur',
        'Bidrar konstruktivt till debrief',
        'Anpassar kommunikation efter mottagare'
      ],
      sortOrder: 10
    },
    {
      code: 'EPA-11',
      title: 'Initial sepsis/infektionsprevention vid traumaskada',
      description: `Identifiera infektionsrisk vid traumaskada och initiera förebyggande åtgärder inklusive antibiotikaprofylax och tetanusskydd.

Kompetensen omfattar riskbedömning, tidig antibiotikaadministration vid indikation, och korrekt tetanusprofylax.`,
      objectives: [
        'Bedöma infektionsrisk vid olika skadetyper',
        'Administrera korrekt antibiotikaprofylax',
        'Ge tetanusprofylax enligt riktlinjer',
        'Identifiera tidiga infektionstecken'
      ],
      criteria: [
        'Bedömer infektionsrisk vid öppen fraktur, kontaminering',
        'Ger antibiotika enligt evidensbaserat protokoll',
        'Kontrollerar tetanusstatus och ger profylax vid behov',
        'Dokumenterar profylax med tid och preparat',
        'Följer upp för tidiga infektionstecken',
        'Eskalerar vid misstanke om sepsis'
      ],
      sortOrder: 11
    },
    {
      code: 'EPA-12',
      title: 'Patientsäker check vid ortopediska akutingrepp',
      description: `Genomföra patientsäkra procedurer genom systematisk check före, under och efter akuta ortopediska ingrepp.

Kompetensen omfattar korrekt patientidentifiering, sidmarkering, time-out, och säker överlämning efter procedur.`,
      objectives: [
        'Utföra korrekt patientidentifiering',
        'Genomföra sidmarkering vid lateraliserade ingrepp',
        'Leda eller delta i time-out',
        'Säkerställa säker överlämning efter procedur'
      ],
      criteria: [
        'Verifierar rätt patient med två identifierare',
        'Markerar rätt sida före procedur',
        'Deltar aktivt i time-out med bekräftelse',
        'Kontrollerar utrustning och implantat före start',
        'Genomför sign-out efter procedur',
        'Överlämnar med strukturerad rapport'
      ],
      sortOrder: 12
    }
  ];
}

// ============================================
// OSCE STATIONER
// ============================================

interface OSCEStationData {
  code: string;
  title: string;
  scenario: string;
  checklist: string[];
  criticalErrors: string[];
  timeLimit: number;
  sortOrder: number;
}

function getOSCEStations(): OSCEStationData[] {
  return [
    {
      code: 'OSCE-01',
      title: 'Ortopedisk primär bedömning',
      scenario: `Du arbetar på akutmottagningen när en 45-årig man inkommer efter motorcykelolycka. Patienten är vid medvetande men smärtpåverkad. Han har tydlig deformitet av höger lår och blödning från ett sår på underbenet.

Din uppgift: Genomför en systematisk ortopedisk primär bedömning och kommunicera dina fynd.

Tillgängligt: Traumabord, undersökningsmaterial, docka/standardiserad patient.`,
      checklist: [
        'Bekräftar stabilitet (ABCDE) i samarbete med traumateam',
        'Identifierar blödning från extremitet/bäcken och initierar hemostas',
        'Applicerar tourniquet inom 3 minuter vid massiv extremitetsblödning (TCCC 2024)',
        'Utför snabb neurovaskulär status distalt (puls, kapillär refill, sensorik, motorik)',
        'Utför grov realignment vid deformitet med hotad hud/cirkulation',
        'Bedömer sårkontamination (jord, grus, organiskt material) och dokumenterar',
        'Immobiliserar korrekt med adekvat metod',
        'Ordinerar smärtlindring',
        'Dokumenterar status före och efter åtgärd',
        'Kommunicerar fynd strukturerat till team'
      ],
      criticalErrors: [
        'Missar livshotande blödning',
        'Fördröjer tourniquet >3 minuter vid massiv blödning',
        'Utför extremitetsundersökning före ABCDE-stabilisering',
        'Missar neurovaskulär undersökning',
        'Förvärrar skada genom olämplig hantering'
      ],
      timeLimit: 10,
      sortOrder: 1
    },
    {
      code: 'OSCE-02',
      title: 'Bäckenringfraktur och bäckenbinda',
      scenario: `En 32-årig kvinna inkommer efter fall från 4 meters höjd. Hon är takykard (puls 120) och har blodtryck 85/60. Bäckenet är instabilt vid försiktig palpation. Röntgen bekräftar bäckenringfraktur.

Din uppgift: Applicera bäckenbinda korrekt och kommunicera din handläggningsplan.

Tillgängligt: Bäckenbinda (SAM Pelvic Sling eller motsvarande), docka.`,
      checklist: [
        'Anger korrekt indikation: misstänkt bäckenfraktur + hemodynamisk instabilitet',
        'Undviker upprepad bäckenmanipulation',
        'Applicerar bäckenbinda i rätt nivå (2-3 cm ovanför trochanter major för optimal stabilisering)',
        'Mäter/bedömer bäckenomkrets för rätt bältesstorlek',
        'Drar åt bälte med korrekt kraft (sluter bäckenet - ska känna/höra "klick")',
        'Säkerställer tidig applikation (inom minuter vid misstanke)',
        'Aktiverar MTP-protokoll vid SBP < 90 och otillräckligt svar på vätska',
        'Planerar transportnivå (major trauma center vid instabil patient)',
        'Dokumenterar tidpunkt för bälte och hemodynamisk respons'
      ],
      criticalErrors: [
        'Placerar binda på fel nivå (över crista istället för trochanter)',
        'Upprepad bäckenmanipulation',
        'Missar att aktivera MTP vid hemodynamisk instabilitet',
        'Fördröjd applikation (> 10 minuter från beslut)',
        'Applicerar binda med otillräcklig spänning (bäckenet inte stabiliserat)'
      ],
      timeLimit: 8,
      sortOrder: 2
    },
    {
      code: 'OSCE-03',
      title: 'Öppen fraktur akutflöde',
      scenario: `En 28-årig man inkommer efter MC-olycka med öppen tibiafraktur. Såret är 3 cm långt med synlig benväv. Foten är rosig med palpabel a. dorsalis pedis-puls. Ankomsttid: kl 14:30.

Din uppgift: Genomför initial handläggning av den öppna frakturen.

Tillgängligt: Antibiotika (kloxacillin, gentamicin), sterilt förband, splintmaterial.`,
      checklist: [
        'Ger IV antibiotika inom 1 timme (Gustilo I-II: Cefazolin; Gustilo III: + Gentamicin)',
        'Klassificerar skadan (Gustilo I-IIIC) och väljer rätt antibiotikaregim',
        'Bedömer och dokumenterar tetanusstatus - ger profylax vid behov',
        'Bedömer och dokumenterar neurovaskulär status före åtgärd',
        'Fotograferar sår (om möjligt) före kompression',
        'Täcker sår med steril fuktad kompress - INTE upprepade sårundersökningar',
        'Utför realignment om felställning föreligger',
        'Immobiliserar (splint) och återbedömer neurovaskulär status',
        'Dokumenterar tidsstämplar: skada → ankomst → antibiotika → planerad debridering'
      ],
      criticalErrors: [
        'Antibiotika ges inte inom 60 minuter',
        'Missar neurovaskulär undersökning',
        'Upprepad manipulation av sår/fraktur',
        'Missar tetanusbedömning',
        'Ingen plan för kirurgisk debridering'
      ],
      timeLimit: 10,
      sortOrder: 3
    },
    {
      code: 'OSCE-04',
      title: 'Compartment syndrome beslut och eskalering',
      scenario: `En 22-årig man med tibiafraktur (slutet, icke-dislokerad) i gips sedan 6 timmar. Han ringer att smärtan är svår trots smärtlindring. När du undersöker honom klagar han på domningar i foten och har kraftig smärta vid passiv töjning av tårna.

Din uppgift: Bedöm patienten, tolka fynden och besluta om åtgärd.

Tillgängligt: Kompartmenttryckmätare, smärtskala, patientjournal.`,
      checklist: [
        'Identifierar kliniska risktecken och alarmsymtom (6 P)',
        'Kontrollerar smärta vid passiv töjning av muskulaturen (tidigt tecken)',
        'Mäter kompartmenttryck vid oklarhet (eller anger när det är indicerat)',
        'Tolkar delta-tryck korrekt (ΔP < 30 mmHg = fasciotomi)',
        'Säkrar smärtlindring utan att maskera klinik',
        'Eskalerar omedelbart till kirurgiskt team vid misstanke',
        'Tar bort ALLA cirkulära förband (gips, linda)',
        'Dokumenterar tidpunkter, status och beslut'
      ],
      criticalErrors: [
        'Försenar bedömning eller eskalering vid klassiska tecken',
        'Lämnar cirkulärt förband intakt vid misstanke',
        'Tolkar pulsförlust som tidigt tecken (det är sent tecken)',
        'Ordinerar observans istället för akut åtgärd vid klinisk misstanke'
      ],
      timeLimit: 8,
      sortOrder: 4
    },
    {
      code: 'OSCE-05',
      title: 'Hotad extremitet - kärl och nerv',
      scenario: `En 55-årig kvinna med suprakondylär humerusfraktur efter fall. Underarmen är blek och pulslös. A. radialis palperas inte. Patienten kan inte sträcka fingrarna.

Din uppgift: Bedöm och hantera den hotade extremiteten.

Tillgängligt: Doppler, splintmaterial, telefon för konsultation.`,
      checklist: [
        'Kontrollerar puls, kapillär återfyllnad, hudtemperatur, färg',
        'Utför objektiv kärlbedömning (ABI eller Doppler) - ABI < 0.9 = kärlskada',
        'Dokumenterar nervstatus: radialis, ulnaris, medianus, ant. interosseus specifikt',
        'Utför snabb reposition vid deformitet med cirkulationspåverkan (< 5 min)',
        'Kontrollerar cirkulation och nervstatus omedelbart efter reposition',
        'Immobiliserar i funktionellt läge efter reposition',
        'Kontaktar BÅDE ortoped OCH kärlkirurg vid arteriell insufficiens',
        'Vid kvarstående ischemi efter reposition: kyl extremiteten, akut kärlkirurgi',
        'Dokumenterar ischemitid (varm vs kall) och status vid varje kontroll'
      ],
      criticalErrors: [
        'Fördröjd reposition vid tydlig ischemi (> 5 min)',
        'Ingen neurovaskulär kontroll efter reposition',
        'Kallar endast ortoped vid arteriell insufficiens (saknar kärlkirurg)',
        'Missar att dokumentera specifik nervstatus baseline',
        'Ingen dokumentation av ischemitid'
      ],
      timeLimit: 10,
      sortOrder: 5
    },
    {
      code: 'OSCE-06',
      title: 'Luxation och akut reposition',
      scenario: `En 30-årig man har ramlat från cykel och landat på utsträckt arm. Han har tydlig deformitet över axeln med "tom" glenoidalregion. Armen hålls i lätt abduktion.

Din uppgift: Bedöm patienten och planera/utför reposition.

Tillgängligt: Röntgenbilder (visar främre axelluxation), läkemedel för analgesi/sedering, mitella.`,
      checklist: [
        'Kontrollerar neurovaskulär status före reposition (spec. n. axillaris)',
        'Testar axillarisnerv motoriskt: deltoideus abduktion + sensorik över laterala axeln',
        'Granskar röntgenbilder för att utesluta fraktur',
        'Bedömer för posterior luxation (mekanism: epilepsi/elolycka, Y-projektion vid tveksamhet)',
        'Planerar analgesi/sedering enligt lokala rutiner',
        'Väljer och beskriver repositionsteknik (tex Cunningham, extern rotation)',
        'Utför reposition med skonsam teknik',
        'Kontrollerar neurovaskulär status efter reposition',
        'Dokumenterar status före och efter',
        'Immobiliserar i mitella och planerar uppföljning'
      ],
      criticalErrors: [
        'Försöker reposition utan neurovaskulär undersökning före',
        'Missar posterior luxation (felaktig diagnos)',
        'Ingen kontroll av röntgen för associerad fraktur',
        'Olämpligt våld vid repositionsförsök',
        'Ingen neurovaskulär kontroll efter reposition'
      ],
      timeLimit: 15,
      sortOrder: 6
    },
    {
      code: 'OSCE-07',
      title: 'Temporär stabilisering och DCO',
      scenario: `En 40-årig man inkommer med femurfraktur efter bilolycka. Han har även revbensfrakturer och lungkontusion. Han är hemodynamiskt stabil efter initial resuscitering men har förhöjda laktater (4.2 mmol/L) och är hypoterm (35.5°C).

Din uppgift: Planera stabilisering av femurfrakturen med hänsyn till patientens tillstånd.

Tillgängligt: Olika immobiliseringsmaterial, patientjournal med vitalparametrar.`,
      checklist: [
        'Väljer temporär metod (splint, traktion, extern fixation) baserat på situation',
        'Motiverar DCO framför ETC baserat på fysiologisk status',
        'Identifierar Pape-kriterier: ISS ≥18, hypotermi (35.5°C), laktat >2.5 mmol/L, thoraxskada',
        'Tolkar laktat och acidosstatus korrekt (denna patient: laktat 4.2 = DCO)',
        'Kontrollerar rotation, längd och alignment efter stabilisering',
        'Re-evaluerar neurovaskulär status efter åtgärd',
        'Planerar re-evaluering vid 48-72h och konvertering till definitiv fixation',
        'Kommunicerar prioritering: thoraxstabilisering före femurfixation',
        'Dokumenterar adekvat inkl. tidpunkt för planerad definitiv kirurgi'
      ],
      criticalErrors: [
        'Planerar primär definitiv fixation hos fysiologiskt instabil patient',
        'Missar att tolka hypotermi (35.5°C) som stark DCO-indikation',
        'Ingen plan för re-evaluering eller definitiv behandling',
        'Felbedömer patientens fysiologiska status',
        'Missar att kontrollera neurovaskulär status efter stabilisering'
      ],
      timeLimit: 10,
      sortOrder: 7
    },
    {
      code: 'OSCE-08',
      title: 'Patientsäker procedurcheck',
      scenario: `Du ska utföra akut extern fixation på en patient med öppen tibiafraktur. Patienten ligger på operationssalen, sövd. Du är operatör.

Din uppgift: Genomför patientsäkra förberedelser och time-out.

Tillgängligt: Operationsteam (sjuksköterska, undersköterska, anestesipersonal), checklistor, utrustning.`,
      checklist: [
        'Verifierar rätt patient med minst två identifierare',
        'Bekräftar rätt sida, rätt ingrepp',
        'Kontrollerar att sidan är markerad',
        'Genomgår infektionsrisk och profylax (antibiotika givet?)',
        'Kontrollerar att utrustning och implantat finns, har reservplan',
        'Genomför team brief med riskgenomgång',
        'Leder eller deltar i formell time-out',
        'Skapar plan för post-procedur (sign-out, överrapportering)'
      ],
      criticalErrors: [
        'Startar utan patientidentifiering',
        'Opererar utan verifierad sidmarkering',
        'Hoppar över time-out',
        'Ingen kontroll av kritisk utrustning'
      ],
      timeLimit: 8,
      sortOrder: 8
    },

    // ========================================
    // INSTRUKTÖRS-OSCE (TTT - Train the Trainer)
    // Stationer för bedömning av instruktörskompetens
    // ========================================

    {
      code: 'OSCE-TTT-01',
      title: 'Strukturerad feedback (Pendleton)',
      scenario: `Du är instruktör på en ORTAC-kurs. Du har just observerat en deltagare genomföra tourniquet-applicering på en simulerad patient. Deltagaren gjorde flera saker bra men missade att dokumentera tidpunkt och hade suboptimal placering.

En skådespelare spelar deltagaren som precis avslutat sin övning.

Din uppgift: Ge strukturerad feedback enligt Pendleton-modellen på deltagarens prestation.

Tillgängligt: Anteckningsblock, observationsprotokoll.`,
      checklist: [
        'Inleder med att fråga deltagaren vad hen upplevde gick bra',
        'Lyssnar aktivt och bekräftar deltagarens självreflektion',
        'Ger egna positiva observationer som komplement',
        'Frågar deltagaren vad som kunde förbättras eller göras annorlunda',
        'Väntar på deltagarens svar innan egna förslag',
        'Ger specifika, konkreta förbättringsförslag',
        'Undviker "men" - separerar positivt och konstruktivt',
        'Sammanfattar och bekräftar förståelse',
        'Skapar psykologisk trygghet genom tonläge och kroppsspråk',
        'Avslutar med framåtblick och uppmuntran'
      ],
      criticalErrors: [
        'Börjar med kritik eller negativ feedback',
        'Ger ingen möjlighet till självreflektion (pratar hela tiden)',
        'Använder generaliserande språk ("du gör alltid...")',
        'Avbryter deltagaren upprepade gånger',
        'Skapar defensiv atmosfär genom anklagande tonläge'
      ],
      timeLimit: 10,
      sortOrder: 101
    },
    {
      code: 'OSCE-TTT-02',
      title: 'Färdighetsundervisning (Peyton 4-steg)',
      scenario: `Du är instruktör och ska lära ut tourniquet-applicering till en grupp nya deltagare. En skådespelare spelar en deltagare som inte har någon tidigare erfarenhet av tourniquet.

Din uppgift: Demonstrera färdighetsundervisning enligt Peytons 4-stegsmodell.

Tillgängligt: CAT-tourniquet, träningsarm/docka, instruktionsguide.`,
      checklist: [
        'Steg 1 (Demonstration): Utför hela momentet i normal hastighet utan förklaring',
        'Steg 2 (Dekonstruktion): Går igenom steg för steg med tydliga förklaringar',
        'Steg 3 (Comprehension): Låter deltagaren instruera medan instruktör utför',
        'Steg 4 (Performance): Deltagaren utför själv med egen verbalisering',
        'Tydlig struktur - meddelar vilket steg man är på',
        'Anpassar tempo efter deltagare',
        'Ger uppmuntran och positiv förstärkning',
        'Korrigerar försiktigt utan att avbryta flödet',
        'Kontrollerar förståelse mellan stegen',
        'Dokumenterar deltagarens progression'
      ],
      criticalErrors: [
        'Hoppar över steg (särskilt steg 3 - comprehension)',
        'Tar över från deltagaren vid minsta fel',
        'Ger ingen demonstration först (börjar med förklaring)',
        'Använder för snabbt tempo utan anpassning',
        'Skapar prestationsångest genom otålighet'
      ],
      timeLimit: 12,
      sortOrder: 102
    },
    {
      code: 'OSCE-TTT-03',
      title: 'Debriefing efter simulering (GAS)',
      scenario: `Du har precis lett ett simuleringscenario där traumateamet skulle hantera en patient med bäckenfraktur och chock. Teamet gjorde flera bra saker men missade att aktivera MTP-protokoll i tid och hade kommunikationsbrister.

Fyra skådespelare spelar teammedlemmar som precis avslutat scenariot.

Din uppgift: Led en debriefing enligt GAS-modellen (Gather-Analyze-Summarize).

Tillgängligt: Whiteboard/flipchart, scenariobeskrivning, observationsanteckningar.`,
      checklist: [
        'GATHER: Inleder med öppen fråga om upplevelse/reaktioner',
        'GATHER: Låter alla komma till tals, inte bara de mest pratsamma',
        'GATHER: Sammanfattar vad som hände kronologiskt',
        'ANALYZE: Ställer utforskande frågor (vad, hur, varför)',
        'ANALYZE: Fokuserar på system/process, inte person',
        'ANALYZE: Relaterar till lärandemål och kursprinciper',
        'ANALYZE: Uppmuntrar peer-to-peer lärande',
        'SUMMARIZE: Sammanfattar nyckellärdomar',
        'SUMMARIZE: Frågar deltagarna vad de tar med sig',
        'Skapar trygg atmosfär - erkänner att simulering är svårt'
      ],
      criticalErrors: [
        'Hoppar direkt till kritik utan att samla upplevelser',
        'Pekar ut individer på negativt sätt',
        'Dominerar samtalet - mer än 30% egen pratandel',
        'Missar att knyta till lärandemål',
        'Avfärdar deltagarnas känslor eller upplevelser'
      ],
      timeLimit: 10,
      sortOrder: 103
    },
    {
      code: 'OSCE-TTT-04',
      title: 'Hantering av svår undervisningssituation',
      scenario: `Du leder en gruppövning när en deltagare (skådespelare) börjar uppvisa utmanande beteende. Välj ETT av följande scenarion:

A) "Den dominanta": Avbryter ständigt, svarar åt andra, visar otålighet
B) "Den tysta": Svarar inte på frågor, undviker ögonkontakt, deltar inte
C) "Den ifrågasättande": Ifrågasätter kursinnehållet, hävdar att "så gör vi inte hos oss"

Din uppgift: Hantera situationen på ett sätt som bevarar lärmiljön för gruppen.

Tillgängligt: Kurssal med övriga "deltagare" (observatörer).`,
      checklist: [
        'Behåller lugn och professionellt förhållningssätt',
        'Erkänner deltagarens perspektiv/känslor',
        'Använder lämplig teknik för situationstypen',
        'Dominant: Omdirigerar artigt, involverar andra deltagare',
        'Tyst: Skapar trygghet, erbjuder alternativa sätt att delta',
        'Ifrågasättande: Validerar erfarenhet, förklarar evidens/standardisering',
        'Balanserar individens behov mot gruppens lärmiljö',
        'Tar paus/enskilt samtal om situationen eskalerar',
        'Återgår till undervisning på ett naturligt sätt',
        'Följer upp efter övningen vid behov'
      ],
      criticalErrors: [
        'Förlorar humöret eller blir konfrontativ',
        'Ignorerar beteendet helt (låter det fortsätta ostört)',
        'Förödmjukar eller skäller ut deltagaren inför gruppen',
        'Låter en person dominera hela övningen',
        'Ger upp och avslutar övningen i förtid'
      ],
      timeLimit: 8,
      sortOrder: 104
    }
  ];
}

// ============================================
// KIRKPATRICK PILOT PROTOCOL
// ============================================

interface PilotProtocolItem {
  level: number;
  levelName: string;
  assessmentType: string;
  description: string;
  measures: string[];
  dataCollection: string;
  timing: string;
}

function getPilotProtocol(): PilotProtocolItem[] {
  return [
    // Nivå 1 - Reaktion
    {
      level: 1,
      levelName: 'Reaktion',
      assessmentType: 'satisfaction',
      description: 'Deltagarnas nöjdhet med kursen',
      measures: [
        'Övergripande nöjdhet (1-5 skala)',
        'Kursinnehåll - relevans',
        'Kursinnehåll - kvalitet',
        'Instruktörskvalitet',
        'Kursmaterial',
        'Praktiska övningar'
      ],
      dataCollection: 'Digital enkät direkt efter kurs',
      timing: 'Omedelbart efter kursavslut'
    },
    {
      level: 1,
      levelName: 'Reaktion',
      assessmentType: 'relevance',
      description: 'Upplevd relevans för klinisk verksamhet',
      measures: [
        'Relevans för dagligt arbete (1-5)',
        'Förväntat användande i praktiken',
        'Identifierade kunskapsluckor som fyllts',
        'Rekommendation till kollegor (NPS)'
      ],
      dataCollection: 'Del av avslutande enkät',
      timing: 'Omedelbart efter kursavslut'
    },
    // Nivå 2 - Lärande
    {
      level: 2,
      levelName: 'Lärande',
      assessmentType: 'pretest',
      description: 'Kunskapsnivå före kurs',
      measures: [
        'MCQ-test (20 frågor) på tidskritiska tillstånd',
        'Självskattad kompetens per område (1-5)',
        'Tidigare erfarenhet av ortopediskt trauma'
      ],
      dataCollection: 'Digital test före kursstart',
      timing: '1 vecka före kursstart'
    },
    {
      level: 2,
      levelName: 'Lärande',
      assessmentType: 'posttest',
      description: 'Kunskapsnivå efter kurs',
      measures: [
        'MCQ-test (samma 20 frågor + 10 nya)',
        'Självskattad kompetens per område (1-5)',
        'Kunskapsökning (delta pre-post)'
      ],
      dataCollection: 'Digital test efter teoriavsnitt',
      timing: 'Innan OSCE-examination'
    },
    {
      level: 2,
      levelName: 'Lärande',
      assessmentType: 'osce',
      description: 'Praktisk färdighetsbedömning',
      measures: [
        'OSCE-resultat per station (poäng)',
        'Godkänd/Icke godkänd per station',
        'Kritiska fel identifierade',
        'Global bedömning av examinator'
      ],
      dataCollection: 'Strukturerad bedömning under OSCE',
      timing: 'Kursdag 2'
    },
    {
      level: 2,
      levelName: 'Lärande',
      assessmentType: 'epa',
      description: 'EPA-bedömningar med entrustment-nivå',
      measures: [
        'Entrustment-nivå per EPA (1-5)',
        'Specifika styrkor och förbättringsområden',
        'Progression under kurs'
      ],
      dataCollection: 'Bedömning av handledare under praktik',
      timing: 'Under och efter praktiska moment'
    },
    // Nivå 3 - Beteende
    {
      level: 3,
      levelName: 'Beteende',
      assessmentType: 'self_assessment',
      description: 'Självrapporterad beteendeförändring',
      measures: [
        'Användning av LIMB-protokoll',
        'Användning av strukturerad kommunikation (SBAR)',
        'Förtroende vid hantering av tidskritiska tillstånd',
        'Upplevd förändring i klinisk praxis'
      ],
      dataCollection: 'Digital enkät',
      timing: '3 månader efter kurs'
    },
    {
      level: 3,
      levelName: 'Beteende',
      assessmentType: 'journal_audit',
      description: 'Mini-audit av journaldokumentation',
      measures: [
        'Dokumenterad neurovaskulär status vid extremitetstrauma',
        'Dokumenterad tid till antibiotika vid öppen fraktur',
        'Korrekt bäckenbinda-dokumentation',
        'Strukturerad överlämningsrapport'
      ],
      dataCollection: 'Journalgranskning (stickprov)',
      timing: '3-6 månader efter kurs, jämförelse med pre-kurs'
    },
    {
      level: 3,
      levelName: 'Beteende',
      assessmentType: 'process_measures',
      description: 'Objektiva processmått',
      measures: [
        'Tid till antibiotika vid öppen fraktur (medel, median)',
        'Andel med dokumenterad neurovaskulär status',
        'Andel korrekt applicerade bäckenbindor',
        'Tid till kärlkirurgkontakt vid misstänkt kärlskada'
      ],
      dataCollection: 'Registerstudie/kvalitetsregister',
      timing: 'Kontinuerligt, jämförelse före/efter kursimplementering'
    },
    // Nivå 4 - Resultat
    {
      level: 4,
      levelName: 'Resultat',
      assessmentType: 'process_outcomes',
      description: 'Primära processutfall',
      measures: [
        'Tid till antibiotika vid öppen fraktur (organisationsnivå)',
        'Andel korrekt initial handläggning',
        'Följsamhet till protokoll',
        'Minskade avvikelser/händelser'
      ],
      dataCollection: 'Organisationsdata, kvalitetsregister',
      timing: '6-12 månader efter kursimplementering'
    },
    {
      level: 4,
      levelName: 'Resultat',
      assessmentType: 'clinical_outcomes',
      description: 'Sekundära kliniska utfall (kräver större material)',
      measures: [
        'Infektionsfrekvens vid öppen fraktur',
        'Andel försenade fasciotomier',
        'Amputationsfrekvens vid kärlskada',
        'Komplikationsrate vid extremitetstrauma'
      ],
      dataCollection: 'Registerstudier, kräver större patientmaterial',
      timing: 'Långtidsuppföljning (1-3 år)'
    }
  ];
}

// ============================================
// INSTRUCTOR GUIDES
// ============================================

interface InstructorGuideData {
  id: string;
  type: string;
  title: string;
  content: string;
  sortOrder: number;
}

function getInstructorGuides(): InstructorGuideData[] {
  return [
    {
      id: 'guide-osce-examiner',
      type: 'OSCE_EXAMINER',
      title: 'OSCE-examinator: Snabbguide',
      sortOrder: 1,
      content: `# OSCE-examinator: Snabbguide

## Innan examination

### Förberedelse (30 min före)
1. **Kontrollera utrustning** för varje station
   - Station 1-2: Tourniquet (CAT/SOFTT-W), docka/simulatorsarm
   - Station 3: Bäckenbälte (SAM Sling), bäckenmodell
   - Station 4: Kompartmenttryckmätare (om tillgänglig)
   - Station 5-6: Doppler, blodtrycksmanschett
   - Station 7-8: Splintmaterial, mitella

2. **Läs igenom scenariot** och bedömningsformuläret
3. **Identifiera kritiska fel** - dessa är icke-förhandlingsbara

### Kritiska fel - AUTOMATISKT UNDERKÄNT
Ett kritiskt fel innebär att stationen är underkänd oavsett övrig prestation:

| Station | Kritiska fel |
|---------|--------------|
| OSCE-01 | Missar livshotande blödning, Fördröjer tourniquet >3 min |
| OSCE-02 | Placerar binda på fel nivå, Upprepad bäckenmanipulation |
| OSCE-03 | Antibiotika inte inom 60 min, Missar neurovaskulär undersökning |
| OSCE-04 | Försenar eskalering vid klassiska tecken |
| OSCE-05 | Fördröjd reposition vid ischemi >5 min |
| OSCE-06 | Reposition utan neurovaskulär undersökning före |
| OSCE-07 | Planerar definitiv fixation hos instabil patient |
| OSCE-08 | Startar utan patientidentifiering eller time-out |

## Under examination

### Tidshantering
- **Meddela kandidaten** när 2 minuter återstår
- **Avbryt INTE** mitt i en åtgärd om tiden går ut
- **Dokumentera** om kandidaten överskrider tid

### Bedömning
1. **Checklista**: Markera varje item som utfört/ej utfört
2. **Global Rating Scale (1-5)**:
   - 1: Klart underkänd - allvarliga brister
   - 2: Gränsfall - flera brister
   - 3: Godkänd - uppfyller minimikrav
   - 4: Över förväntan - god kompetens
   - 5: Exceptionell - expertliknande

3. **Kommentarer**: Skriv konstruktiv feedback

### Kommunikation med kandidat
- Var neutral - ge inga ledtrådar
- Svara på faktafrågor om scenariot
- Säg "fortsätt" om kandidaten fastnar

## Efter examination

### Feedback
- **Omedelbar feedback** efter varje station (2 min)
- Fokusera på 1-2 förbättringsområden
- Lyft fram vad som gjordes bra
- **Avslöja INTE** godkänt/underkänt - detta meddelar kursansvarig

### Dokumentation
- Signera bedömningsformuläret
- Rapportera eventuella avvikelser
- Lämna in till kursadministrationen samma dag`,
    },
    {
      id: 'guide-epa-assessor',
      type: 'EPA_ASSESSOR',
      title: 'EPA-bedömningsguide',
      sortOrder: 2,
      content: `# EPA-bedömningsguide

## Entrustment-skala (1-5)

| Nivå | Beskrivning | Övervakning |
|------|-------------|-------------|
| **1** | Får observera | Observerar handledare |
| **2** | Får utföra med direkt övervakning | Handledare närvarande i rummet |
| **3** | Får utföra med indirekt övervakning | Handledare snabbt tillgänglig |
| **4** | Får utföra självständigt | Retrospektiv granskning |
| **5** | Får handleda andra | Kan lära ut EPA:n |

## Krav för certifiering
- **Minst nivå 3** på samtliga 12 EPA
- Bedömning av **kvalificerad instruktör**
- Dokumenterad i systemet

## De 12 EPA:erna - Vad ska observeras

### EPA-01: Ortopedisk primär bedömning
- ABCDE-bedömning före extremitetsfokus
- LIMB-protokoll systematiskt
- Identifiering av tidskritiska tillstånd
- Kommunikation till team

### EPA-02: Neurovaskulär status
- Puls, kapillär återfyllnad, hudtemperatur
- ABI-mätning med korrekt teknik
- Motorik/sensorik i relevanta dermatom
- Dokumentation FÖRE och EFTER åtgärd

### EPA-03: Öppen fraktur
- Tidig antibiotikaadministration (<60 min)
- Gustilo-klassificering
- Korrekt sårhantering
- Planering för kirurgi

### EPA-04: Temporär stabilisering
- Val av rätt immobiliseringsmetod
- DCO-principer vid polytrauma
- Pape-kriterierna
- Dokumentation

### EPA-05: Kompartmentsyndrom
- 6 P systematiskt
- Tryckmätning vid oklarhet
- OMEDELBAR eskalering vid misstanke
- Förståelse att pulsbortfall är sent tecken

### EPA-06: Bäckenringfraktur
- Undviker upprepad bäckenmanipulation
- Korrekt bindplacering (trochanter, EJ crista)
- MTP-aktivering vid hemodynamisk instabilitet
- Tidsdokumentation

### EPA-07: Akut ledluxation
- Neurovaskulär status FÖRE reposition
- Adekvat analgesi
- Skonsam teknik
- Neurovaskulär status EFTER

### EPA-08: Fraktur med hotad hud/cirkulation
- Identifiering av hotad hud
- Snabb reposition vid cirkulationspåverkan
- Eskalering till kärlkirurg vid behov
- Ischemitid-dokumentation

### EPA-09: Ortopedisk sekundär survey
- Systematisk genomgång
- Identifiering av samtliga skador
- Prioritering

### EPA-10: Klinisk kommunikation
- SBAR-struktur
- Closed-loop kommunikation
- CUS-frågor vid oro

### EPA-11: Smärta och analgesi
- Åldersanpassad bedömning
- Multimodal analgesi
- Balans smärtlindring vs klinikmaskering

### EPA-12: Dokumentation
- Fullständighet
- Tidsstämplar
- Läsbarhet

## Tips för bedömning
1. **Observera i naturlig miljö** - ej simulerad om möjligt
2. **Minst 2-3 observationer** per EPA rekommenderas
3. **Ge konstruktiv feedback** efter varje observation
4. **Dokumentera direkt** - minns bättre`,
    },
    {
      id: 'guide-checklist-osce',
      type: 'CHECKLIST',
      title: 'OSCE Examinationschecklista',
      sortOrder: 3,
      content: `# OSCE Examinationschecklista

## Före examinationsdag

### 1 vecka före
- [ ] Konfirmera alla examinatorer
- [ ] Skicka ut OSCE-guider till examinatorer
- [ ] Boka lokaler för alla stationer
- [ ] Kontrollera utrustningslista

### 1 dag före
- [ ] Packa utrustning per station
- [ ] Skriv ut bedömningsformulär (2 ex per kandidat per station)
- [ ] Skriv ut scenariokort
- [ ] Förbered kandidatlista med tidsschema

### Examinationsdag morgon
- [ ] Ställ i ordning stationer 45 min före
- [ ] Briefing med examinatorer 30 min före
- [ ] Kontrollera all utrustning fungerar
- [ ] Registrera närvaro - kandidater

## Under examination

### Per station
- [ ] Kandidat identifierad (namn + personnummer)
- [ ] Scenario presenterat
- [ ] Timer startad
- [ ] Bedömningsformulär ifyllt
- [ ] Kritiska fel dokumenterade (om några)
- [ ] Global rating angiven
- [ ] Feedback given
- [ ] Signatur av examinator

### Mellan stationer
- [ ] Återställ utrustning
- [ ] Nästa kandidat redo
- [ ] Tidshållning kontrollerad

## Efter examination

### Samma dag
- [ ] Samla in alla bedömningsformulär
- [ ] Verifiera att alla kandidater bedömts på alla stationer
- [ ] Rapportera kritiska fel till kursansvarig
- [ ] Återställ och inventera utrustning

### Inom 24h
- [ ] Registrera resultat i systemet
- [ ] Granska tveksamma bedömningar
- [ ] Beslut om godkänt/underkänt per kandidat
- [ ] Boka omprov för underkända (om tillämpligt)`,
    },
    {
      id: 'guide-feedback-tips',
      type: 'GENERAL',
      title: 'Tips för konstruktiv feedback',
      sortOrder: 4,
      content: `# Tips för konstruktiv feedback

## Feedbackmodellen "Pendleton"

1. **Fråga kandidaten**: "Vad tycker du gick bra?"
2. **Bekräfta och komplettera**: "Jag håller med, och jag såg också att..."
3. **Fråga kandidaten**: "Vad skulle du göra annorlunda?"
4. **Föreslå förbättringar**: "Ett område att utveckla är..."
5. **Sammanfatta**: "Sammantaget..."

## Att ge negativ feedback

### Gör
- Var specifik: "Tourniketen placerades för distalt" (inte "det gick inte bra")
- Fokusera på beteende, inte person
- Ge förbättringsförslag
- Använd "jag observerade att..." istället för "du gjorde fel"

### Gör INTE
- Använd ord som "alltid" eller "aldrig"
- Jämför med andra kandidater
- Ge feedback inför grupp (privat är bättre)
- Avslöja slutresultat (godkänt/underkänt)

## Alternativ feedbackstruktur
Den klassiska "bra-dålig-bra"-strukturen kan uppfattas som oärlig. Använd istället:

1. **Objektivt**: "Jag såg att du..."
2. **Påverkan**: "Det innebar att..."
3. **Förslag**: "Nästa gång skulle du kunna..."

## Tidsram
- **OSCE**: Max 2 minuter per station
- **EPA**: 5-10 minuter efter observation

## Dokumentera
Skriv ner din feedback - det hjälper kandidaten att minnas och dig att vara konsekvent.`,
    },
    {
      id: 'guide-course-schedule',
      type: 'GENERAL',
      title: 'Kursschema dag 1-2',
      sortOrder: 5,
      content: `# ORTAC Kursschema

## Kursformat
- **Längd:** 2 dagar
- **Deltagare:** Max 24 per kurs
- **Instruktörer:** 1 kursledare + 6 stationsinstruktörer
- **Ratio:** 1:4 vid färdighetsstationer

---

## Dag 1 – Schema

| Tid | Aktivitet | Ansvarig |
|-----|-----------|----------|
| 08:00-08:30 | Registrering, kaffe | Admin |
| 08:30-09:00 | Välkommen, introduktion, pre-test | Kursledare |
| 09:00-10:00 | Föreläsning: LIMB-algoritmen | Kursledare |
| 10:00-10:15 | Paus | - |
| 10:15-11:15 | Föreläsning: Öppen fraktur & Kompartmentsyndrom | Instruktör |
| 11:15-12:15 | Föreläsning: Kärlskador & Bäckentrauma | Instruktör |
| 12:15-13:15 | Lunch | - |
| 13:15-15:45 | Färdighetsstationer (rotation, 4x30 min) | Alla instruktörer |
| 15:45-16:00 | Paus | - |
| 16:00-17:00 | Föreläsning: DCO & Polytrauma | Instruktör |
| 17:00-17:30 | Sammanfattning dag 1, frågor | Kursledare |

---

## Dag 2 – Schema

| Tid | Aktivitet | Ansvarig |
|-----|-----------|----------|
| 08:00-08:30 | Rekapitulation dag 1 | Kursledare |
| 08:30-09:30 | Föreläsning: Specifika frakturer (femur, tibia, övre ext.) | Instruktör |
| 09:30-10:30 | Föreläsning: Pediatriskt trauma & Dokumentation | Instruktör |
| 10:30-10:45 | Paus | - |
| 10:45-12:15 | Färdighetsstationer (rotation, 2x30 min) + repetition | Alla instruktörer |
| 12:15-13:00 | Lunch | - |
| 13:00-14:30 | Scenarioträning (3 scenarion) | Alla instruktörer |
| 14:30-14:45 | Paus | - |
| 14:45-16:15 | MCQ-examination (60 frågor, 90 min) | Kursledare |
| 16:15-16:30 | Paus | - |
| 16:30-17:30 | OSCE-examination (6 stationer) | Alla instruktörer |
| 17:30-18:00 | Resultat, certifikatutdelning, kursutvärdering | Kursledare |

---

## Godkännandekrav

### MCQ-examination
- 60 frågor, 90 minuter
- Godkänt: ≥70% (42/60)

### OSCE-examination
- 6 stationer, 8 min per station
- Godkänt: ≥70% totalt (≥46/65 poäng)`,
    },
    {
      id: 'guide-skill-stations',
      type: 'GENERAL',
      title: 'Färdighetsstationer: Instruktörsguide',
      sortOrder: 6,
      content: `# Färdighetsstationer – Detaljerade instruktioner

## Översikt

| Station | Tid | Ratio |
|---------|-----|-------|
| 1. Tourniquet | 30 min | 1:4 |
| 2. ABI-mätning | 30 min | 1:4 |
| 3. Bäckenbälte | 30 min | 1:4 |
| 4. Passiv töjningstest | 30 min | 1:4 |
| 5. Gipsskena (Backslab) | 30 min | 1:4 |
| 6. LIMB-bedömning | 30 min | 1:4 |

---

## Station 1: Tourniquet

**Material:** CAT-tourniquet, övningsmodell, stoppur

**Lärandemål:** Applicera tourniquet korrekt (<30 sek)

**Instruktion:**
1. **Demonstration (5 min)** - Visa korrekt placering 5-7 cm proximalt
2. **Steg-för-steg (10 min)** - Deltagarna övar med instruktion
3. **Tidspress (10 min)** - Öva under tid (<30 sek)
4. **Diskussion (5 min)** - Kontraindikationer, maximal tid

**OSCE-bedömning:**
- [ ] Korrekt placering (proximalt om skadan)
- [ ] Tillräcklig åtdragning (blödning upphör)
- [ ] Tid <30 sekunder
- [ ] Dokumenterar klockslag

---

## Station 2: ABI-mätning

**Material:** Blodtrycksmanschetter, handhållen doppler (8 MHz), ultraljudsgel

**Lärandemål:** Mäta och tolka ABI

**Instruktion:**
1. **Demonstration (5 min)** - Visa teknik för arm- och ankeltryck
2. **Praktisk övning (15 min)** - Deltagarna övar på varandra
3. **Tolkning (5 min)** - Räkna ut ABI, diskutera gränser
4. **Fallexempel (5 min)** - Vad gör du vid ABI 0.7? 0.4?

**OSCE-bedömning:**
- [ ] Korrekt patientpositionering
- [ ] Mäter armtryck korrekt
- [ ] Hittar rätt kärl (a. dorsalis pedis/tibialis posterior)
- [ ] Korrekt beräkning och tolkning

---

## Station 3: Bäckenbälte

**Material:** Kommersiellt bäckenbälte (T-POD/SAM Sling), lakan, bäckenmodell

**Lärandemål:** Applicera bäckenbälte korrekt

**Instruktion:**
1. **Anatomi (5 min)** - Visa trochanternivå vs crista iliaca
2. **Demonstration (5 min)** - Korrekt applicering + bindning av knän/fotleder
3. **Praktisk övning (15 min)** - Deltagarna övar
4. **Alternativ metod (5 min)** - Lakan-teknik

**OSCE-bedömning:**
- [ ] Korrekt nivå (trochanternivå, EJ crista)
- [ ] Symmetrisk applicering
- [ ] Binder knän och fotleder
- [ ] Kontrollerar distala pulsar

---

## Station 4: Passiv töjningstest

**Material:** Brits, anatomiska bilder av underbenkompartment

**Lärandemål:** Utföra passiv töjningstest för alla underbenkompartment

**De 4 kompartmenten:**
1. **Anteriora** - Test: Passiv plantarflexion av fot
2. **Laterala** - Test: Passiv inversion av fot
3. **Djupa posteriora** - Test: Passiv dorsalflexion av tår
4. **Ytliga posteriora** - Test: Passiv dorsalflexion av fot

**OSCE-bedömning:**
- [ ] Testar alla 4 kompartment korrekt
- [ ] Anger korrekt tolkning vid positivt test
- [ ] Förstår att smärta vid passiv töjning = tidigaste tecknet

---

## Station 5: Gipsskena (Backslab)

**Material:** Gipsbinda, polstervadd, elastisk binda, sax, vatten

**Lärandemål:** Applicera temporär stabilisering

**Instruktion:**
1. **Material (5 min)** - Visa lagerteknik
2. **Demonstration (10 min)** - Vaddering → gips → modellering → fixering
3. **Praktisk övning (15 min)** - Deltagarna gör egna skenor

**OSCE-bedömning:**
- [ ] Adekvat vaddering
- [ ] Fot i neutral position (90°)
- [ ] Vet när/hur man delar vid kompartmentmisstanke

---

## Station 6: LIMB-bedömning (integrerad)

**Material:** Simulerad patient med moulage

**Lärandemål:** Genomföra strukturerad LIMB-bedömning

**LIMB-protokollet:**
- **L** - Life & Limb Threats (blödning, pulslöshet, bäckeninstabilitet)
- **I** - Ischemia (hårda/mjuka tecken, ABI)
- **M** - Muscle compartments (palpation, passiv töjning)
- **B** - Bone & soft tissue (öppen fraktur, antibiotika)

**OSCE-bedömning:**
- [ ] Systematisk genomgång L-I-M-B
- [ ] Identifierar tidskritiska tillstånd
- [ ] Formulerar plan och prioritering`,
    },
    {
      id: 'guide-scenario-training',
      type: 'GENERAL',
      title: 'Scenarioträning: 3 fall med debrief',
      sortOrder: 7,
      content: `# Scenarioträning

## Format
- **Tid:** 30 min per scenario (15 min scenario + 15 min debrief)
- **Grupp:** 4-6 deltagare per scenario
- **Roller:** Teamledare, teammedlemmar, observatörer
- **Rotering:** Alla ska vara teamledare minst en gång

---

## Scenario 1: MC-olycka med öppen tibiafraktur

### Bakgrund
28-årig man, MC-olycka i 70 km/h. Helmet intakt. GCS 15.

### Fynd
- Vitalt stabil (BT 125/80, puls 95)
- Höger underben: Synlig angulation, 5 cm sår anteriort, synligt ben
- Foten varm, kapillär återfyllnad <2 sek
- A. dorsalis pedis palpabel
- Sensorik och motorik intakt distalt

### Förväntade åtgärder
1. Primär survey (ABCDE)
2. Identifiera öppen fraktur
3. **Antibiotika (Cefazolin 2g IV) inom 1 timme**
4. Tetanusprofylax
5. Fotodokumentation
6. Steril täckning
7. Neurovaskulär dokumentation
8. Temporär stabilisering
9. SBAR till ortoped

### Diskussionspunkter
- Gustilo-klassifikation (II eller IIIA?)
- Tidsgränser för antibiotika
- Vad om patienten var hypotensiv?

---

## Scenario 2: Polytrauma med femur och bäcken

### Bakgrund
45-årig kvinna, bilolycka, sidokollision. Klämd i 20 minuter. GCS 13.

### Fynd
- **BT 85/55, puls 125, AF 24** (instabil!)
- Bäcken: Instabilitet vid försiktig palpation
- Vänster lår: Förkortning och rotation, slutet
- Blod vid vaginal inspektion (öppen bäckenfraktur?)

### Förväntade åtgärder
1. Primär survey – notera C-problem
2. **Bäckenbälte OMEDELBART**
3. Aktivera MTP (massiv transfusion)
4. Bilateral storfemoral access
5. Identifiera möjlig öppen bäckenfraktur
6. Bred antibiotika (Pip-Tazo)
7. SBAR till traumaledare
8. **DCO-strategi** (ej definitiv kirurgi)

### Diskussionspunkter
- Varför är patienten instabil? (Bäckenblödning + femurblödning)
- DCO vs ETC i detta fall
- Öppen bäckenfraktur – vad innebär det?

---

## Scenario 3: Kompartmentsyndrom efter tibiafraktur

### Bakgrund
22-årig man, fotbollsskada för 8 timmar sedan. Gipsad på annat sjukhus. Nu ökande smärta trots morfin.

### Fynd
- Vitalt stabil
- Höger underben i gips
- **VAS 9/10 trots morfin 15 mg IV** (varningssignal!)
- Vid gipsdelning: Uttalad svullnad, spänt anteriort
- **Smärta vid passiv plantarflexion** (positivt test!)
- Sensorik: Nedsatt dorsalt mellan stortå och 2:a tå
- **A. dorsalis pedis palpabel** (pulsen försvinner SENT)

### Förväntade åtgärder
1. **Dela gipset HELT** (inklusive vaddering)
2. Sänka benet till hjärtnivå
3. Dokumentera neurovaskulär status
4. Passiv töjningstest – alla kompartment
5. **Kontakta ortoped AKUT**
6. Förbered för fasciotomi

### Diskussionspunkter
- Varför har han fortfarande puls?
- Tidsfaktorn – hur akut är det nu efter 8h?
- Vad hade hänt om gipset inte delats?

---

## Debriefingstruktur: PEARLS

### 1. Reaktioner (2 min)
- "Hur kändes det?"
- "Vad tänkte du under scenariot?"

### 2. Beskrivning (3 min)
- "Berätta vad som hände"
- "Vilka fynd hittade ni?"

### 3. Analys (7 min)
- "Vad gick bra?"
- "Vad kunde gjorts annorlunda?"
- "Varför valde ni den strategin?"

### 4. Sammanfattning (3 min)
- Key take-home messages
- Koppla till lärandemålen`,
    },
    {
      id: 'guide-course-philosophy',
      type: 'GENERAL',
      title: 'Kursfilosofi och pedagogik',
      sortOrder: 8,
      content: `# ORTAC Kursfilosofi och pedagogik

## Bakgrund

ORTAC utvecklades för att fylla gapet mellan ATLS och ortopedisk specialistutbildning. Kursen ger icke-ortopeder strukturerade verktyg för initial handläggning av extremitetstrauma.

## Kärnbudskap

**"The right care at the right time by the right person."**

Kursdeltagare behöver INTE kunna operera. De behöver kunna:
- **Identifiera** tidskritiska tillstånd
- **Initiera** rätt behandling
- **Eskalera** till specialist
- **Dokumentera** och kommunicera

---

## Instruktörsroll

Som ORTAC-instruktör är din uppgift att:
- **Facilitera lärande**, inte bara föreläsa
- **Skapa en trygg lärmiljö**
- **Ge konstruktiv feedback**
- **Hålla tiderna**
- **Säkerställa att lärandemålen uppnås**

---

## Pedagogiska principer

### 1. Aktivt lärande
Deltagarna **gör**, inte bara lyssnar. Färdighetsstationer och scenarioträning utgör kärnan i kursen.

### 2. Säker miljö
**Okej att göra fel** – det är så man lär sig. Skapa en kultur där deltagare vågar fråga och prova.

### 3. Relevans
**Koppla alltid till klinisk verklighet.** Använd verkliga (anonymiserade) fall och fråga deltagarna om deras erfarenheter.

### 4. Repetition
**LIMB-algoritmen** återkommer genomgående. Repetition befäster kunskap.

### 5. Feedback
**Specifik, konstruktiv, i stunden.** Feedback är mest effektiv direkt efter utförandet.

---

## Föreläsningstips

- **Max 45-50 min** föreläsning, sedan interaktion
- **Interaktivt:** Ställ frågor, involvera deltagarna
- **Visuellt:** Bilder, algoritmer, videor
- **Återkoppla till LIMB:** Algoritmen är röda tråden

### Interaktivt moment: "Think-pair-share"
1. Ge ett kort scenario
2. Låt deltagarna diskutera i par (2 min)
3. Plenumsammanfattning

---

## Lärandemål

### Kunskap (K) - Examineras via MCQ
- Beskriva LIMB-algoritmens fyra steg
- Ange kritiska tidsgränser
- Klassificera öppna frakturer
- Beskriva DCO vs ETC

### Färdighet (F) - Examineras via OSCE
- Applicera tourniquet (<30 sek)
- Mäta och tolka ABI
- Applicera bäckenbälte
- Utföra passiv töjningstest
- Genomföra strukturerad LIMB-bedömning

### Kompetens (Ko) - Examineras via Scenario
- Prioritera åtgärder vid polytrauma
- Besluta om eskalering
- Kommunicera effektivt (SBAR)`,
    },
    {
      id: 'guide-pocket-reference',
      type: 'GENERAL',
      title: 'Fickguide: LIMB & Tidsgränser',
      sortOrder: 9,
      content: `# ORTAC Fickguide – Snabbreferens

## LIMB-ALGORITMEN

### L - LIFE & LIMB THREATS (SEKUNDER)
- [ ] Massiv blödning? → **TOURNIQUET**
- [ ] Pulslös extremitet? → **Kärlkirurg AKUT**
- [ ] Instabilt bäcken? → **Bäckenbälte + MTP**
- [ ] Hotande hudnekros? → **Omedelbar reposition**

### I - ISCHEMIA (< 6 TIMMAR)
**Hårda tecken (→ omedelbar intervention):**
- Pulserande blödning
- Expanderande hematom
- Pulslöshet distalt
- Kyla och blekhet
- Thrill eller blåsljud

**Mjuka tecken (→ CT-angio):**
- Anamnes pulsatil blödning
- Nervpåverkan
- Icke-expanderande hematom

**ABI:** ≥0.9 normal | 0.5-0.9 utred | <0.5 AKUT

### M - MUSCLE COMPARTMENTS (< 6 TIMMAR)
**Högrisk:** Tibiafraktur, underarmsfraktur, crush, reperfusion, tight gips

**6 P (tidiga → sena):**
1. Pain (utöver förväntat)
2. **Pain on passive stretch** ← VIKTIGAST!
3. Pressure (spänt kompartment)
4. Paresthesia
5. Paralysis (SENT)
6. Pulselessness (MYCKET SENT)

**ΔP < 30 mmHg → FASCIOTOMI**

### B - BONE & SOFT TISSUE (< 3 TIMMAR)
**Öppen fraktur:**
- Antibiotika inom 3h (mål 1h)
- Tetanus
- Foto → Steril täckning → Rör ej

---

## TIDSKRITISKA GRÄNSER

| Tillstånd | Tidsgräns | Åtgärd |
|-----------|-----------|--------|
| Massiv blödning | **SEKUNDER** | Tourniquet |
| Pulslös extremitet | **< 6 timmar** | Revaskularisering |
| Kompartmentsyndrom | **< 6 timmar** | Fasciotomi |
| Öppen fraktur - antibiotika | **< 3 timmar** | Cefazolin 2g IV |
| Instabilt bäcken | **MINUTER** | Bäckenbälte |

---

## ANTIBIOTIKA VID ÖPPEN FRAKTUR

| Typ | Antibiotika | Dos |
|-----|-------------|-----|
| **Gustilo I-II** | Cefazolin | 2g IV |
| **Gustilo III** | Cefazolin + Gentamicin | 2g IV + 5mg/kg |
| **Jordkontaminering** | + Penicillin G | + 3g IV |
| **PC-allergi** | Klindamycin | 600mg IV |

---

## GUSTILO-ANDERSON

| Typ | Sår | Mjukdelsskada |
|-----|-----|---------------|
| **I** | < 1 cm | Minimal |
| **II** | 1-10 cm | Måttlig |
| **IIIA** | > 10 cm | Omfattande |
| **IIIB** | > 10 cm | Kräver lambå |
| **IIIC** | Kärlskada | Kräver reparation |

---

## PASSIV TÖJNINGSTEST - UNDERBEN

| Kompartment | Test |
|-------------|------|
| **Anteriort** | Passiv plantarflexion av fot/tår |
| **Lateralt** | Passiv inversion av fot |
| **Djupt posteriort** | Passiv dorsalflexion av tår |
| **Ytligt posteriort** | Passiv dorsalflexion av fot |

---

## ABI-TOLKNING

| ABI | Bedömning | Åtgärd |
|-----|-----------|--------|
| **≥ 0.9** | Normal | Observation |
| **0.5-0.9** | Måttlig ischemi | CTA |
| **< 0.5** | Svår ischemi | **AKUT** |

---

## BLODFÖRLUST PER FRAKTUR

| Fraktur | Blodförlust |
|---------|-------------|
| Radius/ulna | 150-250 ml |
| Humerus | 250-500 ml |
| Tibia | 500-1000 ml |
| **Femur** | **1000-2000 ml** |
| **Bäcken** | **1000-5000+ ml** |

---

## NERVSTATUS - ÖVRE EXTREMITET

| Nerv | Motorik | Sensorik |
|------|---------|----------|
| **N. medianus** | Tumopposition | Volara pekfingret |
| **N. ulnaris** | Fingerspretning | Ulnara lillfingret |
| **N. radialis** | Handledsextension | Dorsalt 1:a mellanrum |

---

## NERVSTATUS - NEDRE EXTREMITET

| Nerv | Motorik | Sensorik |
|------|---------|----------|
| **N. femoralis** | Knäextension | Anteriora låret |
| **N. peroneus** | Dorsalflexion | 1:a interdigitalrum |
| **N. tibialis** | Plantarflexion | Fotsulans laterala del |

---

## DCO vs ETC

| Patient | Strategi |
|---------|----------|
| **Stabil** | ETC (definitiv fix 24-48h) |
| **Borderline** | Individuell bedömning |
| **Instabil** | DCO (temporär ex-fix) |
| **In extremis** | Endast livräddande |

---

## SBAR-KOMMUNIKATION

| | Innehåll |
|---|----------|
| **S** | Vem du är, varför, om vem |
| **B** | Relevant anamnes |
| **A** | Vitala, fynd, åtgärder |
| **R** | Vad du behöver |

---

## SALTER-HARRIS (Barn)

| Typ | Beskrivning | Risk |
|-----|-------------|------|
| I | Genom fysen | Låg |
| II | Fys + metafys | Låg |
| III | Fys + epifys | Medel |
| **IV** | Genom alla | **HÖG** |
| **V** | Kompression | **HÖG** |

---

## KOMPARTMENTSYNDROM - AKUTA ÅTGÄRDER

1. **Dela gips HELT** (inkl vaddering)
2. **Sänk benet till hjärtnivå** (EJ högre!)
3. **Kontakta ortoped OMEDELBART**
4. **Förbered för fasciotomi**

**Fasciotomi inom 6 timmar!**`,
    },
    {
      id: 'guide-course-evaluation',
      type: 'FORM',
      title: 'Kursutvärdering',
      sortOrder: 10,
      content: `# ORTAC Kursutvärdering

**Kursdatum:** _______________________
**Kursort:** _______________________

*Tack för att du tar dig tid att fylla i denna utvärdering.*

---

## DEL 1: ÖVERGRIPANDE BEDÖMNING

### 1.1 Hur nöjd är du med kursen som helhet?
| 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Mycket missnöjd | Missnöjd | Neutral | Nöjd | Mycket nöjd |

### 1.2 Hur väl uppfylldes dina förväntningar?
☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5

### 1.3 Hur relevant är kursinnehållet för ditt kliniska arbete?
☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5

### 1.4 Skulle du rekommendera kursen till en kollega?
☐ Ja, absolut  ☐ Ja, troligen  ☐ Osäker  ☐ Nej

---

## DEL 2: FÖRELÄSNINGAR (1-5)

| Föreläsning | Innehåll | Pedagogik | Relevans |
|-------------|----------|-----------|----------|
| LIMB-algoritmen | ☐1-5 | ☐1-5 | ☐1-5 |
| Öppen fraktur & Kompartment | ☐1-5 | ☐1-5 | ☐1-5 |
| Kärlskador & Bäckentrauma | ☐1-5 | ☐1-5 | ☐1-5 |
| DCO & Polytrauma | ☐1-5 | ☐1-5 | ☐1-5 |
| Specifika frakturer | ☐1-5 | ☐1-5 | ☐1-5 |
| Pediatriskt trauma | ☐1-5 | ☐1-5 | ☐1-5 |

---

## DEL 3: FÄRDIGHETSSTATIONER (1-5)

| Station | Instruktion | Övningstid | Material | Instruktör |
|---------|-------------|------------|----------|------------|
| Tourniquet | ☐1-5 | ☐1-5 | ☐1-5 | ☐1-5 |
| ABI-mätning | ☐1-5 | ☐1-5 | ☐1-5 | ☐1-5 |
| Bäckenbälte | ☐1-5 | ☐1-5 | ☐1-5 | ☐1-5 |
| Passiv töjningstest | ☐1-5 | ☐1-5 | ☐1-5 | ☐1-5 |
| Gipsskena | ☐1-5 | ☐1-5 | ☐1-5 | ☐1-5 |
| LIMB-bedömning | ☐1-5 | ☐1-5 | ☐1-5 | ☐1-5 |

---

## DEL 4: SCENARIOTRÄNING

| Aspekt | Bedömning |
|--------|-----------|
| Realism | ☐1-5 |
| Pedagogiskt värde | ☐1-5 |
| Feedback-kvalitet | ☐1-5 |

Mängd: ☐ För lite  ☐ Lagom  ☐ För mycket

---

## DEL 5: EXAMINATION

### MCQ
- Svårighetsgrad: ☐ För lätt  ☐ Lagom  ☐ För svår
- Tid: ☐ För kort  ☐ Lagom  ☐ För lång

### OSCE
- Svårighetsgrad: ☐ För lätt  ☐ Lagom  ☐ För svår
- Tid per station: ☐ För kort  ☐ Lagom  ☐ För lång

---

## DEL 6: LÄRANDEMÅL (uppnådda 1-5)

| Lärandemål | 1 | 2 | 3 | 4 | 5 |
|------------|---|---|---|---|---|
| Beskriva LIMB-algoritmens fyra steg | ☐ | ☐ | ☐ | ☐ | ☐ |
| Ange kritiska tidsgränser | ☐ | ☐ | ☐ | ☐ | ☐ |
| Klassificera öppna frakturer (Gustilo) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Applicera tourniquet korrekt | ☐ | ☐ | ☐ | ☐ | ☐ |
| Mäta och tolka ABI | ☐ | ☐ | ☐ | ☐ | ☐ |
| Applicera bäckenbälte korrekt | ☐ | ☐ | ☐ | ☐ | ☐ |
| Utföra passiv töjningstest | ☐ | ☐ | ☐ | ☐ | ☐ |
| Prioritera åtgärder vid polytrauma | ☐ | ☐ | ☐ | ☐ | ☐ |
| Kommunicera enligt SBAR | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## DEL 7: FRITEXT

### Vad var bäst med kursen?
_________________________________________________________________

### Vad kan förbättras?
_________________________________________________________________

### Övriga kommentarer
_________________________________________________________________

---

## BAKGRUNDSFRÅGOR (frivilligt)

**Yrkesroll:** ☐ AT-läkare  ☐ ST-läkare  ☐ Specialist  ☐ Annan

**Specialitet:** ☐ Akutsjukvård  ☐ Kirurgi  ☐ Anestesi  ☐ Allmänmedicin

**År som läkare:** ☐ <2 år  ☐ 2-5 år  ☐ 5-10 år  ☐ >10 år

---

*Tack för din feedback!*`,
    },
    {
      id: 'guide-attendance-osce',
      type: 'FORM',
      title: 'Närvarolista & OSCE-bedömning',
      sortOrder: 11,
      content: `# ORTAC Närvarolista & OSCE-bedömningsformulär

---

## DEL A: NÄRVAROLISTA

**Kursdatum:** _______________  **Kursort:** _______________  **Kursledare:** _______________

| Nr | Namn | Leg.nr | Arbetsplats | Dag 1 | Dag 2 | MCQ | OSCE | Godkänd |
|----|------|--------|-------------|-------|-------|-----|------|---------|
| 1 | | | | ☐ | ☐ | /60 | /65 | ☐ |
| 2 | | | | ☐ | ☐ | /60 | /65 | ☐ |
| 3 | | | | ☐ | ☐ | /60 | /65 | ☐ |
| ... | | | | | | | | |
| 24 | | | | ☐ | ☐ | /60 | /65 | ☐ |

**Godkänt-kriterier:**
- Närvaro dag 1 OCH dag 2: ✓
- MCQ: ≥42/60 (70%)
- OSCE: ≥46/65 (70%)

---

## DEL B: OSCE-BEDÖMNING

### STATION 1: TOURNIQUET (10p)

**Namn:** _______________  **Examinator:** _______________

**Scenario:** "30-årig man med arteriell blödning på överarm. Applicera tourniquet."

| Kriterium | Max | Poäng |
|-----------|-----|-------|
| Väljer korrekt utrustning | 2 | |
| Placerar 5-7 cm proximalt om skadan | 2 | |
| Drar åt tills blödning upphör | 2 | |
| Genomför inom 30 sekunder | 2 | |
| Dokumenterar klockslag | 2 | |
| **TOTALT** | **10** | |

---

### STATION 2: ABI-MÄTNING (10p)

**Scenario:** "45-årig kvinna med spontanreponerad knäluxation. Mät ABI."

| Kriterium | Max | Poäng |
|-----------|-----|-------|
| Korrekt patientpositionering | 2 | |
| Mäter armtryck korrekt | 2 | |
| Identifierar rätt kärl (a. dorsalis pedis/tib post) | 2 | |
| Mäter ankeltryck korrekt | 2 | |
| Beräknar ABI korrekt | 1 | |
| Tolkar ABI-värdet korrekt | 1 | |
| **TOTALT** | **10** | |

---

### STATION 3: BÄCKENBÄLTE (10p)

**Scenario:** "50-årig man, trafikolycka, BT 85/50, misstänkt bäckeninstabilitet."

| Kriterium | Max | Poäng |
|-----------|-----|-------|
| Identifierar korrekt nivå (trochanternivå) | 3 | |
| Applicerar symmetriskt | 2 | |
| Adekvat åtdragning | 2 | |
| Binder knän och fotleder | 2 | |
| Kontrollerar distala pulsar | 1 | |
| **TOTALT** | **10** | |

---

### STATION 4: PASSIV TÖJNINGSTEST (10p)

**Scenario:** "22-årig man med tibiafraktur, ökande smärta. Testa alla 4 kompartment."

| Kriterium | Max | Poäng |
|-----------|-----|-------|
| Testar ANTERIORA (passiv plantarflexion) | 2 | |
| Testar LATERALA (passiv inversion) | 2 | |
| Testar DJUPA POSTERIORA (dorsalflexion tår) | 2 | |
| Testar YTLIGA POSTERIORA (dorsalflexion fot) | 2 | |
| Korrekt tolkning (smärta = fasciotomi) | 2 | |
| **TOTALT** | **10** | |

---

### STATION 5: LIMB-BEDÖMNING (15p)

**Scenario:** "35-årig man, MC-olycka, felställt högerben med 3cm sår anteriort."

| Kriterium | Max | Poäng |
|-----------|-----|-------|
| **L** - Identifierar/utesluter livshotande | 3 | |
| **I** - Kontrollerar cirkulation distalt | 3 | |
| **M** - Palperar kompartment, passiv töjning | 3 | |
| **B** - Identifierar öppen fraktur, antibiotika | 3 | |
| Formulerar korrekt plan | 3 | |
| **TOTALT** | **15** | |

---

### STATION 6: SBAR-KOMMUNIKATION (10p)

**Scenario:** "Ring ortopedjouren om 28-årig man med öppen tibiafraktur Gustilo II."

| Kriterium | Max | Poäng |
|-----------|-----|-------|
| **S** - Situation (vem, varför, om vem) | 2 | |
| **B** - Bakgrund (anamnes, mekanism) | 2 | |
| **A** - Aktuellt (vitala, fynd, åtgärder) | 3 | |
| **R** - Rekommendation (tydlig fråga) | 2 | |
| Professionellt framförande | 1 | |
| **TOTALT** | **10** | |

---

## DEL C: SAMMANSTÄLLNING

**Namn:** _______________

| Station | Max | Uppnått |
|---------|-----|---------|
| 1. Tourniquet | 10 | |
| 2. ABI-mätning | 10 | |
| 3. Bäckenbälte | 10 | |
| 4. Passiv töjningstest | 10 | |
| 5. LIMB-bedömning | 15 | |
| 6. SBAR-kommunikation | 10 | |
| **TOTALT** | **65** | |

**Godkänt (≥46p / 70%):** ☐ Ja  ☐ Nej

---

## DEL D: SLUTRESULTAT

| Komponent | Resultat | Godkänd |
|-----------|----------|---------|
| Närvaro dag 1 | ☐ Ja ☐ Nej | |
| Närvaro dag 2 | ☐ Ja ☐ Nej | |
| MCQ (≥70%) | ___/60 | ☐ Ja ☐ Nej |
| OSCE (≥70%) | ___/65 | ☐ Ja ☐ Nej |

**SLUTRESULTAT:** ☐ GODKÄND  ☐ ICKE GODKÄND

**Examinators signatur:** _______________  **Datum:** _______________`,
    },
  ];
}

// ============================================
// INSTRUCTOR COURSE CONTENT FUNCTIONS
// ============================================

function getTTTWorkshopContent(): string {
  return `# ORTAC TTT Workshop-manual
## Detaljerade instruktioner för Train-the-Trainer-kursen

---

**Facilitatorns kompletta guide**

**Version 1.0**

---

# INNEHÅLL

1. Introduktion och användning
2. Förberedelser (dagen innan)
3. Dag 1 – Pedagogisk grundkurs (8h)
4. Dag 2 – Praktisk instruktörsträning (8h)
5. Bilagor och utdelningsmaterial

---

# 1. INTRODUKTION

## Syfte med denna manual

Detta dokument innehåller **ordagrant manus och detaljerade instruktioner** för varje moment i TTT-kursen. Facilitatorn kan följa detta steg-för-steg för att säkerställa konsekvent och högkvalitativ utbildning av nya instruktörer.

## Hur du använder manualen

Genom hela dokumentet används följande symboler:

| Symbol | Betydelse |
|--------|-----------|
| 🎤 | **Manus** – Vad facilitatorn säger (kan anpassas till egen stil) |
| 📋 | **Instruktion** – Vad facilitatorn gör |
| 📦 | **Material** – Vad som behövs för momentet |
| ⚠️ | **Fallgrop** – Vanliga fel att undvika |
| ⏱️ | **Tid** – Tidsåtgång för momentet |
| ✅ | **Mål** – Lärandemål för momentet |

---

# 2. FÖRBEREDELSER (Dagen innan)

## 2.1 Materiallista

### Dokumentation (1 uppsättning per deltagare)
- [ ] TTT-handbok (tryckt)
- [ ] Feedback-referenskort (laminerat A5)
- [ ] Bedömningsformulär (för övningar)
- [ ] Anteckningsblock + penna
- [ ] Namnbricka

### Stationsmaterial
- [ ] 4 st CAT-tourniquet (för träning)
- [ ] 2 st blodtrycksmanschetter
- [ ] 2 st handhållna doppler (8 MHz)
- [ ] Ultraljudsgel
- [ ] 2 st bäckenbälten (T-POD eller SAM Sling)
- [ ] Anatomisk bäckenmodell
- [ ] Anatomiska bilder underben (A3, laminerade)
- [ ] 2 st britsar
- [ ] Gipsmaterial (för demonstration)

### Teknik
- [ ] Projektor + dator
- [ ] Klickare/presenter
- [ ] Whiteboard + pennor
- [ ] Flipchart (2 st)
- [ ] Timer (synlig för alla)
- [ ] Kamera för videoinspelning (valfritt)

---

# 3. DAG 1 – PEDAGOGISK GRUNDKURS

## Schema dag 1

| Tid | Moment | Längd |
|-----|--------|-------|
| 08:00-08:30 | Registrering och fika | 30 min |
| 08:30-09:00 | Välkomna och introduktion | 30 min |
| 09:00-10:00 | Vuxenpedagogik och lärstilar | 60 min |
| 10:00-10:15 | Paus | 15 min |
| 10:15-11:15 | Feedback – teori och modeller | 60 min |
| 11:15-12:00 | Feedback – praktisk övning 1 | 45 min |
| 12:00-13:00 | Lunch | 60 min |
| 13:00-14:00 | Facilitering av färdighetsträning | 60 min |
| 14:00-14:45 | Praktisk övning 2 – instruera station | 45 min |
| 14:45-15:00 | Paus | 15 min |
| 15:00-16:00 | Simulering och debriefing | 60 min |
| 16:00-16:45 | Debriefing-övning | 45 min |
| 16:45-17:00 | Sammanfattning och förberedelse dag 2 | 15 min |

---

## 3.1 Välkomna och introduktion (08:30-09:00)

⏱️ **Tid:** 30 minuter

✅ **Mål:**
- Deltagarna känner sig välkomna och vet vad kursen innehåller
- Deltagarna har presenterat sig och sina förväntningar
- Praktiska detaljer är klargjorda

---

## 3.2 Vuxenpedagogik och lärstilar (09:00-10:00)

### Knowles 6 principer för vuxenlärande:

1. **Behovet av att veta** – Vuxna behöver förstå VARFÖR de ska lära sig något
2. **Självstyrning** – Vuxna vill ha kontroll över sitt lärande
3. **Erfarenhetens roll** – Vuxna kopplar ny kunskap till det de redan vet
4. **Beredskap att lära** – Motiverade att lära sig praktiskt relevanta saker
5. **Inriktning mot problemlösning** – Vill lösa problem, inte memorera fakta
6. **Motivation** – Motiveras mer av inre faktorer än yttre

### Kolbs lärstilar:
- **Aktivisten** – "Låt mig prova!" Lär sig genom att göra
- **Reflektören** – "Låt mig tänka på det." Observerar först, analyserar
- **Teoretikern** – "Varför fungerar det?" Vill förstå principerna
- **Pragmatikern** – "Hur kan jag använda det?" Fokuserar på tillämpning

### Millers pyramid:
\`\`\`
           ┌───────────┐
           │   GÖR     │  ← Observation i klinisk praktik
           │  (Does)   │
          ┌┴───────────┴┐
          │   VISAR HUR │ ← OSCE, simulering
          │(Shows how)  │
         ┌┴─────────────┴┐
         │    VET HUR    │ ← Fallbaserade test
         │  (Knows how)  │
        ┌┴───────────────┴┐
        │       VET       │ ← MCQ, skriftligt test
        │    (Knows)      │
        └─────────────────┘
\`\`\`

---

## 3.3 Feedback – Pendleton och SET-GO

### Pendletons modell (för längre feedback):

1. Fråga läraren – "Vad tycker du själv gick bra?"
2. Bekräfta och utveckla – "Jag håller med, och jag la också märke till..."
3. Fråga igen – "Vad skulle du göra annorlunda nästa gång?"
4. Komplettera med dina observationer – "Ett förslag till..."

### SET-GO-modellen (snabb, 30 sek):

| Steg | Beskrivning |
|------|-------------|
| **S** – See/Jag såg | Beskriv konkret beteende |
| **E** – Effect/Effekt | Förklara konsekvensen |
| **T** – Task/Uppgift | Ge specifik förbättringsuppgift |
| **G** – Go/Kör | Låt dem prova igen |
| **O** – Outcome | Bekräfta förbättring |

---

## 3.4 Peyton 4-stegsmodell för färdighetsträning

1. **Demonstration (real speed)** – Visa proceduren utan förklaring
2. **Dekonstruktion** – Visa igen, långsamt, med förklaring
3. **Comprehension** – Instruktören gör, deltagaren instruerar
4. **Performance** – Deltagaren gör självständigt

⚠️ **Fallgrop:** Hoppa inte över steg 3! Det är frestande men avgörande för lärandet.

---

## 3.5 GAS-modellen för debriefing

| Steg | Frågor |
|------|--------|
| **G** – Gather (Samla) | "Vad hände i scenariot?" |
| **A** – Analyze (Analysera) | "Varför hände det?" |
| **S** – Summarize (Sammanfatta) | "Vad tar ni med er?" |

---

# 4. DAG 2 – PRAKTISK INSTRUKTÖRSTRÄNING

## Schema dag 2

| Tid | Moment | Längd |
|-----|--------|-------|
| 08:30-08:45 | Reflektion från dag 1 | 15 min |
| 08:45-10:15 | Stationsinstruktion – examineras | 90 min |
| 10:15-10:30 | Paus | 15 min |
| 10:30-12:00 | Scenario-facilitering – examineras | 90 min |
| 12:00-13:00 | Lunch | 60 min |
| 13:00-14:00 | Svåra situationer – workshops | 60 min |
| 14:00-14:45 | Kalibreringsövning – video | 45 min |
| 14:45-15:00 | Paus | 15 min |
| 15:00-15:45 | Individ. feedback + utvecklingsplan | 45 min |
| 15:45-16:30 | Avslutning + certifiering | 45 min |

---

## Bedömningsformulär för stationsinstruktion

| Kriterium | 0 | 1 | 2 |
|-----------|---|---|---|
| Tydlig introduktion med mål | Saknas | Delvis | Komplett |
| Peyton steg 1 (demonstration) | Utelämnad | Otydlig | Tydlig |
| Peyton steg 2 (förklaring) | Utelämnad | Ofullständig | Fullständig |
| Peyton steg 3 (comprehension) | Utelämnad | Delvis | Genomförd |
| Gruppträning | Kaotisk | Fungerar | Välorganiserad |
| Feedback till deltagare | Ingen/vag | Delvis | Specifik/konstruktiv |
| Tidshantering | Överdrag >2 min | Överdrag <2 min | Inom tid |

**Godkänt:** Minst 10 av 14 poäng

---

*Slut på ORTAC TTT Workshop-manual v1.0*`;
}

function getExaminatorkursContent(): string {
  return `# ORTAC Examinatorkurs
## 4-timmars kurs för OSCE-examinatorer

---

**Att bedöma rättvist och konsekvent**

**Version 1.0**

---

# INNEHÅLL

1. Kursöversikt
2. Examinatorns roll
3. OSCE-bedömning
4. Checklistor och global bedömning
5. Kalibrering
6. Vanliga bias och hur du undviker dem
7. Hantering av gränsfall

---

# 1. KURSÖVERSIKT

## Syfte

Denna kurs förbereder erfarna instruktörer för rollen som **OSCE-examinator** vid ORTAC-kursen. Efter kursen ska deltagaren kunna:

- Använda OSCE-checklistor korrekt och konsekvent
- Genomföra kalibrering med andra examinatorer
- Identifiera och undvika vanliga bedömningsbias
- Hantera gränsfall enligt beslutsalgoritm

## Schema

| Tid | Moment | Längd |
|-----|--------|-------|
| 13:00-13:15 | Introduktion | 15 min |
| 13:15-14:00 | Examinatorns roll | 45 min |
| 14:00-14:45 | Checklistor och global bedömning | 45 min |
| 14:45-15:00 | Paus | 15 min |
| 15:00-15:45 | Kalibrering (videoövning) | 45 min |
| 15:45-16:30 | Bias och gränsfall | 45 min |
| 16:30-17:00 | Sammanfattning och examination | 30 min |

---

# 2. EXAMINATORNS ROLL

## 2.1 Examinator vs Instruktör

| Aspekt | Instruktör | Examinator |
|--------|------------|------------|
| **Syfte** | Lärande | Bedömning |
| **Interaktion** | Aktiv, stödjande | Neutral, observerande |
| **Feedback** | Kontinuerlig | Endast efter station (om alls) |
| **Hjälp** | Ger ledtrådar | Ger EJ hjälp |
| **Atmosfär** | Trygg, uppmuntrande | Formell, standardiserad |

## 2.2 Examinatorns ansvar

- Skapa professionell atmosfär
- Följa standardiserat protokoll
- Bedöma objektivt och konsekvent
- Dokumentera korrekt
- Flagga gränsfall för diskussion

---

# 3. OSCE-BEDÖMNING

## Kombinerad bedömningsmodell

ORTAC använder en **kombinerad modell** med:
- **70% Checklista** – objektiv, binär (gjort/ej gjort)
- **30% Global bedömning** – holistisk kompetens

### Checklistans struktur

| Element | Poäng | Typ |
|---------|-------|-----|
| Handtvättning | 1 | Binär |
| Korrekt placering | 2 | Gradera |
| Kommunikation | 1 | Binär |
| **Kritiskt fel** | -5 | Avdrag |

### Global bedömningsskala

| Nivå | Beskrivning |
|------|-------------|
| 1 | Oacceptabel – allvarliga brister |
| 2 | Bristfällig – ej godkänt |
| 3 | Gräns – godkänt med reservationer |
| 4 | Kompetent – godkänt |
| 5 | Expert – imponerande |

---

# 4. KALIBRERING

## Inter-Rater Reliability (IRR)

Kalibrering säkerställer att alla examinatorer bedömer likadant.

**Mål:** ICC (Intraclass Correlation Coefficient) > 0.80

### Kalibreringsprocess

1. **Frame of Reference Training** – Definiera vad som är godkänt
2. **Video-bedömning** – Alla bedömer samma video
3. **Jämförelse** – Diskutera avvikelser
4. **Konsensus** – Enas om standarder
5. **Upprepning** – Tills ICC > 0.80

---

# 5. VANLIGA BIAS

## Bias som påverkar bedömning

| Bias | Beskrivning | Motmedel |
|------|-------------|----------|
| **Halo-effekt** | Starkt första intryck påverkar allt | Bedöm punkt för punkt |
| **Horns-effekt** | Negativt intryck spiller över | Nollställ mellan punkter |
| **Central tendency** | Undviker extremer | Använd hela skalan |
| **Severity/Leniency** | Systematiskt för hård/mild | Kalibrering |
| **Contrast effect** | Jämför med föregående | Jämför med standard |

---

# 6. HANTERING AV GRÄNSFALL

## Beslutsalgoritm

\`\`\`
       ┌─────────────────────────────────────┐
       │       DELTAGARENS PRESTATION         │
       └───────────────┬─────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ TYDLIGT  │  │ GRÄNSFALL│  │ TYDLIGT  │
    │ GODKÄND  │  │          │  │ UNDERKÄND│
    └────┬─────┘  └────┬─────┘  └────┬─────┘
         │             │              │
         ▼             ▼              ▼
    Dokumentera   Flagga för    Dokumentera
                  diskussion    + specifik
                                feedback
\`\`\`

## Borderline Regression Method (BRM)

Vid gränsfall vägs global bedömning tyngre:
- Om global = 3 och checklista nära gränsen → Diskutera
- Om global ≤ 2 och checklista godkänd → Underkänd
- Om global ≥ 4 och checklista underkänd → Diskutera

---

*Slut på ORTAC Examinatorkurs v1.0*`;
}

function getKursledarutbildningContent(): string {
  return `# ORTAC Kursledarutbildning
## Komplett 1-dagskurs för blivande kursledare

---

**Att leda en ORTAC-kurs från planering till genomförande**

**Version 1.0**

---

# INNEHÅLL

1. Kursöversikt
2. Kursledarens roll och ansvar
3. Kursplanering (före kursen)
4. Logistik och administration
5. Teamledning
6. Kursdagen – steg för steg
7. OSCE-hantering
8. Kvalitetssäkring och utvärdering
9. Krishantering

---

# 1. KURSÖVERSIKT

## Syfte

Denna kurs förbereder erfarna instruktörer för rollen som **kursledare** för ORTAC-kursen. Efter kursen ska deltagaren kunna:

- Planera och organisera en komplett ORTAC-kurs
- Leda instruktörsteamet effektivt
- Hantera logistik, schemaläggning och resurser
- Koordinera OSCE-examinationen
- Hantera oväntade situationer och kriser
- Säkerställa kursens kvalitet genom utvärdering

## Förkunskaper

- Aktiv ORTAC-instruktör (minst 6 kurser)
- Genomgången TTT-kurs och examinatorkurs
- Rekommendation från nuvarande kursledare
- Auskultation som biträdande kursledare (minst 2 kurser)

---

# 2. KURSLEDARENS ROLL OCH ANSVAR

## Kursledarens fyra roller

\`\`\`
┌─────────────────────────────────────────────────────────┐
│              KURSLEDARENS FYRA ROLLER                   │
├─────────────────────────────────────────────────────────┤
│  🎯 ORGANISATÖR                                         │
│  Planerar kursen, säkerställer resurser,                │
│  hanterar logistik och administration.                  │
│                                                         │
│  👥 TEAMLEDARE                                          │
│  Leder instruktörsteamet, fördelar uppgifter,           │
│  skapar god arbetsmiljö, löser konflikter.              │
│                                                         │
│  🎓 KVALITETSANSVARIG                                   │
│  Säkerställer att utbildningen håller standard,         │
│  följer upp utvärderingar, driver förbättring.          │
│                                                         │
│  🆘 KRISHANTERARE                                       │
│  Tar beslut vid oväntade situationer,                   │
│  hanterar problem snabbt och diskret.                   │
└─────────────────────────────────────────────────────────┘
\`\`\`

## Tidslinje för kursledaren

\`\`\`
8 VECKOR FÖRE KURSEN
├── Boka lokal
├── Fastställ budget
├── Rekrytera instruktörsteam
└── Skicka "save the date" till deltagare

6 VECKOR FÖRE
├── Slutligt schema
├── Materialbeställning
├── Instruktörsmöte 1 (virtuellt)
└── Deltagaranmälan öppnar

4 VECKOR FÖRE
├── Bekräftelse till deltagare
├── Förläsningsinnehåll granskat
├── Instruktörsmöte 2 (uppgiftsfördelning)
└── OSCE-checklistor uppdaterade

2 VECKOR FÖRE
├── Final deltagarförteckning
├── Tryck material
├── Kontrollera utrustning
└── Förbered deltagarpaket

1 VECKA FÖRE
├── Instruktörsmöte 3 (final briefing)
├── Allt material packat
├── Backup-planer för sjukdom
└── Kontaktlista distribuerad

DAGEN INNAN
├── Rumskontroll
├── Utrustning på plats
├── Material utlagt
└── Schema utskrivet

KURSDAGEN
├── Ankomst 1h före start
├── Teamfrukost
├── Sista genomgång
└── GENOMFÖR KURS

DAGEN EFTER
├── Utvärderingar sammanställda
├── Resultat dokumenterade
├── Tack till teamet
└── Förbättringsförslag noterade
\`\`\`

---

# 3. KURSPLANERING

## Budget och ekonomi

| Post | Typisk kostnad | Kommentar |
|------|----------------|-----------|
| Lokal | 5,000-15,000 kr | Beroende på region |
| Material (förbrukning) | 50-100 kr/deltagare | Gips, förband etc. |
| Trycksaker | 200-300 kr/deltagare | Kursbok, certifikat |
| Fika/lunch | 300-500 kr/person | Deltagare + instruktörer |
| Instruktörsersättning | Varierande | Enligt lokala avtal |
| Oförutsett | 10% av budget | |

---

# 4. LOGISTIK OCH ADMINISTRATION

## Materiallista (komplett)

### Stationsutrustning

| Station | Material | Antal |
|---------|----------|-------|
| Tourniquet | CAT-tourniquet | 6 |
| ABI | Blodtrycksmanschett + doppler | 4 |
| Bäckenbälte | T-POD eller SAM Sling | 4 |
| Kompartment | Anatomiska bilder (A3) | 4 |
| Gips | Gipsbinda + polstring | 20 rullar |

---

# 5. TEAMLEDNING

## Rekrytera instruktörer

**Formella krav:**
- Godkänd TTT-kurs
- Aktiv instruktör (2+ kurser senaste året)
- Tillgänglig båda kursdagarna

**Teamsammansättning:**
- 1 kursledare
- 1 biträdande kursledare
- 1 instruktör per station (4-5 st)
- 1-2 OSCE-examinatorer

---

# 6. KRISHANTERING

## Vanliga problem och lösningar

### Problem: Instruktör sjuk på kursdagen

**Lösning:**
1. Ring backup-instruktör (ska finnas på listan)
2. Om ingen backup: Kursledaren tar stationen
3. Om det inte går: Slå ihop grupper

**Prevention:** Ha alltid en "on-call" instruktör

### Problem: Utrustning fungerar inte

**Lösning:**
1. Byt till backup-utrustning
2. Anpassa stationen (verbal genomgång istället)
3. Kontakta lokal klinik för lån

**Prevention:** Testa all utrustning dagen innan

### Problem: Deltagare underkänns och blir arg

**Lösning:**
1. Behåll lugnet
2. Visa empati: "Jag förstår att det är frustrerande"
3. Håll dig till fakta
4. Erbjud omprövning

---

# 7. KVALITETSINDIKATORER

| Indikator | Mål |
|-----------|-----|
| Godkännandegrad | >85% |
| Deltagarsnöjdhet | >4.5/6 |
| Instruktörsrating | >4.5/6 |
| OSCE-reliabilitet | ICC >0.80 |

---

*Slut på ORTAC Kursledarutbildning v1.0*`;
}

function getSvaraSituationerContent(): string {
  return `# ORTAC Svåra Situationer Casebook
## Pedagogiska utmaningar och lösningar för instruktörer

---

**Scenariobaserad guide för att hantera svåra situationer**

**Version 1.0**

---

# INNEHÅLL

1. Introduktion
2. Deltagare som inte når målen
3. Dominanta och tysta deltagare
4. Hierarkier och maktdynamik
5. Emotionella reaktioner
6. Feedback som inte landar
7. Konflikter och samarbetssvårigheter
8. Snabbreferens – "Vad gör jag nu?"

---

# 1. INTRODUKTION

Varje instruktör kommer att möta svåra situationer. Det kan handla om deltagare som inte klarar kursen, konflikter i gruppen, hierarkier som försvårar lärande, eller oväntade händelser som kräver snabba beslut.

Denna casebook presenterar **verkliga scenarion** (anonymiserade) som instruktörer har mött, tillsammans med **analyserade lösningar**.

---

# 2. DELTAGARE SOM INTE NÅR MÅLEN

## Case 2.1: Deltagaren som uppenbart inte förstår

### Scenario
Du instruerar ABI-mätning. En AT-läkare verkar helt borta. Hon applicerar dopplern på fel ställe gång på gång.

### Vad du INTE ska göra
❌ Sucka eller visa irritation
❌ Säga "Det här borde du kunna"
❌ Ignorera henne och gå vidare

### Vad du KAN göra
✅ Pausa och fråga: "Kan du berätta för mig var du tänker att artären går?"
✅ Förenkla: Bryt ner i ännu mindre steg
✅ Erbjud extra tid: "Vi hinner träna mer under lunchen om du vill"

---

## Case 2.2: Deltagaren som misslyckas på OSCE

### Scenario
En deltagare klarar inte OSCE-provet. Hon presterade under godkäntgränsen på två stationer.

### Vad du KAN göra
✅ **Privat samtal** – Ta henne åt sidan direkt efter OSCE
✅ **Börja med att lyssna:** "Hur upplevde du provet?"
✅ **Var saklig och specifik:** "Du nådde godkäntgränsen på tre stationer, men inte på tourniquet och ABI."
✅ **Erbjud väg framåt:** "Du kan göra omprov. Jag föreslår att du tränar med en kollega."

---

# 3. DOMINANTA OCH TYSTA DELTAGARE

## Case 3.1: "Jag-vet-allt"-deltagaren

### Scenario
En erfaren anestesiolog avbryter dig konstant med egna erfarenheter och "tips".

### Vad du KAN göra
✅ **Erkänn och begränsa:** "Bra poäng! Vi kan prata mer om det efteråt. Nu behöver vi fokusera på X."
✅ **Ge honom en roll:** "Du verkar ha mycket erfarenhet – kan du demonstrera hur du brukar göra?"
✅ **Prata enskilt:** "Jag uppskattar dina bidrag, men jag märker att det tar tid från övningarna."

---

## Case 3.2: Den tysta deltagaren

### Scenario
En ung AT-läkare har knappt sagt ett ord hela dagen.

### Vad du KAN göra
✅ **Bjud in, inte kräv:** "Vad tänker du om det här?" (med vänlig röst)
✅ **Ge enkel uppgift:** "Kan du hålla tourniqueten medan jag visar?"
✅ **Prata enskilt:** "Hur upplever du kursen så långt?"

---

# 4. HIERARKIER OCH MAKTDYNAMIK

## Case 4.1: Överläkaren som inte tar till sig feedback

### Scenario
En överläkare gör fel med bäckenbältet. När du försöker korrigera säger han: "Så har vi alltid gjort."

### Vad du KAN göra
✅ **Fråga in:** "Kan du berätta hur ni brukar göra?"
✅ **Dela evidens neutralt:** "De senaste riktlinjerna rekommenderar faktiskt lägre placering."
✅ **Acceptera begränsningar:** Ibland kan du inte ändra någon på en dag.

---

# 5. EMOTIONELLA REAKTIONER

## Case 5.1: Deltagaren som gråter

### Scenario
Under debriefing börjar en deltagare gråta. "Jag klarar aldrig det här."

### Vad du KAN göra
✅ **Pausa:** "Vi tar en kort paus."
✅ **Privat samtal:** "Hur mår du? Vill du prata?"
✅ **Validera:** "Det låter som att kursen väcker mycket känslor. Det är okej."
✅ **Erbjud alternativ:** "Vill du ta en paus och komma tillbaka?"

---

## Case 5.2: Deltagaren som blir arg

### Scenario
"Det där är fel! Jag har jobbat med trauma i 10 år!"

### Vad du KAN göra
✅ **Sänk tempot:** Pausa, andas, prata lugnt
✅ **Erkänn perspektivet:** "Jag hör att ni gör annorlunda på ert sjukhus."
✅ **Stick till fakta:** "Kursinnehållet baseras på [riktlinje]."
✅ **Erbjud fortsatt dialog:** "Vi kan diskutera mer under lunchen."

---

# 6. SNABBREFERENS – "VAD GÖR JAG NU?"

\`\`\`
┌─────────────────────────────────────────────────────────┐
│       NÄR DU INTE VET VAD DU SKA GÖRA                  │
├─────────────────────────────────────────────────────────┤
│  1. PAUSA                                               │
│     "Vi tar en kort paus / Ge mig en sekund"            │
│                                                         │
│  2. TA ÅT SIDAN                                         │
│     Privat samtal, inte inför gruppen                   │
│                                                         │
│  3. LYSSNA                                              │
│     "Berätta mer" / "Hur tänker du?"                    │
│                                                         │
│  4. KÖP TID                                             │
│     "Låt mig återkomma till det"                        │
│                                                         │
│  5. ESKALERA                                            │
│     Kontakta kursledare om det krävs                    │
└─────────────────────────────────────────────────────────┘
\`\`\`

## Situationsguide

| Situation | Första åtgärd |
|-----------|---------------|
| Deltagare gråter | Pausa gruppen, privat samtal |
| Deltagare blir arg | Sänk tempot, erkänn perspektiv |
| Deltagare förstår inte | Ändra strategi (visa, guida fysiskt) |
| Deltagare dominerar | "Bra poäng – vi tar det efteråt" |
| Deltagare är tyst | Bjud in, ge enkel uppgift |
| Hierarki blockerar | Fråga in, dela evidens neutralt |
| Utrustning krånglar | Improvisera, ändra ordning |
| Konflikt mellan deltagare | Separera, tala enskilt |

## Användbara fraser

**För att avbryta:**
- "Bra – vi bygger vidare på det senare."
- "Vi behöver fokusera på X just nu."

**För att bjuda in:**
- "Vad tänker du om det här?"
- "Har du erfarenhet av detta?"

**För att validera:**
- "Jag förstår att det känns så."
- "Det är helt normalt att det är svårt i början."

**För att korrigera:**
- "Prova att..."
- "Det jag skulle föreslå är..."

---

# SLUTORD

Svåra situationer är inte misslyckanden – de är en del av jobbet. De bästa instruktörerna är inte de som aldrig möter problem, utan de som hanterar problem med värdighet, empati och professionalism.

**Principer att komma ihåg:**

1. **Psykologisk trygghet** – Deltagaren ska alltid känna sig respekterad
2. **Privat före offentligt** – Ta svåra samtal åt sidan
3. **Nyfikenhet före dom** – Fråga "Hur tänker du?" innan du antar
4. **Flexibilitet** – Om något inte fungerar, prova en annan metod
5. **Eskalera vid behov** – Du behöver inte lösa allt själv

---

*Slut på ORTAC Svåra Situationer Casebook v1.0*`;
}

function getInstructorQuizQuestions() {
  return [
    // Kapitel 1: TTT Workshop Manual (5 frågor)
    {
      code: 'TTT-1.1',
      chapterNumber: 1,
      bloomLevel: 'KNOWLEDGE',
      question: 'Enligt Knowles principer för vuxenlärande, vilken av följande faktorer är MEST avgörande för vuxnas motivation att lära?',
      options: [
        { text: 'Att innehållet är omedelbart relevant för deras yrkesroll', correct: true },
        { text: 'Att kursen är obligatorisk enligt arbetsgivaren', correct: false },
        { text: 'Att det finns en formell examination', correct: false },
        { text: 'Att kursledaren har akademiska meriter', correct: false },
      ],
      explanation: 'Knowles betonar att vuxna lär bäst när de ser omedelbar relevans och kan tillämpa kunskapen direkt. "Need to know" är en av de sex grundprinciperna.',
      reference: 'Knowles MS. The Adult Learner, 8th ed. 2015',
    },
    {
      code: 'TTT-1.2',
      chapterNumber: 1,
      bloomLevel: 'COMPREHENSION',
      question: 'Enligt Kolbs lärcykel, vilken aktivitet passar BÄST för en deltagare med "Reflektor"-lärstil?',
      options: [
        { text: 'Observera en demonstration innan egen praktik', correct: true },
        { text: 'Börja med praktisk övning direkt', correct: false },
        { text: 'Läsa teoretiskt material självständigt', correct: false },
        { text: 'Delta i gruppdisskusion omedelbart', correct: false },
      ],
      explanation: 'Reflektorer (Reflective Observers) föredrar att observera och reflektera innan de agerar. De trivs med demonstrationer och tid för eftertanke.',
      reference: 'Kolb DA. Experiential Learning. 2014',
    },
    {
      code: 'TTT-1.3',
      chapterNumber: 1,
      bloomLevel: 'APPLICATION',
      question: 'Du ger feedback på en deltagares tourniquet-applicering. Enligt Pendleton-modellen, vad gör du FÖRST?',
      options: [
        { text: 'Fråga deltagaren vad som gick bra', correct: true },
        { text: 'Berätta vad du observerade som korrekt', correct: false },
        { text: 'Fråga vad deltagaren kunde förbättra', correct: false },
        { text: 'Visa hur det ska göras korrekt', correct: false },
      ],
      explanation: 'Pendleton-modellen börjar alltid med att den som får feedback först identifierar vad som gick bra (självreflektion), sedan kompletterar instruktören.',
      reference: 'Pendleton D et al. The Consultation, 2003',
    },
    {
      code: 'TTT-1.4',
      chapterNumber: 1,
      bloomLevel: 'APPLICATION',
      question: 'Du undervisar bäckenbälte-applicering med Peytons 4-stegsmodell. I steg 3 ("Student describes"), vad gör deltagaren?',
      options: [
        { text: 'Förklarar proceduren muntligt medan instruktören utför den', correct: true },
        { text: 'Utför proceduren självständigt', correct: false },
        { text: 'Observerar instruktören som utför proceduren', correct: false },
        { text: 'Beskriver proceduren efter att ha läst instruktionen', correct: false },
      ],
      explanation: 'I steg 3 ("Student describes") beskriver deltagaren varje moment muntligt medan instruktören utför det – detta säkerställer kognitiv förståelse före motorisk praktik.',
      reference: 'Peyton JWR. Teaching and Learning in Medical Practice, 1998',
    },
    {
      code: 'TTT-1.5',
      chapterNumber: 1,
      bloomLevel: 'ANALYSIS',
      question: 'Under GAS-debriefing efter en simulering säger en deltagare "Jag vet inte varför jag glömde att kontrollera pulsen". Vilken fråga är MEST effektiv för fördjupad reflektion?',
      options: [
        { text: '"Vad hände precis innan du skulle kontrollera pulsen?"', correct: true },
        { text: '"Du borde alltid följa LIMB-protokollet"', correct: false },
        { text: '"Har du glömt detta förut?"', correct: false },
        { text: '"Pulskontroll är kritisk, var mer uppmärksam nästa gång"', correct: false },
      ],
      explanation: 'GAS-modellen (Gather-Analyse-Summarise) använder öppna frågor för att hjälpa deltagaren själv upptäcka orsaker. Frågor om situationen före felet hjälper identifiera triggande faktorer.',
      reference: 'Rudolph JW et al. Simul Healthc 2006;1:49-55',
    },

    // Kapitel 2: Examinatorkurs (4 frågor)
    {
      code: 'TTT-2.1',
      chapterNumber: 2,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka tre komponenter ska en OSCE-checklista MINST innehålla enligt best practice?',
      options: [
        { text: 'Handlingsmoment, kvalitetskriterier och poängsättning', correct: true },
        { text: 'Tidsåtgång, utrustningslista och lärandemål', correct: false },
        { text: 'Patientscenario, instruktörkommentarer och betyg', correct: false },
        { text: 'Teoretisk kunskap, praktisk färdighet och kommunikation', correct: false },
      ],
      explanation: 'En OSCE-checklista måste specificera VAD som ska göras (handlingsmoment), HUR det ska bedömas (kvalitetskriterier) och hur POÄNG tilldelas.',
      reference: 'Harden RM. Med Educ 1988;22:34-45',
    },
    {
      code: 'TTT-2.2',
      chapterNumber: 2,
      bloomLevel: 'COMPREHENSION',
      question: 'Vad är HUVUDSYFTET med kalibrering mellan examinatorer före en OSCE?',
      options: [
        { text: 'Säkerställa att alla examinatorer bedömer lika vid gränsfallsprestationer', correct: true },
        { text: 'Kontrollera att checklistorna är korrekt utskrivna', correct: false },
        { text: 'Fördela stationerna jämnt mellan examinatorerna', correct: false },
        { text: 'Presentera de teoretiska lärandemålen', correct: false },
      ],
      explanation: 'Kalibrering handlar om inter-rater reliability – att examinatorer tolkar checklistor lika, särskilt för gränsfall mellan godkänd/underkänd.',
      reference: 'Khan KZ et al. BMC Med Educ 2013;13:126',
    },
    {
      code: 'TTT-2.3',
      chapterNumber: 2,
      bloomLevel: 'APPLICATION',
      question: 'En deltagare utför 4 av 5 checklistepunkter korrekt på tourniquet-stationen, men den femte punkten (tidsdokumentation) är kritisk säkerhetspunkt. Enligt beslutsalgoritmen, vad är korrekt beslut?',
      options: [
        { text: 'Underkänd – kritiska säkerhetspunkter måste uppfyllas oavsett övrig poäng', correct: true },
        { text: 'Godkänd – 80% är tillräckligt', correct: false },
        { text: 'Marginell – kräver bedömning av två examinatorer', correct: false },
        { text: 'Komplettering krävs endast för den missade punkten', correct: false },
      ],
      explanation: 'Kritiska säkerhetspunkter är "must-pass" items. Att missa tidsnotering på tourniquet kan leda till allvarlig patientskada vid förlängd applicering.',
      reference: 'ORTAC OSCE Protocol v1.0',
    },
    {
      code: 'TTT-2.4',
      chapterNumber: 2,
      bloomLevel: 'ANALYSIS',
      question: 'Under en OSCE-examination märker du att du konsekvent ger kvinnliga deltagare lägre poäng för "kommunikation". Vilken typ av bedömningsbias är detta MEST sannolikt?',
      options: [
        { text: 'Gender bias (könsrelaterad fördom)', correct: true },
        { text: 'Halo-effekt', correct: false },
        { text: 'Leniency bias', correct: false },
        { text: 'Central tendency bias', correct: false },
      ],
      explanation: 'Gender bias innebär systematiska skillnader i bedömning baserat på kön. Det är viktigt att vara medveten om och aktivt motverka sådana mönster.',
      reference: 'Rizan C et al. Med Educ 2022;56:12-24',
    },

    // Kapitel 3: Kursledarutbildning (4 frågor)
    {
      code: 'TTT-3.1',
      chapterNumber: 3,
      bloomLevel: 'KNOWLEDGE',
      question: 'Vilka tre huvudkostnader dominerar vanligtvis budgeten för en ORTAC-kurs?',
      options: [
        { text: 'Lokal, utrustning/förbrukningsvaror och instruktörsarvoden', correct: true },
        { text: 'Marknadsföring, certifikat och administration', correct: false },
        { text: 'Resor, mat och kursmaterial', correct: false },
        { text: 'Simulatorer, IT-system och försäkringar', correct: false },
      ],
      explanation: 'De tre största kostnadsposterna är typiskt lokal (ofta sjukhusförankrad), förbrukningsvaror (tourniquets, bandage) och instruktörsersättning.',
      reference: 'ORTAC Kursledarutbildning v1.0',
    },
    {
      code: 'TTT-3.2',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Du är kursledare och en instruktör meddelar sjukdom kursdag 1 morgon. Kursen har 16 deltagare och 4 planerade instruktörer. Vad är FÖRSTA åtgärden?',
      options: [
        { text: 'Kontakta reserve-instruktör från backup-listan', correct: true },
        { text: 'Reducera antalet stationer för dagen', correct: false },
        { text: 'Informera deltagarna om förändrat program', correct: false },
        { text: 'Ställa in kursdagen och boka om', correct: false },
      ],
      explanation: 'Kursledarens första åtgärd vid personalbortfall är att aktivera backup-planen – kontakta reserve-instruktörer som ska finnas på standby.',
      reference: 'ORTAC Kursledarutbildning v1.0',
    },
    {
      code: 'TTT-3.3',
      chapterNumber: 3,
      bloomLevel: 'APPLICATION',
      question: 'Du koordinerar OSCE för 16 deltagare med 8 stationer. Varje station tar 8 minuter med 2 minuters rotation. Hur lång tid tar HELA examinationen för alla deltagare?',
      options: [
        { text: 'Ca 80 minuter (alla går parallellt genom 8 stationer)', correct: true },
        { text: 'Ca 160 minuter (två grupper á 8 deltagare)', correct: false },
        { text: 'Ca 256 minuter (16 deltagare × 8 min × 2)', correct: false },
        { text: 'Ca 128 minuter (16 deltagare × 8 minuter)', correct: false },
      ],
      explanation: 'Med 8 stationer kan 8 deltagare gå parallellt. 8 stationer × (8+2) min = 80 min per omgång. Med 16 deltagare blir det 2 omgångar = 160 min totalt.',
      reference: 'ORTAC OSCE Protocol v1.0',
    },
    {
      code: 'TTT-3.4',
      chapterNumber: 3,
      bloomLevel: 'ANALYSIS',
      question: 'Under kursen svimmar en deltagare på grund av vasovagal reaktion vid en blödande sårskada-station. Vad är kursledarens PRIORITERING?',
      options: [
        { text: 'Säkerställ deltagarens medicinska status, sedan informera och dokumentera', correct: true },
        { text: 'Fortsätt kursen medan en instruktör tar hand om deltagaren', correct: false },
        { text: 'Avbryt kursen och skicka hem alla deltagare', correct: false },
        { text: 'Kontakta deltagarens chef för att informera', correct: false },
      ],
      explanation: 'Deltagarens säkerhet är alltid första prioritet. Efter medicinsk stabilisering följer information till gruppen och incidentdokumentation enligt rutiner.',
      reference: 'ORTAC Krisprotokollet v1.0',
    },

    // Kapitel 4: Svåra Situationer Casebook (4 frågor)
    {
      code: 'TTT-4.1',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'En deltagare sitter tyst och undviker ögonkontakt under gruppövningarna. När du frågar om allt är okej säger hen "ja, det är bra". Vad är MEST lämpliga första åtgärd?',
      options: [
        { text: 'Ta en kort paus och prata med deltagaren enskilt', correct: true },
        { text: 'Be deltagaren att aktivt delta i nästa övning', correct: false },
        { text: 'Ignorera beteendet och fortsätt som planerat', correct: false },
        { text: 'Fråga gruppen om någon annan upplever samma sak', correct: false },
      ],
      explanation: 'Privat samtal ger möjlighet att förstå orsaken utan att exponera deltagaren. Det kan vara personliga problem, osäkerhet eller tidigare negativa erfarenheter.',
      reference: 'ORTAC Svåra Situationer Casebook v1.0',
    },
    {
      code: 'TTT-4.2',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'En deltagare avbryter ständigt andra och hävdar att "så gör vi på mitt sjukhus". Övriga deltagare ser irriterade ut. Vilken strategi är MEST effektiv?',
      options: [
        { text: 'Validera erfarenheten men styra tillbaka: "Intressant! Vi tar det efter pausen. Nu fokuserar vi på..."', correct: true },
        { text: 'Säga "Här gäller ORTAC-protokollet, inte lokala varianter"', correct: false },
        { text: 'Låta deltagaren förklara sin metod för gruppen', correct: false },
        { text: 'Ignorera kommentarerna och fortsätt', correct: false },
      ],
      explanation: 'Att validera först ("Intressant!") minskar motstånd. Att sedan tydligt avgränsa ("efter pausen") och omdirigera ("nu fokuserar vi") behåller kontrollen utan konflikt.',
      reference: 'ORTAC Svåra Situationer Casebook v1.0',
    },
    {
      code: 'TTT-4.3',
      chapterNumber: 4,
      bloomLevel: 'APPLICATION',
      question: 'Under en simulering med amputerat ben-scenario börjar en deltagare gråta och säger att hen förlorade en närstående i en olycka. Vad gör du FÖRST?',
      options: [
        { text: 'Avbryt simuleringen, visa empati och erbjud att prata enskilt', correct: true },
        { text: 'Be deltagaren ta en kort paus och återkomma', correct: false },
        { text: 'Fortsätt simuleringen för övriga medan någon tar hand om deltagaren', correct: false },
        { text: 'Förklara att simuleringen är viktig och be deltagaren försöka fortsätta', correct: false },
      ],
      explanation: 'Psykologisk säkerhet prioriteras. Avbryt, visa empati ("Jag förstår att detta är svårt") och erbjud privat samtal. Gruppen förstår och respekterar detta.',
      reference: 'ORTAC Svåra Situationer Casebook v1.0',
    },
    {
      code: 'TTT-4.4',
      chapterNumber: 4,
      bloomLevel: 'ANALYSIS',
      question: 'En erfaren kirurg ifrågasätter ATLS-riktlinjerna och säger "evidensen för detta är svag". Hen har delvis rätt men skapar osäkerhet i gruppen. Hur hanterar du situationen BÄST?',
      options: [
        { text: 'Bekräfta att evidens varierar, men förklara varför standardisering är viktig för utbildning och säkerhet', correct: true },
        { text: 'Hänvisa till att kursen följer nationella riktlinjer som inte kan diskuteras', correct: false },
        { text: 'Be kirurgen presentera sin alternativa evidens för gruppen', correct: false },
        { text: 'Erkänna att hen har rätt och att riktlinjerna borde uppdateras', correct: false },
      ],
      explanation: 'Att erkänna nuanserna ("evidens varierar") visar respekt. Att sedan förklara värdet av standardisering ("kognitiv avlastning i stress") ger pedagogisk grund utan att förminska kritiken.',
      reference: 'ORTAC Svåra Situationer Casebook v1.0; ATLS 11th Ed.',
    },
  ];
}

// Learning objectives for instructor course (TTT) chapters
function getInstructorLearningObjectives() {
  return [
    // Kapitel 1: TTT Workshop Manual (5 LOs)
    { chapterNumber: 1, code: 'LO-TTT-01-01', type: 'KNOWLEDGE', description: 'Beskriva Knowles 6 principer för vuxenlärande och deras tillämpning i kurssammanhang', sortOrder: 1 },
    { chapterNumber: 1, code: 'LO-TTT-01-02', type: 'COMPREHENSION', description: 'Förklara Kolbs lärcykel och de 4 lärstilarna samt hur de påverkar kursdesign', sortOrder: 2 },
    { chapterNumber: 1, code: 'LO-TTT-01-03', type: 'APPLICATION', description: 'Tillämpa Pendleton-modellen för strukturerad feedback i undervisningssituationer', sortOrder: 3 },
    { chapterNumber: 1, code: 'LO-TTT-01-04', type: 'APPLICATION', description: 'Genomföra färdighetsundervisning med Peytons 4-stegsmodell', sortOrder: 4 },
    { chapterNumber: 1, code: 'LO-TTT-01-05', type: 'ANALYSIS', description: 'Genomföra GAS-debriefing (Gather-Analyze-Summarize) efter simulering', sortOrder: 5 },

    // Kapitel 2: Examinatorkurs (4 LOs)
    { chapterNumber: 2, code: 'LO-TTT-02-01', type: 'KNOWLEDGE', description: 'Beskriva OSCE-checklistans struktur och poängsättningsprinciper', sortOrder: 1 },
    { chapterNumber: 2, code: 'LO-TTT-02-02', type: 'APPLICATION', description: 'Genomföra kalibrering med andra examinatorer för att säkerställa bedömningssamstämmighet', sortOrder: 2 },
    { chapterNumber: 2, code: 'LO-TTT-02-03', type: 'APPLICATION', description: 'Tillämpa beslutsalgoritmen för gränsfall vid borderline-bedömning', sortOrder: 3 },
    { chapterNumber: 2, code: 'LO-TTT-02-04', type: 'ANALYSIS', description: 'Identifiera och motverka bedömningsbias som halo-effekt och stränghet/mildhet', sortOrder: 4 },

    // Kapitel 3: Kursledarutbildning (4 LOs)
    { chapterNumber: 3, code: 'LO-TTT-03-01', type: 'KNOWLEDGE', description: 'Beskriva ORTAC-kursens struktur, moment och tidsplan', sortOrder: 1 },
    { chapterNumber: 3, code: 'LO-TTT-03-02', type: 'APPLICATION', description: 'Planera och budgetera en ORTAC-kurs inklusive lokaler och material', sortOrder: 2 },
    { chapterNumber: 3, code: 'LO-TTT-03-03', type: 'APPLICATION', description: 'Koordinera instruktörsteam och organisera OSCE-examination', sortOrder: 3 },
    { chapterNumber: 3, code: 'LO-TTT-03-04', type: 'ANALYSIS', description: 'Hantera krissituationer enligt protokoll och eskaleringsrutiner', sortOrder: 4 },

    // Kapitel 4: Svåra Situationer (3 LOs)
    { chapterNumber: 4, code: 'LO-TTT-04-01', type: 'APPLICATION', description: 'Hantera tysta och dominanta deltagare med lämpliga facilitatortekniker', sortOrder: 1 },
    { chapterNumber: 4, code: 'LO-TTT-04-02', type: 'APPLICATION', description: 'Stödja deltagare vid emotionella reaktioner och svåra minnen', sortOrder: 2 },
    { chapterNumber: 4, code: 'LO-TTT-04-03', type: 'ANALYSIS', description: 'Välja lämplig interventionsstrategi baserat på situationstyp och deltagarbehov', sortOrder: 3 },
  ];
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
