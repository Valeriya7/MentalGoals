/**
 * Простий Node.js скрипт для створення індексів в Elasticsearch
 * 
 * Використання:
 * node create-indexes-simple.js
 */

const https = require('https');

// Configuration - Set these variables before running
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'YOUR_ELASTICSEARCH_ENDPOINT.es.us-central1.gcp.elastic.cloud';
const API_KEY = process.env.ELASTICSEARCH_API_KEY || 'YOUR_ELASTICSEARCH_API_KEY_HERE';

// Check if API key is set
if (API_KEY === 'YOUR_ELASTICSEARCH_API_KEY_HERE') {
  console.error('❌ Error: Please set ELASTICSEARCH_API_KEY environment variable');
  console.error('   Example: export ELASTICSEARCH_API_KEY="your-api-key-here"');
  process.exit(1);
}

function createIndex(indexName, mapping) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(mapping);
    
    const options = {
      hostname: ELASTICSEARCH_URL,
      port: 443,
      path: `/${indexName}`,
      method: 'PUT',
      headers: {
        'Authorization': `ApiKey ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ Індекс ${indexName} створено успішно`);
          resolve(body);
        } else if (res.statusCode === 400) {
          try {
            const error = JSON.parse(body);
            if (error.error?.type === 'resource_already_exists_exception') {
              console.log(`⚠️  Індекс ${indexName} вже існує`);
            } else {
              console.log(`⚠️  Помилка створення індексу ${indexName}:`, error.error?.reason || body);
            }
          } catch (e) {
            console.log(`⚠️  Помилка створення індексу ${indexName}:`, body);
          }
          resolve(body);
        } else {
          console.log(`❌ Помилка створення індексу ${indexName} (HTTP ${res.statusCode})`);
          console.log(body);
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Помилка запиту для ${indexName}:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔍 Створення індексів в Elasticsearch...\n');

  // Індекс emotions
  await createIndex('emotions', {
    // Serverless не підтримує number_of_shards та number_of_replicas
    settings: {},
    mappings: {
      properties: {
        id: { type: 'keyword' },
        userId: { type: 'keyword' },
        emotion: { type: 'keyword' },
        value: { type: 'float' },
        energy: { type: 'float' },
        note: { type: 'text' },
        noteEmbedding: {
          type: 'dense_vector',
          dims: 768,
          index: true,
          similarity: 'cosine'
        },
        sentiment: {
          properties: {
            prediction: { type: 'keyword' },
            confidence: { type: 'float' },
            score: { type: 'float' }
          }
        },
        date: { type: 'date' },
        createdAt: { type: 'date' },
        icon: { type: 'keyword' },
        color: { type: 'keyword' },
        type: { type: 'keyword' }
      }
    }
  });

  // Індекс habits
  await createIndex('habits', {
    // Serverless не підтримує number_of_shards та number_of_replicas
    settings: {},
    mappings: {
      properties: {
        id: { type: 'keyword' },
        userId: { type: 'keyword' },
        name: { type: 'text' },
        description: { type: 'text' },
        descriptionEmbedding: {
          type: 'dense_vector',
          dims: 768,
          index: true,
          similarity: 'cosine'
        },
        category: { type: 'keyword' },
        difficulty: { type: 'keyword' },
        completed: { type: 'boolean' },
        date: { type: 'date' },
        points: { type: 'integer' },
        isActive: { type: 'boolean' }
      }
    }
  });

  // Індекс challenges
  await createIndex('challenges', {
    // Serverless не підтримує number_of_shards та number_of_replicas
    settings: {},
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: {
          properties: {
            uk: { type: 'text' },
            en: { type: 'text' },
            de: { type: 'text' }
          }
        },
        description: { type: 'text' },
        descriptionEmbedding: {
          type: 'dense_vector',
          dims: 768,
          index: true,
          similarity: 'cosine'
        },
        difficulty: { type: 'keyword' },
        difficultyLevel: { type: 'integer' },
        category: { type: 'keyword' },
        duration: { type: 'integer' },
        rewards: {
          properties: {
            points: { type: 'integer' }
          }
        },
        status: { type: 'keyword' }
      }
    }
  });

  console.log('\n✅ Готово! Індекси створено.');
  console.log('💡 Примітка: ML jobs потрібно створювати через Elasticsearch API або Kibana UI');
}

main().catch(console.error);

