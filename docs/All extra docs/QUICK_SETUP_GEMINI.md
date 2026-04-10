# ⚡ QUICK SETUP: Gemini API Key

## Step 1: Get API Key (2 min)
**Visit**: https://aistudio.google.com/apikey
- Sign in with Google
- Click "Create API Key"
- Copy the key (starts with `AIza...`)

---

## Step 2: Add to Backend (30 sec)
**File**: `backend/.env`

Add this line:
```env
GEMINI_API_KEY=paste_your_key_here
```

---

## Step 3: Restart Server
```bash
cd backend
# Press Ctrl+C to stop server
npm run dev
```

---

## Step 4: Test
```bash
cd backend
node scripts/test-phase3.1.4.js
```

**Done!** ✅

---

**Once you give me the key, I'll add it and test immediately!** 🚀

