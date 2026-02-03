const WEB_APP_URL = 'http://localhost:3000';

const addressRegex = /0x[a-fA-F0-9]{40}/g;

let widgetContainer = null;
let currentAddress = null;

function init() {
  const url = window.location.href;
  
  if (url.includes('etherscan.io/address/')) {
    const match = url.match(/address\/(0x[a-fA-F0-9]{40})/);
    if (match) {
      currentAddress = match[1];
      injectWidget(currentAddress);
    }
  }
}

function injectWidget(address) {
  if (widgetContainer) {
    widgetContainer.remove();
  }

  widgetContainer = document.createElement('div');
  widgetContainer.id = 'legalchain-widget';
  widgetContainer.innerHTML = `
    <div class="legalchain-widget-content">
      <div class="legalchain-header">
        <span class="legalchain-logo">🛡️</span>
        <span class="legalchain-title">LegalChain</span>
        <button class="legalchain-close" id="legalchain-close">×</button>
      </div>
      <div class="legalchain-body" id="legalchain-body">
        <div class="legalchain-loading">
          <div class="legalchain-spinner"></div>
          <span>Analyzing...</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(widgetContainer);

  document.getElementById('legalchain-close').addEventListener('click', () => {
    widgetContainer.classList.add('legalchain-hidden');
  });

  analyzeAddress(address);
}

async function analyzeAddress(address) {
  const body = document.getElementById('legalchain-body');
  
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'analyzeContract', address },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });

    displayResult(body, response);
  } catch (error) {
    displayError(body, error.message);
  }
}

function displayResult(container, analysis) {
  const riskClass = analysis.risk_level.toLowerCase();
  const riskColors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    dangerous: '#ef4444',
  };
  const riskLabels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    dangerous: 'Dangerous',
  };

  container.innerHTML = `
    <div class="legalchain-result">
      <div class="legalchain-score" style="border-color: ${riskColors[riskClass]}">
        <span class="legalchain-score-value" style="color: ${riskColors[riskClass]}">${analysis.risk_score}</span>
        <span class="legalchain-score-label">/100</span>
      </div>
      <div class="legalchain-risk-level" style="background: ${riskColors[riskClass]}20; color: ${riskColors[riskClass]}">
        ${riskLabels[riskClass]}
      </div>
      <p class="legalchain-summary">${truncateText(analysis.summary_short, 100)}</p>
      <a href="${WEB_APP_URL}/analyze?analysis_id=${analysis.analysis_id}" 
         target="_blank" 
         class="legalchain-link">
        View Full Analysis →
      </a>
    </div>
  `;
}

function displayError(container, message) {
  container.innerHTML = `
    <div class="legalchain-error">
      <span class="legalchain-error-icon">⚠️</span>
      <p>${message}</p>
      <button class="legalchain-retry" id="legalchain-retry">Retry</button>
    </div>
  `;

  document.getElementById('legalchain-retry').addEventListener('click', () => {
    container.innerHTML = `
      <div class="legalchain-loading">
        <div class="legalchain-spinner"></div>
        <span>Analyzing...</span>
      </div>
    `;
    analyzeAddress(currentAddress);
  });
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
