// ⑨「温度表示までの流れ」
// 受講生が見た3つの画面（センサー・サーバー・ブラウザ）とデータベースの表の模型の間を，封筒が移動する．
// 「▶ 再生」で全場面を自動で再生．「前へ」「次へ」で1場面ずつ．


// ============================================================
// 設定
// ============================================================

const MOVE_TIME = 1600;     // 封筒が1区間を移動する時間（ミリ秒）．style.css の .envelope と合わせる
const READ_TIME = 2500;     // 自動再生で，場面の終わりに止まる時間（ミリ秒）

const OLD_ROWS = [["1号棟", "06:10", "6.9℃"], ["1号棟", "06:20", "10.1℃"]];   // 同じ日の過去の記録
const NEW_ROW = ["1号棟", "06:30", "8.4℃"];                                   // 今回送る記録

const CAPTIONS = [
  "送った 8.4℃ は，どうやってカードに届く？（1号棟だけを追跡）",
  "① センサーの代わりが，8.4℃ をサーバーへ送信",
  "② サーバーが 8.4℃ を保存．ブラウザはまだ前の表示",
  "③「更新」で，ブラウザが今日の情報を問い合わせ",
  "④ サーバーが今日の記録から，最新・最高・最低を用意",
  "⑤ サーバーが，表示する情報をブラウザへ返信",
  "⑥ ブラウザが，受け取った情報をカードに表示",
];
const LAST_SCENE = CAPTIONS.length - 1;


// ============================================================
// 画面の要素
// ============================================================

const stage = document.getElementById("scene-stage");
const envelope = document.getElementById("envelope");
const sensorLines = document.getElementById("sensor-lines");
const serverLines = document.getElementById("server-lines");
const dbRows = document.getElementById("db-rows");
const summary = document.getElementById("summary");
const card = document.getElementById("mock-card");
const cardTemp = document.getElementById("card-temp");
const cardMinMax = document.getElementById("card-minmax");
const reloadButton = document.getElementById("mock-reload");
const caption = document.getElementById("scene-caption");
const sceneCount = document.getElementById("scene-count");
const playButton = document.getElementById("scene-play");
const prevButton = document.getElementById("scene-prev");
const nextButton = document.getElementById("scene-next");
const panels = ["m-sensor", "m-browser", "m-server", "m-db"].map((id) => document.getElementById(id));

let current = 0;          // 表示中の場面（0＝導入）
let runId = 0;            // 動作中の再生の番号（別の操作が始まったら古い再生を止める）
let isAutoPlaying = false;


// ============================================================
// 関数：小さな部品
// ============================================================

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// 黒い画面に1行足す（jp は日本語の補足）
function addLine(area, text, jp, isNew) {
  const line = document.createElement("span");
  line.className = isNew ? "term-line new" : "term-line";
  line.textContent = text;
  if (jp) {
    const note = document.createElement("span");
    note.className = "jp";
    note.textContent = jp;
    line.appendChild(note);
  }
  area.appendChild(line);
}

