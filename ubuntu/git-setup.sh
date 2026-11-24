#!/bin/bash
# git に「誰が記録したか」（名前とメール）を設定する．
# 名前は GitHub のユーザー名．メールは，本当のアドレスを公開しないための GitHub の noreply アドレス．
# 先に gh auth login で GitHub にログインしておく．
# 使い方（Ubuntu で）：curl -fsSL https://kokiwakatsuki.github.io/mentor-study/ubuntu/git-setup.sh | bash

if ! gh auth status >/dev/null 2>&1; then
  echo "× GitHub に未ログイン．先に gh auth login を実行"
  exit 1
fi

name=$(gh api user --jq .login)                                # 例：yamada-taro
email="$(gh api user --jq .id)+${name}@users.noreply.github.com"

git config --global user.name "$name"
git config --global user.email "$email"
git config --global pull.ff only       # pull で勝手に merge しない（食い違いがあれば止まる）

echo "○ 設定完了"
echo "  名前：$(git config --global user.name)"
echo "  メール：$(git config --global user.email)"
