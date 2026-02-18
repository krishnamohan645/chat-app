// const express = require("express");
// const cors = require("cors");
// const sequelize = require("./src/config/database");
// const cookieParser = require("cookie-parser");
// const errorHandler = require("./src/middlewares/errorHandler.middleware");
// require("dotenv").config();
// const path = require("path");

// const configureRoutes = require("./routes");

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
// app.use(
//   cors({
//     // origin: ["http://localhost:5173", "http://localhost:3000"],
//     origin:process.env.FRONTEND_URL,
//     credentials: true,
//   }),
// );
// app.get("/", (req, res) => {
//   res.json({ message: "Hello From Express!" });
// });
// configureRoutes(app);

// app.use(errorHandler);

// // console.log(require("crypto").randomBytes(64).toString("hex"));

// sequelize.sync().then(() => {
//   console.log("Database Synced");
//   app.listen(PORT, () => {
//     console.log(`Server Running on http://localhost:${PORT}`);
//   });
// });

// server.js or app.js
// const express = require("express");
// const app = express();

// // Serve static files
// app.use(express.static(__dirname));

// // Explicit routes
// app.get("/firebase-messaging-sw.js", (req, res) => {
//   res.sendFile(__dirname + "/firebase-messaging-sw.js");
// });

// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/fcm-test.html");
// });

// // Listen on localhost specifically
// const PORT = 3000;
// app.listen(PORT, "localhost", () => {
//   // ← ADD 'localhost' HERE
//   console.log(`Server running at: http://localhost:${PORT}`);
//   console.log(`Access at: http://localhost:${PORT}`);
// });

// app.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const errorHandler = require("./src/middlewares/errorHandler.middleware");
const configureRoutes = require("./routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
);

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Hello From Express!" });
});

configureRoutes(app);
app.use(errorHandler);

module.exports = app;
