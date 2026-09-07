const { Queue } = require("bullmq");

const connection = {
  host: "127.0.0.1",
  port: 6379,
};

const reportQueue = new Queue("reportQueue", {
  connection,
});

module.exports = {
  reportQueue,
  connection,
};