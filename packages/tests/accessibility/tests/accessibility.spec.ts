import { test, expect, request as apiRequest } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function clearAllTasks() {
  const ctx = await apiRequest.newContext()
  try {
    const res = await ctx.get('http://localhost:3001/tasks')
    const tasks: Array<{ id: string }> = await res.json()
    for (const task of tasks) {
      await ctx.delete(`http://localhost:3001/tasks/${task.id}`)
    }
  } finally {
    await ctx.dispose()
  }
}

async function seedTask(title: string, priority: string) {
  const ctx = await apiRequest.newContext()
  try {
    await ctx.post('http://localhost:3001/tasks', {
      data: { title, priority },
    })
  } finally {
    await ctx.dispose()
  }
}

test('empty task list has no critical accessibility violations', async ({ page }) => {
  await clearAllTasks()
  await page.goto('/')
  // Wait for the app to settle on the empty state before scanning
  await page.waitForSelector('text=No tasks yet')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

test('task list with items has no critical accessibility violations', async ({ page }) => {
  await clearAllTasks()
  await seedTask('Buy groceries', 'high')
  await seedTask('Walk dog', 'low')
  await page.goto('/')
  await page.waitForSelector('[role="list"]')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

test('task form inputs are properly labeled', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('form')
  const results = await new AxeBuilder({ page })
    .include('form')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

test('filter controls are accessible', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('[aria-label="Filters"]')
  const results = await new AxeBuilder({ page })
    .include('[aria-label="Filters"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

const showFailures = process.env.SHOW_FAILURES === 'true'

test.describe('[FAILURE EXAMPLE]', () => {
  test.skip(!showFailures, 'Set SHOW_FAILURES=true to run these')

  test('fails: page with injected inaccessible element', async ({ page }) => {
    await page.goto('/')
    // Inject an image with no alt text — a known WCAG 1.1.1 violation
    await page.evaluate(() => {
      const img = document.createElement('img')
      img.src = 'https://example.com/img.png'
      // No alt attribute set — this is a violation
      document.body.appendChild(img)
    })
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([]) // Will fail — there IS a violation
  })
})
