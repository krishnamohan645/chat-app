const http = require("http");
const app = require("./app");
const { initSocket } = require("./src/socket/socket");

const server = http.createServer(app);

initSocket(server);
