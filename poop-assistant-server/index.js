require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('API Key loaded:', process.env.GOOGLE_API_KEY ? '✓' : '✗');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 免費模型優先順序
const freeModelPriority = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
  'gemini-pro'
];

let cachedModel = null;
let cachedModelName = null;
let requestCount = 0;
let lastResetTime = Date.now();

function resetRequestCounter() {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    requestCount = 0;
    lastResetTime = now;
  }
}

async function getAvailableModel() {
  for (const modelName of freeModelPriority) {
    try {
      console.log(`🔍 測試免費模型: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const testResult = await model.generateContent('Hello');
      const testResponse = await testResult.response;
      await testResponse.text();
      
      console.log(`✅ 免費模型可用: ${modelName}`);
      return { model, modelName };
    } catch (err) {
      console.log(`❌ 模型 ${modelName} 不可用: ${err.message}`);
      continue;
    }
  }
  throw new Error('❌ 沒有找到可用的免費模型');
}

// 健康檢查端點
app.get('/', (req, res) => {
  res.json({ 
    message: 'Poopalooza AI Assistant API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/assistant', async (req, res) => {
  const { question } = req.body;
  
  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ answer: 'API Key 未設定' });
  }

  resetRequestCounter();
  
  if (requestCount >= 10) {
    return res.status(429).json({ 
      answer: '請求太頻繁，請稍後再試。免費版本有使用限制。',
      error: 'Rate limit exceeded',
      retryAfter: 60
    });
  }
  
  try {
    if (!cachedModel) {
      const result = await getAvailableModel();
      cachedModel = result.model;
      cachedModelName = result.modelName;
    }
    
    console.log(`🤖 使用免費模型: ${cachedModelName} (請求 #${requestCount + 1})`);
    
    requestCount++;
    
    const result = await cachedModel.generateContent(question);
    const response = await result.response;
    const answer = response.text();
    
    res.json({ 
      answer,
      model: cachedModelName,
      status: 'success',
      plan: 'free',
      requestCount: requestCount,
      message: '使用免費版本 - 有使用限制'
    });
    
  } catch (err) {
    console.error('❌ AI 調用錯誤：', err);
    
    if (err.message.includes('quota') || err.message.includes('rate') || err.message.includes('429')) {
      return res.status(429).json({ 
        answer: '免費額度已用完，請稍後再試或考慮升級到付費版本。',
        error: 'Quota exceeded',
        retryAfter: 3600
      });
    }
    
    if (err.message.includes('404') || err.message.includes('NOT_FOUND')) {
      console.log('🔄 嘗試其他免費模型...');
      cachedModel = null;
      cachedModelName = null;
      
      try {
        const result = await getAvailableModel();
        cachedModel = result.model;
        cachedModelName = result.modelName;
        
        const retryResult = await cachedModel.generateContent(question);
        const retryResponse = await retryResult.response;
        const answer = retryResponse.text();
        
        return res.json({ 
          answer,
          model: cachedModelName,
          status: 'success_after_retry',
          plan: 'free'
        });
      } catch (retryErr) {
        console.error('🔄 重試也失敗:', retryErr);
      }
    }
    
    res.status(500).json({ 
      answer: '抱歉，免費的 AI 助手暫時無法使用。請稍後再試或檢查免費額度。',
      error: err.message,
      status: 'error',
      plan: 'free'
    });
  }
});

app.get('/api/models/free', async (req, res) => {
  const modelStatus = [];
  
  for (const modelName of freeModelPriority) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const testResult = await model.generateContent('test');
      const testResponse = await testResult.response;
      await testResponse.text();
      
      let limits = '';
      if (modelName === 'gemini-1.5-flash') {
        limits = '15 requests/min, 1,500/day';
      } else if (modelName === 'gemini-1.5-pro') {
        limits = '2 requests/min, 50/day';
      } else if (modelName === 'gemini-1.0-pro') {
        limits = '15 requests/min, 1,500/day';
      }
      
      modelStatus.push({ 
        name: modelName, 
        status: '✅ 免費可用',
        available: true,
        limits: limits,
        cost: 'FREE 🎉'
      });
    } catch (err) {
      modelStatus.push({ 
        name: modelName, 
        status: `❌ 不可用: ${err.message}`,
        available: false,
        cost: 'FREE'
      });
    }
  }
  
  res.json({ 
    models: modelStatus,
    plan: 'free',
    note: '所有模型都是免費使用，但有使用限制'
  });
});

// 使用環境變數或預設端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 免費 AI Assistant 伺服器啟動於 port ${PORT}`);
  console.log(`🌍 可通過網路訪問`);
});