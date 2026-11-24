#!/bin/bash
# Ubuntu（WSL2）で，講義で使う道具が使用可能かを確認する．インストール・変更は一切しない．
# 使い方（Ubuntu の窓で）：curl -fsSL https://kokiwakatsuki.github.io/mentor-study/ubuntu/tools.sh | bash

# 字数を正しく数えるため，UTF-8 の設定にする
export LC_ALL="$(locale -a 2>/dev/null | grep -i -m1 -E '^(C|en_US)\.utf-?8$')"
pad() { local s="$1" w="$2"; local c=${#s}; local b; b=$(printf %s "$s" | LC_ALL=C wc -c); local d=$(( c + (b - c) / 2 )); printf "%s%*s" "$s" $(( w > d ? w - d : 1 )) ""; }
row() { printf "%s  %s%s%s\n" "$1" "$(pad "$2" 12)" "$(pad "$3" 36)" "$4"; }

echo
row "  " "道具" "次の作業" "詳細"

# WSL2 か（WSL1 では docker が動かない）
case "$(uname -r)" in
  *microsoft-standard-WSL2*) row ○ WSL2 "不要" "$(uname -r)" ;;
  *[Mm]icrosoft*) row ※ WSL2 "メンターと確認" "WSL1 で動いている" ;;
  *) row ・ WSL2 "不要" "WSL ではない Linux" ;;
esac

# systemd：docker を自動起動する仕組み．WSL の版が古いと，設定しても有効にならない
if [ "$(ps -p 1 -o comm= 2>/dev/null)" = systemd ]; then
  row ○ systemd "不要" ""
elif grep -Eq "^[[:space:]]*systemd[[:space:]]*=[[:space:]]*true" /etc/wsl.conf 2>/dev/null; then
  row ※ systemd "③-1 → ⑤-3 → ⑤-4" "設定済みだが無効．WSL が古い可能性"
else
  row × systemd "⑤ のうまくいかないとき" "無効（docker が自動起動しない）"
fi

# git：Ubuntu には最初から入っていることが多い
if command -v git >/dev/null; then row ○ git "不要" "$(git --version)"; else row × git "⑤-1" ""; fi

# python3：sensor.py の実行に必要．Ubuntu には標準で入っている
if command -v python3 >/dev/null; then row ○ python3 "不要" "$(python3 --version)"; else row × python3 "メンターと確認" ""; fi

# docker：Ubuntu に入れた Docker Engine か，Windows の Docker Desktop から借りているものか
# 先に「実際に動くか」を見る（rootless など別の入れ方でも，動けばよい）
d=$(command -v docker)
if [ -n "$d" ] && docker info >/dev/null 2>&1 && ! readlink -f "$d" | grep -q docker-desktop; then
  row ○ docker "不要" "$(docker --version)"
  # ⑦の docker compose は，docker とは別の部品（プラグイン）
  if docker compose version >/dev/null 2>&1; then row ○ compose "不要" "$(docker compose version)"; else row ※ compose "メンターと確認" "docker compose がない"; fi
elif [ -z "$d" ]; then
  row × docker "⑤-2" ""
elif readlink -f "$d" | grep -q docker-desktop; then
  row ※ docker "メンターと確認" "Windows の Docker Desktop のもの"
elif ! dpkg -s docker-ce >/dev/null 2>&1; then
  row ※ docker "メンターと確認" "公式の手順とは別の docker：$d"
elif ! getent group docker | grep -qw "$USER"; then
  row △ docker "⑤-2 → ⑤-3" "docker グループに未登録"
elif ! id -nG | grep -qw docker; then
  row △ docker "⑤-3" "登録済み．再起動で反映"
else
  row △ docker "⑤-3" "入っているが，まだ動いていない（再起動後も同じならメンターと確認）"
fi

echo
echo "○ 使用可　△ 未設定・更新が必要　× 未インストール　※ 要確認　・ 参考"
echo
