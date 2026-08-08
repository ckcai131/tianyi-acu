# tianyi-acu

奇门遁甲 + 通玄针法 · 择时开穴工具

## 算法核心
4 大算法 (基于历法干支推演):
- **值符** (天干定值日经; 五输穴轮值; 阴阳不匹配表里经代值)
- **值使** (12 地支固定对应值使穴)
- **值阳/值阴** (阳日气纳三焦; 阴日血归心包; 每穴轮值 2 时辰)
- **吉凶时** (12 神煞 + 黄黑道 + 截空 + 五不遇)

## 技术栈
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + 自定义 CSS 变量
- 纯前端 JS 计算 (无服务端)
- 部署: 静态导出到 TP 下

## 开发
\`\`\`bash
npm install
npm run dev    # 开发
npm run build  # 构建 (输出 out/)
\`\`\`

## 部署
\`\`\`bash
npm run build
cp -r out/. /<deploy-path>/
\`\`\`

## 数据
所有查表数据写进 \`src/lib/*.ts\` (60 甲子主表 + 720 吉凶时 + 120 值符 + 12 值使 + 24 值阳值阴).

## 在线访问
https://9shu.com.cn/TP/tianyi-acu/

## 许可证
仅供道学爱好者学习参考,
**不构成任何针灸临床专业建议**.