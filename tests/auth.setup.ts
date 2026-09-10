import { test as setup, expect } from '@playwright/test';
import { DEMO_USER, STORAGE_STATE } from './helpers';

/**
 * Signs in once and writes the browser session to disk.
 *
 * "Remember me" must be ticked: with it the session is written to
 * localStorage (which storageState captures); without it the session lives in
 * sessionStorage and would not survive into other tests.
 */
setup('authenticate as the demo user', async ({ page }) => {
  await page.goto('/MediShopWebApp/login.html');

  await page.getByLabel('Email address').fill(DEMO_USER.email);
  await page.getByLabel('Password', { exact: true }).fill(DEMO_USER.password);
  await page.getByTestId('remember_me_checkbox').check();
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL('**/home.html');
  await expect(page.getByTestId('account_menu_button')).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
