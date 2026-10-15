// Minimal static server for ./out (local demo and Playwright). No dependencies.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../out', import.meta.url))
const port = Number(process.env.PORT || 3100)
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff2': 'font/woff2', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain',
}

createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '')
  if (path.includes('..')) { res.writeHead(400).end(); return }
  let file = join(root, path)
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html') } catch { file = join(root, path, 'index.html') }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
  }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}`))
