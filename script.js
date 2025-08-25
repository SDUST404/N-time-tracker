const tracker = document.getElementById("tracker");

// 하루를 10분 단위로 나누면 144칸
const totalCells = 24 * 6;
const colors = {};

function hashColor(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 70%)`;
}

// 셀 생성
for (let i = 0; i < totalCells; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.dataset.index = i;

  // 저장된 값 불러오기
  const saved = localStorage.getItem("cell-" + i);
  if (saved) {
    cell.textContent = saved;
    cell.style.background = hashColor(saved);
  }

  cell.addEventListener("click", () => {
    const input = prompt("내용을 입력하세요:", cell.textContent);
    if (input !== null) {
      cell.textContent = input;
      cell.style.background = input ? hashColor(input) : "#ddd";
      if (input) {
        localStorage.setItem("cell-" + i, input);
      } else {
        localStorage.removeItem("cell-" + i);
      }
    }
  });

  tracker.appendChild(cell);
}
