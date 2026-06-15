# Phase 3.5.1: CDN Integration Guide

**Status**: ✅ **READY**  
**Purpose**: Guide for setting up CDN for static assets and API responses

---

## 🎯 **Overview**

CDN (Content Delivery Network) integration will:
- Serve static assets from edge locations globally
- Reduce server load
- Improve response times for users worldwide
- Cache API responses where appropriate

---

## 📦 **Static Assets to Serve via CDN**

### **1. Audio Files**
- Path: `/uploads/audio/`
- Current: Served directly from server
- CDN: Should be served from CDN

### **2. Certificate PDFs**
- Path: `/uploads/certificates/`
- Current: Served directly from server
- CDN: Should be served from CDN

### **3. Report Files**
- Path: `/uploads/reports/`
- Current: Served directly from server
- CDN: Should be served from CDN

### **4. Module Images/Videos**
- Path: Module content media files
- Current: External URLs or server-hosted
- CDN: Should use CDN URLs

---

## 🔧 **CDN Configuration**

### **Option 1: Cloudflare** (Recommended)

#### **Setup Steps:**

1. **Create Cloudflare Account**
   - Sign up at https://cloudflare.com
   - Add your domain
   - Update DNS nameservers

2. **Configure Caching Rules**
   ```
   Static Assets (images, videos, PDFs):
   - Cache Level: Cache Everything
   - Browser Cache TTL: 1 year
   - Edge Cache TTL: 1 month
   
   API Responses (with cache headers):
   - Cache Level: Respect Existing Headers
   - Browser Cache TTL: Respect Origin
   - Edge Cache TTL: Respect Origin
   ```

3. **Environment Variables**
   ```env
   CDN_ENABLED=true
   CDN_URL=https://cdn.yourdomain.com
   CDN_PROVIDER=cloudflare
   ```

### **Option 2: AWS CloudFront**

#### **Setup Steps:**

1. **Create S3 Bucket**
   - Upload static assets to S3
   - Configure bucket permissions

2. **Create CloudFront Distribution**
   - Origin: S3 bucket or API server
   - Caching behavior: Configure per path pattern

3. **Environment Variables**
   ```env
   CDN_ENABLED=true
   CDN_URL=https://d1234abcd.cloudfront.net
   CDN_PROVIDER=cloudfront
   AWS_CLOUDFRONT_DISTRIBUTION_ID=d1234abcd
   ```

### **Option 3: Cloudinary** (For Images/Media)

#### **Setup Steps:**

1. **Create Cloudinary Account**
   - Sign up at https://cloudinary.com
   - Get API credentials

2. **Upload Assets**
   - Use Cloudinary SDK for uploads
   - Store Cloudinary URLs in database

3. **Environment Variables**
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   CLOUDINARY_ENABLED=true
   ```

---

## 💻 **Code Implementation**

### **1. CDN Configuration Service**

Create `backend/src/config/cdn.js`:
```javascript
const cdnConfig = {
  enabled: process.env.CDN_ENABLED === 'true',
  url: process.env.CDN_URL || '',
  provider: process.env.CDN_PROVIDER || 'cloudflare',
  cloudflare: {
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN
  },
  cloudfront: {
    distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID
  }
};

export const getCDNUrl = (path) => {
  if (!cdnConfig.enabled || !cdnConfig.url) {
    return path; // Return original path if CDN not configured
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Return CDN URL
  return `${cdnConfig.url}/${cleanPath}`;
};

export default cdnConfig;
```

### **2. Update Response Models**

For any model that returns file URLs, use CDN URL:
```javascript
import { getCDNUrl } from '../config/cdn.js';

// In controller
const certificate = {
  ...certificateData,
  pdfUrl: getCDNUrl(certificateData.pdfUrl)
};
```

### **3. Cache Headers for Static Assets**

Update static file serving in `server.js`:
```javascript
app.use('/uploads/audio', express.static(path.join(__dirname, '../uploads/audio'), {
  maxAge: '1y', // Cache for 1 year
  immutable: true
}));
```

---

## 📝 **API Response Caching**

### **Cache Headers**

For cached API responses, add headers:
```javascript
res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
res.setHeader('CDN-Cache-Control', 'public, max-age=3600'); // 1 hour on CDN
```

### **Cache Headers Middleware**

Create middleware to add cache headers:
```javascript
export const cacheHeaders = (maxAge = 300, cdnMaxAge = null) => {
  return (req, res, next) => {
    const cacheControl = `public, max-age=${maxAge}`;
    res.setHeader('Cache-Control', cacheControl);
    
    if (cdnMaxAge) {
      res.setHeader('CDN-Cache-Control', `public, max-age=${cdnMaxAge}`);
    }
    
    next();
  };
};
```

---

## 🔍 **CDN Validation**

### **Test CDN Setup**

1. **Check CDN URL**
   ```bash
   curl -I https://cdn.yourdomain.com/uploads/audio/test.mp3
   ```

2. **Verify Cache Headers**
   - Check for `X-Cache: HIT` header
   - Verify `Cache-Control` headers

3. **Test Performance**
   - Compare response times with/without CDN
   - Use tools like GTmetrix, PageSpeed Insights

---

## 📊 **Benefits**

- ✅ 50-90% faster static asset loading
- ✅ Reduced server bandwidth usage
- ✅ Better global performance
- ✅ Automatic DDoS protection (with Cloudflare)
- ✅ SSL/TLS termination at edge

---

## ⚠️ **Considerations**

1. **Cache Invalidation**
   - Need strategy for invalidating CDN cache
   - Use versioning or purge API

2. **Cost**
   - CDN services have costs (but usually reasonable)
   - Cloudflare has free tier

3. **Asset Upload Flow**
   - May need to upload directly to CDN
   - Or sync after server upload

---

## 🚀 **Next Steps**

1. Choose CDN provider
2. Set up CDN account
3. Configure DNS
4. Update environment variables
5. Deploy code changes
6. Test and validate

---

**CDN Setup**: ✅ **Documentation Complete**  
**Ready for**: Implementation when CDN provider is chosen

