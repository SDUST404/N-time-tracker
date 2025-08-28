// Firebase 초기화 및 Firestore 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyB0g3y8kQqllDKK9tJffHrmjRukISA163Q",
  authDomain: "n-timetracker.firebaseapp.com",
  projectId: "n-timetracker",
  storageBucket: "n-timetracker.firebasestorage.app",
  messagingSenderId: "494974569671",
  appId: "1:494974569671:web:e18dd2ba8cc5bcefa402e2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tasksCollection = collection(db, "tasks");

// DOM 요소
const container = document.getElementById("table-container");
const taskListContainer = document.getElementById("task-list-container");
const toggleBtn = document.getElementById("toggle");

// Notion 페이지별 독립 저장
const urlParams = new URLSearchParams(window.location.search);
const pageKey = urlParams.get("id") || location.hash.replace("#", "") || "default_page";

// 시간 설정
const startHour = 6;
const endHour = 24;
const minutes = [0, 10, 20, 30, 40, 50];

let tasks = []; // {id, task, start, end, color}
let table, tbody;

// ----------------------- 기본 테이블 생성 -----------------------
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

// ----------------------- 색상 생성 -----------------------
function hashColor(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},40%,70%)`;
}

// ----------------------- 셀 위치 계산 -----------------------
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

// ----------------------- 테이블에 할 일 렌더링 -----------------------
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

  let currentHour = startPos.hour;
  let currentIndex = startPos.index;

  let remaining = colspan;
  let isFirstCell = true;

  while (remaining > 0) {
    const row = tbody.children[currentHour - startHour];
    if (!row) break;

    const cell = row.children[currentIndex + 1]; // +1 for time column
    if (!cell) break;

    if (isFirstCell) {
      cell.colSpan = Math.min(remaining, totalCols - currentIndex);
      cell.textContent = task;
      cell.title = `${task} (${start}~${end})`;
      cell.style.background = color || hashColor(task);
      cell.style.display = "";
      isFirstCell = false;
    } else {
      cell.style.display = "none";
    }

    remaining--;
    currentIndex++;

    if (currentIndex >= totalCols) {
      currentHour++;
      currentIndex = 0;
    }
  }
}

// ----------------------- Firestore에서 데이터 불러오기 -----------------------
import { query, where } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadTasks() {
  try {
    const q = query(tasksCollection, where("pageKey", "==", pageKey));
    const querySnapshot = await getDocs(q);
    tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    saveAndRender();
  } catch (error) {
    console.error("Firebase 데이터 불러오기 실패:", error);
    tasks = [];
    saveAndRender();
  }
}
// ----------------------- Firestore에 데이터 저장 -----------------------
async function saveTasks() {
  // 기존 구현은 ID 없이 덮어쓰기였지만, 새 추가는 addDoc 사용 -> 별도 구현 필요 없음
}

// ----------------------- 테이블 렌더링 및 할 일 목록 -----------------------
function saveAndRender() {
  tbody.querySelectorAll("td").forEach(td => {
    td.textContent = "";
    td.style.background = "white";
    td.style.display = "";
    td.colSpan = 1;
    td.title = "";
  });

  tasks.forEach(renderTask);
  renderTaskList();
}

function renderTaskList() {
  taskListContainer.innerHTML = "";

  tasks.forEach((t) => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = `${t.task} (${t.start}~${t.end})`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.onclick = async () => {
      try {
        await deleteDoc(doc(tasksCollection, t.id)); // ID로 정확하게 삭제
        tasks = tasks.filter(task => task.id !== t.id);
        saveAndRender();
      } catch (error) {
        console.error("삭제 실패:", error);
      }
    };

    div.appendChild(span);
    div.appendChild(deleteBtn);
    taskListContainer.appendChild(div);
  });
}

// ----------------------- 버튼 이벤트 -----------------------
toggleBtn.addEventListener("click", () => {
  taskListContainer.style.display = taskListContainer.style.display === "none" ? "block" : "none";
});

document.getElementById("add").addEventListener("click", async () => {
  const task = document.getElementById("task").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const color = document.getElementById("color").value;

  if (task === "" || start === "" || end === "") {
    alert("할일 입력");
    return;
  }

  try {
    const newTaskObj = { task, start, end, color, pageKey };
    const docRef = await addDoc(tasksCollection, newTaskObj);
    tasks.push({ id: docRef.id, ...newTaskObj }); // Firestore ID 포함
    saveAndRender();
    document.getElementById("task").value = "";
  } catch (error) {
    console.error("추가 실패:", error);
  }
});

// ----------------------- 초기화 -----------------------
// 페이지 로드 시 테이블 먼저 생성
initTable();

// Firestore 데이터 로드
loadTasks();
