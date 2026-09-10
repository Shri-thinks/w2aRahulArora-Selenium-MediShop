import { Page, expect } from '@playwright/test';

export const STORAGE_STATE = 'playwright/.auth/user.json';

export const DEMO_USER = {
  email: 'trainer@way2automation.com',
  password: 'way2automation',
  name: 'Rahul Arora'
};

/** The demo card the site accepts. No gateway is involved. */
export const TEST_CARD = {
  number: '4242424242424242',
  expiry: '1229',
  cvv: '123',
  name: 'Rahul Arora'
};

/** Sample upload files, resolved from the project root. */
export const FILES = {
  prescriptionText: 'tests/fixtures/prescription.txt',
  prescriptionImage: 'tests/fixtures/prescription.jpg',
  unsupported: 'tests/fixtures/scan.pdf'
};

/** Signs in through the UI. Use when the test is *about* logging in. */
export async function login(page: Page, remember = true) {
  await page.goto('/MediShopWebApp/login.html');
  await page.getByLabel('Email address').fill(DEMO_USER.email);
  await page.getByLabel('Password', { exact: true }).fill(DEMO_USER.password);
  if (remember) await page.getByTestId('remember_me_checkbox').check();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/home.html');
}

/** Signs in as any account — used by the multi-account tests. */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/MediShopWebApp/login.html');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByTestId('remember_me_checkbox').check();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/home.html');
}

/** Signs out through the account menu in the header. */
export async function signOut(page: Page) {
  await page.getByTestId('account_menu_button').click();
  await page.getByTestId('logout_button').click();
  await page.waitForURL(/login\.html/);
}

/** A clinic account that is unique to this run, so signup never collides. */
export function newClinic() {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    name: 'Sunrise Clinic',
    email: `clinic.${id}@example.com`,
    password: 'Clinic@2026',
    phone: '5550101234'
  };
}

/** Creates an account through the Sign Up form. Ends on the login page. */
export async function registerClinic(page: Page, clinic: ReturnType<typeof newClinic>) {
  await page.goto('/MediShopWebApp/signup.html');
  await page.getByLabel('Full name').fill(clinic.name);
  await page.getByLabel('Email address').fill(clinic.email);
  await page.getByLabel('Mobile number').fill(clinic.phone);
  await page.getByLabel('Password', { exact: true }).fill(clinic.password);
  await page.getByLabel('Confirm password').fill(clinic.password);
  await page.getByTestId('signup_terms_checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(/login\.html\?registered=1/);
}

/** Waits for the shop grid to finish its simulated fetch. */
export async function waitForProducts(page: Page) {
  await expect(page.getByTestId('product_grid')).toHaveAttribute('aria-busy', 'false');
}

/** Searches the shop and adds one product to the cart. */
export async function addToCart(page: Page, query: string, productId: string) {
  await page.goto(`/MediShopWebApp/products.html?q=${encodeURIComponent(query)}`);
  await waitForProducts(page);
  await page.getByTestId(`add_to_cart_${productId}`).click();
}

/** Empties the cart with the "Clear cart" button on the cart page. */
export async function clearCart(page: Page) {
  await page.goto('/MediShopWebApp/cart.html');
  const clearButton = page.getByTestId('clear_cart_button');
  if (await clearButton.isVisible()) await clearButton.click();
  await expect(page.getByTestId('cart_empty')).toBeVisible();
}

/** Saves the demo card on the Payment methods page. */
export async function saveTestCard(page: Page, makeDefault = true) {
  await page.goto('/MediShopWebApp/payment-methods.html');
  await page.getByRole('button', { name: 'Add payment method' }).click();
  await page.getByRole('button', { name: 'Use test card' }).click();
  if (makeDefault) await page.getByTestId('pm_default_checkbox').check();
  await page.getByTestId('payment_save_button').click();
  await expect(page.getByTestId('payment_label_0')).toBeVisible();
}

/** Uploads a prescription and waits for the pharmacist to verify it. */
export async function uploadPrescription(
  page: Page,
  file: string = FILES.prescriptionText,
  patient = DEMO_USER.name
) {
  await page.goto('/MediShopWebApp/prescriptions.html');
  await page.getByRole('button', { name: 'Upload prescription' }).click();
  await page.getByLabel('Prescription file').setInputFiles(file);
  await page.getByLabel('Patient name').fill(patient);
  await page.getByTestId('rx_consent_checkbox').check();
  await page.getByTestId('prescription_save_button').click();
  /* Verification is deliberately async — auto-waiting covers it. */
  await expect(page.getByTestId('prescription_status_0')).toHaveText('Verified');
}

/**
 * Fills the checkout form for whatever is in the cart and places the order.
 * Returns the order id from the confirmation page.
 */
export async function placeOrder(page: Page) {
  await page.goto('/MediShopWebApp/checkout.html');

  /* The address fields are hidden when a saved address is selected. */
  if (await page.getByTestId('checkout_house_input').isVisible()) {
    await page.getByTestId('checkout_house_input').fill('42 Willow Court, Sector 21');
    await page.getByTestId('checkout_city_input').fill('Chandigarh');
    await page.getByTestId('checkout_state_input').fill('Punjab');
    await page.getByTestId('checkout_pincode_input').fill('160022');
  }

  /* A saved card is preselected; otherwise pay cash on delivery. */
  if (!(await page.getByTestId('saved_payments').isVisible())) {
    await page.getByTestId('payment_cod').check();
  }

  await page.getByTestId('terms_checkbox').check();
  await page.getByRole('button', { name: 'Place order' }).click();
  await page.waitForURL(/order-confirmation\.html/);

  return page.getByTestId('confirmation_order_id').innerText();
}

/** Parses "$12.34" into 12.34 so totals can be asserted numerically. */
export function toNumber(money: string) {
  return Number(money.replace(/[^0-9.]/g, ''));
}