// データベースの表を書き直す（mark：new＝新しい行を強調，read＝読む行を強調）
function showRows(includeNew, mark) {
  dbRows.innerHTML = "";
  const rows = includeNew ? [...OLD_ROWS, NEW_ROW] : OLD_ROWS;
  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td>`;
    if (mark === "read") tr.className = "read";
    if (mark === "new" && index === rows.length - 1) tr.className = "new";
    dbRows.appendChild(tr);
  });
}

// カードの表示
function showCard(isUpdated) {
  cardTemp.textContent = isUpdated ? "8.4℃" : "10.1℃";
  cardMinMax.textContent = "本日最高 10.1℃・最低 6.9℃";
  card.classList.toggle("updated", isUpdated);
}

// 指定した画面だけを強調する
function highlight(...ids) {
  for (const panel of panels) {
    panel.classList.toggle("on", ids.includes(panel.id));
  }
}

// いまの区間（保存・表示）を強調する
function showPhase(scene) {
  document.getElementById("phase-save").classList.toggle("on", scene >= 1 && scene <= 2);
  document.getElementById("phase-show").classList.toggle("on", scene >= 3);
}

// 封筒を，画面のふち（side：top＝上のふち，center＝中央）に置く
function placeEnvelope(panelId, side, animate) {
  const rect = document.getElementById(panelId).getBoundingClientRect();
  const area = stage.getBoundingClientRect();
  const width = envelope.offsetWidth;
  const height = envelope.offsetHeight;

  let x = rect.left - area.left + rect.width / 2 - width / 2;
  let y = rect.top - area.top + rect.height / 2 - height / 2;
  if (side === "top") y = rect.top - area.top - height / 2;
  x = Math.min(Math.max(x, 0), area.width - width);

  envelope.classList.toggle("jump", !animate);
  envelope.style.transform = `translate(${x}px, ${y}px)`;
  envelope.offsetWidth;   // 位置を確定させる
  envelope.classList.remove("jump");
}

function setEnvelope(color, text) {
  envelope.className = `envelope ${color}`;
  envelope.textContent = text;
}

function hideEnvelope() {
  envelope.classList.remove("show");
}


// ============================================================
// 関数：場面の終わりの状態（「前へ」「次へ」で一瞬で表示）
// ============================================================

function renderState(scene) {
  sensorLines.innerHTML = "";
  serverLines.innerHTML = "";
  addLine(sensorLines, "1号棟：10.1℃，74.0% を送信", "", false);
  addLine(serverLines, "INFO: Uvicorn running on http://0.0.0.0:8000", "", false);
  if (scene >= 2) {
    addLine(serverLines, '"POST /api/readings HTTP/1.1" 200 OK', "← 保存できた", scene === 2);
    addLine(sensorLines, "1号棟：8.4℃，75.3% を送信", "", scene === 2);
  }
  if (scene >= 5) {
    addLine(serverLines, '"GET /api/houses/1/today HTTP/1.1" 200 OK', "← 返信できた", scene === 5);
  }

  showRows(scene >= 2, scene === 2 ? "new" : scene === 4 ? "read" : "");
  summary.classList.toggle("on", scene === 4 || scene === 5);
  showCard(scene >= 6);
  showPhase(scene);
  showRestingEnvelope(scene);

  const focus = [[], ["m-sensor", "m-server"], ["m-server", "m-db"], ["m-browser", "m-server"], ["m-server", "m-db"], ["m-server", "m-browser"], ["m-browser"]];
  highlight(...focus[scene]);
  caption.textContent = CAPTIONS[scene];
  sceneCount.textContent = scene === 0 ? "" : `${scene} / ${LAST_SCENE}`;
  prevButton.disabled = scene === 0;
  nextButton.disabled = scene === LAST_SCENE;
}


// 場面の終わりに，封筒を届いた位置に残す（届いた中身を読めるように）
function showRestingEnvelope(scene) {
  hideEnvelope();
  if (scene === 1) {
    setEnvelope("blue", "測定値｜1号棟 8.4℃");
    placeEnvelope("m-server", "top", false);
  } else if (scene === 3) {
    setEnvelope("yellow", "問い合わせ｜1号棟の今日は？");
    placeEnvelope("m-server", "top", false);
  } else if (scene === 5) {
    setEnvelope("blue", "返事｜最新 8.4℃・最高 10.1℃・最低 6.9℃");
    placeEnvelope("m-browser", "center", false);
  } else {
    return;
  }
  envelope.classList.add("show");
}


// ============================================================
// 関数：場面の動き（直前の場面の状態から動かす）
// ============================================================

async function playScene(scene, myRun) {
  renderState(scene - 1);
  caption.textContent = CAPTIONS[scene];
  sceneCount.textContent = `${scene} / ${LAST_SCENE}`;
  showPhase(scene);
  const stopped = () => myRun !== runId;

  if (scene === 1) {
    highlight("m-sensor");
    setEnvelope("blue", "測定値｜1号棟 8.4℃");
    placeEnvelope("m-sensor", "center", false);
    envelope.classList.add("show");
    await wait(900); if (stopped()) return;
    highlight("m-sensor", "m-server");
    placeEnvelope("m-server", "top", true);
    await wait(MOVE_TIME); if (stopped()) return;
  }
  if (scene === 2) {
    highlight("m-server", "m-db");
    setEnvelope("blue", "測定値｜1号棟 8.4℃");
    placeEnvelope("m-server", "top", false);
    envelope.classList.add("show");
    await wait(300); if (stopped()) return;
    placeEnvelope("m-db", "center", true);
    await wait(MOVE_TIME); if (stopped()) return;
  }
  if (scene === 3) {
    highlight("m-browser");
    reloadButton.classList.remove("press");
    reloadButton.offsetWidth;
    reloadButton.classList.add("press");
    await wait(700); if (stopped()) return;
    setEnvelope("yellow", "問い合わせ｜1号棟の今日は？");
    placeEnvelope("m-browser", "center", false);
    envelope.classList.add("show");
    await wait(500); if (stopped()) return;
    highlight("m-browser", "m-server");
    placeEnvelope("m-server", "top", true);
    await wait(MOVE_TIME); if (stopped()) return;
  }
  if (scene === 4) {
    highlight("m-server", "m-db");
    showRows(true, "read");   // 表の行は残したまま，内容の写しをサーバーへ
    await wait(900); if (stopped()) return;
    setEnvelope("blue", "記録の写し｜1号棟の今日 3件");
    placeEnvelope("m-db", "top", false);
    envelope.classList.add("show");
    await wait(400); if (stopped()) return;
    placeEnvelope("m-server", "center", true);
    await wait(MOVE_TIME); if (stopped()) return;
  }
  if (scene === 5) {
    highlight("m-server", "m-browser");
    setEnvelope("blue", "返事｜最新 8.4℃・最高 10.1℃・最低 6.9℃");
    placeEnvelope("m-server", "top", false);
    envelope.classList.add("show");
    await wait(1200); if (stopped()) return;
    placeEnvelope("m-browser", "center", true);
    await wait(MOVE_TIME); if (stopped()) return;
  }
  if (stopped()) return;
  renderState(scene);
}


// ============================================================
// 関数：操作
// ============================================================

// 1場面だけ動かす（前へ・次へ）
async function goTo(scene) {
  runId += 1;
  isAutoPlaying = false;
  playButton.textContent = "▶ 再生";
  current = scene;
  if (scene === 0) {
    renderState(0);
  } else {
    await playScene(scene, runId);
  }
}

// 全場面を自動で再生する．再生中に押すと止める
async function togglePlay() {
  if (isAutoPlaying) {
    runId += 1;
    isAutoPlaying = false;
    playButton.textContent = "▶ 再生";
    renderState(current);
    return;
  }
  runId += 1;
  const myRun = runId;
  isAutoPlaying = true;
  playButton.textContent = "❚❚ 停止";
  const start = current >= LAST_SCENE ? 1 : current + 1;
  for (let scene = start; scene <= LAST_SCENE; scene += 1) {
    current = scene;
    await playScene(scene, myRun);
    if (myRun !== runId) return;
    await wait(READ_TIME);
    if (myRun !== runId) return;
  }
  isAutoPlaying = false;
  playButton.textContent = "▶ もう一度";
}


// ============================================================
// 実行開始
// ============================================================

playButton.addEventListener("click", togglePlay);
prevButton.addEventListener("click", () => goTo(current - 1));
nextButton.addEventListener("click", () => goTo(current + 1));
renderState(0);
