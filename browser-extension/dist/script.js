const fetchBtn = document.querySelector('.fetch-btn');
const loadingDiv = document.querySelector('.loading');
const errorDiv = document.querySelector('.errors');
const resultDiv = document.querySelector('.result');
const factText = document.querySelector('.fact');

function resetState() {
  loadingDiv.style.display = 'none';
  errorDiv.style.display = 'none';
  resultDiv.style.display = 'none';
  errorDiv.textContent = '';
}

async function fetchCatFact() {
  resetState();
  loadingDiv.style.display = 'block';

  try {
    const response = await fetch('https://catfact.ninja/fact');

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();

    factText.textContent = data.fact;

    loadingDiv.style.display = 'none';
    resultDiv.style.display = 'block';
  } catch (error) {
    loadingDiv.style.display = 'none';
    errorDiv.style.display = 'block';
    errorDiv.textContent =
      "Sorry, we couldn't fetch a cat fact. Please try again.";
  }
}

fetchBtn.addEventListener('click', fetchCatFact);
