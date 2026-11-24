// 第3回以降の講義資料の部品
// ・予想（.predict）：選択肢を押すと，答えと説明を一度に表示
// ・コードを追う（.trace）：1行ずつ進め，その時点の変数の値を表示
// ・差分（pre.diff）：+ の行を緑，- の行を赤で表示
// ・練習問題（.judge）：ページ内で Python を実行し，○×を判定
// ・書く欄（textarea.note）：入力をブラウザに保存（次に開いたときも残る）


// ============================================================
// 設定
// ============================================================

const LESSON = document.body.dataset.lesson;     // 例：03
const RUN_TIMEOUT = 5000;                        // 実行の制限時間（ミリ秒）．無限ループ対策
const ERROR_HINTS = [
  // （Python のエラー名，日本語のヒント）
  ["IndentationError", "字下げ（行頭の空白）の位置を確認"],
  ["SyntaxError", "記号の抜け・余分を確認（「:」「(」「)」「\"」など）"],
  ["NameError", "名前の書き間違い，または使う前に作っていない変数"],
  ["TypeError", "数と文字を混ぜて計算していないか確認（float() や int() で数に）"],
  ["ValueError", "数に変換できない文字を float() や int() に渡していないか確認"],
  ["IndexError", "リストの範囲外の番号を使っていないか確認"],
  ["KeyError", "辞書にない名前（キー）を使っていないか確認"],
  ["EOFError", "入力の行数より多く input() を呼んでいないか確認"],
  ["ZeroDivisionError", "0 で割っていないか確認"],
];


// ============================================================
// 予想
// ============================================================

// 選択肢を押すと，押した選択肢に印を付け，答えの欄を表示する
function setupPredict(box) {
  const answer = box.querySelector(".predict-answer");
  for (const option of box.querySelectorAll(".predict-options button")) {
    option.addEventListener("click", () => {
      for (const other of box.querySelectorAll(".predict-options button")) {
        other.classList.remove("is-chosen", "is-right");
      }
      option.classList.add("is-chosen");
      if (option.dataset.right !== undefined) {
        option.classList.add("is-right");
      }
      answer.hidden = false;
    });
  }
}


// ============================================================
// コードを追う
// ============================================================

// 1段ずつ進めて，光る行・変数の表・説明を切り替える
function setupTrace(box) {
  const steps = JSON.parse(box.querySelector(".trace-steps").textContent);
  const lines = [...box.querySelectorAll(".trace-code .line")];
  const varsArea = box.querySelector(".trace-vars");
  const noteText = box.querySelector(".trace-note");
  const countText = box.querySelector(".trace-count");
  const prevButton = box.querySelector(".trace-prev");
  const nextButton = box.querySelector(".trace-next");
  const restartButton = box.querySelector(".trace-restart");
  let index = 0;

  function show() {
    const step = steps[index];
    lines.forEach((line, i) => line.classList.toggle("is-current", i + 1 === step.line));

    varsArea.innerHTML = "";
    for (const [name, value] of Object.entries(step.vars)) {
      const row = document.createElement("div");
      row.className = "trace-var";
      if ((step.changed || []).includes(name)) {
        row.classList.add("is-changed");
      }
      row.innerHTML = `<code></code><span></span>`;
      row.querySelector("code").textContent = name;
      row.querySelector("span").textContent = value;
      varsArea.appendChild(row);
    }
    noteText.textContent = step.note;
    countText.textContent = `${index + 1} / ${steps.length}`;
    prevButton.disabled = index === 0;
    nextButton.disabled = index === steps.length - 1;
  }

  prevButton.addEventListener("click", () => { index = index - 1; show(); });
  nextButton.addEventListener("click", () => { index = index + 1; show(); });
  restartButton.addEventListener("click", () => { index = 0; show(); });
  show();
}


// ============================================================
// 差分
// ============================================================

