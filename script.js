// Firebase SDK import
import {
  getFirestore, collection, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

const db = getFirestore(getApp());

// DOM 요소 가져오기
const container = document.getElementById("table-container");
const taskListContainer = document.getElementById("task-list-container");
const toggleBtn = document.getElementById("toggle");

// Notion 페이지별 독립 저장 키
const urlParams = new URLSearchParams(window.location.search);
const pageKey = urlParams.get("id") || location.hash.replace("#", "") || "default_page";

const startHour = 6;
const endHour = 24;
const minutes = [0, 10, 20, 30, 40, 50];

let tasks = []; // Firestore에서 불러올 데이터
let table, tbody;

// ======================= 테이블 초기화 =======================
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

// ======================= 색상 생성 =======================
function hashColor(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},40%,70%)`;
}

// ======================= 셀 위치 계산 =======================
function findCellPos(totalMin, isEnd = false) {
  let hour = Math.floor(totalMin / 60);
  let minute = totalMin % 60;
  let index = minutes.findIndex(m => m >= minute);

  if (index === -1) {
    hour += 1;
    index = 0;
  }

  if (isEnd) {
    if (minute % 10 !== 0) {
      index++;
      if (index >= minutes.length) {
        hour += 1;
        index = 0;
      }
    }
  }

  return { hour, index };
}

// ======================= 할 일 렌더링 =======================
function renderTask(taskObj) {
  const { task, start, end, color } = taskObj;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;

  const startPos = findCellPos(startTotal, false);
  const endPos = findCellPos(endTotal, true);

  const totalCols = minutes.length;
  const colspan = (endPos.hour - startPos.hour) * totalCols + (endPos.index - startPos.index);
  if (colspan <= 0) return;

  const row = tbody.children[startPos.hour - startHour];
  if (!row) return;

  const cell = row.children[startPos.index + 1];
  if (!cell) return;

  cell.colSpan = colspan;
  cell.textContent = task;
  cell.title = `${task} (${start}~${end})`;
  cell.style.background = color || hashColor(task);
  cell.style.display = "";

  // 병합된 셀 숨기기
  for (let i = 1; i < colspan; i++) {
    const idx = startPos.index + i;
    const hr = startPos.hour + Math.floor(idx / totalCols);
    const mi = idx % totalCols;

    const r = tbody.children[hr - startHour];
    if (!r) continue;
    const td = r.children[mi + 1];
    if (td) td.style.display = "none";
  }
}

// ======================= 저장 & 렌더링 =======================
async function saveAndRender() {
  // 테이블 초기화
  tbody.querySelectorAll("td").forEach(td => {
    td.textContent = "";
    td.style.background = "white";
    td.style.display = "";
    td.colSpan = 1;
    td.title = "";
  });

  tasks.forEach(renderTask);

  // Firestore에 저장
  await setDoc(doc(collection(db, "timeTracker"), pageKey), { tasks });

  renderTaskList();
}

// ======================= 할 일 목록 표시 =======================
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

// ======================= Firestore에서 불러오기 =======================
async function loadTasks() {
  const ref = doc(collection(db, "timeTracker"), pageKey);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    tasks = snap.data().tasks || [];
  } else {
    tasks = [];
  }
  saveAndRender();
}

// ======================= 이벤트 바인딩 =======================
toggleBtn.addEventListener("click", () => {
  taskListContainer.style.display =
    taskListContainer.style.display === "none" ? "block" : "none";
});

document.getElementById("add").addEventListener("click", () => {
  const task = document.getElementById("task").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const color = document.getElementById("color").value;

  if (task === "" || start === "" || end === "") {
    alert("할일 입력");
    return;
  }

  tasks.push({ task, start, end, color });
  saveAndRender();
  document.getElementById("task").value = "";
});

// ======================= 실행 =======================
initTable();   // 표 생성
loadTasks();   // Firestore에서 기존 기록 불러오기
