// ⑨「測定値が表示されるまでの流れ」の解説．
// 「次へ」で1段ずつ進み，左に動いているコード，右にアプリのどこが動いているかを表示する．


// ============================================================
// 各段の内容
// ============================================================

const STEPS = [
  {
    title: "1. センサーが送信",
    file: "sensor.py",
    code: `def send(house_id, temperature, humidity):
    """測定値をサーバーに送信する．"""
    body = {"house_id": house_id,
            "temperature": temperature,
            "humidity": humidity}
    ...
    urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS)`,
    text: "sensor.py の send：棟の番号・温度・湿度を送信",
    active: ["box-sensor", "arrow-1"],
  },
  {
    title: "2. サーバーが保存",
    file: "app.py",
    code: `@app.post("/api/readings")
def add_reading(reading: Reading):
    """センサーから受信した記録を保存する．"""
    ...
    sql = "INSERT INTO readings (...) VALUES (?, ?, ?, ?)"
    write(sql, params)`,
    text: "app.py の add_reading：受信してデータベースに保存\n（記録「POST /api/readings」）",
    active: ["box-server", "arrow-2", "box-db"],
  },
  {
    title: "3. 画面が要求",
    file: "static/list.js",
    code: `// 棟ごとに本日の集計を取得し，カードを追加する
for (const house of houses) {
  const today = await getJson(\`/api/houses/\${house.id}/today\`);
  ...
}`,
    text: "list.js：「更新」で棟ごとの集計を要求\n（記録「GET /api/houses/1/today」）",
    active: ["box-screen", "arrow-3", "box-server"],
  },
  {
    title: "4. サーバーが取得・応答",
    file: "app.py",
    code: `@app.get("/api/houses/{house_id}/today")
def today_summary(house_id: int):
    """棟の本日の集計（最新値・最高・最低）を返す．"""
    # 1. この棟の全記録を取得する（古い順）
    rows = fetch_all(sql, (house_id,))
    # 2. 本日の記録だけを抽出する
    ...
    return {"temperature": ..., "max": ..., "min": ...}`,
    text: "app.py の today_summary：記録を取得し，最新値・最高・最低を計算して応答",
    active: ["box-server", "arrow-2", "box-db", "arrow-3"],
  },
  {
    title: "5. 画面に表示",
    file: "static/list.js",
    code: `// 棟1つ分のカードを作成する
function makeCard(house, today) {
  ...
  card.querySelector(".card-temperature").textContent =
    formatTemperature(today.temperature);
  ...
}`,
    text: "list.js の makeCard：受信した温度をカードに表示",
    active: ["box-screen", "mini-card"],
  },
];


// ============================================================
// 画面の要素
// ============================================================

const stepTitle = document.getElementById("flow-step");
const fileName = document.getElementById("flow-file");
const codeArea = document.getElementById("flow-code");
const explanation = document.getElementById("flow-text");
const prevButton = document.getElementById("flow-prev");
const nextButton = document.getElementById("flow-next");
const highlightIds = ["box-sensor", "arrow-1", "box-server", "arrow-2", "box-db", "arrow-3", "box-screen", "mini-card"];

let current = 0;  // 表示中の段（0 から数える）


// ============================================================
// 関数
// ============================================================

// current 番目の段を表示する
function showStep() {
  const step = STEPS[current];

  stepTitle.textContent = `${step.title}（${current + 1} / ${STEPS.length}）`;
  fileName.textContent = step.file;
  codeArea.textContent = step.code;
  explanation.textContent = step.text;

  // 右の図：この段で動いている所だけを強調する
  for (const id of highlightIds) {
    const element = document.getElementById(id);
    element.classList.toggle("on", step.active.includes(id));
  }

  prevButton.disabled = current === 0;
  nextButton.disabled = current === STEPS.length - 1;
}


// ============================================================
// 実行開始
// ============================================================

prevButton.addEventListener("click", () => { current -= 1; showStep(); });
nextButton.addEventListener("click", () => { current += 1; showStep(); });
showStep();
