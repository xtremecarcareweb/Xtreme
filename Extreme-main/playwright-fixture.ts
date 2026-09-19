import { test as base, expect } from '@playwright/test';

type Fixtures = {
  // Add any app-specific fixtures here
  // Example:
  // authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  // Define fixtures here
  // Example:
  // authenticatedPage: async ({ page }, use) => {
  //   await page.goto('/');
  //   // Perform authentication
  //   await use(page);
  // },
});

export { expect };
