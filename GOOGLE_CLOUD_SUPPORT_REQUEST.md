# Google Cloud Support Request: Service Account OAuth2 Token Issue

## Issue Summary
Service account JWT bearer grant to Google's OAuth2 token endpoint is returning `id_token` instead of `access_token`, causing authentication failures with Gemini Live Voice API.

## Project Details
- **Project ID**: `massive-dynamo-484115-a2`
- **Project Name**: Professional Diver App
- **Service Account**: `vertex-express@massive-dynamo-484115-a2.iam.gserviceaccount.com`
- **Issue Date**: January 13, 2026 (ongoing)

## Problem Description

When attempting to authenticate using a service account JWT bearer grant, Google's OAuth2 token endpoint (`https://oauth2.googleapis.com/token`) is returning HTTP 200 with a response containing only `id_token` instead of the expected `access_token`.

### Expected Behavior
For service account JWT bearer grants, Google's OAuth2 token endpoint should return an `access_token` that can be used to authenticate API requests.

### Actual Behavior
The OAuth2 token endpoint returns HTTP 200 with a response containing only `id_token`:
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

No `access_token` field is present in the response.

## Symptoms

1. **google-auth-library fails**: The `google-auth-library` Node.js library's `getAccessToken()` method fails with error: "Could not refresh access token."

2. **Manual JWT signing also fails**: When manually signing a JWT and exchanging it for a token:
   - HTTP Status: 200 (success)
   - Response contains only `id_token` (no `access_token`)
   - JWT payload structure appears correct

3. **Impact**: Unable to authenticate with Gemini Live Voice API, which requires OAuth2 access tokens.

## Configuration Details

### Service Account Roles
The service account has the following IAM roles:
- Editor
- Owner
- Service Account Token Creator (recently added)
- Generative Language Service Agent
- Vertex AI User
- Service Usage Consumer

### Enabled APIs
- Generative Language API (`generativelanguage.googleapis.com`) - Enabled January 13, 2026
- Vertex AI API (`aiplatform.googleapis.com`) - Enabled
- Cloud Resource Manager API
- IAM API
- IAM Credentials API

### Billing Status
- Billing account assigned: January 12, 2026
- Billing appears to be active

### Service Account Key
- Key was created: January 13, 2026 (key ID: 109177482860806972527)
- Key format: JSON
- Key is enabled (not revoked)

## Technical Details

### JWT Payload Structure
```json
{
  "iss": "vertex-express@massive-dynamo-484115-a2.iam.gserviceaccount.com",
  "sub": "vertex-express@massive-dynamo-484115-a2.iam.gserviceaccount.com",
  "aud": "https://oauth2.googleapis.com/token",
  "exp": 1768352457,
  "iat": 1768348857,
  "scope": "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language https://www.googleapis.com/auth/aiplatform"
}
```

### Token Request
- **Endpoint**: `https://oauth2.googleapis.com/token`
- **Method**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **Grant Type**: `urn:ietf:params:oauth:grant-type:jwt-bearer`
- **Assertion**: [Signed JWT with RS256 algorithm]

### Response
- **HTTP Status**: 200
- **Response Body**: Contains only `id_token` (no `access_token`)

## Troubleshooting Steps Taken

1. ✅ Added "Service Account Token Creator" role to the service account
2. ✅ Verified APIs are enabled (Generative Language API, Vertex AI API)
3. ✅ Verified service account key is enabled and not revoked
4. ✅ Verified billing account is assigned and active
5. ✅ Verified credentials are loading correctly (JSON file is valid)
6. ✅ Verified JWT payload structure is correct
7. ✅ Waited for IAM changes to propagate (tested after multiple hours)
8. ✅ Verified scopes requested are correct

## Code/Logs Reference

### Error from google-auth-library
```
Error: Could not refresh access token.
    at JWT.getAccessTokenAsync (/app/node_modules/googleapis-common/node_modules/google-auth-library/build/src/auth/oauth2client.js:319:23)
```

### Manual Token Exchange Response
```
HTTP Status: 200
Response: {
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
Response keys: ['id_token']
Has access_token: false
Has id_token: true
```

## Request

Please investigate why Google's OAuth2 token endpoint is returning `id_token` instead of `access_token` for service account JWT bearer grants. This behavior is preventing authentication with the Gemini Live Voice API.

Is there a configuration issue, or is this a known issue with the OAuth2 token endpoint for this project/service account?

## Additional Context

- The service account was created on January 12, 2026
- The Service Account Token Creator role was added on January 13, 2026 (approximately 22:22 GMT)
- We've been testing throughout January 13, 2026 with consistent results
- No error messages from Google indicating why `access_token` is not being returned

## Contact Information
- **Email**: [Your email address]
- **Project**: Professional Diver App (massive-dynamo-484115-a2)
