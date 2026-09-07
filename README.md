# Background Job Practice with Node.js, BullMQ & Redis

A small practice project to understand how **background jobs** work in a Node.js backend using **Express**, **BullMQ**, and **Redis**.

This project does not use MongoDB, MySQL, PostgreSQL, or any other application database. Redis is used only as the queue backend for BullMQ.

---

## What This Project Demonstrates

This project covers the basic background-job workflow:

- Creating jobs from an API
- Processing jobs in a separate worker
- Using Redis as the queue backend
- Tracking job status
- Updating job progress
- Returning job results
- Retrying failed jobs
- Using retry backoff
- Handling permanently failed jobs
- Keeping jobs waiting while the worker is offline

---

## Tech Stack

- Node.js
- Express.js
- BullMQ
- Redis
- ioredis

---

## Project Architecture

```text
Client
  |
  | POST /reports
  v
Express API
  |
  | Queue.add()
  v
BullMQ Queue
  |
  v
Redis
  |
  v
Worker
  |
  v
Process Report Job
  |
  +----> Completed
  |
  +----> Failed -> Retry
```

The API server and worker run as separate Node.js processes.

```text
server.js
   |
   v
 Redis
   ^
   |
worker.js
```

The server does not directly call the worker. BullMQ and Redis act as the communication layer between them.

---

## Project Structure

```text
background-job-practice/
|
|-- server.js
|-- queue.js
|-- worker.js
|-- package.json
|-- package-lock.json
|-- .gitignore
`-- README.md
```

---

## File Responsibilities

### `queue.js`

Responsible for:

- BullMQ queue creation
- Redis connection configuration
- Exporting shared queue configuration

### `server.js`

Acts as the producer.

Responsible for:

- Receiving HTTP requests
- Validating request data
- Creating background jobs
- Returning job IDs
- Returning job status and results

### `worker.js`

Acts as the consumer.

Responsible for:

- Receiving jobs from the queue
- Processing background tasks
- Updating progress
- Simulating failures
- Retrying failed jobs
- Returning job results

---

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd background-job-practice
```

Install dependencies:

```bash
npm install
```

If needed, install the main dependencies manually:

```bash
npm install express bullmq ioredis
```

---

## Running Redis

### Option 1: Docker

Run Redis using Docker:

```bash
docker run --name background-job-redis -p 6379:6379 -d redis
```

Check that Redis is running:

```bash
docker ps
```

### Option 2: Local Redis

If Redis is already installed locally, make sure it is running on:

```text
127.0.0.1:6379
```

---

## Run the Project

You need the API server and worker running separately.

### Terminal 1 - API Server

```bash
node server.js
```

Expected output:

```text
Server running on http://localhost:3000
```

### Terminal 2 - Worker

```bash
node worker.js
```

Expected output:

```text
Worker is waiting for jobs...
```

---

## API Endpoints

### 1. Create Report Job

```http
POST /reports
```

Example:

```http
POST http://localhost:3000/reports
```

Request body:

```json
{
  "reportType": "monthly-sales"
}
```

Example response:

```json
{
  "message": "Report generation started",
  "jobId": "1"
}
```

The API returns immediately. The report is processed later by the worker.

---

### 2. Check Job Status

```http
GET /reports/:jobId
```

Example:

```http
GET http://localhost:3000/reports/1
```

Possible response while processing:

```json
{
  "jobId": "1",
  "status": "active",
  "progress": 50,
  "result": null,
  "failedReason": null,
  "attemptsMade": 0
}
```

Example completed response:

```json
{
  "jobId": "1",
  "status": "completed",
  "progress": 100,
  "result": {
    "reportType": "monthly-sales",
    "totalSales": 50000,
    "totalOrders": 120,
    "generatedAt": "2026-09-07T00:00:00.000Z"
  },
  "failedReason": null,
  "attemptsMade": 1
}
```

---

## Test Scenarios

### Normal Success

Request:

```json
{
  "reportType": "monthly-sales"
}
```

Expected flow:

```text
Waiting
  |
  v
Active
  |
  v
Completed
```

---

### Retry Then Success

Request:

```json
{
  "reportType": "retry-demo"
}
```

Expected flow:

```text
Attempt 1
   |
   v
Failed
   |
   v
Wait 2 seconds
   |
   v
Attempt 2
   |
   v
Completed
```

---

### Permanent Failure

Request:

```json
{
  "reportType": "fail"
}
```

The job is configured with:

```text
Maximum Attempts: 3
Backoff: 2 seconds
```

Expected flow:

```text
Attempt 1 -> Failed
Attempt 2 -> Failed
Attempt 3 -> Failed
Final Status -> Failed
```

---

### Worker Offline Test

Stop the worker:

```text
Ctrl + C
```

Keep the API server and Redis running.

Create a job:

```json
{
  "reportType": "yearly-sales"
}
```

Check its status:

```text
waiting
```

Then restart the worker:

```bash
node worker.js
```

The waiting job should automatically be picked up and processed.

This demonstrates that the API server and worker are decoupled.

---

## Job Lifecycle

A job may move through states such as:

```text
waiting
   |
   v
active
   |
   +----> completed
   |
   +----> failed
            |
            v
           retry
```

BullMQ stores job state and metadata in Redis.

---

## Retry Configuration

Jobs are configured with:

```javascript
{
  attempts: 3,
  backoff: {
    type: "fixed",
    delay: 2000
  }
}
```

This means a failed job can be attempted up to three times with a two-second delay between retries.

---

## Important Concepts Practiced

This project helps demonstrate:

- Background processing
- Producer and consumer pattern
- Queue-based architecture
- Asynchronous execution
- Job persistence
- Retry mechanism
- Backoff strategy
- Job progress tracking
- Job status tracking
- Worker isolation
- Fault tolerance
- Decoupling

---

## Mental Model

```text
server.js
   |
   | creates job
   v
BullMQ Queue
   |
   v
Redis
   |
   | consumed by
   v
worker.js
```

In simple terms:

> `server.js` creates the job, `queue.js` defines the queue infrastructure, and `worker.js` executes the background job.

---

## Notes

This is a learning/practice project and uses fake report generation with delays instead of generating real files.

In a production system, background jobs could be used for tasks such as:

- Sending emails
- Sending SMS
- Generating PDFs
- Exporting Excel files
- Image processing
- Video processing
- Notifications
- Webhook processing
- Scheduled tasks
- Data imports and exports

---

## License

This project is intended for learning and practice.
