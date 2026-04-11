# File Organization Guide

## 📁 Current Organization Structure

### Recommended Structure

```
kavach/
├── backend/                    # Backend API (Phase 1 - Complete)
│   ├── src/
│   ├── tests/
│   ├── scripts/
│   ├── docker/
│   └── docs/
│       └── openapi.yaml
│
├── mobile/                     # Flutter Mobile App (Phase 2)
│   ├── lib/
│   ├── assets/
│   ├── test/
│   └── pubspec.yaml
│
├── web/                        # Next.js Admin Dashboard (Phase 2)
│   ├── app/
│   ├── components/
│   └── package.json
│
└── docs/                       # Documentation
    ├── phase-0/                # Phase 0 Documentation
    ├── phase-1/                # Phase 1 Documentation
    ├── phase-2/                # Phase 2 Documentation
    └── shared/                 # Shared Documentation
        ├── ARCHITECTURE.md
        ├── CURSOR_AI_METHODOLOGY.md
        └── METHODOLOGY_INDEX.md
```

---

## 📂 Phase-Wise Documentation Organization

### Phase 0 Documents → `docs/phase-0/`

**Files to Move:**
- `PHASE_0_SETUP.md`
- `PHASE_0_SUMMARY.md`
- `PHASE_0_CHECKLIST.md`
- `SETUP_GUIDE.md`

### Phase 1 Documents → `docs/phase-1/`

**Files to Move:**
- `PHASE_1_IMPLEMENTATION.md`
- `PHASE_1_PLAN.md`
- `PHASE_1.2_COMPLETE.md`
- `PHASE_1.3_COMPLETE.md`
- `PHASE_1.4_COMPLETE.md`
- `PHASE_1.4.1_SUMMARY.md`
- `PHASE_1.4.1_TEST_RESULTS.md`
- `PHASE_1.4.1_TESTING_GUIDE.md`
- `PHASE_1.5_COMPLETE.md`
- `PHASE_1.6_COMPLETE.md`
- `PHASE_1.6_README.md`
- `PHASE_1.7_COMPLETE.md`
- `PHASE_1.8_COMPLETE.md`
- `PHASE_1_PROGRESS.md`
- `PHASE_1_READY.md`
- `PHASE_1_METHODOLOGY_SUMMARY.md`

### Phase 2 Documents → `docs/phase-2/`

**Files to Create/Move:**
- `PHASE_2_COMPLETE_PLAN.md` ✅ (Created)
- Phase 2 sub-phase completion docs (as they're created)

### Shared Documents → `docs/shared/`

**Files to Move:**
- `ARCHITECTURE.md`
- `CURSOR_AI_METHODOLOGY.md`
- `AI_ASSISTANT_QUICK_GUIDE.md`
- `METHODOLOGY_INDEX.md`
- `ACCEPTANCE_TEST_CHECKLIST.md`
- `FIREBASE_STATUS.md`
- `IOT_INTEGRATION_READY.md`
- `IOT_INTEGRATION_GUIDE.md`
- `MONGODB_GUIDE.md`

### Root Level Files → Organize

**Phase Summaries (Keep in Root or Move to Respective Phase):**
- `PHASE_0_SUMMARY.md` → `docs/phase-0/`
- `PHASE_1.4.1_FINAL_RESULTS.md` → `docs/phase-1/`
- `PHASE_1.4.1_TESTING.md` → `docs/phase-1/`
- `PHASE_1.6_SUMMARY.md` → `docs/phase-1/`
- `PHASE_1.7_SUMMARY.md` → `docs/phase-1/`
- `PHASE_1.8_SUMMARY.md` → `docs/phase-1/`
- `PHASE_1_METHODOLOGY_SUMMARY.md` → `docs/phase-1/`

**Tech Stack Docs (Move to Shared or Archive):**
- `TECH_STACK.md` → `docs/shared/` or archive
- `FINAL_TECH_STACK.md` → `docs/shared/` or archive
- `STACK_COMPARISON.md` → Archive (historical)
- `ENHANCEMENT_ROADMAP.md` → `docs/shared/`

---

## 🔄 Organization Script (Manual Steps)

### Step 1: Create Directory Structure

```powershell
# Create phase directories
New-Item -ItemType Directory -Path "docs\phase-0" -Force
New-Item -ItemType Directory -Path "docs\phase-1" -Force
New-Item -ItemType Directory -Path "docs\phase-2" -Force
New-Item -ItemType Directory -Path "docs\shared" -Force
```

### Step 2: Move Phase 0 Files

```powershell
Move-Item -Path "docs\PHASE_0_*.md" -Destination "docs\phase-0\" -Force
Move-Item -Path "PHASE_0_*.md" -Destination "docs\phase-0\" -Force
Move-Item -Path "SETUP_GUIDE.md" -Destination "docs\phase-0\" -Force
```

### Step 3: Move Phase 1 Files

```powershell
Move-Item -Path "docs\PHASE_1*.md" -Destination "docs\phase-1\" -Force
Move-Item -Path "PHASE_1*.md" -Destination "docs\phase-1\" -Force
Move-Item -Path "PHASE_1.4.1*.md" -Destination "docs\phase-1\" -Force
```

### Step 4: Move Shared Files

```powershell
Move-Item -Path "docs\ARCHITECTURE.md" -Destination "docs\shared\" -Force
Move-Item -Path "docs\CURSOR_AI_METHODOLOGY.md" -Destination "docs\shared\" -Force
Move-Item -Path "docs\AI_ASSISTANT_QUICK_GUIDE.md" -Destination "docs\shared\" -Force
Move-Item -Path "docs\METHODOLOGY_INDEX.md" -Destination "docs\shared\" -Force
Move-Item -Path "docs\ACCEPTANCE_TEST_CHECKLIST.md" -Destination "docs\shared\" -Force
```

---

## 📋 File Naming Conventions

### Phase Documents
- `PHASE_X_COMPLETE_PLAN.md` - Complete plan for phase
- `PHASE_X.Y_COMPLETE.md` - Sub-phase completion
- `PHASE_X_SUMMARY.md` - Phase summary
- `PHASE_X_README.md` - Phase-specific guide

### Shared Documents
- `ARCHITECTURE.md` - System architecture
- `METHODOLOGY.md` - Development methodology
- `INTEGRATION_GUIDE.md` - Integration guides

---

## ✅ Organization Checklist

- [ ] Create phase directories
- [ ] Move Phase 0 documents
- [ ] Move Phase 1 documents
- [ ] Move shared documents
- [ ] Organize root level files
- [ ] Update README with new structure
- [ ] Create index files for each phase

---

**Last Updated**: Phase 2 Planning

