# 🔐 Elasticsearch Setup Guide

## 📋 Quick Start

This guide will help you set up Elasticsearch API key and configure it in the project.

## 🔑 Step 1: Get Your Elasticsearch API Key

### Option A: Elastic Cloud (Recommended)

1. **Go to Elastic Cloud Console:**
   ```
   https://cloud.elastic.co
   ```

2. **Login or create an account**

3. **Create or select your deployment**

4. **Get API Key:**
   - Go to **Security** → **API keys**
   - Click **Create API key**
   - Name it (e.g., `mentalgoals-api-key`)
   - Copy the API key immediately (it's shown only once!)

5. **Get Endpoint URL:**
   - In your deployment, find the **Endpoint** URL
   - It looks like: `https://xxxxx.es.us-central1.gcp.elastic.cloud:443`

### Option B: Local Elasticsearch

For local development, you don't need an API key. Just use:
```
http://localhost:9200
```

## ⚙️ Step 2: Configure in Project

### Method 1: Environment File (Recommended)

1. **Copy the example file:**
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```

2. **Edit `src/environments/environment.ts`:**
   ```typescript
   elasticsearch: {
     enabled: true,
     url: '/elasticsearch', // For development with proxy
     // OR
     // url: 'https://your-endpoint.es.us-central1.gcp.elastic.cloud:443', // For production
     apiKey: 'YOUR_ELASTICSEARCH_API_KEY_HERE' // Paste your API key here
   }
   ```

3. **The file is already in `.gitignore`**, so it won't be committed to Git.

### Method 2: Environment Variables

1. **Create a `.env` file** (add to `.gitignore`):
   ```bash
   ELASTICSEARCH_API_KEY=your-api-key-here
   ELASTICSEARCH_URL=https://your-endpoint.es.us-central1.gcp.elastic.cloud:443
   ```

2. **Update `environment.ts`** to use environment variables:
   ```typescript
   apiKey: process.env['ELASTICSEARCH_API_KEY'] || 'YOUR_ELASTICSEARCH_API_KEY_HERE'
   ```

## 🔧 Step 3: Configure Proxy (For Development)

If you're using proxy for development:

1. **Copy the example file:**
   ```bash
   cp proxy.conf.example.json proxy.conf.json
   ```

2. **Edit `proxy.conf.json`:**
   ```json
   {
     "/elasticsearch": {
       "target": "https://YOUR_ELASTICSEARCH_ENDPOINT.es.us-central1.gcp.elastic.cloud:443",
       "headers": {
         "Authorization": "ApiKey YOUR_ELASTICSEARCH_API_KEY_HERE"
       }
     }
   }
   ```

3. **Add `proxy.conf.json` to `.gitignore`** to keep your API key private.

## 📝 Step 4: Create Indexes

After configuring your API key, create the indexes:

### Using Node.js Script:

```bash
# Set environment variables
export ELASTICSEARCH_API_KEY="your-api-key-here"
export ELASTICSEARCH_URL="your-endpoint.es.us-central1.gcp.elastic.cloud"

# Run the script
node create-indexes-simple.js
```

### Using Shell Script:

```bash
# Set environment variables
export ELASTICSEARCH_API_KEY="your-api-key-here"
export ELASTICSEARCH_URL="https://your-endpoint.es.us-central1.gcp.elastic.cloud:443"

# Run the script
chmod +x create-elasticsearch-indexes.sh
./create-elasticsearch-indexes.sh
```

## ✅ Step 5: Verify Setup

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Open the test page:**
   ```
   https://localhost:4200/elasticsearch-test
   ```

3. **Check the connection status** - it should show "✅ Connected to Elasticsearch"

## 🔒 Security Best Practices

1. **Never commit API keys to Git:**
   - ✅ `src/environments/environment.ts` is in `.gitignore`
   - ✅ `proxy.conf.json` should be in `.gitignore`
   - ✅ `.env` files should be in `.gitignore`

2. **Use different keys for different environments:**
   - Development: Test API key
   - Production: Production API key with limited permissions

3. **Rotate API keys regularly:**
   - Delete old keys in Elastic Cloud Console
   - Create new keys when needed

4. **Limit API key permissions:**
   - Don't use "All" privileges in production
   - Create keys with minimal necessary permissions

## 📚 Additional Resources

- **API Key Guide:** See [ELASTICSEARCH_API_KEY_GUIDE.md](./ELASTICSEARCH_API_KEY_GUIDE.md)
- **Integration Guide:** See [ELASTICSEARCH_INTEGRATION.md](./ELASTICSEARCH_INTEGRATION.md)
- **CORS Setup:** See [CORS_SOLUTION.md](./CORS_SOLUTION.md)

## 🆘 Troubleshooting

### API Key Not Working
- Check if the key hasn't expired
- Verify key permissions in Elastic Cloud Console
- Make sure the endpoint URL is correct

### Connection Errors
- Verify the deployment is active
- Check if the URL uses HTTPS
- Ensure the port is correct (usually 443 for Cloud)

### Proxy Not Working
- Make sure `proxy.conf.json` exists and is configured
- Check that `npm start` includes `--proxy-config proxy.conf.json`
- Verify the API key in proxy config matches your actual key

---

**Done!** 🎉 Your Elasticsearch is now configured securely!

