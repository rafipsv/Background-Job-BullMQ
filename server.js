const express = require("express");
const { reportQueue } = require("./queue");

const app = express();

app.use(express.json());

// Create report job
app.post("/reports", async (req, res) => {
  try {
    const { reportType } = req.body;

    if (!reportType) {
      return res.status(400).json({
        message: "reportType is required",
      });
    }

    const job = await reportQueue.add(
      "generate-report",
      {
        reportType,
      },
      {
        attempts: 3,

        backoff: {
          type: "fixed",
          delay: 2000,
        },
      },
    );

    return res.status(202).json({
      message: "Report generation started",
      jobId: job.id,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Check report status
app.get("/reports/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await reportQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const state = await job.getState();

    return res.json({
      jobId: job.id,
      status: state,
      progress: job.progress,
      result: job.returnvalue,
      failedReason: job.failedReason || null,
      attemptsMade: job.attemptsMade,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
