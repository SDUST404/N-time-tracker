const container = document.getElementById("table-container");
const pageKey = location.pathname || "default_page";

const startHour = 6;
const endHour = 24;
const minutes = [10,20,30,40,50,60];

function createTable(){
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // 왼쪽 위 코너
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

let tbody=createTable();
let tasks=JSON.parse(localStorage.getItem(pageKey)||"[]");

function hashColor(text){
  let hash=0;
  for(let i=0;i<text.length;i++){
    hash=text.charCodeAt(i)+((hash<<5)-hash);
  }
  const hue=Math.abs(hash)%360;
  return `hsl(${hue},40%,70%)`;
}

function renderTask(taskObj){
  const {task,start,end,color}=taskObj;
  const [sh,sm]=start.split(":").map(Number);
  const [eh,em]=end.split(":").map(Number);

  const cells=Array.from(tbody.querySelectorAll("td"));
  const startIndex=(sh-startHour)*6 + Math.floor(sm/10);
  const endIndex=(eh-startHour)*6 + Math.floor(em/10);
  const colspan=endIndex-startIndex;
  if(colspan<=0) return;

  const firstCell=cells[startIndex];
  firstCell.textContent=task;
  firstCell.style.background=color||hashColor(task);
  firstCell.colSpan=colspan;

  // 나머지 셀 숨기기
  for(let i=startIndex+1;i<endIndex;i++){
    const cell=cells[i];
    cell.style.display="none";
  }

  // 수정/삭제
  firstCell.onclick=()=>{
    const newTask=prompt("할 일 수정:",task);
    if(newTask===null) return;
    const newColor=prompt("색상 코드 입력:",color||"#88c0d0");
    if(newTask===""){
      tasks=tasks.filter(t=>t!==taskObj);
      saveAndRender();
    } else {
      taskObj.task=newTask;
      taskObj.color=newColor||color;
      saveAndRender();
    }
  }
}

function saveAndRender(){
  localStorage.setItem(pageKey,JSON.stringify(tasks));
  tbody=createTable();
  tasks.forEach(renderTask);
}

tasks.forEach(renderTask);

document.getElementById("add").addEventListener("click",()=>{
  const task=document.getElementById("task").value.trim();
  const start=document.getElementById("start").value;
  const end=document.getElementById("end").value;
  const color=document.getElementById("color").value;

  if(!task||!start||!end){ alert("모든 항목 입력!"); return; }

  const obj={task,start,end,color};
  tasks.push(obj);
  saveAndRender();
});

