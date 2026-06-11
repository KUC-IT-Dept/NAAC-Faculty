const Metric = require("../models/Metric");
const Faculty = require("../../../models/Faculty");
const StudentProfile =
require("../../../modules/student/models/StudentProfile");

async function calculateMetric(metricId) {



    const metric = await Metric.findOne({
        metricId
    }).lean();

   

    if (!metric) {
        return null;
    }

    let value = 0;

     {

        switch (metric.formulaType) {

            case "count":

                const countRecords = await Faculty.find({
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
        [metric.fieldPath]: {
            $exists: true,
            $ne: []
        }
    }).lean();

    value = conditionalRecords.reduce((total, faculty) => {

        const items =
            faculty[metric.fieldPath] || [];

        const matches = items.filter(item =>

            item[metric.conditionField] ===
            metric.conditionValue

        ).length;

        return total + matches;

    }, 0);

    break;
            case "objectSum":

    const records = await Faculty.find().lean();

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
        await Faculty.countDocuments();

    const matchingFaculty =
        await Faculty.countDocuments({
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
            metric.numeratorMetric
        );

    const denominatorMetric =
        await calculateMetric(
            metric.denominatorMetric
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
        await Faculty.countDocuments();

    break;
    case "studentCount":
    
        value =
            await StudentProfile.countDocuments();
    
            console.log("DB:", StudentProfile.db.name);
            console.log("Collection:", StudentProfile.collection.name);
            console.log("Count:", await StudentProfile.countDocuments());    
    
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
            metric.numeratorMetric
        );

    const denominator =
        await calculateMetric(
            metric.denominatorMetric
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

            default:
                value = 0;
        }
    }

    return {
        metricId: metric.metricId,
        metricName: metric.metricName,
        value
    };
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
            student.academic_details?.faculty ||
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
    getStudentProfileCompletion,
    getStudentProfileSummary,
    getStudentDepartments,
    getProgramLevels
};