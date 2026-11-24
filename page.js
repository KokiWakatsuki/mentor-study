// 講義資料の共通の動き
// ・コピーボタン：コマンドをコピーし，「✓ コピー済」と表示
// ・確認済のチェック：上部の進捗に反映し，ブラウザに保存（次に開いたときも残る）
// ・全手順を確認済にすると「着任完了」を表示


// ============================================================
// 設定
// ============================================================

const STORAGE_KEY = `house-course-${document.body.dataset.lesson}`;  // 例：house-course-02
const CONFETTI_COLORS = ["#005AFF", "#03AF7A", "#FFF100", "#F6AA00"];  // カラーユニバーサルデザイン推奨配色


// ============================================================
// 画面の要素
// ============================================================

const checkboxes = [...document.querySelectorAll(".check input")];
const dots = [...document.querySelectorAll(".dot")];
const countText = document.getElementById("progress-count");
const finishCard = document.getElementById("finish");


// ============================================================
// 関数
// ============================================================

// コマンドをコピーし，ボタンの表示で結果を知らせる
async function copyCommand(button) {
  const command = button.parentElement.querySelector("code").textContent;
  try {
    await navigator.clipboard.writeText(command);
    button.textContent = "✓ コピー済";
    button.classList.add("is-copied");
  } catch (error) {
    button.textContent = "コピー失敗";
    button.classList.add("is-failed");
  }
  setTimeout(() => {
    button.textContent = "コピー";
    button.classList.remove("is-copied", "is-failed");
  }, 1500);
}

// 保存した「確認済」の一覧を読み出す
function loadDone() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

// 確認済の状態を，カード・進捗の点・数に反映する
function showProgress() {
  const doneSteps = [];
  for (const checkbox of checkboxes) {
    const step = checkbox.dataset.step;
    const card = document.getElementById(`step-${step}`);
    card.classList.toggle("is-done", checkbox.checked);
    if (checkbox.checked) {
      doneSteps.push(step);
    }
  }
  for (const dot of dots) {
    dot.classList.toggle("is-done", doneSteps.includes(dot.dataset.step));
  }
  countText.innerHTML = `確認済 <b>${doneSteps.length}</b> / ${checkboxes.length}`;
  return doneSteps;
}

// 紙吹雪を，着任完了の欄の中だけに1回降らせる
function celebrate() {
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    finishCard.appendChild(piece);
    setTimeout(() => piece.remove(), 1400);
  }
}

// チェックを切り替えたとき：保存し，全部そろったら着任完了を表示する
function onCheck() {
  const wasFinished = !finishCard.hidden;
  const doneSteps = showProgress();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doneSteps));

  const isFinished = doneSteps.length === checkboxes.length;
  finishCard.hidden = !isFinished;
  if (isFinished && !wasFinished) {
    finishCard.scrollIntoView({ behavior: "smooth", block: "center" });
    celebrate();
  }
}


// ============================================================
// 実行開始
// ============================================================

for (const button of document.querySelectorAll(".cmd .copy")) {
  button.addEventListener("click", () => copyCommand(button));
}

// 前回の確認済を復元する（このときは紙吹雪を出さない）
const savedSteps = loadDone();
for (const checkbox of checkboxes) {
  checkbox.checked = savedSteps.includes(checkbox.dataset.step);
  checkbox.addEventListener("change", onCheck);
}
finishCard.hidden = showProgress().length !== checkboxes.length;

// 進捗の点を押すと，その手順へ移動する
for (const dot of dots) {
  dot.addEventListener("click", () => {
    document.getElementById(`step-${dot.dataset.step}`).scrollIntoView({ behavior: "smooth" });
  });
}
