# メンター勉強会

アプリの障害を解決し，再納品するまでを体験する勉強会の講義資料．
題材は架空のいちご農園の温度監視アプリ「ベリーウォッチ」．

- 公開ページ：https://kokiwakatsuki.github.io/mentor-study/
- 教材のアプリ：https://github.com/KokiWakatsuki/berry-watch

## ファイル構成

```
index.html        講義資料の一覧
02/〜11/          各回の資料（index.html）
style.css         スタイル
lesson.css        第3回以降の部品のスタイル（予想・コードを追う・練習問題など）
tip.js            用語の吹き出し
page.js           コピーボタン・確認済のチェック・進捗
lesson.js         第3回以降の部品の動き
judge-worker.js   練習問題の Python をブラウザ内で実行（Pyodide）
config.js         期ごとの設定（チームのリポジトリ名・公開する回）
gate.js           公開前の回を「準備中」にする（確認は URL に ?preview）
ubuntu/git-setup.sh  git の名前とメールの設定
win/pc.txt        Windows の PC 確認スクリプト（PowerShell）
win/tools.txt     Windows の道具確認スクリプト（PowerShell）
ubuntu/tools.sh   Ubuntu の道具確認スクリプト
```
