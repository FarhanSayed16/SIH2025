# Phase 3.5.1: Load Balancer Setup Guide

**Status**: ✅ **READY**  
**Purpose**: Complete guide for setting up load balancing in production

---

## 🎯 **Overview**

Load balancing distributes incoming requests across multiple server instances to:
- Handle high traffic volumes
- Improve availability and redundancy
- Scale horizontally
- Distribute workload evenly

---

## 🏗️ **Architecture**

```
Internet
    │
    ▼
Load Balancer (Nginx/HAProxy/Cloud Provider)
    │
    ├──► Backend Server 1 (Port 3000)
    ├──► Backend Server 2 (Port 3000)
    ├──► Backend Server 3 (Port 3000)
    └──► Backend Server N...
```

---

## 🔧 **Load Balancer Options**

### **Option 1: Nginx** (Self-Hosted)

#### **Installation**
```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### **Configuration** (`/etc/nginx/sites-available/kavach`)

```nginx
upstream kavach_backend {
    # Load balancing method: least_conn, ip_hash, or round_robin (default)
    least_conn;
    
    # Backend servers
    server 127.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
    
    # Health check
    keepalive 32;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Client body size limit
    client_max_body_size 10M;
    
    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Health check endpoint (bypasses load balancing)
    location /health {
        access_log off;
        proxy_pass http://kavach_backend;
        proxy_set_header Host $host;
    }
    
    # API endpoints
    location /api {
        proxy_pass http://kavach_backend;
        
        # Health check configuration
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
    
    # Static files (can be served directly or via CDN)
    location /uploads {
        alias /path/to/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **Enable Configuration**
```bash
sudo ln -s /etc/nginx/sites-available/kavach /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

### **Option 2: AWS Application Load Balancer (ALB)**

#### **Setup via AWS Console**

1. **Create Target Group**
   - Name: `kavach-backend-tg`
   - Target type: Instances
   - Protocol: HTTP, Port: 3000
   - Health check path: `/api/health`
   - Health check interval: 30 seconds
   - Healthy threshold: 2
   - Unhealthy threshold: 3
   - Timeout: 5 seconds

2. **Register Instances**
   - Select EC2 instances running backend
   - Register them to target group

3. **Create Load Balancer**
   - Type: Application Load Balancer
   - Scheme: Internet-facing
   - IP address type: IPv4
   - Listeners:
     - HTTP (80) → Redirect to HTTPS
     - HTTPS (443) → Forward to target group
   - SSL Certificate: Upload or select from ACM
   - Security groups: Allow HTTP/HTTPS

4. **Configure Health Checks**
   - Health check path: `/api/health`
   - Success codes: 200
   - Advanced settings as configured in target group

#### **Environment Variables**
```env
LOAD_BALANCER_ENABLED=true
LOAD_BALANCER_TYPE=alb
AWS_ALB_TARGET_GROUP_ARN=arn:aws:elasticloadbalancing:...
```

---

### **Option 3: Cloudflare Load Balancer**

#### **Setup Steps**

1. **Enable Load Balancing**
   - Go to Traffic → Load Balancing
   - Create Load Balancer

2. **Configure Origin Pools**
   - Add backend server IPs/domains
   - Configure health checks

3. **Configure Health Checks**
   - Monitor endpoint: `/api/health`
   - Interval: 60 seconds
   - Timeout: 5 seconds
   - Expected status codes: 200

4. **Configure Routing**
   - Set up routing rules
   - Configure failover

---

## 🏥 **Enhanced Health Check Endpoint**

Our health check endpoint should be lightweight and check all critical dependencies.

### **Current Health Check**

Location: `backend/src/routes/health.routes.js`

Enhanced version should include:
- ✅ Server status (always OK if endpoint responds)
- ✅ Database connection status
- ✅ Redis connection status
- ✅ Memory usage
- ✅ Response time

---

## 📊 **Load Balancing Strategies**

### **1. Round Robin** (Default)
- Distributes requests evenly
- Simple and fair
- Good for similar server capacity

### **2. Least Connections**
- Routes to server with fewest active connections
- Better for long-lived connections
- Good for WebSocket connections

### **3. IP Hash**
- Routes based on client IP hash
- Ensures same client → same server
- Good for session affinity

### **4. Weighted Round Robin**
- Routes based on server weights
- Better for servers with different capacities

**Recommendation**: Use **Least Connections** for API servers with WebSocket support.

---

## 🔄 **Session Persistence**

### **If Using Sessions**

For session-based apps, configure sticky sessions:

**Nginx**:
```nginx
upstream kavach_backend {
    ip_hash;  # Session affinity based on IP
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}
```

**AWS ALB**:
- Enable sticky sessions in target group
- Set sticky duration (1 second - 7 days)

**Note**: KAVACH uses JWT tokens, so no sticky sessions needed.

---

## 📈 **Auto-Scaling Configuration**

### **AWS Auto Scaling Group**

```yaml
Min Size: 2
Max Size: 10
Desired Capacity: 3

Scaling Policies:
  Scale Up:
    - CPU > 70% for 5 minutes → Add 1 instance
    - Response Time > 1000ms → Add 1 instance
  
  Scale Down:
    - CPU < 30% for 15 minutes → Remove 1 instance
    - Response Time < 200ms → Remove 1 instance
```

### **Health Check Integration**

- Auto Scaling uses Load Balancer health checks
- Unhealthy instances are replaced automatically
- New instances register with Load Balancer

---

## 🧪 **Testing Load Balancer**

### **1. Test Health Checks**
```bash
curl http://load-balancer-url/api/health
```

### **2. Test Load Distribution**
```bash
# Send multiple requests and check which server handles them
for i in {1..10}; do
  curl -H "X-Request-ID: test-$i" http://load-balancer-url/api/health
done
```

### **3. Test Failover**
- Stop one backend server
- Verify requests still work
- Check health check detects failure

---

## 📝 **Configuration Checklist**

- [ ] Load balancer installed/configured
- [ ] Backend servers registered
- [ ] Health checks configured
- [ ] SSL/TLS certificates installed
- [ ] Security groups/firewall rules configured
- [ ] Session persistence configured (if needed)
- [ ] Auto-scaling configured (if using cloud)
- [ ] Monitoring/alerting setup
- [ ] Load testing completed
- [ ] Failover testing completed

---

## 🚀 **Production Deployment Steps**

1. Set up load balancer
2. Configure health checks
3. Register backend servers
4. Test load distribution
5. Test failover scenarios
6. Configure auto-scaling
7. Set up monitoring
8. Document configuration

---

**Load Balancer Setup**: ✅ **Documentation Complete**  
**Ready for**: Implementation based on chosen infrastructure

