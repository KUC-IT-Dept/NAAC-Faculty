/**
 * metricDefinitions.js
 *
 * Code-defined registry of every analytics Metric (V1 + V3). Single source of truth:
 * metricRegistry.js upserts these at server start so the metric list never depends on
 * someone remembering to run a seeder. Definitions only - no institutional data.
 */

'use strict';

function buildMetrics() {
  const m = [];

  // ── §4.1 Publications ────────────────────────────────────────────────────

  m.push({
    metricId:   '3.4.4.journal',
    metricName: 'Journal Articles',
    criterion:  'Research & Publications',
    description:'Number of journal article publications across all faculty',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'type',
    conditionValue: 'Journal Articles',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   '3.4.4.bookchapter',
    metricName: 'Book Chapters',
    criterion:  'Research & Publications',
    description:'Number of book chapter publications across all faculty',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'type',
    conditionValue: 'Book Chapters',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   '3.4.5_books',
    metricName: 'Books Authored / Edited',
    criterion:  'Research & Publications',
    description:'Number of books authored or edited across all faculty',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'type',
    conditionValue: 'Books Authored / Edited',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   '3.4.3',
    metricName: 'Conference Papers',
    criterion:  'Research & Publications',
    description:'Number of conference paper publications across all faculty',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'type',
    conditionValue: 'Conference Papers',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pub.scopus',
    metricName: 'Scopus-Indexed Publications',
    criterion:  'Research & Publications',
    description:'Publications indexed in Scopus',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'indexedIn',
    conditionValue: 'Scopus',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pub.wos',
    metricName: 'Web of Science Publications',
    criterion:  'Research & Publications',
    description:'Publications indexed in Web of Science',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'indexedIn',
    conditionValue: 'WoS',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pub.ugccare',
    metricName: 'UGC-CARE Listed Publications',
    criterion:  'Research & Publications',
    description:'Publications listed in UGC-CARE',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'indexedIn',
    conditionValue: 'UGC Care',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pub.international',
    metricName: 'International Publications',
    criterion:  'Research & Publications',
    description:'Publications at International level',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'level',
    conditionValue: 'International',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pub.national',
    metricName: 'National Publications',
    criterion:  'Research & Publications',
    description:'Publications at National level',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'level',
    conditionValue: 'National',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pub.peerreviewed',
    metricName: 'Peer-Reviewed Publications',
    criterion:  'Research & Publications',
    description:'Peer-reviewed publications',
    formulaType:'conditionalCount',
    fieldPath:  'publications',
    conditionField: 'peerReviewed',
    conditionValue: 'Yes',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pub.avgimpactfactor',
    metricName: 'Average Impact Factor',
    criterion:  'Research & Publications',
    description:'Average impact factor of all publications',
    formulaType:'average',
    fieldPath:  'publications',
    sumField:   'impactFactor',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.2 Projects ─────────────────────────────────────────────────────────

  m.push({
    metricId:   'proj.ongoing',
    metricName: 'Ongoing Projects',
    criterion:  'Research Projects',
    description:'Projects with status Ongoing',
    formulaType:'conditionalCount',
    fieldPath:  'projects',
    conditionField: 'status',
    conditionValue: 'Ongoing',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'proj.completed',
    metricName: 'Completed Projects',
    criterion:  'Research Projects',
    description:'Projects with status Completed',
    formulaType:'conditionalCount',
    fieldPath:  'projects',
    conditionField: 'status',
    conditionValue: 'Completed',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'proj.major',
    metricName: 'Major Projects',
    criterion:  'Research Projects',
    description:'Projects categorised as Major',
    formulaType:'conditionalCount',
    fieldPath:  'projects',
    conditionField: 'projectCategory',
    conditionValue: 'Major',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'proj.minor',
    metricName: 'Minor Projects',
    criterion:  'Research Projects',
    description:'Projects categorised as Minor',
    formulaType:'conditionalCount',
    fieldPath:  'projects',
    conditionField: 'projectCategory',
    conditionValue: 'Minor',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'proj.international',
    metricName: 'International Projects',
    criterion:  'Research Projects',
    description:'Internationally funded/categorised projects',
    formulaType:'conditionalCount',
    fieldPath:  'projects',
    conditionField: 'projectCategory',
    conditionValue: 'International',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'proj.pi',
    metricName: 'Projects as Principal Investigator',
    criterion:  'Research Projects',
    description:'Projects where the faculty is the Principal Investigator',
    formulaType:'conditionalCount',
    fieldPath:  'projects',
    conditionField: 'role',
    conditionValue: 'PI',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'proj.industry',
    metricName: 'Industry-Sponsored Projects',
    criterion:  'Research Projects',
    description:'Projects categorised as Industry Sponsored',
    formulaType:'conditionalCount',
    fieldPath:  'projects',
    conditionField: 'projectCategory',
    conditionValue: 'Industry Sponsored',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.3 Patents ──────────────────────────────────────────────────────────

  m.push({
    metricId:   'patent.filed',
    metricName: 'Patents Filed',
    criterion:  'Innovation & Intellectual Property',
    description:'Patents with status Filed',
    formulaType:'conditionalCount',
    fieldPath:  'patents',
    conditionField: 'status',
    conditionValue: 'Filed',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'patent.published',
    metricName: 'Patents Published',
    criterion:  'Innovation & Intellectual Property',
    description:'Patents with status Published',
    formulaType:'conditionalCount',
    fieldPath:  'patents',
    conditionField: 'status',
    conditionValue: 'Published',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'patent.granted',
    metricName: 'Patents Granted',
    criterion:  'Innovation & Intellectual Property',
    description:'Patents with status Granted',
    formulaType:'conditionalCount',
    fieldPath:  'patents',
    conditionField: 'status',
    conditionValue: 'Granted',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.4 Awards ───────────────────────────────────────────────────────────

  m.push({
    metricId:   'awards.total',
    metricName: 'Total Awards',
    criterion:  'Innovation & Awards',
    description:'Total awards received by faculty',
    formulaType:'count',
    fieldPath:  'awards',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'awards.international',
    metricName: 'International Awards',
    criterion:  'Innovation & Awards',
    description:'Awards received at International level',
    formulaType:'conditionalCount',
    fieldPath:  'awards',
    conditionField: 'level',
    conditionValue: 'International',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'awards.national',
    metricName: 'National Awards',
    criterion:  'Innovation & Awards',
    description:'Awards received at National level',
    formulaType:'conditionalCount',
    fieldPath:  'awards',
    conditionField: 'level',
    conditionValue: 'National',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'awards.state',
    metricName: 'State Awards',
    criterion:  'Innovation & Awards',
    description:'Awards received at State level',
    formulaType:'conditionalCount',
    fieldPath:  'awards',
    conditionField: 'level',
    conditionValue: 'State',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.5 Research Guidance ────────────────────────────────────────────────

  m.push({
    metricId:   'phd.completed',
    metricName: 'PhD Scholars Guided to Completion',
    criterion:  'Research Guidance',
    description:'Total PhD scholars guided to completion across all faculty',
    formulaType:'objectSum',
    fieldPath:  'researchGuidance',
    sumField:   'phdCompleted',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'phd.inprogress',
    metricName: 'PhD Scholars In Progress',
    criterion:  'Research Guidance',
    description:'Total PhD scholars currently under guidance',
    formulaType:'objectSum',
    fieldPath:  'researchGuidance',
    sumField:   'phdInProgress',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'mphil.completed',
    metricName: 'M.Phil Scholars Completed',
    criterion:  'Research Guidance',
    description:'Total M.Phil scholars guided to completion',
    formulaType:'objectSum',
    fieldPath:  'researchGuidance',
    sumField:   'mphilCompleted',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'mphil.inprogress',
    metricName: 'M.Phil Scholars In Progress',
    criterion:  'Research Guidance',
    description:'Total M.Phil scholars currently under guidance',
    formulaType:'objectSum',
    fieldPath:  'researchGuidance',
    sumField:   'mphilInProgress',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pg.supervised',
    metricName: 'PG Projects Supervised',
    criterion:  'Research Guidance',
    description:'Total PG projects supervised by faculty',
    formulaType:'objectSum',
    fieldPath:  'researchGuidance',
    sumField:   'pgProjectsSupervised',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.6 FDP / Workshops ──────────────────────────────────────────────────

  m.push({
    metricId:   'fdp.total',
    metricName: 'FDP / Workshop Participations',
    criterion:  'Faculty Development',
    description:'Total FDP/workshop/seminar/short-term training participations',
    formulaType:'count',
    fieldPath:  'fdpWorkshops',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'fdp.online',
    metricName: 'Online FDP Participations',
    criterion:  'Faculty Development',
    description:'FDP/workshop participations in Online mode',
    formulaType:'conditionalCount',
    fieldPath:  'fdpWorkshops',
    conditionField: 'mode',
    conditionValue: 'Online',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'fdp.offline',
    metricName: 'Offline FDP Participations',
    criterion:  'Faculty Development',
    description:'FDP/workshop participations in Offline/in-person mode',
    formulaType:'conditionalCount',
    fieldPath:  'fdpWorkshops',
    conditionField: 'mode',
    conditionValue: 'Offline',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.7 Online Courses ───────────────────────────────────────────────────

  m.push({
    metricId:   'courses.total',
    metricName: 'Online Courses / Certifications',
    criterion:  'Faculty Development',
    description:'Total online courses and certifications completed by faculty',
    formulaType:'count',
    fieldPath:  'onlineCourses',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.8 Memberships ─────────────────────────────────────────────────────

  m.push({
    metricId:   'membership.total',
    metricName: 'Professional Memberships',
    criterion:  'Professional Engagement',
    description:'Total professional body memberships held by faculty',
    formulaType:'count',
    fieldPath:  'memberships',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'membership.life',
    metricName: 'Life Memberships',
    criterion:  'Professional Engagement',
    description:'Life memberships in professional bodies',
    formulaType:'conditionalCount',
    fieldPath:  'memberships',
    conditionField: 'membershipType',
    conditionValue: 'Life',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.9 International Experience ────────────────────────────────────────

  m.push({
    metricId:   'intl.total',
    metricName: 'International Engagements',
    criterion:  'International Linkage',
    description:'Total international academic/research engagements by faculty',
    formulaType:'count',
    fieldPath:  'internationalExperience',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'intl.research',
    metricName: 'International Research Engagements',
    criterion:  'International Linkage',
    description:'International engagements for research purpose',
    formulaType:'conditionalCount',
    fieldPath:  'internationalExperience',
    conditionField: 'purpose',
    conditionValue: 'Research',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.10 Admin / Extension arrays (all simple count) ───────────────────

  const adminArrays = [
    { metricId: 'admin.total',       metricName: 'Admin Responsibilities',       fieldPath: 'adminResponsibilities',          criterion: 'Administration & Extension' },
    { metricId: 'deptcharges.total', metricName: 'Departmental Charges',         fieldPath: 'departmentalCharges',            criterion: 'Administration & Extension' },
    { metricId: 'specialassign.total',metricName:'Special Assignments',           fieldPath: 'specialAssignments',             criterion: 'Administration & Extension' },
    { metricId: 'extrainst.total',   metricName: 'Extra-Institutional Activities',fieldPath: 'extraInstitutionalActivities',   criterion: 'Administration & Extension' },
    { metricId: 'adminnonacad.total',metricName: 'Admin & Non-Academic Responsibilities', fieldPath: 'adminNonAcademicResponsibilities', criterion: 'Administration & Extension' },
    { metricId: 'acadadmin.total',   metricName: 'Academic Administration',       fieldPath: 'academicAdministration',         criterion: 'Administration & Extension' },
    { metricId: 'researchinnov.total',metricName:'Research & Innovation Activities',fieldPath: 'researchAndInnovation',          criterion: 'Administration & Extension' },
    { metricId: 'examseval.total',   metricName: 'Examination & Evaluation',      fieldPath: 'examinationAndEvaluation',       criterion: 'Administration & Extension' },
    { metricId: 'adminsupport.total',metricName: 'Administrative Support',        fieldPath: 'administrativeSupport',          criterion: 'Administration & Extension' },
    { metricId: 'qa.total',          metricName: 'Quality Assurance Activities',  fieldPath: 'qualityAssurance',               criterion: 'Quality Assurance' },
  ];

  for (const a of adminArrays) {
    m.push({
      metricId:    a.metricId,
      metricName:  a.metricName,
      criterion:   a.criterion,
      description: `Total entries in ${a.fieldPath} across all faculty`,
      formulaType: 'count',
      fieldPath:   a.fieldPath,
      collection:  'faculties',
      supported:   true,
      sourceModules: ['faculty'],
    });
  }

  // ── §4.11 Qualifications / Experience ────────────────────────────────────

  m.push({
    metricId:   'qual.phdholders',
    metricName: 'Faculty with PhD',
    criterion:  'Teacher Profile & Quality',
    description:'Number of faculty holding a PhD degree',
    formulaType:'conditionalCount',
    fieldPath:  'qualifications',
    conditionField: 'degreeLevel',
    conditionValue: 'Ph.D',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'qual.netset',
    metricName: 'Faculty with NET/SET/GATE',
    criterion:  'Teacher Profile & Quality',
    description:'Number of faculty qualifying NET/SET/GATE',
    formulaType:'conditionalCount',
    fieldPath:  'eligibilityTests',
    conditionField: 'examName',
    conditionValue: 'NET',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'emp.avgExperience',
    metricName: 'Average Teaching Experience (Years)',
    criterion:  'Teacher Profile & Quality',
    description:'Average total teaching experience in years across all faculty',
    formulaType:'average',
    fieldPath:  'employmentDetails',
    sumField:   'totalExperienceYears',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // ── §4.12 / §4.13 Normalized / Ratio Metrics ─────────────────────────────

  m.push({
    metricId:   'ratio.pubsperfaculty',
    metricName: 'Publications per Faculty',
    criterion:  'Research & Publications',
    description:'Average number of publications per full-time faculty member',
    formulaType:'ratio',
    numeratorMetric:   '3.4.4',
    denominatorMetric: 'facultycount',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'ratio.projectsperfaculty',
    metricName: 'Projects per Faculty',
    criterion:  'Research Projects',
    description:'Average number of funded projects per faculty member',
    formulaType:'ratio',
    numeratorMetric:   '3.2.2',
    denominatorMetric: 'facultycount',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'ratio.patentsperfaculty',
    metricName: 'Patents per Faculty',
    criterion:  'Innovation & Intellectual Property',
    description:'Average number of patents per faculty member',
    formulaType:'ratio',
    numeratorMetric:   '3.4.5',
    denominatorMetric: 'facultycount',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'ratio.fundingperfaculty',
    metricName: 'Research Funding per Faculty (₹)',
    criterion:  'Resource Mobilization',
    description:'Average research funding sanctioned per faculty member (in ₹)',
    formulaType:'ratio',
    numeratorMetric:   '3.2.1',
    denominatorMetric: 'facultycount',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  m.push({
    metricId:   'pct.phdholders',
    metricName: '% Faculty with PhD',
    criterion:  'Teacher Profile & Quality',
    description:'Percentage of full-time faculty holding a PhD degree',
    formulaType:'metricPercentage',
    numeratorMetric:   'qual.phdholders',
    denominatorMetric: 'facultycount',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  // facultycount — a standalone metric needed as denominator in ratio metrics
  m.push({
    metricId:   'facultycount',
    metricName: 'Total Faculty Count',
    criterion:  'Teacher Profile & Quality',
    description:'Total number of faculty in the system (or filtered scope)',
    formulaType:'facultyCount',
    collection: 'faculties',
    supported:  true,
    sourceModules: ['faculty'],
  });

  return m;
}

// V1 metrics (previously existed only in hand-edited databases). Fields follow METRIC_INVENTORY.md.
function buildV1Metrics() {
  return [
    { metricId: '3.4.4', metricName: 'Research Publications', criterion: 'Research & Publications', description: 'Total publication entries across all faculty', formulaType: 'count', fieldPath: 'publications', collection: 'faculties', supported: true, sourceModules: ['faculty'] },
    { metricId: '3.2.2', metricName: 'Research Projects', criterion: 'Research Projects', description: 'Total research project entries across all faculty', formulaType: 'count', fieldPath: 'projects', collection: 'faculties', supported: true, sourceModules: ['faculty'] },
    { metricId: '3.4.5', metricName: 'Patents', criterion: 'Innovation & Intellectual Property', description: 'Total patent entries across all faculty', formulaType: 'count', fieldPath: 'patents', collection: 'faculties', supported: true, sourceModules: ['faculty'] },
    { metricId: '3.2.1', metricName: 'Research Funding', criterion: 'Resource Mobilization', description: 'Sum of sanctioned amounts (INR) across all research projects', formulaType: 'sum', fieldPath: 'projects', sumField: 'amountSanctioned', collection: 'faculties', supported: true, sourceModules: ['faculty'] },
  ];
}

// Project categories the profile form offers are Research/Development/Consultancy/Innovation/
// Sponsored Project (src/shared/dropdownOptions.js). These definitions match values the form can
// never store, so they would silently read 0: flag them unsupported instead of reporting fake zeros.
const NEVER_MATCHED = {
  'proj.major': 'projectCategory "Major" is not an option in the profile form',
  'proj.minor': 'projectCategory "Minor" is not an option in the profile form',
  'proj.international': 'projectCategory "International" is not an option in the profile form',
  'proj.industry': 'projectCategory "Industry Sponsored" is not an option in the profile form',
};

function getMetricDefinitions() {
  const v1 = new Set(buildV1Metrics().map((m) => m.metricId));
  const v3 = buildMetrics().filter((m) => !v1.has(m.metricId)).map((m) => (
    NEVER_MATCHED[m.metricId] ? { ...m, supported: false, missingFields: [NEVER_MATCHED[m.metricId]] } : m
  ));
  return [...buildV1Metrics(), ...v3];
}

module.exports = { getMetricDefinitions, buildMetrics, buildV1Metrics };
