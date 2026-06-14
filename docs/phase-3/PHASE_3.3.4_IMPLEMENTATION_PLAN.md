# Phase 3.3.4: PDF Certificates - Implementation Plan

## Overview
Implement automated PDF certificate generation for students who complete modules, achieve milestones, or reach certain preparedness scores.

## Goals
- Generate shareable PDF certificates
- Trigger certificates on achievements (e.g., Level 5, all modules completed)
- Allow students to download and share certificates
- Store certificate history

## Implementation Tasks

### Backend Tasks

#### 1. PDF Generation Library
- [ ] Install PDF generation library (choose one):
  - Option A: `pdfkit` - Lightweight, good for simple PDFs
  - Option B: `puppeteer` - Full browser rendering, more flexible
  - Option C: `pdfmake` - Declarative PDF generation
  - **Recommendation:** `pdfkit` for simplicity and performance

#### 2. Certificate Model
- [ ] Create `Certificate` model to track generated certificates
- [ ] Fields: userId, certificateType, achievement, pdfUrl, issuedAt, sharedAt

#### 3. Certificate Service
- [ ] Create `certificate.service.js`:
  - `generateCertificate()` - Generate PDF certificate
  - `getUserCertificates()` - Get user's certificates
  - `downloadCertificate()` - Stream PDF file

#### 4. Certificate Templates
- [ ] Design certificate template:
  - Student name
  - Achievement description
  - Date issued
  - Signature/Stamp
  - QR code (optional) for verification

#### 5. Certificate API Endpoints
- [ ] `POST /api/certificates/generate` - Generate certificate
- [ ] `GET /api/certificates/my-certificates` - Get user certificates
- [ ] `GET /api/certificates/:id` - Get certificate details
- [ ] `GET /api/certificates/:id/download` - Download PDF

#### 6. Certificate Triggers
- [ ] Auto-generate on preparedness score milestone (e.g., 80%, 95%)
- [ ] Auto-generate on completing all modules
- [ ] Auto-generate on earning certain badges

### Mobile Tasks

#### 1. PDF Package Integration
- [ ] Install `printing` package for PDF viewing/sharing
- [ ] Install `path_provider` for file storage
- [ ] Install `share_plus` for sharing functionality

#### 2. Certificate Models
- [ ] Create certificate model
- [ ] Create certificate history model

#### 3. Certificate Service
- [ ] Create certificate service:
  - `getMyCertificates()` - Fetch user certificates
  - `downloadCertificate()` - Download PDF
  - `shareCertificate()` - Share certificate

#### 4. Certificate UI Screens
- [ ] Certificate List Screen - Show all certificates
- [ ] Certificate Detail Screen - View certificate details
- [ ] Certificate Viewer Screen - Display PDF with download/share options

#### 5. Integration
- [ ] Add certificate navigation from profile
- [ ] Show certificate notifications when earned
- [ ] Add certificate badge/icon on achievements

### Certificate Types

1. **Module Completion Certificate**
   - Trigger: Complete all modules
   - Text: "Certificate of Completion"

2. **Preparedness Score Certificate**
   - Trigger: Reach 80% or 95% preparedness score
   - Text: "Safety Champion" or "Safety Expert"

3. **Badge Achievement Certificate**
   - Trigger: Earn rare badge or complete badge collection
   - Text: "Achievement Certificate"

## API Endpoints

### POST `/api/certificates/generate`
Body:
```json
{
  "certificateType": "module_completion" | "score_milestone" | "badge_achievement",
  "achievement": "Completed all modules",
  "metadata": {}
}
```

### GET `/api/certificates/my-certificates`
Returns list of user's certificates

### GET `/api/certificates/:id/download`
Returns PDF file stream

## Implementation Order

1. Backend: Install PDF library
2. Backend: Create Certificate model
3. Backend: Create certificate service
4. Backend: Create certificate controller and routes
5. Backend: Integrate certificate triggers
6. Mobile: Install PDF packages
7. Mobile: Create certificate models and service
8. Mobile: Create certificate UI screens
9. Mobile: Integrate certificate display
10. Testing

## Timeline
Estimated: 1 week
- Backend: 3-4 days
- Mobile: 2-3 days
- Testing: 1 day

