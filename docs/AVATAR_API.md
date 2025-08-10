# Avatar Upload API Documentation

This document describes the avatar upload functionality for user profile management.

## Overview

The Avatar Upload API allows authenticated users to upload, update, and remove profile avatars. The system automatically processes images for optimal display and storage.

## Features

- ✅ Single avatar per user
- ✅ Automatic image processing (resize to 400x400, JPEG conversion)
- ✅ File format validation (JPG, JPEG, PNG, WEBP)
- ✅ File size limit (5MB maximum)
- ✅ Authenticated access only
- ✅ Old avatar automatic cleanup
- ✅ Static file serving

## Endpoints

### Upload Avatar

**POST** `/api/users/avatar`

Uploads a new avatar for the authenticated user. Replaces any existing avatar.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body:**

- `avatar` (file): Image file (JPG, JPEG, PNG, WEBP, max 5MB)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": {
      "url": "/uploads/avatars/60f7b3b4c4e4b12a8c8b4567/avatar-1640995200000.jpg",
      "uploadedAt": "2025-08-10T09:00:00.000Z"
    },
    "previousAvatarDeleted": true,
    "profile": {
      "id": "60f7b3b4c4e4b12a8c8b4568",
      "avatar": {
        "url": "/uploads/avatars/60f7b3b4c4e4b12a8c8b4567/avatar-1640995200000.jpg",
        "uploadedAt": "2025-08-10T09:00:00.000Z"
      }
    }
  },
  "requestId": "req_abc123"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid file format, size too large, or no file provided
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Upload processing failed

### Remove Avatar

**DELETE** `/api/users/avatar`

Removes the current avatar for the authenticated user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Avatar removed successfully",
  "data": {
    "profile": {
      "id": "60f7b3b4c4e4b12a8c8b4568",
      "avatar": null
    }
  },
  "requestId": "req_xyz789"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: User profile not found

### Get Upload Configuration

**GET** `/api/users/avatar/config`

Returns avatar upload limits and allowed file formats for client-side validation.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Avatar upload limits retrieved successfully",
  "data": {
    "maxFileSize": 5242880,
    "maxFileSizeMB": 5,
    "allowedFormats": ["jpg", "jpeg", "png", "webp"],
    "allowedExtensions": [".jpg", ".jpeg", ".png", ".webp"],
    "imageProcessing": {
      "width": 400,
      "height": 400,
      "quality": 90
    }
  },
  "requestId": "req_config123"
}
```

## Image Processing

All uploaded avatars are automatically processed with the following transformations:

1. **Resize**: Images are resized to 400x400 pixels using cover fit (maintains aspect ratio, crops if necessary)
2. **Format**: Converted to JPEG format for consistent display and smaller file size
3. **Quality**: Compressed to 90% quality for optimal balance between size and quality
4. **Naming**: Files are renamed with timestamp to prevent caching issues

## File Storage Structure

Avatars are stored in the following directory structure:

```
uploads/
└── avatars/
    └── <userId>/
        └── avatar-<timestamp>.jpg
```

## Static File Access

Avatar files are served as static content and can be accessed directly via their URL:

```
GET /uploads/avatars/<userId>/avatar-<timestamp>.jpg
```

**Note**: Direct file access requires the same authentication as API endpoints.

## Client-Side Implementation Examples

### JavaScript (Fetch API)

```javascript
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/users/avatar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
}
```

### HTML Form

```html
<form id="avatarForm" enctype="multipart/form-data">
  <input type="file" name="avatar" accept=".jpg,.jpeg,.png,.webp" required />
  <button type="submit">Upload Avatar</button>
</form>
```

### File Validation

```javascript
function validateAvatarFile(file) {
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be JPG, JPEG, PNG, or WEBP format');
  }

  return true;
}
```

## Error Handling

### Common Error Codes

| Status Code | Error Code              | Description                   |
| ----------- | ----------------------- | ----------------------------- |
| 400         | INVALID_FILE_FORMAT     | File type not supported       |
| 400         | FILE_TOO_LARGE          | File size exceeds 5MB limit   |
| 400         | NO_FILE_UPLOADED        | No file provided in request   |
| 400         | NO_PROCESSED_FILE       | File processing failed        |
| 401         | AUTHENTICATION_REQUIRED | Missing or invalid auth token |
| 500         | AVATAR_UPLOAD_FAILED    | Server error during upload    |
| 500         | IMAGE_PROCESSING_FAILED | Error processing image        |
| 500         | PROFILE_UPDATE_FAILED   | Error updating user profile   |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "File size exceeds maximum limit of 5MB",
    "code": "FILE_TOO_LARGE",
    "statusCode": 400
  },
  "requestId": "req_error123"
}
```

## Security Considerations

1. **Authentication Required**: All avatar endpoints require valid Bearer token authentication
2. **File Type Validation**: Only image files are accepted (validated by MIME type and extension)
3. **File Size Limits**: Maximum 5MB per upload to prevent abuse
4. **Path Traversal Protection**: User IDs are used to isolate avatar storage
5. **Automatic Cleanup**: Old avatars are automatically deleted to prevent storage bloat

## Testing with Postman

The project includes Postman collection with pre-configured avatar upload requests:

1. **Upload Avatar**: Test file upload with form-data
2. **Remove Avatar**: Test avatar deletion
3. **Get Upload Config**: Test configuration retrieval

Import the collection from: `docs/postman/Express-TypeScript-API.postman_collection.json`

## Integration Notes

- Avatar URLs are included in user profile responses
- The Profile model automatically manages avatar metadata
- File cleanup is handled automatically by the AvatarService
- Static file serving is configured in the main server setup
