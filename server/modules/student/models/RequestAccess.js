const mongoose = require("mongoose");

const RequestAccess = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: ["cancelled", "approved", "pending"],
        default: "pending"
    }
})

module.exports = mongoose.model("RequestAccess", RequestAccess);
