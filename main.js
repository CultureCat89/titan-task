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
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

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
  x: [],
  y: [],
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
  x: volumeArray.map((x) => x.date),
  y: volumeArray.map((y) => y.value),
  // hovertext: [],
  name: 'Добыто (сутки)',
  mode: 'lines',
  marker: {
    color: '#c401a6',
  },
};

const data = [extractionPlan, extractionPerHour, extractionPerDay];

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

function setPlan(plan) {
  if (!udpatePlanInput.value && plan <= 0) return;
  extractionPlan.y = new Array(25).fill(plan);
  extractionPlan.x = [shortDate(date) + ' 00:00', ...dates(date)];
  const extrPlan = (plan) => `План добычи: ${plan} тыс. м.`;
  extractionPlan.hovertext = new Array(25).fill(extrPlan(plan));
  udpatePlanInput.value = '';
  Plotly.redraw(divPlot, data, layout, config);
}

function setValue(value, date) {
  volumeArray.push({
    date,
    value,
  });

  volumeArray.sort(compareDates);
  const sumArray = buildSumArray(volumeArray);

  extractionPerDay.x = volumeArray.map((x) => x.date);
  extractionPerDay.y = sumArray;
  
  Plotly.redraw(divPlot, data, layout, config);
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

dateButton.addEventListener('click', (e) => {
  e.preventDefault();
  if (!dateInput.value) {
    return;
  }

  // обновление данных
  date = new Date(dateInput.value);
  const newDateRange = [shortDate(date) + ' 00:00', shortDate(date) + ' 23:59'];

  layout.xaxis.range = newDateRange;
  extractionPlan.x = newDateRange;
  extractionPlan.y = [];
  dateText.innerText = `текущий период: ${text(date)}`;

  // сброс значения
  dateInput.value = '';

  // перерисовка графика
  Plotly.redraw(divPlot, data, layout, config);
});

udpatePlanButton.addEventListener('click', (e) => {
  e.preventDefault();
  setPlan(udpatePlanInput.value);
});

clearDataButton.addEventListener('click', (e) => {
  e.preventDefault();

  extractionPlan.x = [];
  extractionPlan.y = [];
  extractionPlan.hovertext = [];
  extractionPerHour.x = [];
  extractionPerHour.y = [];
  extractionPerHour.hovertext = [];

  Plotly.redraw(divPlot, data, layout, config);
});

testCaseButton.addEventListener('click', (e) => {
  e.preventDefault();

  const fakePlan = Math.round(Math.random() * 300);
  setPlan(fakePlan);

  const fakeExtrHour = Array.from(
    new Array(Math.floor(Math.random() * 24)),
    () => Math.round(Math.random() * 20)
  );
  const fakeExtrHourText = fakeExtrHour.map(
    (value) => `Добыто (час): ${value} тыс. м.`
  );

  const count = Math.round(Math.random() * 25);
  for (let key = 0; key < count; key++) {
    const hour = `${Math.floor(Math.random() * 12)}`.padStart(2, '0');
    const min = `${Math.floor(Math.random() * 60)}`.padStart(2, '0');
    const fakeDate = `${shortDate(date)} ${hour}:${min}`;
    const fakeValue = Math.ceil(Math.random() * 4);
    setValue(fakeValue, fakeDate);
  };

  extractionPerHour.x = [...dates(date)];
  extractionPerHour.y = [...fakeExtrHour];
  extractionPerHour.hovertext = [...fakeExtrHourText];

  Plotly.redraw(divPlot, data, layout, config);
});
