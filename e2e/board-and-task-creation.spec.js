// e2e/board-and-task-creation.spec.js
import { test, expect } from '@playwright/test';

test.describe('Board and Task Creation Flow', () => {
  const newBoardName = 'My E2E Test Board';
  const newTaskTitle = 'First E2E Task';

  test.beforeEach(async ({ page }) => {
    // Go to the home page before each test
    await page.goto('/');
    // Clear localStorage for a clean state before each test in this describe block
    await page.evaluate(() => localStorage.clear());
    // Reload to apply the cleared localStorage
    await page.reload();
     // It might take a moment for localStorage to actually clear and UI to reset.
    // A small wait or check for an element that indicates a clear state might be needed
    // if tests are flaky. For now, simple reload.
  });

  test('should allow a user to create a new board and add a task to it', async ({ page }) => {
    // 1. Assert Page Title
    await expect(page).toHaveTitle(/Boardify/);

    // 2. Handle the prompt for board name and create a new board
    page.on('dialog', async dialog => {
      expect(dialog.type()).toContain('prompt');
      expect(dialog.message()).toContain('Enter the name of the new board:');
      await dialog.accept(newBoardName);
    });

    // Click "Add New Board" button
    // Assuming the button is initially visible, otherwise wait for it.
    const addNewBoardBtn = page.locator('#add-new-board-btn');
    await expect(addNewBoardBtn).toBeVisible();
    await addNewBoardBtn.click();

    // 3. Verify the new board appears on the screen
    // Boards are rendered dynamically. We'll look for the board by its title within an h3.
    // The board header h3 has a class 'board-title-heading' from previous work.
    const newBoardHeader = page.locator(`.board-draggable-item .board-title-heading`, { hasText: newBoardName });
    await expect(newBoardHeader).toBeVisible({ timeout: 10000 }); // Increased timeout for dynamic element

    // Find the specific board container for the new board to scope task creation
    const newBoardContainer = page.locator(`.board-draggable-item:has(h3.board-title-heading:has-text("${newBoardName}"))`);
    await expect(newBoardContainer).toBeVisible();

    // 4. Click the "Add Task" button within that specific new board
    const addTaskBtnInNewBoard = newBoardContainer.locator('.add-task-btn');
    await expect(addTaskBtnInNewBoard).toBeVisible();
    await addTaskBtnInNewBoard.click();

    // 5. Fill out the task title in the task modal
    const taskModal = page.locator('#task-modal');
    await expect(taskModal).toBeVisible();

    const taskTitleInput = taskModal.locator('#task-title');
    await expect(taskTitleInput).toBeVisible();
    await taskTitleInput.fill(newTaskTitle);

    // 6. Click "Save Task" in the modal
    // The submit button is type="submit"
    const saveTaskBtn = taskModal.locator('button[type="submit"]');
    await expect(saveTaskBtn).toBeVisible();
    await saveTaskBtn.click();

    // 7. Assert that the task modal is hidden
    await expect(taskModal).toBeHidden();

    // 8. Verify the new task appears in the new board's column
    // Tasks are divs with class 'task'. We'll look for one containing the title.
    const newTaskCard = newBoardContainer.locator(`.task h4:has-text("${newTaskTitle}")`);
    await expect(newTaskCard).toBeVisible();
  });
});
