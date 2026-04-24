import { test, expect, request as apiRequest } from '@playwright/test'

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

test.beforeEach(async () => {
  await clearAllTasks()
})

test('user can create a task', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Buy groceries')
  // exact: true prevents matching the FilterBar's "Filter by priority" label
  await page.getByLabel('Priority', { exact: true }).selectOption('high')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Buy groceries')).toBeVisible()
  await expect(page.getByText('high', { exact: true })).toBeVisible()
})

test('user can mark a task as complete', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Exercise')
  await page.getByRole('button', { name: 'Add' }).click()
  // Wait for the task to appear before interacting with its checkbox.
  // Use click() instead of check(): the app is a controlled React component
  // that updates after an async API call, so Playwright's check() (which
  // validates the DOM flipped synchronously) will fail.
  await expect(page.getByText('Exercise')).toBeVisible()
  await page.getByLabel(/Mark "Exercise" as complete/i).click()
  await expect(page.getByText('Exercise')).toHaveCSS('text-decoration-line', 'line-through')
})

test('user can delete a task', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Temporary task')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Temporary task')).toBeVisible()
  await page.getByRole('button', { name: /Delete "Temporary task"/i }).click()
  await expect(page.getByText('Temporary task')).not.toBeVisible()
})

test('user can filter tasks by status', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Task title').fill('Active task')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('Task title').fill('Completed task')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Completed task')).toBeVisible()
  await page.getByLabel(/Mark "Completed task" as complete/i).click()
  // Wait for the toggle to persist before filtering — the PATCH is async and
  // the filter query must run after the backend has recorded the completion.
  await expect(page.getByText('Completed task')).toHaveCSS('text-decoration-line', 'line-through')
  await page.getByLabel('Filter by status').selectOption('active')
  await expect(page.getByText('Active task')).toBeVisible()
  await expect(page.getByText('Completed task')).not.toBeVisible()
})

test('empty state message shows when no tasks exist', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('No tasks yet')).toBeVisible()
})

const showFailures = process.env.SHOW_FAILURES === 'true'

test.describe('[FAILURE EXAMPLES]', () => {
  test.skip(!showFailures, 'Set SHOW_FAILURES=true to run these')

  test('fails: clicks a button that does not exist', async ({ page }) => {
    await page.goto('/')
    // Playwright will time out waiting for a button that never appears
    await page.getByRole('button', { name: 'Non-existent button' }).click({ timeout: 3000 })
  })

  test('fails: expects text to be hidden when it is visible', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Task title').fill('Visible task')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('Visible task')).not.toBeVisible()
  })
})
