const API_URL = 'http://localhost:3002';
const WEB_APP_URL = 'http://localhost:3000';

const elements = {
  inputSection: document.getElementById('input-section'),
  loadingSection: document.getElementById('loading-section'),
  resultSection: document.getElementById('result-section'),
  errorSection: document.getElementById('error-section'),
  addressInput: document.getElementById('address-input'),
  scanBtn: document.getElementById('scan-btn'),
  scoreCircle: document.getElementById('score-circle'),
  scoreValue: document.getElementById('score-value'),
  riskLevel: document.getElementById('risk-level'),
  summary: document.getElementById('summary'),
  findingsList: document.getElementById('findings-list'),
  fullAnalysisBtn: document.getElementById('full-analysis-btn'),
  scanAgainBtn: document.getElementById('scan-again-btn'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),
  webappLink: document.getElementById('webapp-link'),
  educationLink: document.getElementById('education-link'),
};

let currentAnalysisId = null;

function showSection(sectionName) {
  elements.inputSection.classList.add('hidden');
  elements.loadingSection.classList.add('hidden');
  elements.resultSection.classList.add('hidden');
  elements.errorSection.classList.add('hidden');

  switch (sectionName) {
    case 'input':
      elements.inputSection.classList.remove('hidden');
      break;
    case 'loading':
      elements.loadingSection.classList.remove('hidden');
      break;
    case 'result':
      elements.resultSection.classList.remove('hidden');
      break;
    case 'error':
      elements.errorSection.classList.remove('hidden');
      break;
  }
}

function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function getRiskClass(level) {
  return level.toLowerCase();
}

function getSeverityClass(severity) {
  return severity.toLowerCase();
}

async function analyzeContract(address) {
  showSection('loading');

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
    currentAnalysisId = analysis.analysis_id;
    displayResult(analysis);
  } catch (error) {
    showError(error.message);
  }
}

function displayResult(analysis) {
  const riskClass = getRiskClass(analysis.risk_level);

  elements.scoreCircle.className = `score-circle ${riskClass}`;
  elements.scoreValue.textContent = analysis.risk_score;

  elements.riskLevel.className = `risk-level ${riskClass}`;
  elements.riskLevel.textContent = formatRiskLevel(analysis.risk_level);

  elements.summary.textContent = analysis.summary_short;

  elements.findingsList.innerHTML = '';
  const findings = analysis.key_findings.slice(0, 3);
  
  if (findings.length === 0) {
    const li = document.createElement('li');
    li.className = 'finding-item low';
    li.innerHTML = `
      <span class="finding-severity low">INFO</span>
      <span class="finding-title">No critical issues detected</span>
    `;
    elements.findingsList.appendChild(li);
  } else {
    findings.forEach(finding => {
      const li = document.createElement('li');
      const severityClass = getSeverityClass(finding.severity);
      li.className = `finding-item ${severityClass}`;
      li.innerHTML = `
        <span class="finding-severity ${severityClass}">${finding.severity.toUpperCase()}</span>
        <span class="finding-title">${finding.title}</span>
      `;
      elements.findingsList.appendChild(li);
    });
  }

  showSection('result');
}

function formatRiskLevel(level) {
  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    dangerous: 'Dangerous',
  };
  return labels[level] || level;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  showSection('error');
}

function resetToInput() {
  elements.addressInput.value = '';
  currentAnalysisId = null;
  showSection('input');
  elements.addressInput.focus();
}

elements.scanBtn.addEventListener('click', () => {
  const address = elements.addressInput.value.trim();
  
  if (!address) {
    elements.addressInput.focus();
    return;
  }

  if (!isValidAddress(address)) {
    showError('Invalid Ethereum address. Please enter a valid address (0x + 40 hex characters).');
    return;
  }

  analyzeContract(address);
});

elements.addressInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    elements.scanBtn.click();
  }
});

elements.fullAnalysisBtn.addEventListener('click', () => {
  if (currentAnalysisId) {
    chrome.tabs.create({ url: `${WEB_APP_URL}/analyze?analysis_id=${currentAnalysisId}` });
  }
});

elements.scanAgainBtn.addEventListener('click', resetToInput);
elements.retryBtn.addEventListener('click', resetToInput);

elements.webappLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: WEB_APP_URL });
});

elements.educationLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${WEB_APP_URL}/education` });
});

document.addEventListener('DOMContentLoaded', () => {
  elements.addressInput.focus();
  
  chrome.storage.local.get(['lastAddress'], (result) => {
    if (result.lastAddress) {
      elements.addressInput.value = result.lastAddress;
    }
  });
});

elements.addressInput.addEventListener('blur', () => {
  const address = elements.addressInput.value.trim();
  if (address) {
    chrome.storage.local.set({ lastAddress: address });
  }
});
