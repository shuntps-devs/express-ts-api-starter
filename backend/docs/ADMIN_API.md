# Admin API Documentation

## Overview

This document describes the administrative API endpoints for session management and system maintenance. All admin endpoints require authentication and admin role privileges.

## Authentication

All admin endpoints require:

- Valid JWT access token in Authorization header: `Authorization: Bearer <token>`
- User must have `UserRole.ADMIN` role

## Endpoints

### Session Management

#### GET /api/admin/sessions/active

Get a paginated list of all active sessions.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**

```json
{
  "status": "success",
  "data": {
    "sessions": [
      {
        "_id": "session_id",
        "userId": "user_id",
        "isActive": true,
        "lastActivityAt": "2024-01-20T10:30:00.000Z",
        "deviceInfo": {
          "userAgent": "Mozilla/5.0...",
          "ipAddress": "192.168.1.1"
        },
        "createdAt": "2024-01-20T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### GET /api/admin/sessions/inactive

Get a paginated list of all inactive sessions.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**
Similar to active sessions, but with `isActive: false`

#### GET /api/admin/sessions/stats

Get session statistics for monitoring and dashboard purposes.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalSessions": 150,
    "activeSessions": 45,
    "inactiveSessions": 80,
    "expiredSessions": 25,
    "uniqueUsers": 120,
    "oldestActiveSession": "2024-01-15T08:00:00.000Z",
    "newestSession": "2024-01-20T14:30:00.000Z"
  }
}
```

#### DELETE /api/admin/sessions/:sessionId

Deactivate a specific session by ID. This will immediately log out the user from that session.

**Path Parameters:**

- `sessionId`: The MongoDB ObjectId of the session to deactivate

**Response:**

```json
{
  "status": "success",
  "message": "Session deactivated successfully",
  "data": {
    "sessionId": "session_id",
    "userId": "user_id",
    "deactivatedAt": "2024-01-20T15:30:00.000Z"
  }
}
```

#### DELETE /api/admin/sessions/inactive

Force cleanup of all inactive sessions that are older than 24 hours.

**Response:**

```json
{
  "status": "success",
  "message": "Inactive sessions cleaned successfully",
  "data": {
    "deletedCount": 15,
    "cleanupTime": "2024-01-20T15:30:00.000Z"
  }
}
```

### System Maintenance

#### POST /api/admin/cleanup

Run comprehensive system cleanup including:

- Expired sessions (TTL handled by MongoDB)
- Inactive sessions older than 24 hours
- Expired email verification tokens

**Response:**

```json
{
  "status": "success",
  "message": "System cleanup completed successfully",
  "data": {
    "totalCleaned": 42,
    "expiredSessions": 20,
    "inactiveSessions": 15,
    "expiredTokens": 7,
    "cleanupTime": "2024-01-20T15:30:00.000Z",
    "duration": "1.5s"
  }
}
```

## Error Responses

All admin endpoints can return the following error responses:

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Unauthorized: No token provided",
  "errorCode": "AUTH_TOKEN_MISSING"
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "Forbidden: Admin role required",
  "errorCode": "AUTH_INSUFFICIENT_PERMISSIONS"
}
```

### 404 Not Found (for specific session operations)

```json
{
  "status": "error",
  "message": "Session not found",
  "errorCode": "RESOURCE_NOT_FOUND"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error occurred",
  "errorCode": "INTERNAL_SERVER_ERROR"
}
```

## Usage Examples

### Using cURL

```bash
# Get active sessions
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/sessions/active?page=1&limit=10"

# Get session statistics
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/sessions/stats"

# Force cleanup inactive sessions
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/sessions/inactive"

# Deactivate specific session
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/sessions/65b8f1234567890abcdef123"

# Run full system cleanup
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/cleanup"
```

### Using Postman

Import the provided Postman collection which includes pre-configured requests for all admin endpoints with:

- Proper authentication headers
- Query parameter examples
- Response validation tests
- Environment variables for easy testing

## Security Considerations

1. **Admin Role Required**: All endpoints check for admin role before execution
2. **Rate Limiting**: Consider implementing rate limiting for admin endpoints in production
3. **Audit Logging**: All admin operations are logged with user context and timestamps
4. **Session Validation**: Admin sessions are validated on every request
5. **IP Restrictions**: Consider restricting admin endpoints to specific IP ranges in production

## Automated Cleanup

The system includes an automated `CleanupService` that:

- Runs every 60 minutes automatically
- Cleans inactive sessions older than 24 hours
- Removes expired verification tokens
- Logs all cleanup operations with statistics

Manual cleanup via admin endpoints provides immediate control when needed.

## Monitoring

Use the `/api/admin/sessions/stats` endpoint to monitor:

- Total number of sessions
- Active vs inactive session ratios
- System cleanup effectiveness
- User engagement patterns

## Best Practices

1. **Regular Monitoring**: Check session statistics regularly
2. **Scheduled Cleanup**: Use automated cleanup for routine maintenance
3. **Manual Intervention**: Use force cleanup during high-load periods
4. **Session Analysis**: Monitor inactive session patterns to optimize TTL settings
5. **Security Audits**: Regularly review admin access logs and session patterns
