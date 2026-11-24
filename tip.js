// 吹き出し：data-tip を持つ要素にマウスを合わせると，補足を小さく表示する．
// クリック（タップ）でも開閉できる．画面の端からはみ出さない位置に出す．


// ============================================================
// 吹き出しの要素（ページに1つだけ作る）
// ============================================================

const bubble = document.createElement("div");
bubble.className = "bubble";
bubble.hidden = true;
document.body.appendChild(bubble);


// ============================================================
// 関数
// ============================================================

// target の補足を，target のすぐ下に表示する
function showBubble(target) {
  bubble.textContent = target.dataset.tip;
  bubble.hidden = false;

  const rect = target.getBoundingClientRect();
  const margin = 8;
  const left = Math.min(Math.max(rect.left, margin), window.innerWidth - bubble.offsetWidth - margin);
  bubble.style.left = `${left}px`;
  bubble.style.top = `${rect.bottom + 6}px`;
}

function hideBubble() {
  bubble.hidden = true;
}


// ============================================================
// 実行開始
// ============================================================

for (const target of document.querySelectorAll("[data-tip]")) {
  target.addEventListener("mouseenter", () => showBubble(target));
  target.addEventListener("mouseleave", hideBubble);
  target.addEventListener("click", () => (bubble.hidden ? showBubble(target) : hideBubble()));
}
window.addEventListener("scroll", hideBubble);
