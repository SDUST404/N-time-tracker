const container = document.getElementById("table-container");
const taskListContainer = document.getElementById("task-list-container");
const toggleBtn = document.getElementById("toggle");

// Notion 페이지별 독립 저장 (id 파라미터 기준)
const urlParams = new URLSearchParams(window.location.search);
const pageKey = urlParams.get("id") || location.hash.replace("#", "") || "default_page";

const startHour = 6;
const endHour = 24;
const minutes = [0,10,20,30,40,50];  // 0분 포함

let tasks = JSON.parse(localStorage.getItem(pageKey)||"[]");

let table, tbody;

// table 초기 생성 (한 번만)
function initTable(){
  table = document.createElement("table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const corner = document.createElement("th");
  corner.style.background="#ddd";
  headerRow.appendChild(corner);

  minutes.forEach(m=>{
    const th = document.createElement("th");
    th.className="minute-col";
    th.textContent=m.toString().padStart(2,"0");
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  tbody = document.createElement("tbody");
  for(let h=startHour; h<endHour; h++){
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.className="time-col";
    th.textContent = `${h}:00`;
    row.appendChild(th);

    minutes.forEach(m=>{
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

function hashColor(text){
  let hash = 0;
  for(let i=0;i<text.length;i++){
    hash = text.charCodeAt(i)+((hash<<5)-hash);
  }
  const hue = Math.abs(hash)%360;
  return `hsl(${hue},40%,70%)`;
}

function renderTask(taskObj) {
  const { task, start, end, color } = taskObj;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;

  function findIndex(timeInMin) {
    const minPart = timeInMin % 60;
    const hourPart = Math.floor(timeInMin / 60);

    for (let i = 0; i < minutes.length; i++) {
      if (minPart <= minutes[i]) {
        return { hour: hourPart, index: i };
      }
    }
    return { hour: hourPart + 1, index: 0 };
  }

  const startPos = findIndex(startTotal);
  const endPos = findIndex(endTotal);

  const firstCell = tbody.querySelector(
    `tr:nth-child(${startPos.hour - startHour + 1}) td:nth-child(${startPos.index + 2})`
  );

  if (!firstCell) return;

  let colspan =
    (endPos.hour - startPos.hour) * minutes.length + (endPos.index - startPos.index);

  if (colspan <= 0) return;

  firstCell.colSpan = colspan;
  firstCell.textContent = task;
  firstCell.title = `${task} (${start}~${end})`;
  firstCell.style.background = color || hashColor(task);
  firstCell.style.display = "";

  for (let i = 1; i < colspan; i++) {
    let currentIndex = startPos.index + i;
    let currentHour = startPos.hour + Math.floor(currentIndex / minutes.length);
    let currentMinuteIndex = currentIndex % minutes.length;

    const cellToHide = tbody.querySelector(
      `tr:nth-child(${currentHour - startHour + 1}) td:nth-child(${currentMinuteIndex + 2})`
    );
    if (cellToHide) cellToHide.style.display = "none";
  }
}

// tbody만 초기화 + 렌더
function saveAndRender(){
  tbody.querySelectorAll("td").forEach(td=>{
    td.textContent="";
    td.style.background="white";
    td.style.display="";
    td.colSpan=1;
    td.title = "";
  });

  tasks.forEach(renderTask);
  localStorage.setItem(pageKey, JSON.stringify(tasks));
  renderTaskList();
}

// 토글 리스트 표시
function renderTaskList(){
  taskListContainer.innerHTML = "";
  tasks.forEach((t,i)=>{
    const div = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = `${t.task} (${t.start}~${t.end})`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.onclick = () => {
      const newTask = prompt("할 일 수정:", t.task);
      if(newTask === null) return;
      const newStart = prompt("시작 시간 수정:", t.start);
      const newEnd = prompt("종료 시간 수정:", t.end);
      const newColor = prompt("색상 코드 입력:", t.color || "#88c0d0");
      if(newTask && newStart && newEnd){
        t.task = newTask;
        t.start = newStart;
        t.end = newEnd;
        t.color = newColor || t.color;
        saveAndRender();
      }
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.onclick = () => {
      tasks.splice(i,1);
      saveAndRender();
    }

    div.appendChild(span);
    div.appendChild(editBtn);
    div.appendChild(deleteBtn);
    taskListContainer.appendChild(div);
  });
}

// toggle 버튼
toggleBtn.addEventListener("click", ()=>{
  taskListContainer.style.display = taskListContainer.style.display === "none" ? "block" : "none";
});

// 추가 버튼
document.getElementById("add").addEventListener("click", ()=>{
  const task = document.getElementById("task").value.trim();
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const color = document.getElementById("color").value;

  if(!task || !start || !end){ alert("모든 항목 입력!"); return; }

  tasks.push({task,start,end,color});
  saveAndRender();
  document.getElementById("task").value = "";
});

// 최초 table 생성 및 렌더
initTable();
saveAndRender();
