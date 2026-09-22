const Metric = require("../models/Metric");
const Faculty = require("../../faculty/models/Faculty");
const StudentProfile =
require("../../student/models/StudentProfile");
const LibraryRecord = require("../../library/models/LibraryRecord");
const MMTTCRecord = require("../../mmttc/models/MMTTCRecord");
const { normalizePublicationType } = require("../utils/publicationType");

const { extractExperienceFilter, isInExperienceRange } = require('./filterService');

// Phase 6: calculateMetricFromDoc accepts an already-fetched Metric document,
// eliminating redundant Metric.findOne in batch callers like /dashboard-v3.
// calculateMetric remains a thin wrapper for standalone/V1/V2 callers.

async function calculateMetricFromDoc(metric, filter = {}, options = {}) {
    if (!metric) {
        return null;
    }

    const { min, max, cleanFilter } = extractExperienceFilter(filter);
    filter = cleanFilter;

    let value = 0;

     {

        switch (metric.formulaType) {

            case "count":

                const countRecords = await Faculty.find({
                    ...filter,
                    [metric.fieldPath]: {
                        $exists: true,
                        $ne: []
                    }
                }).lean();

                value = countRecords.filter(f => isInExperienceRange(f, min, max)).reduce((total, faculty) => {

                    const data = faculty[metric.fieldPath] || [];

                    return total + data.length;

                }, 0);

                break;

            case "sum":

                const sumRecords = await Faculty.find({
                    ...filter,
                    [metric.fieldPath]: {
                        $exists: true,
                        $ne: []
                    }
                }).lean();

                value = sumRecords.filter(f => isInExperienceRange(f, min, max)).reduce((total, faculty) => {

                    const items = faculty[metric.fieldPath] || [];

                    const subtotal = items.reduce((sum, item) => {

                        const amount = Number(
                            String(item[metric.sumField] || 0)
                                .replace(/,/g, "")
                        );

                        return sum + amount;

                    }, 0);

                    return total + subtotal;

                }, 0);

                break;
                case "conditionalCount":

    const conditionalRecords = await Faculty.find({
        ...filter,
        [metric.fieldPath]: {
            $exists: true,
            $ne: []
        }
    }).lean();

    value = conditionalRecords.filter(f => isInExperienceRange(f, min, max)).reduce((total, faculty) => {

        const items =
            faculty[metric.fieldPath] || [];

        const isPublicationType =
            metric.fieldPath === 'publications' &&
            metric.conditionField === 'type';

        const matches = items.filter(item => {

            const actual = isPublicationType
                ? normalizePublicationType(item[metric.conditionField])
                : item[metric.conditionField];

            return actual === metric.conditionValue;

        }).length;

        return total + matches;

    }, 0);

    break;
            case "objectSum":

    const records = await Faculty.find({ ...filter }).lean();

    value = records.filter(f => isInExperienceRange(f, min, max)).reduce((total, faculty) => {

        const obj = faculty[metric.fieldPath] || {};

        const amount = Number(
            obj[metric.sumField] || 0
        );

        return total + amount;

    }, 0);

    break;
    case "percentage":

    {
        const allFacForPct = await Faculty.find({ ...filter }).lean();
        const filteredForPct = allFacForPct.filter(f => isInExperienceRange(f, min, max));
        const totalFaculty = filteredForPct.length;

        const matchingFaculty = filteredForPct.filter(f => {
            const field = f[metric.numeratorField];
            return field !== undefined && field !== null && !(Array.isArray(field) && field.length === 0);
        }).length;

        value =
            totalFaculty === 0
                ? 0
                : Number(
                    (
                        matchingFaculty /
                        totalFaculty * 100
                    ).toFixed(2)
                );
    }

    break;
    case "ratio":

    const numeratorMetric =
        await calculateMetric(
            metric.numeratorMetric,
            filter
        );

    const denominatorMetric =
        await calculateMetric(
            metric.denominatorMetric,
            filter
        );

    value =
        denominatorMetric?.value > 0
            ? Number(
                (
                    numeratorMetric.value /
                    denominatorMetric.value
                ).toFixed(2)
            )
            : 0;

    break;
    case "facultyCount":

    {
        const allFacForCount = await Faculty.find({ ...filter }).lean();
        value = allFacForCount.filter(f => isInExperienceRange(f, min, max)).length;
    }

    break;
    case "studentCount":

        value =
            await StudentProfile.countDocuments();

        break;

        case "studentConditionalCount":

    value =
        await StudentProfile.countDocuments({
            [metric.fieldName]:
                metric.fieldValue
        });

    break;
    case "studentExists":

    value =
        await StudentProfile.countDocuments({
            [metric.fieldName]: {
                $exists: true,
                $ne: ""
            }
        });

    break;
    case "metricPercentage":

    const numerator =
        await calculateMetric(
            metric.numeratorMetric,
            filter
        );

    const denominator =
        await calculateMetric(
            metric.denominatorMetric,
            filter
        );

    value =
        denominator?.value > 0
            ? Number(
                (
                    numerator.value /
                    denominator.value * 100
                ).toFixed(2)
            )
            : 0;

    break;

    // ── V3 additions ────────────────────────────────────────────────────────
    // These cases are unreachable by any formulaType value currently seeded;
    // they activate only when new Metric documents with these formulaTypes
    // are added by analyticsV3MetricSeeder.js.

    case "average":
        {
            const avgRecords = (await Faculty.find({ ...filter }).lean())
                .filter(f => isInExperienceRange(f, min, max));

            let total = 0, count = 0;
            for (const faculty of avgRecords) {
                const field = faculty[metric.fieldPath];
                if (Array.isArray(field)) {
                    for (const item of field) {
                        const num = parseFloat(
                            String(item[metric.sumField] || '').replace(/,/g, '')
                        );
                        if (!isNaN(num)) { total += num; count++; }
                    }
                } else if (field && typeof field === 'object') {
                    const num = parseFloat(
                        String(field[metric.sumField] || '').replace(/,/g, '')
                    );
                    if (!isNaN(num) && num >= 0) { total += num; count++; }
                }
            }
            value = count > 0 ? Number((total / count).toFixed(4)) : 0;
        }
        break;

    case "distinctGroupCount":
        {
            // distinctGroupCount with experience range: fetch records and count distinct values
            if (min !== null || max !== null) {
                const allForDistinct = (await Faculty.find({ ...filter }).lean())
                    .filter(f => isInExperienceRange(f, min, max));
                const distinctSet = new Set();
                for (const f of allForDistinct) {
                    const v = f[metric.fieldPath];
                    if (v && String(v).trim() !== '') distinctSet.add(String(v).trim());
                }
                value = distinctSet.size;
            } else {
                const distinctVals = await Faculty.distinct(metric.fieldPath, { ...filter });
                value = distinctVals.filter(v => v && String(v).trim() !== '').length;
            }
        }
        break;

            default:
                value = 0;
        }
    }

    // Apply viewMode normalization centrally
    // Phase 3 fix: skip normalization for formula types that are already
    // normalized by definition. ratio/metricPercentage/percentage are
    // already ratios — dividing by facultyCount again produces nonsense.
    const NON_NORMALIZABLE = new Set(['ratio', 'metricPercentage', 'percentage']);
    const viewMode = options.viewMode || 'absolute';
    const normalizationSkipped = viewMode !== 'absolute' && NON_NORMALIZABLE.has(metric.formulaType);

    if (viewMode === 'perFaculty' && !normalizationSkipped) {
        const facultyCount = (options.precomputedCounts && typeof options.precomputedCounts.facultyCount === 'number')
            ? options.precomputedCounts.facultyCount
            : (await Faculty.find({ ...filter }).lean()).filter(f => isInExperienceRange(f, min, max)).length;
        value = facultyCount > 0 ? Number((value / facultyCount).toFixed(4)) : 0;
    } else if (viewMode === 'percentage' && !normalizationSkipped) {
        const facultyCount = (options.precomputedCounts && typeof options.precomputedCounts.facultyCount === 'number')
            ? options.precomputedCounts.facultyCount
            : (await Faculty.find({ ...filter }).lean()).filter(f => isInExperienceRange(f, min, max)).length;
        value = facultyCount > 0 ? Number((value / facultyCount * 100).toFixed(2)) : 0;
    } else if (viewMode === 'perStudent' && !normalizationSkipped) {
        const studentCount = (options.precomputedCounts && typeof options.precomputedCounts.studentCount === 'number')
            ? options.precomputedCounts.studentCount
            : await StudentProfile.countDocuments();
        value = studentCount > 0 ? Number((value / studentCount).toFixed(4)) : 0;
    }

    return {
        metricId: metric.metricId,
        metricName: metric.metricName,
        value,
        ...(normalizationSkipped ? { normalizationSkipped: true } : {}),
    };
}

