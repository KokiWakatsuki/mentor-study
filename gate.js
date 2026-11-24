// 公開前の回を隠す（config.js の RELEASED にない回）
// 鍵ではなく目隠し．ページのソースを読めば中身は分かる
// 各ページの <head> で，config.js の後に読み込む


// ============================================================
// 確認用の表示（?preview）をブラウザに覚えさせる
// ============================================================

const PREVIEW_KEY = "mentor-study-preview";
const previewParam = new URLSearchParams(location.search).get("preview");
try {
  if (previewParam === "off") localStorage.removeItem(PREVIEW_KEY);
  else if (previewParam !== null) localStorage.setItem(PREVIEW_KEY, "1");
} catch (error) {
  // 保存できないブラウザでは，その場だけ表示
}

function isPreview() {
  try {
    return previewParam !== "off" && (previewParam !== null || localStorage.getItem(PREVIEW_KEY) === "1");
  } catch (error) {
    return previewParam !== null && previewParam !== "off";
  }
}

function isReleased(lesson) {
  return isPreview() || RELEASED.includes(lesson);
}


// ============================================================
// 各回のページ：公開前なら「準備中」に差し替える
// ============================================================

const pageLesson = document.currentScript.dataset.lesson;  // 例：03．一覧のページでは空
if (pageLesson && !isReleased(pageLesson)) {
  document.documentElement.style.visibility = "hidden";   // 差し替えまで中身を見せない
  document.addEventListener("DOMContentLoaded", () => {
    document.title = "準備中 | メンター勉強会";
    document.body.innerHTML = `
      <header class="topbar"><a class="brand" href="../">メンター勉強会</a></header>
      <main class="page">
        <section class="card">
          <h2>準備中</h2>
          <p>この回の資料は，授業の日に公開</p>
          <p><a href="../">講義資料の一覧へ</a></p>
        </section>
      </main>`;
    document.documentElement.style.visibility = "";
  });
}


// ============================================================
// 一覧のページ：公開前の回を一覧から外す
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  for (const item of document.querySelectorAll("[data-lesson-link]")) {
    item.hidden = !isReleased(item.dataset.lessonLink);
  }
});
