const mongoose = require("mongoose");
console.log("Metric model file loaded");

const MetricSchema = new mongoose.Schema(
{
    metricId: {
        type: String,
        required: true,
        unique: true
    },

    metricName: {
        type: String,
        required: true
    },

    criterion: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    sourceModules: [{
        type: String
    }],

    supported: {
        type: Boolean,
        default: false
    },
    sumField: {
        type: String
    },
    collection: {
        type: String
    },

    fieldPath: {
        type: String
    },

    formulaType: {
        type: String
   },
   conditionField: {
    type: String
},

conditionValue: {
    type: String
},
distinctField: {
    type: String
},
numeratorField: {
    type: String
},
numeratorField: {
    type: String
},
    missingFields: [{
        type: String
    }]
},
{
    timestamps: true
});

module.exports = mongoose.model("Metric", MetricSchema);