const API_URL = 'http://localhost:3002';
const WEB_APP_URL = 'http://localhost:3000';

const analysisCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContract') {
    handleAnalyzeContract(request.address)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'getCachedAnalysis') {
    const cached = getCachedAnalysis(request.address);
    sendResponse(cached);
    return true;
  }

  if (request.action === 'openFullAnalysis') {
    chrome.tabs.create({ 
      url: `${WEB_APP_URL}/analyze?analysis_id=${request.analysisId}` 
    });
    return true;
  }
});

async function handleAnalyzeContract(address) {
  const cached = getCachedAnalysis(address);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_type: 'address',
        chain_id: 1,
        value: address,
        options: {
          generate_voice: false,
          user_level: 'beginner',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Analysis failed');
    }

    const analysis = await response.json();
    
    cacheAnalysis(address, analysis);

    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

function getCachedAnalysis(address) {
  const normalizedAddress = address.toLowerCase();
  const cached = analysisCache.get(normalizedAddress);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  analysisCache.delete(normalizedAddress);
  return null;
}

function cacheAnalysis(address, data) {
  const normalizedAddress = address.toLowerCase();
  analysisCache.set(normalizedAddress, {
    data,
    timestamp: Date.now(),
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [address, cached] of analysisCache.entries()) {
    if (now - cached.timestamp >= CACHE_DURATION) {
      analysisCache.delete(address);
    }
  }
}, 60 * 1000);

console.log('LegalChain background service worker started');
