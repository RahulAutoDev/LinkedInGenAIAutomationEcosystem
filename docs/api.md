# API Contracts

## Base URL
`http://localhost:8000`

## Endpoints

### `GET /`
Root endpoint. Returns API status and available endpoints.

### `POST /trigger-cycle`
Trigger a new content generation cycle.
- **Response:** `{ cycle_id, status, message }`
- **Status Codes:** `200 OK`

### `GET /status/{cycle_id}`
Get status of a running or completed cycle.
- **Response:** `{ status, started_at, completed_at, output?, errors? }`
- **Status Codes:** `200 OK`, `404 Not Found`

### `GET /audit-log?limit=50&agent_id=optional`
Retrieve governance audit log entries.
- **Params:** `limit` (int), `agent_id` (string, optional filter)
- **Response:** `{ total, entries[] }`

### `GET /drafts`
List all saved post drafts.
- **Response:** `{ total, drafts[] }`

### `GET /topics`
List all posted topics (for dedup reference).
- **Response:** `{ total, topics[] }`

### `POST /topics`
Add a new topic to the pipeline.
- **Body:** `{ topic, category, priority, notes }`

### `GET /health`
Health check endpoint.
- **Response:** `{ status, timestamp, data_dir_exists, audit_log_entries }`
