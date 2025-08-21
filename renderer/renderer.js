const { ipcRenderer } = require('electron');

// App State
let isLoading = false;
let currentTheme = 'light';

// DOM Elements
const elements = {
  themeToggle: document.getElementById('themeToggle'),
  apiKey: document.getElementById('apiKey'),
  toggleApiKey: document.getElementById('toggleApiKey'),
  saveApiKey: document.getElementById('saveApiKey'),
  loadApiKey: document.getElementById('loadApiKey'),
  predictionDate: document.getElementById('predictionDate'),
  predictionHour: document.getElementById('predictionHour'),
  predictionMinute: document.getElementById('predictionMinute'),
  inputTimesList: document.getElementById('inputTimesList'),
  predictBtn: document.getElementById('predictBtn'),
  progressContainer: document.getElementById('progressContainer'),
  progressText: document.getElementById('progressText'),
  progressPercent: document.getElementById('progressPercent'),
  progressFill: document.getElementById('progressFill'),
  progressSteps: document.getElementById('progressSteps'),
  placeholderContent: document.getElementById('placeholderContent'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingText: document.getElementById('loadingText'),
  resultContainer: document.getElementById('resultContainer'),
  predictionImage: document.getElementById('predictionImage'),
  maxRainfall: document.getElementById('maxRainfall'),
  centerRainfall: document.getElementById('centerRainfall'),
  avgRainfall: document.getElementById('avgRainfall'),
  predictionTime: document.getElementById('predictionTime'),
  exportBtn: document.getElementById('exportBtn'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  backendStatus: document.getElementById('backendStatus'),
  backendStatusText: document.getElementById('backendStatusText'),
  toastContainer: document.getElementById('toastContainer')
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await initializeTheme();
  initializeTimeSelectors();
  initializeEventListeners();
  await loadSavedApiKey();
  checkBackendStatus();
  updateInputTimes();
});

// Theme Management
async function initializeTheme() {
  currentTheme = await ipcRenderer.invoke('get-config-value', 'theme') || 'light';
  document.querySelector('.app-container').setAttribute('data-theme', currentTheme);
  updateThemeIcon();
}

async function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.querySelector('.app-container').setAttribute('data-theme', currentTheme);
  await ipcRenderer.invoke('set-config-value', 'theme', currentTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = elements.themeToggle.querySelector('i');
  icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Time Selector Initialization
function initializeTimeSelectors() {
  // Initialize hour selector (0-23)
  for (let i = 0; i < 24; i++) {
    const option = document.createElement('option');
    option.value = i.toString().padStart(2, '0');
    option.textContent = i.toString().padStart(2, '0');
    elements.predictionHour.appendChild(option);
  }

  // Set current date and time
  const now = new Date();
  elements.predictionDate.value = now.toISOString().split('T')[0];
  elements.predictionHour.value = now.getHours().toString().padStart(2, '0');
  
  // Set to nearest 5-minute interval
  const minutes = Math.floor(now.getMinutes() / 5) * 5;
  elements.predictionMinute.value = minutes.toString().padStart(2, '0');
}

// Event Listeners
function initializeEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
  elements.saveApiKey.addEventListener('click', saveApiKey);
  elements.loadApiKey.addEventListener('click', loadApiKey);
  elements.predictBtn.addEventListener('click', startPrediction);
  elements.exportBtn.addEventListener('click', exportResult);
  elements.fullscreenBtn.addEventListener('click', toggleFullscreen);

  // Time change listeners
  elements.predictionDate.addEventListener('change', updateInputTimes);
  elements.predictionHour.addEventListener('change', updateInputTimes);
  elements.predictionMinute.addEventListener('change', updateInputTimes);
}

// API Key Management
function toggleApiKeyVisibility() {
  const isPassword = elements.apiKey.type === 'password';
  elements.apiKey.type = isPassword ? 'text' : 'password';
  const icon = elements.toggleApiKey.querySelector('i');
  icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
}

async function saveApiKey() {
  const apiKey = elements.apiKey.value.trim();
  if (!apiKey) {
    showToast('오류', 'API 키를 입력해주세요.', 'error');
    return;
  }
  const success = await ipcRenderer.invoke('set-config-value', 'apiKey', apiKey);
  if (success) {
    showToast('성공', 'API 키가 저장되었습니다.', 'success');
  } else {
    showToast('오류', 'API 키 저장에 실패했습니다.', 'error');
  }
}

async function loadApiKey() {
  const saved = await ipcRenderer.invoke('get-config-value', 'apiKey');
  if (saved) {
    elements.apiKey.value = saved;
    showToast('성공', 'API 키를 불러왔습니다.', 'success');
  } else {
    showToast('알림', '저장된 API 키가 없습니다.', 'warning');
  }
}

async function loadSavedApiKey() {
  const saved = await ipcRenderer.invoke('get-config-value', 'apiKey');
  if (saved) {
    elements.apiKey.value = saved;
  }
}

// Time Calculation
function getSelectedDateTime() {
  const date = elements.predictionDate.value;
  const hour = elements.predictionHour.value;
  const minute = elements.predictionMinute.value;
  return new Date(`${date}T${hour}:${minute}:00`);
}

function calculateInputTimes() {
  const selectedTime = getSelectedDateTime();
  const times = [];
  
  for (let i = 3; i >= 0; i--) {
    const time = new Date(selectedTime.getTime() - (i * 5 * 60 * 1000));
    times.push(time);
  }
  
  return times;
}

function formatTimeForAPI(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}`;
}

function updateInputTimes() {
  const times = calculateInputTimes();
  elements.inputTimesList.innerHTML = '';
  
  times.forEach((time, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${formatTimeForAPI(time)}`;
    elements.inputTimesList.appendChild(li);
  });
}

