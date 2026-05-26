const RequestAccess = require("../models/RequestAccess.js");
const Users = require("../../../auth/models/User.model.js");

exports.requestAccess = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ "Message": "Session out please login" });
        }
        await RequestAccess.create({
            userId,
            Status: "pending",
            "message": req.body.message
        });
        res.status(200).json({"message":"the message has sent to the hod"});
    } catch (error) {
        return res.status(400).json({"message":"Something fishy."});
    }
}

exports.getAllRequest = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== "professor" && role !== "office") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const requests = await RequestAccess.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Requests fetched successfully",
      count: requests.length,
      requests
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.approveEdit = async (req, res) => {
    try {
        const role = req.user.role;
        const id = req.user.id;
        if (role !== "professor" && role != "office") {
            return res.status(400).json({ "Message": "Only teacher can approve." });
        }
        if (!id) {
            return res.status(400).json({ "Message": "Session out please login" });
        }
        const user = req.body.userId;
        if (!user) {
            return res.status(400).json({"Message": "User does not exist."});
        }
        await Users.findByIdAndUpdate(user, { canEdit: true });
        return res.status(200).json({"Message": "Sucess"});
    } catch(error) {
        return res.status(400).json({"message":"Something fishy."});
    }
}
