const container = document.getElementById("table-container");
const pageKey = location.pathname || "default_page";
const taskListContainer = document.getElementById("task-list-container");
const toggleBtn = document.getElementById("toggle");

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
  return Math.floor(totalMinutes/10);
}

function renderTask(taskObj){
  const {task,start,end,color}=taskObj;
  const [sh,sm]=start.split(":").map(Number);
  const [eh,em]=end.split(":").map(Number);

  const cells=Array.from(tbody.querySelectorAll("td"));
  const startIndex = timeToIndex(sh,sm);
  const endIndex = timeToIndex(eh,em);
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
  if(taskListContainer.style.display==="none"){
    taskListContainer.style.display="block";
  } else {
    taskListContainer.style.display="none";
  }
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
