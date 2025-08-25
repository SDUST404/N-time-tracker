const container = document.getElementById("table-container");

// 시간 범위
const startHour = 6;
const endHour = 24;
const minutes = Array.from({ length: 6 }, (_, i) => i * 10); // 0,10,20,30,40,50

// 표 생성
function createTable() {
  const table = document.createElement("table");

  // 헤더
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  headerRow.appendChild(corner);
  minutes.forEach(m => {
    const th = document.createElement("th");
    th.className = "minute-col";
    th.textContent = m.toString().padStart(2, "0");
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 바디
  const tbody = document.createElement("tbody");
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

  container.innerHTML = ""; // 초기화
  container.appendChild(table);
  return tbody;
}

const tbody = createTable();

// 색상 함수
function hashColor(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 70%)`;
}

// 일정 반영 함수
function renderTask(task, sh, sm, eh, em) {
  const cells = Array.from(tbody.querySelectorAll("td"));
  const startIndex = (sh - startHour) * 6 + Math.floor(sm / 10);
  const endIndex = (eh - startHour) * 6 + Math.floor(em / 10);

  for (let i = startIndex; i < endIndex; i++) {
    const cell = cells[i];
    if (cell) {
      cell.textContent = task;
      cell.style.background = hashColor(task);
    }
  }
}

// 추가 버튼
document.getElementById("add").addEventListener("click", () => {
  const task = document.getElementById("task").value.trim();
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!task || !start || !end) {
    alert("모든 항목을 입력하세요.");
    return;
  }

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  renderTask(task, sh, sm, eh, em);

  // 저장
  const data = JSON.parse(localStorage.getItem("tasks") || "[]");
  data.push({ task, start, end });
  localStorage.setItem("tasks", JSON.stringify(data));
});

// 로드 시 기존 일정 표시
window.addEventListener("load", () => {
  const data = JSON.parse(localStorage.getItem("tasks") || "[]");
  data.forEach(({ task, start, end }) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    renderTask(task, sh, sm, eh, em);
  });
});
