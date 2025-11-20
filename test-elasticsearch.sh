#!/bin/bash

echo "🔍 Перевірка доступності Elasticsearch тестової сторінки..."
echo ""

# Перевірка портів
PORT_4200=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:4200 2>/dev/null)
PORT_8100=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:8100 2>/dev/null)

if [ "$PORT_4200" = "200" ] || [ "$PORT_4200" = "404" ]; then
    echo "✅ Сервер працює на https://localhost:4200"
    echo ""
    echo "📝 Відкрийте в браузері:"
    echo "   https://localhost:4200/elasticsearch-test"
    echo ""
    echo "⚠️  Якщо бачите попередження про SSL:"
    echo "   Натисніть 'Advanced' → 'Proceed to localhost'"
    echo ""
elif [ "$PORT_8100" = "200" ] || [ "$PORT_8100" = "404" ]; then
    echo "✅ Сервер працює на https://localhost:8100"
    echo ""
    echo "📝 Відкрийте в браузері:"
    echo "   https://localhost:8100/elasticsearch-test"
    echo ""
    echo "⚠️  Якщо бачите попередження про SSL:"
    echo "   Натисніть 'Advanced' → 'Proceed to localhost'"
    echo ""
else
    echo "❌ Сервер не доступний"
    echo "   Перевірте, чи запущений: npm start"
    echo ""
fi

