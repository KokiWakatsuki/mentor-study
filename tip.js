// 吹き出し（引き継ぎメモ風）
// data-tip を持つ要素にマウスを合わせると，少し遅れて補足を表示する．
// クリック・キーボード（Tab）ではすぐ表示．クリックで固定し，外側のクリックか Esc で閉じる．
//   data-tip      本文．「／」で改行
//   data-tip-head 見出し（省略時は「用語｜その語」，コマンドは「コマンド」）


// ============================================================
// 設定
// ============================================================

const SHOW_DELAY = 250;  // マウスを合わせてから表示するまで（ミリ秒）
const HIDE_DELAY = 180;  // 離れてから消すまで（ミリ秒）
const GAP = 10;          // 対象と吹き出しの間（px）
const EDGE = 16;         // 画面の端との間（px）


// ============================================================
// 吹き出しの要素（ページに1つ）
// ============================================================

const bubble = document.createElement("div");
bubble.className = "bubble";
bubble.id = "bubble";
bubble.setAttribute("role", "tooltip");
document.body.appendChild(bubble);

let currentTarget = null;  // 表示中の対象
let isPinned = false;      // クリックで固定中か
let showTimer = null;
let hideTimer = null;


// ============================================================
// 関数
// ============================================================

// コマンドの補足は，コマンドの横の「？」ボタンに移す
function addHelpButtons() {
  for (const code of document.querySelectorAll(".cmd code[data-tip]")) {
    const help = document.createElement("button");
    help.className = "help";
    help.type = "button";
    help.textContent = "?";
    help.setAttribute("aria-label", "このコマンドの意味");
    help.dataset.tip = code.dataset.tip;
    help.dataset.tipHead = "コマンド";
    code.removeAttribute("data-tip");
    code.after(help);
  }
}

// 対象の見出しと本文から，吹き出しの中身を作る
function fillBubble(target) {
  const head = target.dataset.tipHead || `用語｜${target.textContent.trim()}`;
  bubble.innerHTML = "";

  const headElement = document.createElement("div");
  headElement.className = "bubble-head";
  headElement.textContent = head;
  bubble.appendChild(headElement);

  for (const line of target.dataset.tip.split("／")) {
    const lineElement = document.createElement("span");
    lineElement.className = "bubble-line";
    lineElement.textContent = line;
    bubble.appendChild(lineElement);
  }

  const arrow = document.createElement("span");
  arrow.className = "bubble-arrow";
  bubble.appendChild(arrow);
}

// 対象の下（入らなければ上）に置き，矢印を対象の中央に合わせる
function placeBubble(target) {
  const rect = target.getBoundingClientRect();
  const width = bubble.offsetWidth;
  const height = bubble.offsetHeight;

  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, EDGE), window.innerWidth - width - EDGE);
  const fitsBelow = rect.bottom + GAP + height < window.innerHeight - EDGE;
  const top = fitsBelow ? rect.bottom + GAP : rect.top - GAP - height;

  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
  bubble.classList.toggle("is-below", fitsBelow);
  bubble.classList.toggle("is-above", !fitsBelow);

  const arrowLeft = Math.min(Math.max(rect.left + rect.width / 2 - left - 6, 12), width - 24);
  bubble.querySelector(".bubble-arrow").style.left = `${arrowLeft}px`;
}

function open(target) {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  currentTarget = target;
  fillBubble(target);
  placeBubble(target);
  bubble.classList.add("is-open");
  target.setAttribute("aria-describedby", "bubble");
}

function close() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  bubble.classList.remove("is-open");
  if (currentTarget) {
    currentTarget.removeAttribute("aria-describedby");
  }
  currentTarget = null;
  isPinned = false;
}

// マウスが対象・吹き出しから離れたら，少し待って閉じる（固定中は閉じない）
function closeLater() {
  if (isPinned) {
    return;
  }
  clearTimeout(hideTimer);
  hideTimer = setTimeout(close, HIDE_DELAY);
}


// ============================================================
// 実行開始
// ============================================================

addHelpButtons();

for (const target of document.querySelectorAll("[data-tip]")) {
  if (target.tagName !== "BUTTON") {
    target.tabIndex = 0;  // キーボードでも選べるようにする
  }
  target.addEventListener("mouseenter", () => {
    clearTimeout(hideTimer);
    if (currentTarget !== target) {
      clearTimeout(showTimer);
      showTimer = setTimeout(() => open(target), SHOW_DELAY);
    }
  });
  target.addEventListener("mouseleave", () => {
    clearTimeout(showTimer);
    closeLater();
  });
  target.addEventListener("focus", () => open(target));
  target.addEventListener("blur", () => { if (!isPinned) close(); });
  target.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isPinned && currentTarget === target) {
      close();
    } else {
      open(target);
      isPinned = true;
    }
  });
}

bubble.addEventListener("mouseenter", () => clearTimeout(hideTimer));
bubble.addEventListener("mouseleave", closeLater);
document.addEventListener("click", (event) => { if (!bubble.contains(event.target)) close(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
window.addEventListener("scroll", () => { if (currentTarget) placeBubble(currentTarget); }, { passive: true });
