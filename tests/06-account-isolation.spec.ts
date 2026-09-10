import { test, expect } from '@playwright/test';
import {
  DEMO_USER, addToCart, login, newClinic, placeOrder, registerClinic,
  saveTestCard, signIn, signOut, uploadPrescription
} from './helpers';

/**
 * Every account keeps its own cart, orders, prescriptions and saved cards.
 * These tests deliberately do NOT reuse the saved session — they sign up,
 * sign in and sign out through the UI, like a real pair of users would.
 */
test.describe('Account data isolation', () => {
  test('a newly registered clinic does not inherit the previous account data', async ({ page }) => {
    const clinic = newClinic();

    /* The demo user shops, saves a card and uploads a prescription. */
    await login(page);
    await addToCart(page, 'paracetamol', 'p1');
    await expect(page.getByTestId('cart_count')).toHaveText('1');
    await saveTestCard(page);
    await uploadPrescription(page);

    await signOut(page);

    /* A brand new clinic signs up and signs in. */
    await registerClinic(page, clinic);
    await signIn(page, clinic.email, clinic.password);

    await expect(page.getByTestId('home_greeting')).toContainText(clinic.name);
    await expect(page.getByTestId('cart_count')).toBeHidden();

    await page.goto('/MediShopWebApp/cart.html');
    await expect(page.getByTestId('cart_empty')).toBeVisible();

    await page.goto('/MediShopWebApp/profile.html');
    await expect(page.getByTestId('profile_email')).toContainText(clinic.email);
    await expect(page.getByTestId('stat_cart_count')).toHaveText('0');
    await expect(page.getByTestId('stat_prescriptions_count')).toHaveText('0');
    await expect(page.getByTestId('stat_payments_count')).toHaveText('0');

    await page.goto('/MediShopWebApp/prescriptions.html');
    await expect(page.getByTestId('prescriptions_empty')).toBeVisible();

    await page.goto('/MediShopWebApp/payment-methods.html');
    await expect(page.getByTestId('payments_empty')).toBeVisible();

    /* Back on the demo account, nothing was lost. */
    await signOut(page);
    await signIn(page, DEMO_USER.email, DEMO_USER.password);
    await expect(page.getByTestId('cart_count')).toHaveText('1');

    await page.goto('/MediShopWebApp/payment-methods.html');
    await expect(page.getByTestId('payment_label_0')).toHaveText('Visa •••• 4242');

    await page.goto('/MediShopWebApp/prescriptions.html');
    await expect(page.getByTestId('prescription_file_0')).toHaveText('prescription.txt');
  });

  test('orders placed by one account stay out of the other', async ({ page }) => {
    const clinic = newClinic();

    await login(page);
    await addToCart(page, 'paracetamol', 'p1');
    const orderId = await placeOrder(page);

    await page.goto('/MediShopWebApp/orders.html');
    await expect(page.getByTestId(`order_card_${orderId}`)).toBeVisible();

    await signOut(page);
    await registerClinic(page, clinic);
    await signIn(page, clinic.email, clinic.password);

    await page.goto('/MediShopWebApp/orders.html');
    await expect(page.getByTestId(`order_card_${orderId}`)).toHaveCount(0);
    /* The new clinic starts from the standard seeded history instead. */
    await expect(page.getByTestId('order_card_MS-8492-AX')).toBeVisible();
  });

  test('a guest cart follows the shopper into their account', async ({ page }) => {
    await addToCart(page, 'paracetamol', 'p1');
    await expect(page.getByTestId('cart_count')).toHaveText('1');

    await signIn(page, DEMO_USER.email, DEMO_USER.password);

    await expect(page.getByTestId('cart_count')).not.toHaveText('0');
    await page.goto('/MediShopWebApp/cart.html');
    await expect(page.getByTestId('cart_row_p1')).toBeVisible();
  });
});
