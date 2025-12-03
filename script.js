const boxes = {
  bubble: document.getElementById('array_bubble'),
  selection: document.getElementById('array_selection'),
  insertion: document.getElementById('array_insertion'),
  merge: document.getElementById('array_merge')
};

const logs = {
  bubble: document.getElementById('log_bubble'),
  selection: document.getElementById('log_selection'),
  insertion: document.getElementById('log_insertion'),
  merge: document.getElementById('log_merge')
};

const statuses = {
  bubble: document.getElementById('status_bubble'),
  selection: document.getElementById('status_selection'),
  insertion: document.getElementById('status_insertion'),
  merge: document.getElementById('status_merge')
};

/* State */
let stats = {
  bubble: {comparisons:0, swaps:0, time:0},
  selection: {comparisons:0, swaps:0, time:0},
  insertion: {comparisons:0, swaps:0, time:0},
  merge: {comparisons:0, swaps:0, time:0}
};

let base = [];
let isPaused = false;
let isStepMode = false;
let shouldContinue = false;
let currentSpeed = 80;
let isRunning = false;

/* Array generation and stats reset */
function generateArray() {
  const size = parseInt(document.getElementById('arraySize').value);
  base = Array.from({length:size}, () => Math.floor(Math.random()*100)+10);
  resetStats();
  renderAll();
}

function resetStats() {
  stats = {
    bubble: {comparisons:0, swaps:0, time:0},
    selection: {comparisons:0, swaps:0, time:0},
    insertion: {comparisons:0, swaps:0, time:0},
    merge: {comparisons:0, swaps:0, time:0}
  };
  Object.keys(logs).forEach(k => logs[k].innerHTML = '');
  Object.keys(statuses).forEach(k => {
    statuses[k].innerHTML = '';
    statuses[k].className = 'status';
  });
  updateAllStats();
}

function updateAllStats() {
  Object.keys(stats).forEach(type => {
    document.getElementById(`comp_${type}`).textContent = stats[type].comparisons;
    document.getElementById(`swap_${type}`).textContent = stats[type].swaps;
    document.getElementById(`time_${type}`).textContent = stats[type].time + 'ms';
  });
}

/* Rendering functions */
function renderAll() {
  ['bubble','selection','insertion','merge'].forEach(type => renderArray(base, boxes[type], []));
}

function renderArray(a, container, highlight=[], sorted=[]) {
  container.innerHTML = '';
  a.forEach((v,i)=>{
    const bar = document.createElement('div');
    bar.className='bar';
    bar.style.height=v*2+'px';
    if (sorted.includes(i)) bar.classList.add('sorted');
    else if (highlight.includes(i) && highlight.length === 2 && highlight[0] !== highlight[1]) bar.classList.add('swapping');
    else if (highlight.includes(i)) bar.classList.add('comparing');
    container.appendChild(bar);
  });
}

/* Logging and status */
function logOperation(type, text) {
  const row = document.createElement('tr');
  row.innerHTML = text;
  logs[type].insertBefore(row, logs[type].firstChild);
  while (logs[type].children.length > 10) logs[type].removeChild(logs[type].lastChild);
}

function setStatus(type, status) {
  if (status === 'running') {
    statuses[type].textContent = 'Running...';
    statuses[type].className = 'status running';
  } else if (status === 'complete') {
    statuses[type].textContent = 'Complete!';
    statuses[type].className = 'status complete';
  } else {
    statuses[type].textContent = '';
    statuses[type].className = 'status';
  }
}

/* Utilities */
function clone() { return [...base]; }

async function sleep(ms) {
  const actualMs = ms || currentSpeed;
  if (isStepMode) {
    shouldContinue = false;
    while (!shouldContinue && isStepMode) await new Promise(res => setTimeout(res,50));
    return;
  }
  while (isPaused) await new Promise(res => setTimeout(res,50));
  return new Promise(res => setTimeout(res, actualMs));
}

/* Sorting algorithm functions */
async function sortAll() {
  if (isRunning) return;
  isRunning = true;
  isPaused = false;
  resetStats();
  document.getElementById('run').disabled = true;
  document.getElementById('generate').disabled = true;

  await Promise.all([
    runBubble(clone()),
    runSelection(clone()),
    runInsertion(clone()),
    runMerge(clone())
  ]);

  document.getElementById('run').disabled = false;
  document.getElementById('generate').disabled = false;
  isRunning = false;
}