// Backend Status Check
async function checkBackendStatus() {
  try {
    const result = await ipcRenderer.invoke('get-backend-status');
    if (result.success) {
      elements.backendStatus.classList.add('connected');
      elements.backendStatusText.textContent = '백엔드 연결됨';
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    elements.backendStatus.classList.remove('connected');
    elements.backendStatusText.textContent = '백엔드 연결 실패';
    console.error('Backend status check failed:', error);
  }
}

// Progress Management
function showProgress() {
  elements.progressContainer.classList.add('active');
  elements.predictBtn.disabled = true;
}

function hideProgress() {
  elements.progressContainer.classList.remove('active');
  elements.predictBtn.disabled = false;
}

function updateProgress(step, percent, text) {
  elements.progressText.textContent = text;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressFill.style.width = `${percent}%`;
  
  // Update step indicators
  const steps = elements.progressSteps.children;
  for (let i = 0; i < steps.length; i++) {
    steps[i].classList.remove('active', 'completed');
    if (i < step) {
      steps[i].classList.add('completed');
    } else if (i === step) {
      steps[i].classList.add('active');
    }
  }
}

// API Requests
async function downloadRadarData() {
  const apiKey = elements.apiKey.value.trim();
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다.');
  }

  const times = calculateInputTimes();
  const downloads = times.map(time => downloadSingleFile(time, apiKey));
  
  updateProgress(0, 10, '레이더 데이터 다운로드 중...');
  
  try {
    const results = await Promise.all(downloads);
    updateProgress(0, 40, '데이터 다운로드 완료');
    return results;
  } catch (error) {
    throw new Error(`데이터 다운로드 실패: ${error.message}`);
  }
}

async function downloadSingleFile(time, apiKey) {
  const timeStr = formatTimeForAPI(time);
  const url = `https://apihub.kma.go.kr/api/typ04/url/rdr_cmp_file.php?tm=${timeStr}&data=bin&cmp=hsr&authKey=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    const text = await response.text();
    if (text.includes('error') || text.includes('Error')) {
      throw new Error('API 키가 유효하지 않거나 데이터가 존재하지 않습니다.');
    }
  }
  
  return await response.blob();
}

async function sendPredictionRequest(fileBlobs) {
  updateProgress(1, 50, 'AI 모델 예측 중...');
  
  const formData = new FormData();
  fileBlobs.forEach((blob, index) => {
    formData.append(`file${index + 1}`, blob, `file${index + 1}.bin.gz`);
  });
  
  const response = await fetch('http://localhost:5000/predict', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`백엔드 요청 실패: ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '예측 처리 중 오류가 발생했습니다.');
  }
  
  updateProgress(1, 80, 'AI 예측 완료');
  return result;
}

// Main Prediction Function
async function startPrediction() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    showProgress();
    showLoading('예측을 준비하고 있습니다...');
    
    // Download radar data
    updateProgress(0, 0, '예측 시작...');
    const fileBlobs = await downloadRadarData();
    
    // Send to backend for prediction
    const result = await sendPredictionRequest(fileBlobs);
    
    // Update visualization
    updateProgress(2, 90, '결과 시각화 중...');
    await displayResult(result);
    
    updateProgress(2, 100, '예측 완료!');
    setTimeout(() => {
      hideProgress();
      hideLoading();
    }, 1000);
    
    showToast('성공', '예측이 완료되었습니다!', 'success');
    
  } catch (error) {
    console.error('Prediction error:', error);
    showToast('오류', error.message, 'error');
    hideProgress();
    hideLoading();
  } finally {
    isLoading = false;
  }
}

// Result Display
async function displayResult(result) {
  // Hide placeholder
  elements.placeholderContent.style.display = 'none';
  
  // Show result
  elements.resultContainer.classList.add('active');
  
  // Update image
  elements.predictionImage.src = result.imageData;
  
  // Update statistics
  elements.maxRainfall.textContent = `${result.maxRainfall.toFixed(2)} mm/h`;
  elements.centerRainfall.textContent = `${result.centerRainfall.toFixed(2)} mm/h`;
  elements.avgRainfall.textContent = `${result.predictionStats.mean.toFixed(2)} mm/h`;
  
  const selectedTime = getSelectedDateTime();
  const predictionTime = new Date(selectedTime.getTime() + (10 * 60 * 1000)); // +10분
  elements.predictionTime.textContent = predictionTime.toLocaleString('ko-KR');
  
  // Enable export buttons
  elements.exportBtn.disabled = false;
  elements.fullscreenBtn.disabled = false;
}

// Loading Overlay
function showLoading(text) {
  elements.loadingText.textContent = text;
  elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
  elements.loadingOverlay.classList.remove('active');
}

// Toast Notifications
function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${iconMap[type]}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
}

// Export and Fullscreen
function exportResult() {
  if (!elements.predictionImage.src) return;
  
  const link = document.createElement('a');
  link.download = `radar_prediction_${Date.now()}.png`;
  link.href = elements.predictionImage.src;
  link.click();
  
  showToast('성공', '이미지가 다운로드되었습니다.', 'success');
}

function toggleFullscreen() {
  const img = elements.predictionImage;
  if (!img.src) return;
  
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    img.requestFullscreen().catch(err => {
      showToast('오류', '전체화면 모드를 지원하지 않습니다.', 'error');
    });
  }
}

// Periodic backend status check
setInterval(checkBackendStatus, 30000); // Check every 30 seconds