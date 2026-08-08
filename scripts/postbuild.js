/**
 * 构建后脚本 — 修复 GitHub Pages _next 路径问题
 * GitHub Pages 忽略 _ 开头的目录，将其改为 next/
 */
const fs = require('fs')
const path = require('path')

const outDir = path.resolve(__dirname, '..', 'out')

// 1. 重命名所有 _next 目录为 next
function renameNextDirs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '_next') {
        const newPath = path.join(dir, 'next')
        fs.renameSync(fullPath, newPath)
        console.log(`  renamed: ${fullPath} → ${newPath}`)
        renameNextDirs(newPath)
      } else {
        renameNextDirs(fullPath)
      }
    }
  }
}

console.log('Fixing _next paths for GitHub Pages...')
renameNextDirs(outDir)

// 2. 修复 HTML 文件中的 _next/ 引用
function fixHtmlRefs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js') || entry.name.endsWith('.css'))) {
      let content = fs.readFileSync(fullPath, 'utf8')
      const newContent = content.replace(/\/_next\//g, '/next/')
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent)
        console.log(`  fixed: ${fullPath}`)
      }
    } else if (entry.isDirectory()) {
      fixHtmlRefs(fullPath)
    }
  }
}

fixHtmlRefs(outDir)

console.log('Done!')