// --- Bubble Sort ---
async function runBubble(a) {
  const type='bubble';
  const c = boxes[type];
  const startTime = Date.now();
  setStatus(type,'running');

  for (let i=0;i<a.length;i++) {
    for (let j=0;j<a.length-i-1;j++) {
      stats[type].comparisons++;
      updateAllStats();
      renderArray(a,c,[j,j+1],Array.from({length:i},(_,k)=>a.length-1-k));
      await sleep();
      if (a[j] > a[j+1]) {
        stats[type].swaps++;
        logOperation(type, `<td>${stats[type].swaps}</td><td>${j}</td><td>${j+1}</td>`);
        [a[j],a[j+1]]=[a[j+1],a[j]];
      }
    }
  }

  renderArray(a,c,[],Array.from({length:a.length},(_,i)=>i));
  stats[type].time = Date.now() - startTime;
  updateAllStats();
  setStatus(type,'complete');
}

// --- Selection Sort ---
async function runSelection(a) {
  const type='selection';
  const c = boxes[type];
  const startTime = Date.now();
  setStatus(type,'running');
  const sorted=[];

  for(let i=0;i<a.length;i++){
    let min=i;
    for(let j=i+1;j<a.length;j++){
      stats[type].comparisons++;
      updateAllStats();
      renderArray(a,c,[min,j],sorted);
      await sleep();
      if(a[j]<a[min]) min=j;
    }
    if(min!==i){
      stats[type].swaps++;
      logOperation(type, `<td>${stats[type].swaps}</td><td>${i}</td><td>${min}</td>`);
      [a[i],a[min]]=[a[min],a[i]];
    }
    sorted.push(i);
  }

  renderArray(a,c,[],sorted);
  stats[type].time = Date.now() - startTime;
  updateAllStats();
  setStatus(type,'complete');
}

// --- Insertion Sort ---
async function runInsertion(a) {
  const type='insertion';
  const c = boxes[type];
  const startTime = Date.now();
  setStatus(type,'running');
  const sorted=[0];

  for(let i=1;i<a.length;i++){
    let key=a[i];
    let j=i-1;
    while(j>=0 && a[j]>key){
      stats[type].comparisons++;
      stats[type].swaps++;
      updateAllStats();
      renderArray(a,c,[j,j+1],sorted);
      await sleep();
      logOperation(type, `<td>${stats[type].swaps}</td><td>${j}</td><td>${j+1}</td>`);
      a[j+1]=a[j];
      j--;
    }
    if(j>=0) stats[type].comparisons++;
    a[j+1]=key;
    sorted.push(i);
  }

  renderArray(a,c,[],sorted);
  stats[type].time = Date.now() - startTime;
  updateAllStats();
  setStatus(type,'complete');
}

// --- Merge Sort ---
async function runMerge(a){
  const type='merge';
  const c = boxes[type];
  const startTime = Date.now();
  setStatus(type,'running');

  async function merge(arr,l,m,r){
    const n1 = m-l+1, n2=r-m;
    const L=arr.slice(l,m+1), R=arr.slice(m+1,r+1);
    let i=0,j=0,k=l;

    while(i<n1 && j<n2){
      stats[type].comparisons++;
      updateAllStats();
      renderArray(arr,c,[k],[]);
      await sleep();
      if(L[i]<=R[j]) arr[k]=L[i++];
      else arr[k]=R[j++];
      stats[type].swaps++;
      logOperation(type, `<td>${stats[type].swaps}</td><td>Merge pos ${k}</td>`);
      k++;
    }
    while(i<n1){ arr[k++]=L[i++]; stats[type].swaps++; }
    while(j<n2){ arr[k++]=R[j++]; stats[type].swaps++; }
  }

  async function mergeSort(arr,l,r){
    if(l<r){
      const m=Math.floor((l+r)/2);
      await mergeSort(arr,l,m);
      await mergeSort(arr,m+1,r);
      await merge(arr,l,m,r);
    }
  }

  await mergeSort(a,0,a.length-1);
  renderArray(a,c,[],Array.from({length:a.length},(_,i)=>i));
  stats[type].time = Date.now() - startTime;
  updateAllStats();
  setStatus(type,'complete');
}

document.getElementById('generate').onclick=generateArray;
document.getElementById('run').onclick=sortAll;
document.getElementById('pause').onclick=()=>{isPaused=true;};
document.getElementById('resume').onclick=()=>{isPaused=false;};
document.getElementById('reset').onclick=()=>{location.reload();};
document.getElementById('speed').oninput=(e)=>{currentSpeed=parseInt(e.target.value); document.getElementById('speedVal').textContent=currentSpeed+'ms';};
document.getElementById('stepMode').onchange=(e)=>{isStepMode=e.target.checked; document.getElementById('nextStep').disabled=!isStepMode;};
document.getElementById('nextStep').onclick=()=>{shouldContinue=true;};
document.getElementById('arraySize').onchange=generateArray;

generateArray();