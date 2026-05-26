const StudentProfile = require("../models/StudentProfile.js");
const Users = require("../../../auth/models/User.model.js");

exports.searchUser = async (req, res) => {
    try {
        const search = req.query.search || "";
        const users = await Users.find({
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ]
        });
        res.status(200).json(users);
    } catch(error) {
        return res.status(400).json({"message":"not found"});
    }
}

exports.searchUserById = async (req, res) => {
    try {
        const { id } = req.params || "";
        const data = await StudentProfile.findOne({userId:id});
        if (!data) {
            return res.status(400).json({"message": "no data found"});
        }
        res.status(200).json(data);
    } catch (error) {
        console.log("no user found.");
        return res.status(500).json({"message": "internal error"});
    }
}
