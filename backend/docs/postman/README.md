# Postman Configuration - UPDATE v1.1.0

This updated Postman configuration allows comprehensive testing of your Express TypeScript API with the new ProfileController.

## ✅ Latest Changes (v1.1.0)

- **🔄 Updated Architecture** - Separation of profile and user endpoints
- **📝 New Profile Endpoints** - `/api/profile/*` for user profile management
- **👑 Admin Endpoints** - `/api/users/*` reserved for administrative operations
- **📷 Avatar Management** - Upload/deletion/configuration of avatars
- **🧪 Enhanced Testing** - Complete response validation and performance metrics

## Contents

- `Express-TypeScript-API.postman_collection.json` - Updated collection with ProfileController
- `Development.postman_environment.json` - Environment variables for local development
- `Production.postman_environment.json` - Environment variables for production
- `Express-TypeScript-API.postman_collection.backup.json` - Backup of previous version

## Import into Postman

1. Open Postman
2. Click "Import" in the top left
3. Drag and drop the 3 main files or use "Upload Files"
4. The collection and environments will be imported automatically

## Configuration

### Development Environment Variables

- `baseUrl`: http://localhost:3000 (modify if your server uses another port)
- `testEmail`: test@example.com
- `testPassword`: SecurePassword123!
- `adminEmail`: admin@example.com
- `adminPassword`: AdminPassword123!

### Production Environment Variables

- `baseUrl`: https://your-api-domain.com (replace with your domain)
- Same variables as Development with production values

## 🆕 New Endpoint Architecture

### 👤 Profile Management (`/api/profile/`)

**Authenticated user endpoints for managing their own profile:**

- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar (multipart/form-data)
- `DELETE /api/profile/avatar` - Remove avatar
- `GET /api/profile/avatar/config` - Avatar upload configuration (public)

### 👑 Admin User Management (`/api/users/`)

**Administrator endpoints for user management:**

- `GET /api/users` - Paginated user list (admin only)
- `GET /api/users/:id` - User details by ID (admin only)
- `PATCH /api/users/:id` - Update user by ID (admin only)
- `DELETE /api/users/:id` - Delete user by ID (admin only)

## Usage

### 1. Authentication Workflow

1. **Register User** - Create a new user account
2. **Login User** - Login (automatically stores tokens)
3. **Refresh Token** - Renew tokens automatically

### 2. User Profile Management (New ✨)

1. **Get User Profile** - Retrieve complete profile
2. **Update Profile** - Modify firstName, lastName, bio, location, etc.
3. **Upload Avatar** - Image upload (JPG, PNG, WEBP - max 5MB)
4. **Remove Avatar** - Delete avatar
5. **Get Avatar Config** - View limits and supported formats

### 3. User Administration

1. **Get All Users** - List all users (admin only)
2. **Get User by ID** - Retrieve specific user (admin only)
3. **Update User** - Modify user data (admin only)
4. **Delete User** - Remove user account (admin only)

### 4. Enhanced Automatic Testing

Each request includes automatic validation tests:

- Response time verification
- Status code validation
- Response structure verification
- Authentication token management
- Error handling validation

## 🧪 Recommended Testing Workflows

### Complete User Sequence

1. **Health Check** - Verify API is functioning
2. **Register User** - Create account with initial profile
3. **Login User** - Login (automatic tokens)
4. **Get User Profile** - Verify profile and authentication
5. **Update Profile** - Modify personal information
6. **Get Avatar Config** - View upload constraints
7. **Upload Avatar** - Upload profile image
8. **Get User Profile** - Verify avatar in profile
9. **Remove Avatar** - Delete avatar
10. **Logout** - Clean logout

### Administration Testing

1. **Login as Admin** - Admin authentication
2. **Get All Users** - List all users
3. **Create Test User** - Create user via admin
4. **Update User** - Modify user data
5. **Delete Test User** - Remove test user
6. **Admin Logout** - Clean admin logout

## 🔧 Technical Features

### Automatic Variables

- `userId` - User ID automatically extracted at login
- `accessToken` - JWT token automatically managed
- `refreshToken` - Refresh token automatically managed

### Performance Testing

- Profile endpoints: < 1000ms
- Update operations: < 2000ms
- Avatar upload: < 5000ms
- Admin operations: < 1500ms

### Robust Validation

```javascript
/**
 * Example automatic test for profile endpoint
 */
pm.test('Response has profile data', () => {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('data');
  pm.expect(jsonData.data).to.have.property('profile');
  pm.expect(jsonData.data.profile).to.have.property('userId');
  pm.expect(jsonData.data.profile).to.have.property('firstName');
});
```

## 🔄 Migration from Previous Version

### Modified Endpoints

- **Profile Management**: Now uses `/api/profile/*` instead of `/api/users/profile`
- **Admin Operations**: Now uses `/api/users/*` (admin only)
- **Avatar Upload**: New dedicated endpoints in ProfileController

### Structural Changes

- **User Profile**: Now in `/api/profile`
- **Admin Management**: Now in `/api/users` (admin only)
- **Enhanced Tests**: Stricter response validation
- **Performance**: Response time thresholds defined

## Troubleshooting

### 404 Error on Old Endpoints

➡️ **Solution**: Use new endpoints `/api/profile/*`

### 403 Error on Admin Endpoints

➡️ **Solution**: Verify user has ADMIN role

### Avatar Upload Fails

➡️ **Solution**: Check format (JPG/PNG/WEBP) and size (< 5MB)

### Automatic Tests Fail

➡️ **Solution**: Import new collection v1.1.0

---

**Ready for comprehensive API testing with professional validation and performance metrics!** 🚀
