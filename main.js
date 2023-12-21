const divPlot = document.getElementById('extraction');

const dateInput = document.getElementById('date-input');
const dateButton = document.getElementById('date-btn');
const dateText = document.getElementById('date-text');

const udpatePlanInput = document.getElementById('update-plan-input');
const udpatePlanButton = document.getElementById('update-plan-btn');

const udpateVolumeTime = document.getElementById('update-volume-time');
const udpateVolumeNumber = document.getElementById('update-volume-number');
const udpateVolumeButton = document.getElementById('update-volume-btn');

const clearDataButton = document.getElementById('clear-data');
const testCaseButton = document.getElementById('test-case');

let date = new Date();

const shortDate = (date) =>
  `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;

let minDate = new Date(shortDate(date) + ' 00:00').valueOf();
let maxDate = minDate + 86340000;


const text = (date) =>
  date.toLocaleDateString(['ru-RU'], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const dates = (date) =>
  Array.from(
    new Array(24),
    (_, i) => `${shortDate(date)} ${`${i}`.padStart(2, '0')}:59`
  );

dateText.innerText = `текущий период: ${text(date)}`;

const volumeArray = [];
let volumePerHourObj = {};


// *** Plotly ***

// план добычи
const extractionPlan = {
  x: [],
  y: [],
  hovertext: [],
  name: 'план добычи',
  type: 'area',
  fill: 'tonexty',
  mode: 'lines',
  line: {
    color: '#4fa8fc',
  },
  hoverinfo: 'text',
};

// добыча (час)
const extractionPerHour = {
  x: dates(date),
  y: new Array(24).fill(null),
  hovertext: [],
  name: 'Добыто (час)',
  type: 'bar',
  marker: {
    color: '#8eed84',
  },
  hoverinfo: 'x+text',
};

// добыча (сутки)
const extractionPerDay = {
  x: [],
  y: [],
  hovertext: [],
  name: 'Добыто (сутки)',
  mode: 'lines',
  marker: {
    color: '#c401a6',
  },
  hoverinfo: 'x+text'
};

// прогноз добычи
const extractionForecast = {
  x: [],
  y: [],
  // hovertext: [],
  name: 'Прогноз добычи',
  mode: 'lines',
  marker: {
    color: '#ffa426',
  },
  line: {
    dash: 'dot',
    width: 4
  },
  hoverinfo: 'x+text'
};

const data = [extractionPlan, extractionPerHour, extractionPerDay, extractionForecast];

const layout = {
  // название графика
  title: 'Скважина 1-1',

  // настройки по оси x
  xaxis: {
    type: 'date',
    range: [shortDate(date) + ' 00:00', shortDate(date) + ' 23:59'],
    ticks: 'outside',
    nticks: 12,
    showticklabels: true,
    automargin: true,
  },

  // настройки по оси y
  yaxis: {
    fixedrange: true,
    title: 'Дебит',
    ticksuffix: ' тыс. м.   ',
    zeroline: false,
    rangemode: 'tozero',
  },

  showlegend: true,

  margin: {
    l: 120,
  },

  legend: {
    orientation: 'h',
    traceorder: 'normal',
    yanchor: 'top',
    xanchor: 'center',
    x: 0.5,
    y: -0.2,
  },

  automargin: true,
  hovermode: 'x',
  height: 400,
};

const config = {
  responsive: true,
  showEditInChartStudio: true,
  plotlyServerURL: 'https://chart-studio.plotly.com',
  locale: 'ru',
};

Plotly.newPlot(divPlot, data, layout, config);


// функции и события по клику кнопок

function setPlan(plan) {
  if (!udpatePlanInput.value && plan <= 0) return;

  extractionPlan.y = new Array(25).fill(plan);
  extractionPlan.x = [shortDate(date) + ' 00:00', ...dates(date)];

  const extrPlan = (plan) => `План добычи: ${plan} тыс. м.`;
  extractionPlan.hovertext = new Array(25).fill(extrPlan(plan));
  udpatePlanInput.value = '';
  Plotly.redraw(divPlot);
}

function setValue(value, date) {
  if (date < minDate || date > maxDate) {
    console.log('Ошибка! Значение выходит за пределы установленной даты');
    return;
  }
  
  date = new Date(date);
  let setDate = shortDate(date);
  setDate += ` ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;

  volumeArray.push({
    date: setDate,
    value,
    perHour: setDate.slice(0,14) + '59'
  });

  volumeArray.sort(compareDates);
  volumePerHourObj = sumPerHourObj(volumeArray);

  const sumPerHourArray = Object.values(volumePerHourObj);

  extractionPerHour.y = sumPerHourArray;
  extractionPerHour.hovertext = sumPerHourArray.map(
    (value) => `Добыто (час): ${value} тыс. м.`
  );
  
  const volumePerDayArray = volumeArray.map((x) => x.date);
  extractionPerDay.x = volumePerDayArray;

  const sumArray = buildSumArray(volumeArray);
  extractionPerDay.y = sumArray;
  extractionPerDay.hovertext = sumArray.map((value) => `Добыто (сутки): ${value} тыс. м.`)

  const lastTickPerDay = {
    date: volumePerDayArray[volumePerDayArray.length - 1],
    value: sumArray[sumArray.length - 1]
  }
  
  extractionForecast.x = [], extractionForecast.y = [], extractionForecast.hovertext = []

  const volumeForecast = updateForecast(lastTickPerDay, volumePerHourObj);
  extractionForecast.x = volumeForecast.map((x) => x.date);

  const volumeForecastValues = volumeForecast.map((y) => y.value);
  const forecastTotal = volumeForecastValues[volumeForecastValues.length - 1];
  extractionForecast.y = volumeForecastValues;
  extractionForecast.hovertext = volumeForecast.map((y) => `Прогноз добычи: ${y.value} тыс. м.`);
  extractionForecast.marker.color = forecastTotal > extractionPlan.y[0] ? 'green' : '#ffa426';

  Plotly.redraw(divPlot);
}

