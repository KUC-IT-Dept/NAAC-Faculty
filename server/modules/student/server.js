const express = require("express");
import cors from 'cors';
import dotenv from 'dotenv';
const connectDB = require("./db/config.js");
const authRouter = require("./routes/auth.routes.js");
const studentProfileRouter = require("./routes/studentProfile.routes.js");
const requestAccessRouter = require("./routes/RequestAccess.routes.js");
const searchRouter = require("./routes/search.route.js");

const app = express()
app.use(cors());
app.use(express.json())

dotenv.config()

connectDB()

app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRouter)
app.use("/api/student/", studentProfileRouter)
app.use("/api/privilege/", requestAccessRouter)
app.use("/", searchRouter);

app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  res.status(400).json({
    message: err.message || "Something went wrong",
  });
});


app.listen(process.env.PORT, (req, res) => {
    console.log("The app is running...");
})