async function calculateMetric(metricId, filter = {}, options = {}) {
    const { getMetric } = require('./referenceDataCache');
    const metric = await getMetric(metricId);
    if (!metric) {
        console.warn(`[analyticsService] calculateMetric: unknown metricId "${metricId}" — no seeded Metric document found. Returning null (unchanged behavior).`);
    }
    return calculateMetricFromDoc(metric, filter, options);
}
async function getStudentProfileCompletion(department = null) {

    const filter = department
        ? { "academic_details.department": department }
        : {};

    const students =
        await StudentProfile.find(filter).lean();

    const results = [];

    for (const student of students) {

        let filled = 0;
        let total = 0;

        function countFields(obj) {

            for (const key in obj) {

                const value = obj[key];

                if (
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                ) {

                    countFields(value);

                } else {

                    total++;

                    if (
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                    ) {
                        filled++;
                    }
                }
            }
        }

        countFields(student);

        const completion =
            total > 0
                ? Number(
                    (
                        filled /
                        total * 100
                    ).toFixed(2)
                )
                : 0;

        results.push({

            student:
                student.personal_details?.fullName ||
                "Unknown",

            completion
        });
    }

    return results;
}
async function getStudentProfileSummary(department = null) {

    const profiles =
        await getStudentProfileCompletion(department);

    const totalStudents =
        profiles.length;

    const averageCompletion =
        totalStudents > 0
            ? Number(
                (
                    profiles.reduce(
                        (sum, p) =>
                            sum + p.completion,
                        0
                    ) / totalStudents
                ).toFixed(2)
            )
            : 0;

    const completeProfiles =
        profiles.filter(
            p => p.completion >= 80
        ).length;

    const incompleteProfiles =
        totalStudents -
        completeProfiles;

    return {
        totalStudents,
        averageCompletion,
        completeProfiles,
        incompleteProfiles
    };
}
async function getStudentDepartments(department = null) {

    const filter = department
        ? { "academic_details.department": department }
        : {};

    const students =
        await StudentProfile.find(filter).lean();

    const departments = {};

    students.forEach(student => {

        const dept =
            student.academic_details?.department ||
            "Unknown";

        if (!departments[dept]) {

            departments[dept] = {
                department: dept,
                students: 0
            };

        }

        departments[dept].students++;

    });

    return Object.values(departments);
}
async function getProgramLevels(department = null) {

    const filter = department
        ? { "academic_details.department": department }
        : {};

    const students =
        await StudentProfile.find(filter).lean();

    const levels = {};

    students.forEach(student => {

        const level =
            student.academic_details?.programLevel ||
            "Unknown";

        if (!levels[level]) {

            levels[level] = {
                programLevel: level,
                students: 0
            };

        }

        levels[level].students++;

    });

    return Object.values(levels);
}

