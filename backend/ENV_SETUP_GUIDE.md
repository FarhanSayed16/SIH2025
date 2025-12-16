# 🔐 Environment Variables Setup Guide

## Quick Fix for Current Error

Your server is failing because `JWT_SECRET` is not set in your `.env` file.

### Step 1: Generate Secrets

Run this command to generate secure secrets:

```bash
node scripts/generate-secrets.js
```

### Step 2: Add to .env File

Copy the generated `JWT_SECRET` and `ENCRYPTION_KEY` and add them to your `backend/.env` file.

**Example .env file should have:**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/kavach
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kavach?retryWrites=true&w=majority

# JWT Configuration (REQUIRED)
JWT_SECRET=d2cac9a18882391943c016c4d28636cb8606095df4d604ecd04860ac34c9bf2d
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Encryption key (RECOMMENDED for production)
ENCRYPTION_KEY=a411919729a8bdc847c7a44b5d0bad5433cf1341f87dc508f2b97d98d3f95af2

# Redis Configuration (Optional)
# REDIS_URL=redis://localhost:6379

# CORS Origins
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### Step 3: Restart Server

```bash
npm run dev
```

---

## Required Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string | None (server won't start) |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens (min 32 chars) | None (server won't start) |
| `JWT_EXPIRE` | ❌ No | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRE` | ❌ No | Refresh token expiry | `7d` |
| `ENCRYPTION_KEY` | ⚠️ Recommended | 64 hex chars for AES-256-GCM | Random (changes on restart) |
| `PORT` | ❌ No | Server port | `3000` |
| `NODE_ENV` | ❌ No | Environment mode | `development` |

---

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong secrets** - Minimum 32 characters for JWT_SECRET
3. **Generate unique secrets** - Don't reuse secrets across environments
4. **Set ENCRYPTION_KEY in production** - Prevents data loss on restart
5. **Rotate secrets periodically** - Especially if compromised

---

## Generating Secrets

### Quick Method (One-liner)

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using the Script

```bash
node scripts/generate-secrets.js
```

---

## Troubleshooting

### Error: "JWT_SECRET environment variable is required"

**Solution:** Add `JWT_SECRET` to your `.env` file and restart the server.

### Error: "MONGODB_URI not configured"

**Solution:** Add `MONGODB_URI` to your `.env` file with your MongoDB connection string.

### Error: "Invalid encryption key length"

**Solution:** `ENCRYPTION_KEY` must be exactly 64 hex characters (32 bytes). Regenerate it using the script.

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique `JWT_SECRET` (32+ characters)
- [ ] Set `ENCRYPTION_KEY` (64 hex characters)
- [ ] Configure MongoDB Atlas connection string
- [ ] Set proper `CORS_ORIGIN` for your domain
- [ ] Enable HTTPS
- [ ] Set up Redis (optional, for performance)
- [ ] Configure rate limiting thresholds
- [ ] Set up monitoring and logging

---

## Need Help?

If you're still having issues:

1. Check that your `.env` file is in the `backend/` directory
2. Verify there are no extra spaces around the `=` sign
3. Make sure you're using the correct format (no quotes needed)
4. Restart your server after making changes

