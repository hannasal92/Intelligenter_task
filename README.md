Intelligenter - Domain Analysis API

Intelligenter is a Node.js + TypeScript service that analyzes domains using VirusTotal and WHOIS data.
It supports asynchronous domain analysis, stores results in MongoDB, and exposes a REST API with GET and POST endpoints.

⸻

Features
	•	REST API:
	•	POST /post → enqueue domain for analysis
	•	GET /get?domain=example.com → retrieve stored domain info
	•	Worker: processes domain analysis jobs asynchronously using a Redis queue.
	•	Scheduler: automatically re-checks domains older than 30 days.
	•	Database: MongoDB stores domains, request logs, and results.
	•	Security: input validation, rate limiting, and secure headers with Helmet.
	•	Extensible: easy to integrate real VirusTotal and WHOIS APIs.

⸻

Tech Stack
	•	Node.js + TypeScript
	•	Express.js (REST API)
	•	MongoDB (data storage)
	•	Redis + Bull (job queue)
	•	Joi (input validation)
	•	Winston (logging)
	•	Docker & Docker Compose (local development)

⸻

Prerequisites
	•	Node.js ≥ 20
	•	npm ≥ 9
	•	Docker & Docker Compose (for MongoDB + Redis)
	•	Optional: VirusTotal API key (VT_API_KEY)
	•	Optional: WHOIS API key (WHOIS_API_KEY)

⸻

Setup
	1.	Clone the repository
    
    git clone <repo-url> intelligenter
    cd intelligenter
    npm install
    
    2.	Create .env
    cp .env.example .env

    Edit .env and provide your configuration:
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/intelligenter
    REDIS_URL=redis://127.0.0.1:6379
    VT_API_KEY=<your_virustotal_api_key>
    WHOIS_API_KEY=<your_whois_api_key>
    JOB_CONCURRENCY=3
    RATE_LIMIT_WINDOW_MS=60000
    RATE_LIMIT_MAX=60

    3.	Start MongoDB & Redis


Running the Project

Development
npm run dev

Production
npm run build
node dist/index.js