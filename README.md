# ReflectAI - Intelligent Journal & Private Reflection Workspace

A user-authenticated web application built with Google AI Studio, Gemini 3.6 Flash API, and Cloud Firestore with strict user isolation.

---

## 🌟 Application Features & Architecture

- **User Identity**: Firebase Authentication supporting Google Sign-In with zero password storage on application servers.
- **Strict User Isolation**: Every journal entry and reflection thread is saved to `/users/{userId}/entries/{entryId}`, protected by rule-enforced Firestore security policies.
- **Gemini 3.6 Flash Processing**: Server-side conversational reflection engine featuring multi-turn memory, tailored reflection modes (Deep Reflection, Action Planning, Cognitive Reframe, Socratic Inquiry, Gratitude, and Quick Summary), and cross-entry digests.
- **Resilient AI Fallback Ladder**: Built-in automated fallback ladder across `gemini-3.6-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-flash-latest` ➔ `gemini-3.7-flash` to ensure high availability.
- **Zero-Hardcoding Hygiene**: All API keys and secrets are securely provided via Google Cloud Secret Manager or environment variables.

---

## 🔒 Firestore Security Rules

To ensure strict tenant isolation where users can only read and write their own journal entries and conversation interactions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Isolated journal entries
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Isolated interactions & multi-turn conversations
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other unmatched paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔐 Secret Management Setup

Store your Gemini API key in Google Cloud Secret Manager and grant access to the Cloud Run service account:

```bash
# 1. Create and populate the Secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Cloud Run Deployment Flow

### Prerequisites
1. Install and initialize the [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk).
2. Enable required Google Cloud APIs:
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

### Build & Deploy Command
```bash
# Deploy to Google Cloud Run with Secret Manager environment binding
gcloud run deploy reflect-ai \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Campaign Verification Binding
Apply the mandatory verification label to register your Cloud Run service:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# 3. Build production bundle
npm run build

# 4. Start production server
npm start
```
