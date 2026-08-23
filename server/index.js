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

const server = http.createServer(app);

initSocket(server);

sequelize.sync().then(async () => {
  console.log("Database Synced");

  await connectRedis(); 

  server.listen(PORT, () => {
    console.log(`🚀 Server + Socket running on http://localhost:${PORT}`);
  });
});
