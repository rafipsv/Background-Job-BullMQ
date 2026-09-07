const { Worker } = require("bullmq");
const { connection } = require("./queue");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};


const worker = new Worker(
  "reportQueue",

  async (job) => {
    console.log("----------------------------");
    console.log(`Job ${job.id} started`);
    console.log("Data:", job.data);
    console.log(`Attempt: ${job.attemptsMade + 1}`);

    const { reportType } = job.data;


    // 10%
    await job.updateProgress(10);

    console.log("Collecting report data...");

    await sleep(2000);


    // 50%
    await job.updateProgress(50);

    console.log("Generating report...");

    await sleep(3000);


    // Failure test
    if (reportType === "fail") {
      throw new Error("Report generation intentionally failed");
    }


    // Retry test
    if (
      reportType === "retry-demo" &&
      job.attemptsMade < 1
    ) {
      throw new Error("Temporary error occurred");
    }


    await job.updateProgress(100);

    console.log(`Job ${job.id} completed`);


    return {
      reportType,
      totalSales: 50000,
      totalOrders: 120,
      generatedAt: new Date().toISOString(),
    };
  },

  {
    connection,
  }
);


worker.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
  console.log(result);
});


worker.on("failed", (job, error) => {
  console.log(`❌ Job ${job?.id} failed`);
  console.log(error.message);
});


console.log("Worker is waiting for jobs...");