#!/usr/bin/env bash
# GitHub Pages への公開スクリプト（gh-pages ブランチ方式）。
# 使い方: ./scripts/deploy-pages.sh
# ビルド → gh-pages ブランチに静的ファイルを強制プッシュします。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NEXT_PUBLIC_BASE_PATH=/youtube-preflight
export NEXT_PUBLIC_SITE_URL=https://UniSchool-TM.github.io/youtube-preflight

echo "==> Building static site..."
rm -rf out
npm run build
touch out/.nojekyll

echo "==> Publishing to gh-pages branch..."
TMP="$(mktemp -d)"
git worktree add --detach "$TMP" >/dev/null 2>&1
(
  cd "$TMP"
  git rm -rq . >/dev/null 2>&1 || true
  cp -R "$ROOT/out"/. .
  git checkout -q -B gh-pages
  git add -A
  git -c user.name="YouTube Preflight Deploy" -c user.email="deploy@users.noreply.github.com" \
    commit -qm "deploy: static site (gh-pages)"
  git push -q -f origin gh-pages
)
git worktree remove --force "$TMP"

echo "==> Done: https://UniSchool-TM.github.io/youtube-preflight/"