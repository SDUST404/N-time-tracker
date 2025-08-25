const container = document.getElementById("table-container");
const taskListContainer = document.getElementById("task-list-container");
const toggleBtn = document.getElementById("toggle");

// 🔹 Notion 페이지별 독립 저장
// iframe URL에 ?id=페이지ID 를 붙여서 사용
const urlParams = new URLSearchParams(window.location.search);
const pageKey = urlParams.get("id") || "default_page";

const startHour = 6;
const endHour = 24;
const minutes = [10,20,30,40,50,60];

let tasks = JSON.parse(localStorage.getItem(pageKey)||"[]");

function createTable(){
  const table = document.createElement("table");
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

  const tbody=document.createElement("tbody");
  for(let h=startHour;h<endHour;h++){
    const row=document.createElement("tr");
    const th=document.createElement("th");
    th.className="time-col";
    th.textContent=`${h}:00`;
    row.appendChild(th);

    minutes.forEach(m=>{
      const td=document.createElement("td");
      td.dataset.hour=h;
      td.dataset.minute=m;
      row.appendChild(td);
    });

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.innerHTML="";
  container.appendChild(table);
  return tbody;
}

function hashColor(text){
  let hash=0;
  for(let i=0;i<text.length;i++){
    hash=text.charCodeAt(i)+((hash<<5)-hash);
  }
  const hue=Math.abs(hash)%360;
  return `hsl(${hue},40%,70%)`;
}

function timeToIndex(hour, minute){
  const totalMinutes = (hour-startHour)*60 + minute;
  return totalMinutes / 10;
}

function renderTask(taskObj){
  const {task,start,end,color}=taskObj;
  const [sh,sm]=start.split(":").map(Number);
  const [eh,em]=end.split(":").map(Number);

  const cells=Array.from(tbody.querySelectorAll("td"));
  const startIndex = Math.floor(timeToIndex(sh,sm));
  const endIndex = Math.ceil(timeToIndex(eh,em));
  const colspan = endIndex - startIndex;
  if(colspan <=0) return;

  const firstCell = cells[startIndex];
  firstCell.textContent = task;
  firstCell.style.background = color||hashColor(task);
  firstCell.colSpan = colspan;

  for(let i=startIndex+1;i<endIndex;i++){
    const cell = cells[i];
    cell.style.display="none";
  }
}

function saveAndRender(){
  localStorage.setItem(pageKey,JSON.stringify(tasks));
  tbody = createTable();
  tasks.forEach(renderTask);
  renderTaskList();
}

function renderTaskList(){
  taskListContainer.innerHTML="";
  tasks.forEach((t,i)=>{
    const div=document.createElement("div");
    const span=document.createElement("span");
    span.textContent=`${t.task} (${t.start}~${t.end})`;

    const editBtn=document.createElement("button");
    editBtn.textContent="수정";
    editBtn.onclick=()=>{
      const newTask=prompt("할 일 수정:", t.task);
      if(newTask===null) return;
      const newStart=prompt("시작 시간 수정:", t.start);
      const newEnd=prompt("종료 시간 수정:", t.end);
      const newColor=prompt("색상 코드 입력:", t.color||"#88c0d0");
      if(newTask && newStart && newEnd){
        t.task=newTask;
        t.start=newStart;
        t.end=newEnd;
        t.color=newColor||t.color;
        saveAndRender();
      }
    }

    const deleteBtn=document.createElement("button");
    deleteBtn.textContent="삭제";
    deleteBtn.onclick=()=>{
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
  taskListContainer.style.display = taskListContainer.style.display==="none" ? "block" : "none";
});

const addBtn = document.getElementById("add");
addBtn.addEventListener("click", ()=>{
  const task = document.getElementById("task").value.trim();
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const color = document.getElementById("color").value;

  if(!task || !start || !end){ alert("모든 항목 입력!"); return; }

  const obj = {task,start,end,color};
  tasks.push(obj);
  saveAndRender();

  document.getElementById("task").value = "";
});

let tbody = createTable();
tasks.forEach(renderTask);
renderTaskList();
