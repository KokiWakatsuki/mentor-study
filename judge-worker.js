// 練習問題の Python を，ページとは別の場所（Web Worker）で実行する．
// 無限ループになっても，ページが固まらないようにするため．


// ============================================================
// 設定
// ============================================================

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";


// ============================================================
// Python の準備（最初の1回だけ）
// ============================================================

importScripts(`${PYODIDE_URL}pyodide.js`);
const ready = loadPyodide({ indexURL: PYODIDE_URL });

// 入力（stdin）を渡して実行し，出力（stdout）と エラーを返す Python の関数
const RUNNER = `
import sys, io, traceback

def run_code(code, stdin_text):
    sys.stdin = io.StringIO(stdin_text)
    out = io.StringIO()
    sys.stdout = out
    error = ""
    try:
        exec(compile(code, "あなたのコード", "exec"), {"__name__": "__main__"})
    except SystemExit:
        pass
    except BaseException:
        lines = traceback.format_exc().splitlines()
        error = "\\n".join(lines[-3:])
    finally:
        sys.stdout = sys.__stdout__
    return out.getvalue(), error
`;


// ============================================================
// ページからの依頼を受けて実行する
// ============================================================

self.onmessage = async (event) => {
  const { id, code, stdin } = event.data;
  try {
    const pyodide = await ready;
    if (!self.runCode) {
      pyodide.runPython(RUNNER);
      self.runCode = pyodide.globals.get("run_code");
    }
    const result = self.runCode(code, stdin);
    const [output, error] = result.toJs();
    result.destroy();
    self.postMessage({ id, output, error });
  } catch (error) {
    self.postMessage({ id, output: "", error: String(error) });
  }
};
