const container = document.getElementById("table-container");
const taskListContainer = document.getElementById("task-list-container");
const toggleBtn = document.getElementById("toggle");

const urlParams = new URLSearchParams(window.location.search);
const pageKey = urlParams.get("id") || location.hash.replace("#", "") || "default_page";

const startHour = 6;
const endHour = 24;
const minutes = [10, 20, 30, 40, 50, 60];

let tasks = JSON.parse(localStorage.getItem(pageKey) || "[]");

let table, tbody;

// 테이블 초기 생성
function initTable() {
  table = document.createElement("table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const corner = document.createElement("th");
  corner.style.background = "#ddd";
  headerRow.appendChild(corner);

  minutes.forEach(m => {
    const th = document.createElement("th");
    th.className = "minute-col";
    th.textContent = m.toString().padStart(2, "0");
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  tbody = document.createElement("tbody");
  for (let h = startHour; h < endHour; h++) {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.className = "time-col";
    th.textContent = `${h}:00`;
    row.appendChild(th);

    minutes.forEach(m => {
      const td = document.createElement("td");
      td.dataset.hour = h;
      td.dataset.minute = m;
      row.appendChild(td);
    });

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.innerHTML = "";
  container.appendChild(table);
}

// 해시 기반 색상
function hashColor(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 70%)`;
}

// 셀 병합된 할 일 렌더링
function renderTask(taskObj) {
  const { task, start, end, color } = taskObj;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;

  let firstCell = null;
  let colspan = 0;

  for (let t = startTotal; t < endTotal; t += 10) {
    let hour = Math.floor(t / 60);
    let minute = t % 60;

    // 60분은 다음 시간의 0분으로 처리
    if (minute === 60) {
      hour += 1;
      minute = 0;
    }

    const roundedMinute = minutes.find(m => minute <= m);
    if (roundedMinute === undefined) continue;

    const cell = tbody.querySelector(`td[data-hour="${hour}"][data-minute="${roundedMinute}"]`);
    if (!cell) continue;

    if (!firstCell) {
      firstCell = cell;
      colspan = 1;
    } else {
      cell.style.display = "none";
      colspan++;
    }
  }

  if (firstCell) {
    firstCell.colSpan = col
