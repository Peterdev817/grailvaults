/**
 * npm hoists `scheduler` to the repo root, but CRA's source-map-loader resolves
 * sources as react-dom/node_modules/scheduler/index.js (ENOENT). Link hoisted
 * scheduler into react-dom's nested node_modules so dev/build can open that path.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const hoisted = path.join(root, 'node_modules', 'scheduler')
const linkDir = path.join(root, 'node_modules', 'react-dom', 'node_modules')
const linkPath = path.join(linkDir, 'scheduler')

function main() {
  if (!fs.existsSync(path.join(hoisted, 'index.js'))) {
    return
  }
  if (fs.existsSync(path.join(linkPath, 'index.js'))) {
    return
  }
  fs.mkdirSync(linkDir, { recursive: true })
  if (fs.existsSync(linkPath)) {
    fs.rmSync(linkPath, { recursive: true, force: true })
  }
  if (process.platform === 'win32') {
    fs.symlinkSync(hoisted, linkPath, 'junction')
  } else {
    fs.symlinkSync(path.relative(linkDir, hoisted), linkPath, 'dir')
  }
}

main()
