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

  let cells = [];

  for (let t = startTotal; t < endTotal; t += 10) {
    let hour = Math.floor(t / 60);
    let minute = t % 60;

    // 60분 처리 → 다음 시간 0분
    if (minute === 60) {
      hour += 1;
      minute = 0;
    }

    // 가장 가까운 10분 단위로 올림
    const roundedMinute = minutes.find(m => minute <= m);
    if (roundedMinute === undefined || roundedMinute > 60) continue;

    // minute == 60 이면 다음 시간의 0분 셀
    let targetHour = hour;
    let targetMinute = roundedMinute;
    if (roundedMinute === 60) {
      targetHour += 1;
      targetMinute = 10;
    }

    const cell = tbody.querySelector(`td[data-hour="${targetHour}"][data-minute="${targetMinute}"]`);
    if (cell) cells.push(cell);
  }

  if (cells.length === 0) return;

  const firstCell = cells[0];
  const colspan = cells.length;

  // 병합 셀 세팅
  firstCell.colSpan = colspan;
  firstCell.textContent = task;
  firstCell.title = `${task} (${start}~${end})`;
  firstCell.style.background = color || hashColor(task);
  firstCell.style.display = "";

  // 나머지 셀 숨기기
  for (let i = 1; i < cells.length; i++) {
    cells[i].style.display = "none";
  }
}

// 테이블 초기화 후 전체 렌더
function saveAndRender() {
  tbody.querySelectorAll("td").forEach(td => {
    td.textContent = "";
    td.style.background = "white";
    td.style.display = "";
    td.colSpan = 1;
    td.title = "";
  });

  tasks.forEach(renderTask);
  localStorage.setItem(pageKey, JSON.stringify(tasks));
  renderTaskList();
}

// 일정 리스트 렌더링
function renderTaskList() {
  taskListContainer.innerHTML = "";
  tasks.forEach((t, i) => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = `${t.task} (${t.start}~${t.end})`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.onclick = () => {
      const newTask = prompt("할 일 수정:", t.task);
      if (newTask === null) return;
      const newStart = prompt("시작 시간 수정:", t.start);
      const newEnd = prompt("종료 시간 수정:", t.end);
      const newColor = prompt("색상 코드 입력:", t.color || "#88c0d0");
      if (newTask && newStart && newEnd) {
        t.task = newTask;
        t.start = newStart;
        t.end = newEnd;
        t.color = newColor || t.color;
        saveAndRender();
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.onclick = () => {
      tasks.splice(i, 1);
      saveAndRender();
    };

    div.appendChild(span);
    div.appendChild(editBtn);
    div.appendChild(deleteBtn);
    taskListContainer.appendChild(div);
  });
}

// 토글 버튼
toggleBtn.addEventListener("click", () => {
  taskListContainer.style.display = taskListContainer.style.display === "none" ? "block" : "none";
});

// 추가 버튼
document.getElementById("add").addEventListener("click", () => {
  const task = document.getElementById("task").value.trim();
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const color = document.getElementById("color").value;

  if (!task || !start || !end) {
    alert("모든 항목 입력!");
    return;
  }

  tasks.push({ task, start, end, color });
  saveAndRender();
  document.getElementById("task").value = "";
});

// 초기 테이블 생성
initTable();
tasks.forEach(renderTask);
renderTaskList();
