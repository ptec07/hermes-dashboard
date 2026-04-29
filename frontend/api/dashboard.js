import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const snapshotPath = join(dirname(fileURLToPath(import.meta.url)), 'dashboard-snapshot.json')
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'))

export default function handler(_request, response) {
  response.status(200).json(snapshot)
}
