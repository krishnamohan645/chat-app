const express = require("express");
const cors = require("cors");
const sequelize = require("./src/config/database");
const cookieParser = require("cookie-parser");
const errorHandler = require("./src/middlewares/errorHandler.middleware");
require("dotenv").config();
const path = require("path");

const configureRoutes = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);
app.get("/", (req, res) => {
  res.json({ message: "Hello From Express!" });
});
configureRoutes(app);

app.use(errorHandler);

// console.log(require("crypto").randomBytes(64).toString("hex"));

sequelize.sync().then(() => {
  console.log("Database Synced");
  app.listen(PORT, () => {
    console.log(`Server Running on http://localhost:${PORT}`);
  });
});
