// Netlify refuses to deploy files whose names contain # or ?. Fail the build early with a clear message instead.
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const bad = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (/[#?]/.test(entry.name)) bad.push(path)
    if (entry.isDirectory()) walk(path)
  }
}
walk('public')

if (bad.length) {
  console.error('These files have # or ? in their names, which Netlify cannot deploy. Rename them:')
  for (const path of bad) console.error('  ' + path)
  process.exit(1)
}
