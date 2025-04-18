# Chat App Deployment Guide

This guide explains how to build, push, and deploy a static web application (consisting of `index.html`, `styles.css`, and `script.js`) to Google Cloud Run using Docker. The application is a client-side chat interface that uses WebSocket (`ws://34.143.139.189:8080/api/v1/chat/ws`) and APIs (`http://34.143.139.189:8080/...`) for chat, document management, and billing data.

## Prerequisites

- Google Cloud SDK: Install from https://cloud.google.com/sdk/docs/install.
- Docker: Install from https://docs.docker.com/get-docker/.
- Google Cloud Project: Create a project in Google Cloud Console and note the Project ID.
- A terminal with `gcloud` and `docker` commands configured.

## Project Structure

```
project/
├── index.html        # Main HTML file for the chat interface
├── styles.css        # CSS for styling the chat, docs, and billing tabs
├── script.js         # JavaScript for WebSocket, API calls, and UI logic
├── Dockerfile        # Docker configuration for building the container
├── .dockerignore     # Ignore unnecessary files during build
```

## Setup

1. **Clone or Prepare the Project**:
   - Ensure `index.html`, `styles.css`, and `script.js` are in the project directory.
   - Create a `.dockerignore` file to exclude unnecessary files:
     ```
     .git
     .gitignore
     *.md
     ```

2. **Install Google Cloud SDK**:
   - Run `gcloud init` to log in and select your project.

3. **Enable Required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

4. **Create Artifact Registry Repository**:
   ```bash
   gcloud artifacts repositories create chat-app-repo \
     --repository-format=docker \
     --location=us-central1 \
     --description="Repository for Chat App"
   ```

5. **Configure Docker Authentication**:
   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```

## Build and Push Docker Image

1. **Build the Docker Image**:
   - From the project directory, run:
     ```bash
     docker build -t us-central1-docker.pkg.dev/<PROJECT_ID>/chat-app-repo/chat-app:latest .
     ```
     - Replace `<PROJECT_ID>` with your Google Cloud Project ID.

2. **Push the Image to Artifact Registry**:
   ```bash
   docker push us-central1-docker.pkg.dev/<PROJECT_ID>/chat-app-repo/chat-app:latest
   ```

## Deploy to Google Cloud Run

1. **Deploy the Service**:
   ```bash
   gcloud run deploy chat-app \
     --image=us-central1-docker.pkg.dev/<PROJECT_ID>/chat-app-repo/chat-app:latest \
     --region=us-central1 \
     --platform=managed \
     --allow-unauthenticated \
     --port=8080 \
     --max-instances=2
   ```
   - `--allow-unauthenticated`: Allows public access (remove for authenticated access).
   - `--port=8080`: Matches the port configured in the Dockerfile.
   - `--max-instances=2`: Limits instances to control costs.

2. **Access the Application**:
   - After deployment, Cloud Run provides a URL (e.g., `https://chat-app-abcdef.a.run.app`).
   - Open the URL in a browser to access the chat interface.
   - Enter a username when prompted and test the chat, docs, and billing tabs.

## Testing

- **Chat Functionality**:
  - Send messages to verify WebSocket (`ws://34.143.139.189:8080/api/v1/chat/ws`) connectivity.
  - Ensure chat bubbles (user and bot) display correctly.

- **Docs Tab**:
  - Upload a file and verify the document list updates via the API (`http://34.143.139.189:8080/api/v1/document`).

- **Billing Tab**:
  - Check if billing data loads correctly from APIs (`http://34.143.139.189:8080/api/v1/...`).

## Troubleshooting

- **Docker Build Errors**:
  - Verify `index.html`, `styles.css`, and `script.js` exist in the project directory.
  - Check the build log for missing files or syntax errors.

- **Deployment Errors**:
  - View logs in Google Cloud Console (Cloud Run > Service > Logs).
  - Ensure the image is pushed to Artifact Registry and the account has `run.services.create` permission.

- **WebSocket Issues**:
  - The app uses `ws://34.143.139.189:8080/api/v1/chat/ws`. If it fails:
    - Check if the WebSocket server is accessible.
    - Consider upgrading to `wss://` (secure WebSocket) and update `script.js`:
      ```javascript
      socket = new WebSocket(`wss://34.143.139.189:8080/api/v1/chat/ws?name=${name}`);
      ```
    - If WebSocket is unavailable, deploy a separate WebSocket server (e.g., on Compute Engine).

- **Tab Overlap**:
  - The chat box uses `position: fixed`, which may overlap the Docs or Billing tabs. To fix, ensure `switchTab` in `script.js` hides `.chat-box` when not in the Chat tab.

## Notes

- **WebSocket Support**: Cloud Run supports WebSocket (post-October 2023), but the external WebSocket server must be accessible and preferably use `wss://` for security.
- **Cost Management**: Set `--max-instances=2` to limit Cloud Run costs. Monitor usage in Google Cloud Console.
- **Security**: If the app requires authentication, remove `--allow-unauthenticated` and configure IAM roles.
- **Enhancements**:
  - Replace the `prompt` for username input with a custom HTML/CSS modal for better UX.
  - Center the Docs and Billing tabs (update `styles.css` if needed).

## References

- Google Cloud Run Documentation: https://cloud.google.com/run/docs
- Deploying a Static Website to Cloud Run: https://cloud.google.com/run/docs/quickstarts/build-and-deploy
- Nginx Docker Documentation: https://hub.docker.com/_/nginx

For further assistance, contact the project maintainer or check the Google Cloud Community forums.