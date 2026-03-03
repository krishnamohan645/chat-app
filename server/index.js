// const http = require("http");
// const app = require("./app");
// const { initSocket } = require("./src/socket/socket");

// const server = http.createServer(app);

// initSocket(server);

// index.js
const http = require("http");
require("dotenv").config();

const sequelize = require("./src/config/database");
const app = require("./app");
const { initSocket } = require("./src/socket/socket");
const { connectRedis } = require("./src/config/redis");

const PORT = process.env.PORT || 5000;

// 🔥 create http server from app
const server = http.createServer(app);

// 🔥 attach socket to THIS server
initSocket(server);

// 🔥 start server (ONLY HERE)
sequelize.sync().then(async () => {
  console.log("Database Synced");

  await connectRedis(); // ✅ actually connect Redis

  server.listen(PORT, () => {
    console.log(`🚀 Server + Socket running on port ${PORT}`);
  });
});
