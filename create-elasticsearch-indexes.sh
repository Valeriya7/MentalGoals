#!/bin/bash

# Скрипт для створення індексів в Elasticsearch Cloud

# Configuration - Set these variables before running
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-https://YOUR_ELASTICSEARCH_ENDPOINT.es.us-central1.gcp.elastic.cloud:443}"
API_KEY="${ELASTICSEARCH_API_KEY:-YOUR_ELASTICSEARCH_API_KEY_HERE}"

# Check if API key is set
if [ "$API_KEY" = "YOUR_ELASTICSEARCH_API_KEY_HERE" ]; then
  echo "❌ Error: Please set ELASTICSEARCH_API_KEY environment variable"
  echo "   Example: export ELASTICSEARCH_API_KEY='your-api-key-here'"
  exit 1
fi

echo "🔍 Створення індексів в Elasticsearch..."
echo ""

# Функція для створення індексу
create_index() {
    local index_name=$1
    local mapping_file=$2
    
    echo "📝 Створення індексу: $index_name"
    
    response=$(curl -s -w "\n%{http_code}" -X PUT \
        "$ELASTICSEARCH_URL/$index_name" \
        -H "Authorization: ApiKey $API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$mapping_file")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "✅ Індекс $index_name створено успішно"
    elif [ "$http_code" -eq 400 ]; then
        echo "⚠️  Індекс $index_name вже існує або помилка в конфігурації"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo "❌ Помилка створення індексу $index_name (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    echo ""
}

# Створення індексу emotions
create_index "emotions" << 'EOF'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "ukrainian_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "userId": { "type": "keyword" },
      "emotion": { "type": "keyword" },
      "value": { "type": "float" },
      "energy": { "type": "float" },
      "note": {
        "type": "text",
        "analyzer": "ukrainian_analyzer"
      },
      "noteEmbedding": {
        "type": "dense_vector",
        "dims": 768,
        "index": true,
        "similarity": "cosine"
      },
      "sentiment": {
        "properties": {
          "prediction": { "type": "keyword" },
          "confidence": { "type": "float" },
          "score": { "type": "float" }
        }
      },
      "date": { "type": "date" },
      "createdAt": { "type": "date" },
      "icon": { "type": "keyword" },
      "color": { "type": "keyword" },
      "type": { "type": "keyword" }
    }
  }
}
EOF

# Створення індексу habits
create_index "habits" << 'EOF'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "ukrainian_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "userId": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "ukrainian_analyzer"
      },
      "description": {
        "type": "text",
        "analyzer": "ukrainian_analyzer",
        "fields": {
          "embedding": {
            "type": "dense_vector",
            "dims": 768,
            "index": true,
            "similarity": "cosine"
          }
        }
      },
      "category": { "type": "keyword" },
      "difficulty": { "type": "keyword" },
      "completed": { "type": "boolean" },
      "completionTime": { "type": "date" },
      "date": { "type": "date" },
      "streak": {
        "properties": {
          "current": { "type": "integer" },
          "best": { "type": "integer" }
        }
      },
      "points": { "type": "integer" },
      "isActive": { "type": "boolean" },
      "target": { "type": "integer" },
      "unit": { "type": "keyword" },
      "frequency": { "type": "keyword" }
    }
  }
}
EOF

# Створення індексу challenges
create_index "challenges" << 'EOF'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "ukrainian_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase"]
        },
        "german_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "title": {
        "properties": {
          "uk": { "type": "text", "analyzer": "ukrainian_analyzer" },
          "en": { "type": "text", "analyzer": "english" },
          "de": { "type": "text", "analyzer": "german_analyzer" }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "ukrainian_analyzer",
        "fields": {
          "embedding": {
            "type": "dense_vector",
            "dims": 768,
            "index": true,
            "similarity": "cosine"
          }
        }
      },
      "difficulty": { "type": "keyword" },
      "difficultyLevel": { "type": "integer" },
      "category": { "type": "keyword" },
      "duration": { "type": "integer" },
      "rewards": {
        "properties": {
          "points": { "type": "integer" },
          "discounts": {
            "type": "nested",
            "properties": {
              "brand": { "type": "keyword" },
              "amount": { "type": "keyword" }
            }
          }
        }
      },
      "completedBy": { "type": "keyword" },
      "status": { "type": "keyword" },
      "tasks": { "type": "nested" },
      "phases": { "type": "nested" }
    }
  }
}
EOF

echo "✅ Готово! Індекси створено (або вже існують)"
echo ""
echo "💡 Примітка: ML jobs потрібно створювати окремо через Elasticsearch API"
echo "   або через Kibana UI в Elastic Cloud Console"

