import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const snapshotPath = join(dirname(fileURLToPath(import.meta.url)), 'dashboard-snapshot.json')
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'))

function normalizeBackendUrl(value) {
  return value?.trim().replace(/\/+$/, '')
}

export default async function handler(_request, response) {
  const backendUrl = normalizeBackendUrl(process.env.HERMES_DASHBOARD_BACKEND_URL)

  if (backendUrl) {
    try {
      const backendResponse = await fetch(`${backendUrl}/api/dashboard`, {
        headers: { accept: 'application/json' },
      })

      if (!backendResponse.ok) {
        throw new Error(`Live backend returned ${backendResponse.status}`)
      }

      const liveSnapshot = await backendResponse.json()
      response.setHeader('x-hermes-dashboard-source', 'live-backend')
      response.status(200).json(liveSnapshot)
      return
    } catch (error) {
      response.setHeader('x-hermes-dashboard-live-error', String(error?.message || error))
    }
  }

  response.setHeader('x-hermes-dashboard-source', 'snapshot-fallback')
  response.status(200).json(snapshot)
}
