import { test, expect } from '@playwright/test';
import { DEMO_USER } from './helpers';

test.describe('Sign in', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/MediShopWebApp/login.html');
  });

  test(
    'the splash screen redirects an anonymous visitor to the login page',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-101' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/index.html');
      await expect(page.getByTestId('splash_screen')).toBeVisible();
      await page.waitForURL('**/login.html');
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    }
  );

  test(
    'signs in with valid credentials',
    {
      annotation: [
        { type: 'priority', description: 'P1' },
        { type: 'severity', description: 'critical' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-102' },
      ],
    },
    async ({ page }) => {
      await page.getByLabel('Email address').fill(DEMO_USER.email);
      await page.getByLabel('Password', { exact: true }).fill(DEMO_USER.password);
      await page.getByRole('button', { name: 'Sign in' }).click();

      await page.waitForURL('**/home.html');
      await expect(page.getByTestId('home_greeting')).toContainText(DEMO_USER.name);
      await expect(page.getByTestId('account_menu_button')).toBeVisible();
    }
  );

  test(
    'rejects invalid credentials',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-103' },
      ],
    },
    async ({ page }) => {
      await page.getByLabel('Email address').fill('wrong@way2automation.com');
      await page.getByLabel('Password', { exact: true }).fill('nope');
      await page.getByRole('button', { name: 'Sign in' }).click();

      // INTENTIONAL FAILURE: wrong expected value to demo failure screenshots in the report.
      await expect(page.getByTestId('login_alert_message'))
        .toHaveText('Invalid username or password.');
      await expect(page).toHaveURL(/login\.html/);
    }
  );

  test(
    'validates empty and malformed fields',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-104' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('signin_button').click();
      await expect(page.getByTestId('email_id_error')).toHaveText('Email is required');
      await expect(page.getByTestId('password_id_error')).toHaveText('Password is required');

      await page.getByLabel('Email address').fill('not-an-email');
      await page.getByTestId('signin_button').click();
      await expect(page.getByTestId('email_id_error')).toHaveText('Enter a valid email address');
    }
  );

  test(
    'toggles password visibility',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-105' },
      ],
    },
    async ({ page }) => {
      const password = page.getByLabel('Password', { exact: true });
      await password.fill('way2automation');
      await expect(password).toHaveAttribute('type', 'password');

      await page.getByRole('button', { name: 'Show password' }).click();
      await expect(password).toHaveAttribute('type', 'text');

      await page.getByRole('button', { name: 'Hide password' }).click();
      await expect(password).toHaveAttribute('type', 'password');
    }
  );

  test(
    '"remember me" decides where the session is stored',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-106' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('fill_demo_button').click();
      await page.getByTestId('remember_me_checkbox').check();
      await page.getByTestId('signin_button').click();
      await page.waitForURL('**/home.html');

      const stored = await page.evaluate(() => ({
        local: window.localStorage.getItem('medishop.session'),
        session: window.sessionStorage.getItem('medishop.session')
      }));

      expect(stored.local).not.toBeNull();
      expect(stored.session).toBeNull();
    }
  );

  test(
    'opens the forgot password dialog',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-107' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('forgot_password_button').click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { name: 'Reset your password' })).toBeVisible();

      await page.getByTestId('reset_email_input').fill(DEMO_USER.email);
      await page.getByTestId('reset_submit_button').click();

      await expect(page.getByTestId('toast_title')).toHaveText('Reset link sent');
      await expect(dialog).toBeHidden();
    }
  );

  test(
    'protected pages bounce anonymous visitors back to login',
    {
      annotation: [
        { type: 'priority', description: 'P1' },
        { type: 'severity', description: 'critical' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-108' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/orders.html');
      await expect(page).toHaveURL(/MediShopWebApp\/login\.html\?redirect=orders\.html/);
      await expect(page.getByTestId('login_alert_message'))
        .toHaveText('Please sign in to continue to that page.');
    }
  );

  test(
    'signs out again',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Authentication' },
        { type: 'story', description: 'AUTH-109' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('fill_demo_button').click();
      await page.getByTestId('signin_button').click();
      await page.waitForURL('**/home.html');

      await page.getByTestId('account_menu_button').click();
      await page.getByTestId('logout_button').click();

      await page.waitForURL(/MediShopWebApp\/login\.html/);
      await expect(page.getByTestId('login_alert_message'))
        .toHaveText('You have been signed out. See you soon.');
    }
  );
});