// 行の先頭の記号で色を分ける（+ 追加・- 削除・@ 場所）
function colorDiff(pre) {
  const text = pre.textContent.replace(/^\n/, "");
  pre.textContent = "";
  for (const line of text.split("\n")) {
    const span = document.createElement("span");
    span.className = "diff-line";
    if (line.startsWith("+")) span.classList.add("is-add");
    if (line.startsWith("-")) span.classList.add("is-del");
    if (line.startsWith("@")) span.classList.add("is-at");
    span.textContent = line === "" ? " " : line;
    pre.appendChild(span);
  }
}


// ============================================================
// 練習問題（判定）
// ============================================================

let worker = null;
let runCount = 0;

// Python の実行場所を用意する（最初の実行のときだけ，数秒かかる）
function getWorker() {
  if (worker === null) {
    const base = document.querySelector('script[src$="lesson.js"]').src.replace("lesson.js", "");
    worker = new Worker(`${base}judge-worker.js`);
  }
  return worker;
}

// コードを1回実行し，出力とエラーを返す．時間切れなら実行場所を作り直す
function runPython(code, stdin, timeout) {
  return new Promise((resolve) => {
    runCount = runCount + 1;
    const id = runCount;
    const current = getWorker();
    const timer = setTimeout(() => {
      current.terminate();
      worker = null;
      resolve({ output: "", error: "TimeoutError: 時間切れ（終わらない繰り返しになっていないか確認）" });
    }, timeout);
    current.addEventListener("message", function onMessage(event) {
      if (event.data.id !== id) return;
      current.removeEventListener("message", onMessage);
      clearTimeout(timer);
      resolve(event.data);
    });
    current.postMessage({ id, code, stdin });
  });
}

// エラーの文から，日本語のヒントを選ぶ
function hintFor(error) {
  for (const [name, hint] of ERROR_HINTS) {
    if (error.includes(name)) return hint;
  }
  return "";
}

// 出力を比べる．行末の空白と最後の改行は無視する
function sameOutput(actual, expected) {
  const clean = (text) => text.split("\n").map((line) => line.trimEnd()).join("\n").trim();
  return clean(actual) === clean(expected);
}

// 入力欄で Tab を空白4つに，Enter で前の行の字下げを引き継ぐ（「:」で終わる行なら1段深く）
function setupEditor(textarea) {
  textarea.addEventListener("keydown", (event) => {
    const start = textarea.selectionStart;
    const before = textarea.value.slice(0, start);
    if (event.key === "Tab") {
      event.preventDefault();
      textarea.setRangeText("    ", start, textarea.selectionEnd, "end");
    }
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      const lastLine = before.split("\n").pop();
      let indent = lastLine.match(/^ */)[0];
      if (lastLine.trimEnd().endsWith(":")) indent = indent + "    ";
      textarea.setRangeText("\n" + indent, start, textarea.selectionEnd, "end");
    }
    textarea.dispatchEvent(new Event("input"));
  });
}

// 1つの問題の部品を組み立てる
function setupJudge(box) {
  const key = `mentor-study-judge-${box.dataset.id}`;
  const starter = box.querySelector(".starter").textContent.replace(/^\n/, "");
  const tests = JSON.parse(box.querySelector(".tests").textContent);

  box.insertAdjacentHTML("beforeend", `
    <div class="judge-editor">
      <div class="judge-bar"><span>Python</span><button type="button" class="judge-reset">最初の状態に戻す</button></div>
      <textarea spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
    </div>
    <div class="judge-actions">
      <button type="button" class="judge-run">▶ 実行して判定</button>
      <span class="judge-status"></span>
    </div>
    <div class="judge-result" hidden></div>
  `);
  const textarea = box.querySelector("textarea");
  const runButton = box.querySelector(".judge-run");
  const statusText = box.querySelector(".judge-status");
  const resultArea = box.querySelector(".judge-result");

  textarea.value = localStorage.getItem(key) ?? starter;
  textarea.rows = Math.max(8, textarea.value.split("\n").length + 2);
  textarea.addEventListener("input", () => localStorage.setItem(key, textarea.value));
  setupEditor(textarea);

  box.querySelector(".judge-reset").addEventListener("click", () => {
    textarea.value = starter;
    localStorage.removeItem(key);
  });

  runButton.addEventListener("click", async () => {
    runButton.disabled = true;
    statusText.textContent = worker === null ? "Python を準備中…（初回のみ 10秒ほど）" : "実行中…";
    const rows = [];
    let passCount = 0;
    for (const test of tests) {
      const timeout = worker === null ? RUN_TIMEOUT + 30000 : RUN_TIMEOUT;  // 初回は準備の時間も待つ
      const result = await runPython(textarea.value, test.in, timeout);
      const pass = result.error === "" && sameOutput(result.output, test.out);
      if (pass) passCount = passCount + 1;
      rows.push({ test, result, pass });
      if (result.error.startsWith("TimeoutError")) break;  // 終わらないコードは，残りを実行しない
    }
    showResult(resultArea, rows, passCount, tests.length);
    statusText.textContent = "";
    runButton.disabled = false;
  });
}

