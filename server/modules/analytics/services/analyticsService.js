const Metric = require("../models/Metric");
const Faculty = require("../../faculty/models/Faculty");
const StudentProfile =
require("../../student/models/StudentProfile");
const { normalizePublicationType } = require("../utils/publicationType");

// Phase 6: calculateMetricFromDoc accepts an already-fetched Metric document,
// eliminating redundant Metric.findOne in batch callers like /dashboard-v3.
// calculateMetric remains a thin wrapper for standalone/V1/V2 callers.

async function calculateMetricFromDoc(metric, filter = {}, options = {}) {
    if (!metric) {
        return null;
    }

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

                value = countRecords.reduce((total, faculty) => {

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

                value = sumRecords.reduce((total, faculty) => {

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

    value = conditionalRecords.reduce((total, faculty) => {

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

    value = records.reduce((total, faculty) => {

        const obj = faculty[metric.fieldPath] || {};

        const amount = Number(
            obj[metric.sumField] || 0
        );

        return total + amount;

    }, 0);

    break;
    case "percentage":

    const totalFaculty =
        await Faculty.countDocuments({ ...filter });

    const matchingFaculty =
        await Faculty.countDocuments({
            ...filter,
            [metric.numeratorField]: {
                $exists: true,
                $ne: []
            }
        });

    value =
        totalFaculty === 0
            ? 0
            : Number(
                (
                    matchingFaculty /
                    totalFaculty * 100
                ).toFixed(2)
            );

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

    value =
        await Faculty.countDocuments({ ...filter });

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
            const avgRecords = await Faculty.find({ ...filter }).lean();

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
            const distinctVals = await Faculty.distinct(metric.fieldPath, { ...filter });
            value = distinctVals.filter(v => v && String(v).trim() !== '').length;
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
            : await Faculty.countDocuments({ ...filter });
        value = facultyCount > 0 ? Number((value / facultyCount).toFixed(4)) : 0;
    } else if (viewMode === 'percentage' && !normalizationSkipped) {
        const facultyCount = (options.precomputedCounts && typeof options.precomputedCounts.facultyCount === 'number')
            ? options.precomputedCounts.facultyCount
            : await Faculty.countDocuments({ ...filter });
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
async function getStudentProfileCompletion() {

    const students =
        await StudentProfile.find().lean();

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
async function getStudentProfileSummary() {

    const profiles =
        await getStudentProfileCompletion();

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
async function getStudentDepartments() {

    const students =
        await StudentProfile.find().lean();

    const departments = {};

    students.forEach(student => {

        const department =
            student.academic_details?.department ||
            "Unknown";

        if (!departments[department]) {

            departments[department] = {
                department,
                students: 0
            };

        }

        departments[department].students++;

    });

    return Object.values(departments);
}
async function getProgramLevels() {

    const students =
        await StudentProfile.find().lean();

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
module.exports = {
    calculateMetric,
    calculateMetricFromDoc,
    getStudentProfileCompletion,
    getStudentProfileSummary,
    getStudentDepartments,
    getProgramLevels
};