// ── Institutional Summary (Library + MMTTC) ─────────────────────────────────
// Library and MMTTC records are one-per-academic-year institutional
// documents (see modules/library/models/LibraryRecord.js and
// modules/mmttc/models/MMTTCRecord.js) - not per-faculty arrays, so they
// don't fit the fieldPath-based Faculty metric engine above. This returns
// a simple year-by-year summary of both instead, for a dedicated dashboard
// section. Institution-wide by nature (neither record has a department
// field), so no department filter is applied here.
async function getInstitutionalSummary() {

    const [libraryRecords, mmttcRecords] = await Promise.all([
        LibraryRecord.find().lean(),
        MMTTCRecord.find().lean(),
    ]);

    const academicYearRegex = /^\d{4}-\d{4}$/;

    const library = libraryRecords
        .filter(r => {
            if (!academicYearRegex.test(r.academicYear)) {
                console.warn(`[getInstitutionalSummary] Invalid library academicYear excluded: "${r.academicYear}"`);
                return false;
            }
            return true;
        })
        .map(r => ({
            academicYear: r.academicYear,
            totalBooks: r.collections?.totalBooks?.number || 0,
            journalsAndPeriodicals:
                (r.collections?.journalsAndPeriodicals?.print || 0) +
                (r.collections?.journalsAndPeriodicals?.electronic || 0),
            ebooks: r.collections?.digitalResources?.ebooks || 0,
            seatingCapacity:
                (r.infrastructure?.seatingCapacity?.readingRooms || 0) +
                (r.infrastructure?.seatingCapacity?.studyCarrels || 0) +
                (r.infrastructure?.seatingCapacity?.digitalLabs || 0),
            computers: r.infrastructure?.computers || 0,
        }))
        .sort((a, b) => String(a.academicYear).localeCompare(String(b.academicYear)));

    const mmttc = mmttcRecords
        .filter(r => {
            if (!academicYearRegex.test(r.academicYear)) {
                console.warn(`[getInstitutionalSummary] Invalid mmttc academicYear excluded: "${r.academicYear}"`);
                return false;
            }
            return true;
        })
        .map(r => {
            const courses = r.courses || [];
            return {
                academicYear: r.academicYear,
                coursesConducted: courses.length,
                totalParticipants: courses.reduce((sum, c) => sum + (c.participants?.total || 0), 0),
                facultyParticipants: courses.reduce((sum, c) => sum + (c.facultyParticipants || 0), 0),
            };
        })
        .sort((a, b) => String(a.academicYear).localeCompare(String(b.academicYear)));

    return { library, mmttc };
}

module.exports = {
    calculateMetric,
    calculateMetricFromDoc,
    getStudentProfileCompletion,
    getStudentProfileSummary,
    getStudentDepartments,
    getProgramLevels,
    getInstitutionalSummary
};
