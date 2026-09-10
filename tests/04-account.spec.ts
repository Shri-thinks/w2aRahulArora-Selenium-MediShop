import { test, expect } from '@playwright/test';
import { DEMO_USER, STORAGE_STATE } from './helpers';

/* Every test below starts already signed in, using the state saved by
   tests/auth.setup.ts — no login steps needed. */
test.use({ storageState: STORAGE_STATE });

test.describe('Account', () => {
  test('lands on the dashboard as the signed-in user', async ({ page }) => {
    await page.goto('/MediShopWebApp/home.html');

    await expect(page.getByTestId('home_greeting')).toContainText(DEMO_USER.name);
    await expect(page.getByTestId('account_menu_button')).toHaveText('RA');
  });

  test('shows the account details on the profile page', async ({ page }) => {
    await page.goto('/MediShopWebApp/profile.html');

    await expect(page.getByTestId('profile_name')).toHaveText(DEMO_USER.name);
    await expect(page.getByTestId('profile_email')).toContainText(DEMO_USER.email);
  });

  test('updates the profile and persists it across a reload', async ({ page }) => {
    await page.goto('/MediShopWebApp/edit-profile.html');

    await page.getByLabel('Full name').fill('Dr. Rahul Arora');
    await page.getByLabel('Phone number').fill('+1 555 700 1234');
    await page.getByLabel('Role').selectOption('Pharmacist');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByTestId('edit_profile_alert_message')).toHaveText('Profile updated successfully.');

    await page.goto('/MediShopWebApp/profile.html');
    await expect(page.getByTestId('profile_name')).toHaveText('Dr. Rahul Arora');
    await expect(page.getByTestId('profile_phone')).toContainText('+1 555 700 1234');
  });

  test('adds and deletes a delivery address', async ({ page }) => {
    await page.goto('/MediShopWebApp/addresses.html');
    await expect(page.getByTestId('addresses_empty')).toBeVisible();

    await page.getByRole('button', { name: 'Add new address' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.getByTestId('address_name_input').fill('Rahul Arora');
    await page.getByTestId('address_mobile_input').fill('5550192834');
    await page.getByTestId('address_house_input').fill('42 Willow Court');
    await page.getByTestId('address_city_input').fill('Chandigarh');
    await page.getByTestId('address_state_input').fill('Punjab');
    await page.getByTestId('address_pincode_input').fill('160022');
    await page.getByLabel('Address type').selectOption('Clinic');
    await page.getByTestId('address_save_button').click();

    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('address_card_0')).toBeVisible();
    await expect(page.getByTestId('address_type_0')).toHaveText('Clinic');
    await expect(page.getByTestId('address_default_0')).toHaveText('Default');

    await page.getByTestId('delete_address_0').click();
    await expect(page.getByTestId('addresses_empty')).toBeVisible();
  });

  test('validates the address form', async ({ page }) => {
    await page.goto('/MediShopWebApp/addresses.html');
    await page.getByRole('button', { name: 'Add new address' }).click();

    await page.getByTestId('address_name_input').fill('');
    await page.getByTestId('address_pincode_input').fill('12');
    await page.getByTestId('address_save_button').click();

    await expect(page.getByTestId('address_name_input_error')).toHaveText('Full name is required');
    await expect(page.getByTestId('address_pincode_input_error')).toHaveText('Enter a 5 or 6 digit pincode');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('toggles dark mode and remembers it', async ({ page }) => {
    await page.goto('/MediShopWebApp/settings.html');

    await page.getByRole('switch', { name: 'Dark mode' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto('/MediShopWebApp/home.html');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto('/MediShopWebApp/settings.html');
    await page.getByRole('switch', { name: 'Dark mode' }).uncheck();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('filters the order history by status', async ({ page }) => {
    await page.goto('/MediShopWebApp/orders.html');
    await expect(page.getByTestId('orders_count')).toHaveText('3 orders found');

    await page.getByLabel('Filter by status').selectOption('Delivered');
    await expect(page.getByTestId('orders_count')).toHaveText('1 order found');
    await expect(page.getByTestId('order_card_MS-8492-AX')).toBeVisible();

    await page.getByTestId('orders_reset_filters_button').click();
    await expect(page.getByTestId('orders_count')).toHaveText('3 orders found');
  });

  test('opens an order and reads its tracking timeline', async ({ page }) => {
    await page.goto('/MediShopWebApp/orders.html');
    await page.getByTestId('view_details_MS-8492-AX').click();

    await expect(page).toHaveURL(/order-details\.html\?id=MS-8492-AX/);
    await expect(page.getByTestId('order_status')).toHaveText('Delivered');
    await expect(page.getByTestId('order_timeline').locator('li.is-done')).toHaveCount(4);
    await expect(page.getByTestId('details_total')).toHaveText('$42.50');
  });

  test('cancels an order that is still processing', async ({ page }) => {
    await page.goto('/MediShopWebApp/order-details.html?id=MS-9255-CZ');
    await page.getByTestId('cancel_order_button').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByLabel('Reason for cancelling').selectOption('Ordered by mistake');
    await page.getByTestId('cancel_dialog_confirm_button').click();

    await expect(page.getByTestId('order_status')).toHaveText('Cancelled');
    await expect(page.getByTestId('cancelled_notice')).toContainText('Ordered by mistake');
  });

  test('tracks hydration on the wellness page', async ({ page }) => {
    await page.goto('/MediShopWebApp/wellness.html');

    await expect(page.getByTestId('hydration_count')).toHaveText('3');
    await page.getByRole('button', { name: 'Add a glass' }).click();
    await expect(page.getByTestId('hydration_count')).toHaveText('4');
    await expect(page.getByTestId('hydration_progress')).toContainText('4 more glasses');

    await page.getByLabel('Daily goal').selectOption('6');
    await expect(page.getByTestId('hydration_goal')).toHaveText('6');

    await page.getByTestId('reset_hydration_button').click();
    await expect(page.getByTestId('hydration_count')).toHaveText('0');
    await expect(page.getByRole('button', { name: 'Remove a glass' })).toBeDisabled();
  });
});
