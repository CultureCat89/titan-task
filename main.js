const dateInput = document.getElementById('date-input');
const dateButton = document.getElementById('date-btn');
const dateText = document.getElementById('date-text');

const date = new Date();
const text = date.toLocaleDateString(['ru-RU'], {weekday: "long", year: "numeric", month: "long", day: "numeric"});
dateText.innerText = `текущий период: ${text}`;

dateButton.addEventListener('click', (e) => {
  e.preventDefault();
  if (!dateInput.value) {
    return;
  }

  const choseDate = new Date(dateInput.value);
  const updateText = choseDate.toLocaleDateString(['ru-RU'], {weekday: "long", year: "numeric", month: "long", day: "numeric"});
  dateText.innerText = `текущий период: ${updateText}`;

  dateInput.value = '';
});