// 判定の表を表示する
function showResult(area, rows, passCount, total) {
  const allPass = passCount === rows.length && rows.length === total;
  area.hidden = false;
  area.className = `judge-result ${allPass ? "is-pass" : "is-fail"}`;
  area.innerHTML = `<p class="judge-summary">${allPass ? "全問正解" : "もう一歩"}　${passCount} / ${total}</p>`;

  const table = document.createElement("table");
  table.innerHTML = "<thead><tr><th></th><th>入力</th><th>正しい出力</th><th>あなたの出力</th></tr></thead>";
  const body = document.createElement("tbody");
  for (const { test, result, pass } of rows) {
    const row = document.createElement("tr");
    row.innerHTML = "<td></td><td><pre></pre></td><td><pre></pre></td><td><pre></pre></td>";
    row.children[0].textContent = pass ? "○" : "×";
    row.children[0].className = pass ? "mark-pass" : "mark-fail";
    row.children[1].firstChild.textContent = test.in;
    row.children[2].firstChild.textContent = test.out;
    row.children[3].firstChild.textContent = result.error === "" ? result.output : "（エラー）";
    body.appendChild(row);
  }
  table.appendChild(body);
  area.appendChild(table);

  const firstError = rows.find((row) => row.result.error !== "");
  if (firstError) {
    const box = document.createElement("div");
    box.className = "judge-error";
    const hint = hintFor(firstError.result.error);
    box.innerHTML = `<b>エラー</b><pre></pre>${hint ? `<p></p>` : ""}`;
    box.querySelector("pre").textContent = firstError.result.error;
    if (hint) box.querySelector("p").textContent = `ヒント：${hint}`;
    area.appendChild(box);
  }
}


// ============================================================
// 書く欄（ブラウザに保存）
// ============================================================

function setupNote(textarea) {
  const key = `mentor-study-note-${LESSON}-${textarea.dataset.id}`;
  textarea.value = localStorage.getItem(key) ?? "";
  textarea.addEventListener("input", () => localStorage.setItem(key, textarea.value));
}


// ============================================================
// 期ごとの設定（config.js）をページに入れる
// ============================================================

// data-team を持つ要素の {team} を，チームのリポジトリの名前にする
function fillTeam() {
  if (typeof TEAM_REPO === "undefined") return;
  for (const element of document.querySelectorAll("[data-team]")) {
    element.textContent = element.textContent.replaceAll("{team}", TEAM_REPO);
    if (element.href) {
      element.href = element.getAttribute("href").replaceAll("{team}", TEAM_REPO);
    }
  }
}


// ============================================================
// 実行開始
// ============================================================

fillTeam();

document.querySelectorAll(".predict").forEach(setupPredict);
document.querySelectorAll(".trace").forEach(setupTrace);
document.querySelectorAll("pre.diff").forEach(colorDiff);
document.querySelectorAll(".judge").forEach(setupJudge);
document.querySelectorAll("textarea.note").forEach(setupNote);
for (const button of document.querySelectorAll(".print")) {
  button.addEventListener("click", () => window.print());
}
// 印刷（PDF に保存）のときは，書いた内容が全部見える高さにする
window.addEventListener("beforeprint", () => {
  for (const textarea of document.querySelectorAll("textarea.note")) {
    textarea.style.height = `${textarea.scrollHeight + 4}px`;
  }
});
