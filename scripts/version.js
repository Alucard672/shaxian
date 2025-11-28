#!/usr/bin/env node

/**
 * 版本管理脚本
 * 用于更新版本号和创建 Git Tag
 * 
 * 使用方法:
 *   node scripts/version.js patch   # 0.1.0 -> 0.1.1
 *   node scripts/version.js minor   # 0.1.0 -> 0.2.0
 *   node scripts/version.js major   # 0.1.0 -> 1.0.0
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const versionType = process.argv[2]

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('❌ 请指定版本类型: patch, minor, 或 major')
  process.exit(1)
}

// 读取 package.json
const packagePath = path.join(__dirname, '../package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const currentVersion = packageJson.version

// 解析版本号
const [major, minor, patch] = currentVersion.split('.').map(Number)

// 计算新版本号
let newVersion
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`
    break
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`
    break
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`
    break
}

console.log(`📦 当前版本: ${currentVersion}`)
console.log(`🚀 新版本: ${newVersion}`)

// 更新 package.json
packageJson.version = newVersion
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')
console.log('✅ 已更新 package.json')

// 更新 VERSION.md
const versionPath = path.join(__dirname, '../VERSION.md')
let versionContent = fs.readFileSync(versionPath, 'utf8')
versionContent = versionContent.replace(
  /^\*\*v\d+\.\d+\.\d+\*\*/m,
  `**v${newVersion}**`
)
const today = new Date().toISOString().split('T')[0]
versionContent = versionContent.replace(
  /## 版本历史\n\n- \*\*v\d+\.\d+\.\d+\*\*/,
  `## 版本历史\n\n- **v${newVersion}** (${today})\n  - 待更新\n\n- **v${currentVersion}**`
)
fs.writeFileSync(versionPath, versionContent)
console.log('✅ 已更新 VERSION.md')

console.log('\n📝 请手动执行以下命令完成版本发布:')
console.log(`   git add package.json VERSION.md CHANGELOG.md`)
console.log(`   git commit -m "chore: 更新版本号到 ${newVersion}"`)
console.log(`   git tag -a v${newVersion} -m "Release version ${newVersion}"`)
console.log(`   git push origin master --tags`)

