# Oracle Data Provider

This serves as a dummy data provider, emulating API responses from the palmyra suite.

## Configuration

Create a `.env` file in the root directory for custom configuration. See `.env.example` for available options.

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: development)
- `MAX_RECORDS_PER_REQUEST` - Maximum records per API request (default: 10000)
- `CORS_ORIGIN` - CORS origin setting (default: *)
- `CORS_MAX_AGE` - CORS max age in seconds (default: 3600)

## Usage

To install dependencies:
```sh
bun install
```

To run in development mode:
```sh
bun run dev
```

To run in production mode:
```sh
bun run start
```

Open http://localhost:3000 (or your configured PORT)

## API Endpoints

- `GET /` - API documentation
- `GET /{count}` - Get N drum records (1 ≤ count ≤ MAX_RECORDS)
- `DELETE /reset` - Clear stored records
- `GET /health` - Health check endpoint

## Error Handling

The application includes comprehensive error handling with:
- Structured error responses
- Error ID tracking for debugging
- Different error detail levels for development vs production
- Request logging and error logging
