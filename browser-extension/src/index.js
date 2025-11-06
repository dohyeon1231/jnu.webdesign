// form fields
const form = document.querySelector('.form-data');
const region = document.querySelector('.region-name');
const apiKey = document.querySelector('.api-key');

// results
const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const results = document.querySelector('.result-container');
const usage = document.querySelector('.carbon-usage');
const fossilfuel = document.querySelector('.fossil-fuel');
const myregion = document.querySelector('.my-region');
const clearBtn = document.querySelector('.clear-btn');

// 이벤트 리스너
form.addEventListener('submit', (e) => handleSubmit(e));
clearBtn.addEventListener('click', (e) => reset(e));

init();

function handleSubmit(e) {
  e.preventDefault();
  setUpUser(apiKey.value, region.value);
}

function setUpUser(apiKeyValue, regionName) {
  localStorage.setItem('apiKey', apiKeyValue);
  localStorage.setItem('regionName', regionName);
  loading.style.display = 'block';
  errors.textContent = '';
  clearBtn.style.display = 'block';

  displayCarbonUsage(apiKeyValue, regionName);
}

function reset(e) {
  e.preventDefault();
  localStorage.removeItem('regionName');
  localStorage.removeItem('apiKey');
  init();
}

function init() {
  const storedApiKey = localStorage.getItem('apiKey');
  const storedRegion = localStorage.getItem('regionName');

  if (storedApiKey === null || storedRegion === null) {
    form.style.display = 'block';
    results.style.display = 'none';
    loading.style.display = 'none';
    clearBtn.style.display = 'none';
    errors.textContent = '';
  } else {
    displayCarbonUsage(storedApiKey, storedRegion);
    results.style.display = 'block';
    form.style.display = 'none';
    clearBtn.style.display = 'block';
  }
}

// 실제 데이터 로드 함수 (임시 mock)
function displayCarbonUsage(apiKey, regionName) {
  loading.style.display = 'none';
  results.style.display = 'block';
  myregion.textContent = regionName;
  usage.textContent = "123.45 kWh";
  fossilfuel.textContent = "45%";
}
