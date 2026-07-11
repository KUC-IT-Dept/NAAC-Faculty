const express = require("express");
const Metric = require("../../analytics/models/Metric");
const Faculty = require("../models/Faculty");
const {
    calculateMetric,
    getStudentProfileCompletion,
    getStudentProfileSummary,
    getStudentDepartments,
    getProgramLevels
} = require("../../analytics/services/analyticsService");
const { auth } = require("../middleware/auth");
const requireAnalyticsScope = require("../../analytics/middleware/requireAnalyticsScope");
const { buildFacultyFilter, mergeFilters } = require("../../analytics/services/filterService");

const router = express.Router();

router.get("/metrics", auth, requireAnalyticsScope("metrics"), async (req, res) => {
  try {
    const metrics = await Metric.find();
    res.json(metrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});
router.get("/coverage", auth, requireAnalyticsScope("coverage"), async (req, res) => {

    try {

        const scope = req.analyticsScope;

        // Build an optional base filter for department-scoped callers.
        const deptFilter =
            scope.level === "department" && scope.department
                ? { "employmentDetails.department": scope.department }
                : {};

        // V2: merge with optional query-param filters (no-op when absent).
        const userFilter = buildFacultyFilter(req.query);
        const combinedFilter = mergeFilters(deptFilter, userFilter);

        const metrics = await Metric.find().lean();

        const totalFaculty = await Faculty.countDocuments(combinedFilter);

        const coverage = [];

        for (const metric of metrics) {

            let recordsFound = 0;

            if (metric.collection === "faculties") {

                if (metric.formulaType === "objectSum") {

                    const facultyRecords = await Faculty.find({
                        ...combinedFilter,
                        [metric.fieldPath]: {
                            $exists: true
                        }
                    }).lean();

                    recordsFound = facultyRecords.length;

                } else {

                    recordsFound = await Faculty.countDocuments({
                        ...combinedFilter,
                        [metric.fieldPath]: {
                            $exists: true,
                            $ne: []
                        }
                    });

                }
            }

            const coveragePercent =
                totalFaculty === 0
                    ? 0
                    : Number(
                        (
                            (recordsFound / totalFaculty) * 100
                        ).toFixed(2)
                    );

            coverage.push({
                metricId: metric.metricId,
                metricName: metric.metricName,
                recordsFound,
                totalFaculty,
                coveragePercent,
                available: recordsFound > 0
            });
        }

        res.json(coverage);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});
router.get("/metric/:metricId", auth, requireAnalyticsScope("metric"), async (req, res) => {

    try {

        const result = await calculateMetric(
            req.params.metricId
        );

        if (!result) {
            return res.status(404).json({
                message: "Metric not found"
            });
        }

        res.json(result);

    } catch(error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});
router.get("/dashboard", auth, requireAnalyticsScope("dashboard"), async (req, res) => {

    try {

        const metrics = await Metric.find().lean();

        const dashboard = [];

for (const metric of metrics) {

    const result = await calculateMetric(
        metric.metricId
    );

    dashboard.push(result);

}

res.json(dashboard);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});
router.get("/profile-completion", auth, requireAnalyticsScope("profileCompletion"), async (req, res) => {

    try {

        const scope = req.analyticsScope;

        const deptFilter =
            scope.level === "department" && scope.department
                ? { "employmentDetails.department": scope.department }
                : {};

        const userFilter = buildFacultyFilter(req.query);
        const combinedFilter = mergeFilters(deptFilter, userFilter);

        const facultyRecords = await Faculty.find(combinedFilter).lean();

        const result = facultyRecords.map(faculty => ({

            facultyName:
                faculty.personalInfo?.fullName ||
                faculty.username,

            department:
                faculty.employmentDetails?.department ||
                "Unknown",

            profileComplete:
                faculty.profileComplete,

            completionPercentage:
                faculty.completionPercentage || 0

        }));

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});
router.get("/profile-summary", auth, requireAnalyticsScope("profileSummary"), async (req, res) => {

    try {

        const scope = req.analyticsScope;

        const deptFilter =
            scope.level === "department" && scope.department
                ? { "employmentDetails.department": scope.department }
                : {};

        const userFilter = buildFacultyFilter(req.query);
        const combinedFilter = mergeFilters(deptFilter, userFilter);

        const facultyRecords = await Faculty.find(combinedFilter).lean();

        const totalFaculty = facultyRecords.length;

        const completedProfiles = facultyRecords.filter(
            faculty => faculty.profileComplete === true
        ).length;

        const incompleteProfiles =
            totalFaculty - completedProfiles;

        const totalCompletion =
            facultyRecords.reduce((sum, faculty) => {

                return sum +
                    (faculty.completionPercentage || 0);

            }, 0);

        const averageCompletion =
            totalFaculty === 0
                ? 0
                : Number(
                    (
                        totalCompletion / totalFaculty
                    ).toFixed(2)
                );

        res.json({
            totalFaculty,
            completedProfiles,
            incompleteProfiles,
            averageCompletion
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});
router.get("/departments", auth, requireAnalyticsScope("departments"), async (req, res) => {

    try {

        const scope = req.analyticsScope;

        const deptFilter =
            scope.level === "department" && scope.department
                ? { "employmentDetails.department": scope.department }
                : {};

        const userFilter = buildFacultyFilter(req.query);
        const combinedFilter = mergeFilters(deptFilter, userFilter);

        const facultyRecords = await Faculty.find(combinedFilter).lean();

        const departments = {};

        facultyRecords.forEach(faculty => {

            const department =
                faculty.employmentDetails?.department ||
                "Unknown";

            if (!departments[department]) {

                departments[department] = {
                    department,
                    facultyCount: 0,
                    totalCompletion: 0
                };
            }

            departments[department].facultyCount++;

            departments[department].totalCompletion +=
                faculty.completionPercentage || 0;

        });

        const result = Object.values(departments).map(dep => ({

            department: dep.department,

            facultyCount: dep.facultyCount,

            averageCompletion: Number(
                (
                    dep.totalCompletion /
                    dep.facultyCount
                ).toFixed(2)
            )

        }));

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});
router.get("/department-performance", auth, requireAnalyticsScope("departmentPerformance"), async (req, res) => {

    try {

        const scope = req.analyticsScope;

        const deptFilter =
            scope.level === "department" && scope.department
                ? { "employmentDetails.department": scope.department }
                : {};

        const userFilter = buildFacultyFilter(req.query);
        const combinedFilter = mergeFilters(deptFilter, userFilter);

        const facultyRecords = await Faculty.find(combinedFilter).lean();

        const departments = {};

        facultyRecords.forEach(faculty => {

            const department =
                faculty.employmentDetails?.department ||
                "Unknown";

            if (!departments[department]) {

                departments[department] = {
                    department,
                    facultyCount: 0,
                    totalCompletion: 0,
                    publications: 0,
                    projects: 0,
                    patents: 0,
                    funding: 0
                };
            }

            const dept = departments[department];

            dept.facultyCount++;

            dept.totalCompletion +=
                faculty.completionPercentage || 0;

            dept.publications +=
                (faculty.publications || []).length;

            dept.projects +=
                (faculty.projects || []).length;

            dept.patents +=
                (faculty.patents || []).length;

            dept.funding +=
                (faculty.projects || []).reduce(
                    (sum, project) => {

                        const amount = Number(
                            String(
                                project.amountSanctioned || 0
                            ).replace(/,/g, "")
                        );

                        return sum + amount;

                    }, 0
                );

        });

        const result = Object.values(departments).map(dep => ({

            department: dep.department,

            facultyCount: dep.facultyCount,

            averageCompletion: Number(
                (
                    dep.totalCompletion /
                    dep.facultyCount
                ).toFixed(2)
            ),

            publications: dep.publications,

            projects: dep.projects,

            patents: dep.patents,

            funding: dep.funding

        }));

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});
router.get(
    "/student-profile-completion",
    auth, requireAnalyticsScope("studentProfileCompletion"),
    async (req, res) => {

        try {

            const result =
                await getStudentProfileCompletion();

            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: error.message
            });

        }
    }
);
router.get(
    "/student-profile-summary",
    auth, requireAnalyticsScope("studentProfileSummary"),
    async (req, res) => {

        try {

            const result =
                await getStudentProfileSummary();

            res.json(result);

        } catch (error) {

            res.status(500).json({
                message: error.message
            });

        }
    }
);
router.get(
    "/student-departments",
    auth, requireAnalyticsScope("studentDepartments"),
    async (req, res) => {

        try {

            const result =
                await getStudentDepartments();

            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: error.message
            });

        }
    }
);
router.get(
    "/program-levels",
    auth, requireAnalyticsScope("programLevels"),
    async (req, res) => {

        try {

            const result =
                await getProgramLevels();

            res.json(result);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: error.message
            });

        }
    }
);
module.exports = router;



