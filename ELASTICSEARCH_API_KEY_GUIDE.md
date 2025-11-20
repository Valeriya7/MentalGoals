# 🔑 How to Get Elasticsearch API Key

## 📋 API Key Options

There are two main ways to use Elasticsearch:

### 1. **Elastic Cloud** (recommended for production) ☁️
### 2. **Local Elasticsearch** (free, for development) 💻

---

## ☁️ Option 1: Elastic Cloud (with API Key)

### Step 1: Register on Elastic Cloud

1. **Go to website:**
   ```
   https://cloud.elastic.co/registration
   ```

2. **Register:**
   - Enter email
   - Create password
   - Confirm email

3. **Or login if you already have an account:**
   ```
   https://cloud.elastic.co/login
   ```

### Step 2: Create Deployment

1. **After login click "Create deployment"**

2. **Choose settings:**
   - **Name**: `mentalgoals-elasticsearch` (or any name)
   - **Cloud provider**: AWS, GCP or Azure
   - **Region**: closest to you (e.g., `us-east-1`)
   - **Version**: leave latest version
   - **Template**: `I/O Optimized` (for better performance)

3. **Click "Create deployment"**

4. **Wait 2-3 minutes** for deployment to be created

### Step 3: Get API Key

1. **After deployment creation, click on it**

2. **Go to "Security" section** (left panel)

3. **Click "API keys"**

4. **Click "Create API key"**

5. **Fill the form:**
   - **Name**: `mentalgoals-api-key`
   - **Expiration**: choose expiration (or "Never expire" for development)
   - **Privileges**: choose `All` or configure specific permissions

6. **Click "Create API key"**

7. **⚠️ IMPORTANT: Copy API key immediately!** 
   - It's shown only once
   - Format: `VnVhQ2ZHY0JDZGJrU...` (long string)

### Step 4: Get URL

1. **In the same deployment find "Endpoint"**
   - It will be something like: `https://xxxxx.us-east-1.aws.cloud.es.io:9243`

2. **Copy URL**

### Step 5: Configure in Project

Update `src/environments/environment.ts`:

```typescript
elasticsearch: {
  enabled: true,
  url: 'https://xxxxx.us-east-1.aws.cloud.es.io:9243', // Your endpoint
  apiKey: 'VnVhQ2ZHY0JDZGJrU...' // Your API key
}
```

---

## 💻 Option 2: Local Elasticsearch (no API key)

If you want to use local Elasticsearch for development:

### Installation (macOS)

```bash
# Via Homebrew
brew install elasticsearch

# Or download from official website
# https://www.elastic.co/downloads/elasticsearch
```

### Start

```bash
# Start Elasticsearch
elasticsearch

# Or as service
brew services start elasticsearch
```

### Configure in Project

Update `src/environments/environment.ts`:

```typescript
elasticsearch: {
  enabled: true,
  url: 'http://localhost:9200',
  apiKey: undefined // Not needed for local
}
```

**Note:** For local Elasticsearch API key is not needed, but you need to configure security in `elasticsearch.yml`:

```yaml
# config/elasticsearch.yml
xpack.security.enabled: false  # For development
```

---

## 🆓 Elastic Cloud Free Plan

Elastic Cloud has a **14-day free trial** with:
- 1GB RAM
- 30GB storage
- Full access to all features

After trial you can:
- Continue on paid plan (from $95/month)
- Or use local Elasticsearch

---

## 🔐 API Key Security

⚠️ **IMPORTANT:**

1. **Never commit API key to Git!**
   - File `src/environments/environment.ts` is already in `.gitignore`
   - But check that key didn't get into Git history

2. **Use different keys for:**
   - Development
   - Production
   - Testing

3. **Limit API key permissions:**
   - Don't use `All` privileges in production
   - Create keys with minimal necessary permissions

---

## 📝 Quick Checklist

- [ ] Register at https://cloud.elastic.co
- [ ] Create deployment
- [ ] Create API key in Security section
- [ ] Copy API key and endpoint URL
- [ ] Update `environment.ts` with your data
- [ ] Set `enabled: true`
- [ ] Restart app

---

## 🆘 Problems?

### API Key Not Working
- Check if key hasn't expired
- Check key access permissions
- Make sure endpoint is correct

### Connection Error
- Check if deployment is active
- Check URL (should be HTTPS)
- Check port (usually 9243 for Cloud)

### Local Elasticsearch Won't Start
- Check if port 9200 is free: `lsof -i :9200`
- Check logs: `tail -f /usr/local/var/log/elasticsearch.log`

---

## 🔗 Useful Links

- **Elastic Cloud**: https://cloud.elastic.co
- **API keys documentation**: https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-create-api-key.html
- **Local installation**: https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html

---

**Done!** 🎉 After setup your Elasticsearch will work with API key!