function compareDates(a, b) {
  const dateA = new Date(a.date);
  const dateB = new Date(b.date);

  return dateA - dateB;
}

function buildSumArray(inputArray) {
  let sumArray = [];
  let sum = 0;

  for (let i = 0; i < inputArray.length; i++) {
    sum += inputArray[i].value;
    sumArray.push(sum);
  }

  return sumArray;
}

function sumValuesByDate(inputArray) {
  const resultArray = [];

  // Создаем объект для хранения сумм по датам
  const sumsByDate = {};

  // Итерируем по исходному массиву
  inputArray.forEach(item => {
    const date = item.perHour;
    const value = item.value;

    // Если сумма для данной даты уже есть, добавляем значение к существующей сумме
    if (sumsByDate[date]) {
      sumsByDate[date] += value;
    } else {
      // Если суммы для даты нет, создаем новую запись
      sumsByDate[date] = value;
    }
  });

  // Преобразуем объект с суммами в массив
  for (const date in sumsByDate) {
    if (sumsByDate.hasOwnProperty(date)) {
      resultArray.push({
        date: date,
        sum: sumsByDate[date]
      });
    }
  }

  return resultArray;
}

function sumPerHourObj(inputArray) {
  const resArr = {};
  dates(date).forEach(value => {
    resArr[value] = null;
  });
  const tempArr = sumValuesByDate(inputArray);
  tempArr.forEach(value => {
    resArr[value.date] = value.sum;
  });

  return resArr;
}

function updateForecast(lastValue, volumePerHour) {
  const index = +lastValue.date.slice(11, 13);
  if (+lastValue.date.slice(11) === '23:59') return;
  
  const value = Object.values(volumePerHour)[index];

  const dateArr = Object.keys(volumePerHour).slice(index);

  const forecastArr = [{ date: lastValue.date, value: lastValue.value }];
  let forecast = lastValue.value
  for (let key = 0; key < dateArr.length; key++) {
    const tick = {
      date: dateArr[key], 
      value: forecast
    };
    forecastArr.push(tick);
    forecast += value;
  }
  return forecastArr;
}

function clearData() {
  extractionPlan.x = [];
  extractionPlan.y = [];
  extractionPlan.hovertext = [];

  extractionPerHour.x = dates(date);
  extractionPerHour.y = [];
  extractionPerHour.hovertext = [];

  extractionPerDay.x = [];
  extractionPerDay.y = [];
  extractionPerDay.hovertext = [];

  extractionForecast.x = [];
  extractionForecast.y = [];
  extractionForecast.hovertext = [];
  extractionForecast.marker.color = '#ffa426';

  volumeArray.length = 0;
  volumePerHourObj = {}
}

dateButton.addEventListener('click', (e) => {
  e.preventDefault();
  if (!dateInput.value) {
    return;
  }

  // обновление данных
  date = new Date(dateInput.value);
  minDate = new Date(shortDate(date) + ' 00:00').valueOf();
  maxDate = minDate + 86340000;

  const newDateRange = [shortDate(date) + ' 00:00', shortDate(date) + ' 23:59'];

  layout.xaxis.range = newDateRange;
  extractionPlan.x = newDateRange;
  extractionPlan.y = [];

  extractionPerHour.x = dates(date);
  extractionPerHour.y = []

  dateText.innerText = `текущий период: ${text(date)}`;

  // сброс значения
  dateInput.value = '';

  // перерисовка графика
  Plotly.redraw(divPlot);
});

udpatePlanButton.addEventListener('click', (e) => {
  e.preventDefault();
  setPlan(udpatePlanInput.value);
});

clearDataButton.addEventListener('click', (e) => {
  e.preventDefault();

  clearData();

  Plotly.redraw(divPlot);
});

testCaseButton.addEventListener('click', (e) => {
  e.preventDefault();
  clearData();

  const fakePlan = Math.round(Math.random() * 300);
  setPlan(fakePlan);

  const count = Math.round(Math.random() * (fakePlan * 0.4));
  for (let key = 0; key < count; key++) {
    const hour = `${Math.floor(Math.random() * 12)}`.padStart(2, '0');
    const min = `${Math.floor(Math.random() * 60)}`.padStart(2, '0');
    const fakeDate = `${shortDate(date)} ${hour}:${min}`;
    const fakeValue = Math.ceil(Math.random() * 4);
    setValue(fakeValue, fakeDate);
  }


  Plotly.redraw(divPlot);
});

udpateVolumeButton.addEventListener('click', (e) => {
  e.preventDefault();

  if (!udpateVolumeNumber.value || !udpateVolumeTime.value) return;
  const fullDate = `${shortDate(date)} ${udpateVolumeTime.value}`;
  const value = +udpateVolumeNumber.value;
  setValue(value, fullDate);
  udpateVolumeNumber.value = '';
  udpateVolumeTime.value = '';

  Plotly.redraw(divPlot);
});
