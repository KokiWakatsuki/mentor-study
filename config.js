// 期ごとの設定．メンターが書き換えて push する

const TEAM_REPO = "KokiWakatsuki/berry-watch-2026";  // チームのリポジトリ（所有者/名前）．ページの {team} に入る

// 公開する回．ここにない回は「準備中」と表示し，一覧にも出さない
// 確認用：URL の後ろに ?preview を付けて開くと，そのブラウザでは全部の回を表示（?preview=off で戻す）
const RELEASED = ["02"];
