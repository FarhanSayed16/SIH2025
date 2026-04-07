# SendGrid Setup Guide

## Quick Setup

### 1. Install SendGrid Package
```bash
cd backend
npm install @sendgrid/mail
```

### 2. Get SendGrid API Key

1. **Sign up for SendGrid** (Free tier available):
   - Go to https://sendgrid.com
   - Sign up for free account
   - Free tier: **100 emails/day**

2. **Create API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it (e.g., "Kavach Production")
   - Select "Full Access" or "Mail Send" permissions
   - Copy the API key (you'll only see it once!)

3. **Add to Environment Variables**:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com  # Optional
   SENDGRID_FROM_NAME=Kavach  # Optional
   ```

### 3. Verify Setup

After adding the API key, restart your backend server. You should see:
```
✅ SendGrid email service initialized
```

### 4. Test Email Sending

Send a test broadcast and check the logs. You should see:
```
✅ Email sent via SendGrid to user@example.com: 200
```

---

## How It Works

- **Primary Provider**: SendGrid (if API key configured)
- **Fallback**: SMTP/Gmail (if SendGrid fails or not configured)
- **Rate Limits**: 
  - SendGrid: 100/day (free), 40,000/day (paid)
  - Gmail: 500/day

---

## Benefits of SendGrid

1. ✅ **Better Deliverability**: Professional email service
2. ✅ **Higher Limits**: 40,000/day on paid tier
3. ✅ **Analytics**: Track opens, clicks, bounces
4. ✅ **Reliability**: 99.9% uptime SLA
5. ✅ **No App Passwords**: Just API key needed

---

## Troubleshooting

### "SendGrid package not installed"
```bash
npm install @sendgrid/mail
```

### "SendGrid not configured"
- Check `SENDGRID_API_KEY` is set in `.env`
- Restart backend server after adding key

### "Email still using SMTP"
- Check logs for "SendGrid email service initialized"
- If not present, API key might be invalid
- Verify API key in SendGrid dashboard

---

**Status**: Ready to use after package installation and API key setup

