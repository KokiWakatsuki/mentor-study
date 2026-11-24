// ⑨「温度表示までの流れ」
// 「次へ」で1段ずつ進む．青い札（1号棟の温度）が，センサー → サーバー → データベース → 画面 と移動する．
// 下の開閉欄には，その段で動いているコードを表示する（読まなくてよい）．


// ============================================================
// 各段の内容
// ============================================================

const STEPS = [
  {
    title: "1. センサーが送信",
    text: "センサーが1号棟の温度を測定し，サーバーへ送信",
    path: ["box-sensor", "box-server"],          // 札が通る場所（順に移動）
    active: ["box-sensor", "arrow-1", "box-server"],
    file: "sensor.py の send",
    code: `def send(house_id, temperature, humidity):
    """測定値をサーバーに送信する．"""
    body = {"house_id": house_id, "temperature": temperature, ...}
    ...
    urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS)`,
  },
  {
    title: "2. サーバーが保存",
    text: "サーバーが受信し，データベースに保存\n（サーバーの記録「POST /api/readings」）",
    path: ["box-server", "box-db"],
    active: ["box-server", "arrow-2", "box-db"],
    file: "app.py の add_reading",
    code: `@app.post("/api/readings")
def add_reading(reading: Reading):
    """センサーから受信した記録を保存する．"""
    sql = "INSERT INTO readings (...) VALUES (?, ?, ?, ?)"
    write(sql, params)`,
  },
  {
    title: "3. 画面が要求",
    text: "「更新」で，画面がサーバーへ1号棟の集計を要求\n（サーバーの記録「GET /api/houses/1/today」）",
    path: ["box-db"],                            // 温度はまだデータベースの中
    active: ["box-screen", "arrow-3", "box-server"],
    file: "list.js の showList",
    code: `for (const house of houses) {
  const today = await getJson(\`/api/houses/\${house.id}/today\`);
  ...
}`,
  },
  {
    title: "4. サーバーが取得・応答",
    text: "サーバーがデータベースから取得し，最新値・最高・最低を計算して画面へ応答",
    path: ["box-db", "box-server", "box-screen"],
    active: ["box-db", "arrow-2", "box-server", "arrow-3"],
    file: "app.py の today_summary",
    code: `@app.get("/api/houses/{house_id}/today")
def today_summary(house_id: int):
    """棟の本日の集計（最新値・最高・最低）を返す．"""
    rows = fetch_all(sql, (house_id,))
    ...
    return {"temperature": ..., "max": ..., "min": ...}`,
  },
  {
    title: "5. 画面に表示",
    text: "画面が温度をカードに表示．引き継ぎ完了",
    path: ["box-screen"],
    active: ["box-screen", "landed"],
    file: "list.js の makeCard",
    code: `function makeCard(house, today) {
  ...
  card.querySelector(".card-temperature").textContent =
    formatTemperature(today.temperature);
}`,
  },
];

const MOVE_TIME = 450;  // 札が1区間を移動する時間（ミリ秒）．style.css の .tag と合わせる


// ============================================================
// 画面の要素
// ============================================================

const stage = document.getElementById("stage");
const tag = document.getElementById("tag");
const stepTitle = document.getElementById("flow-step");
const explanation = document.getElementById("flow-text");
const fileName = document.getElementById("flow-file");
const codeArea = document.getElementById("flow-code");
const prevButton = document.getElementById("flow-prev");
const nextButton = document.getElementById("flow-next");
const highlightIds = ["box-sensor", "arrow-1", "box-screen", "arrow-3", "box-server", "arrow-2", "box-db", "landed"];

let current = 0;        // 表示中の段（0 から数える）
let moveTimers = [];    // 札の移動の予約


// ============================================================
// 関数
// ============================================================

// 札を，指定した場所（箱）の内側の右下に動かす（箱の名前・矢印の文字に重ねない）
function moveTagTo(boxId) {
  const box = document.getElementById(boxId).getBoundingClientRect();
  const area = stage.getBoundingClientRect();
  const x = box.right - area.left - tag.offsetWidth - 8;
  const y = box.bottom - area.top - tag.offsetHeight - 8;
  tag.style.transform = `translate(${x}px, ${y}px)`;
}

// 札を，path の場所を順に通って動かす
function moveTagAlong(path) {
  moveTimers.forEach(clearTimeout);
  moveTimers = [];
  path.forEach((boxId, index) => {
    moveTimers.push(setTimeout(() => moveTagTo(boxId), index * MOVE_TIME));
  });
}

// current 番目の段を表示する
function showStep() {
  const step = STEPS[current];

  stepTitle.textContent = `${step.title}（${current + 1} / ${STEPS.length}）`;
  explanation.textContent = step.text;
  fileName.textContent = step.file;
  codeArea.textContent = step.code;

  for (const id of highlightIds) {
    document.getElementById(id).classList.toggle("on", step.active.includes(id));
  }
  tag.classList.toggle("is-hidden", current === STEPS.length - 1);  // 最後は札がカードに収まる
  moveTagAlong(step.path);

  prevButton.disabled = current === 0;
  nextButton.disabled = current === STEPS.length - 1;
}


// ============================================================
// 実行開始
// ============================================================

prevButton.addEventListener("click", () => { current -= 1; showStep(); });
nextButton.addEventListener("click", () => { current += 1; showStep(); });
window.addEventListener("resize", () => moveTagTo(STEPS[current].path.at(-1)));
showStep();
