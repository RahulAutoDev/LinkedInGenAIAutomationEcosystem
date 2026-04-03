# LinkedIn GenAI Automation Ecosystem

## Overview
An AI-powered system designed to generate, review, and publish LinkedIn content using a human-in-the-loop governance model.

## Key Features
- AI content generation using Gemini
- Semantic deduplication using Qdrant
- Topic ingestion via Google Sheets
- Governance dashboard using Next.js
- Approval workflow before publishing
- Diagram generation (Mermaid → Image)
- Secure OAuth integration for LinkedIn
- Hybrid publishing (manual + assisted)

## Architecture
Google Sheets → Worker → Supabase → Dashboard → Approval → Publish

## Tech Stack
- Next.js (Frontend + API)
- Node.js (Worker)
- Supabase (PostgreSQL)
- Qdrant (Vector Database)
- Google Gemini API
- Google Sheets API

## Publishing Model (IMPORTANT)
Due to LinkedIn API restrictions, this system does NOT directly publish posts using the LinkedIn API.

The application does not currently have access to the `w_member_social` permission required for programmatic posting.

Instead, the system uses a **human-in-the-loop publishing model**, where:
- AI generates content
- User reviews and approves
- User manually publishes to LinkedIn

## Security Considerations
- All API keys are stored in environment variables
- No sensitive data is exposed in the frontend
- OAuth flow is securely handled on the backend

## Setup Instructions
1. Clone the repository
2. Install dependencies:
   npm install
3. Create .env file and configure required variables
4. Run the application:
   npm run dev

## Environment Variables
- GEMINI_API_KEY
- DATABASE_URL
- QDRANT_API_KEY
- GOOGLE_SHEET_ID
- GOOGLE_APPLICATION_CREDENTIALS
- LINKEDIN_CLIENT_ID
- LINKEDIN_CLIENT_SECRET

## Future Enhancements
- LinkedIn API integration (subject to approval)
- Automated scheduler (post every 4 days)
- Analytics dashboard (engagement tracking)
- Feedback loop for AI optimization