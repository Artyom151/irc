# **App Name**: Paladin IRC Server

## Core Features:

- GET /api/messages: Return a JSON list of the latest messages.
- POST /api/message: Accept a new message from the client. Includes validation and UTF-8 support.
- Message Storage: Store messages in-memory (for MVP).
- CORS Support: Enable Cross-Origin Resource Sharing (CORS) for external requests.
- Rate Limiting: Implement rate limiting to protect against abuse.
- Request Logging: Log all incoming requests for debugging and monitoring.
- Error Handling: Return useful and appropriate HTTP error codes

## Style Guidelines:

- Primary color: Dark theme, with dark grays and blacks for backgrounds.
- Accent color: Light purple (#A020F0) for highlights and interactive elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern look, suitable for UI and chat messages
- Use simple, clean icons for UI elements.
- Simple and clear, to minimize user friction.
- Minimal animations, used for feedback on user interactions.