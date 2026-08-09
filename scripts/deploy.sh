#!/bin/bash
# 部署脚本 - Next.js out/ → /<deploy-path>/
# 自动处理路径: /next/ → /TP/tianyi-acu/next/

set -e

OUT_DIR="/<app>/out"
DEST="/<deploy-path>"
BASE_URL="/TP/tianyi-acu"

echo "==> 备份..."
TS=$(date +%Y%m%d_%H%M%S)
[ -d "$DEST/next" ] && cp -r "$DEST/next" "/tmp/tianyi-acu_next_$TS.bak"
[ -f "$DEST/index.html" ] && cp "$DEST/index.html" "/tmp/tianyi-acu_index_$TS.bak"

echo "==> 部署静态文件..."
cp "$OUT_DIR/acupoints-index.min.json" "$DEST/"
[ -f "$OUT_DIR/shikong-fangwei.json" ] && cp "$OUT_DIR/shikong-fangwei.json" "$DEST/"
cp "$OUT_DIR/index.html" "$DEST/"
[ -d "$OUT_DIR/2d" ] && cp -rT "$OUT_DIR/2d" "$DEST/2d"
[ -d "$OUT_DIR/qihuang-images" ] && cp -rT "$OUT_DIR/qihuang-images" "$DEST/qihuang-images"
cp -rT "$OUT_DIR/next" "$DEST/next"

echo "==> 修复脚本路径: /next/ → ${BASE_URL}/next/..."
for f in "$DEST/index.html" "$DEST/404.html" \
         "$DEST/next/static/chunks/app/"page-*.js \
         "$DEST/next/static/chunks/main-"*.js \
         "$DEST/next/static/chunks/webpack-"*.js; do
  if [ -f "$f" ]; then
    sed -i "s|\"/next/|\"$BASE_URL/next/|g; s|\\\\\"/next/|\\\\\"$BASE_URL/next/|g" "$f"
  fi
done

echo "==> 权限修复..."
chown -R apache:nginx "$DEST"
find "$DEST" -type f -exec chmod 644 {} \;
find "$DEST" -type d -exec chmod 755 {} \;

# 清理旧 page chunks (避免浏览器缓存)
echo "==> 清理旧 page chunks..."
find "$DEST/next/static/chunks/app" -name "page-*.js" -mmin +5 -delete 2>/dev/null || true

echo "✅ 部署完成"
ls "$DEST/"