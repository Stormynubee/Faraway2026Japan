import { chromium } from 'playwright'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const tempDir = 'assets/screenshots/temp_frames'
const outGif = 'assets/screenshots/demo.gif'

await rm(tempDir, { recursive: true, force: true })
await mkdir(tempDir, { recursive: true })

console.log('Starting GIF capture at:', BASE)
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1024, height: 640 },
  deviceScaleFactor: 1.5,
})
const page = await context.newPage()

try {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
  const continueBtn = page.locator('.boot-continue-btn, button:has-text("Continue")')
  await continueBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
  if (await continueBtn.count() > 0) {
    await continueBtn.first().click()
  }
  await page.waitForTimeout(1000)

  // Capture baseline nominal state (3 frames)
  console.log('Capturing baseline...')
  for (let i = 1; i <= 3; i++) {
    const framePath = path.join(tempDir, `frame_${String(i).padStart(3, '0')}.png`)
    await page.screenshot({ path: framePath })
    await page.waitForTimeout(1000)
  }

  // Trigger monsoon sweep or monsoon S4 inject to show red transition
  console.log('Injecting monsoon sweep/S4...')
  // Let's use ?demo=monsoon-sweep or click inject monsoon S4
  const injectBtn = page.getByTestId('inject-monsoon-s4')
  if (await injectBtn.count() > 0) {
    await injectBtn.click()
  }
  
  // Capture the transition, ticket creation, and recovery
  console.log('Capturing scenario progression (30 seconds)...')
  for (let i = 4; i <= 35; i++) {
    const framePath = path.join(tempDir, `frame_${String(i).padStart(3, '0')}.png`)
    await page.screenshot({ path: framePath })
    await page.waitForTimeout(1000)
  }

  console.log('GIF frames captured in:', tempDir)
} catch (err) {
  console.error('GIF capture failed:', err)
} finally {
  await browser.close()
}
