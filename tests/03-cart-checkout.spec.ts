import { test, expect } from '@playwright/test';
import { STORAGE_STATE, clearCart, toNumber, waitForProducts } from './helpers';

test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    /* The shop honours ?q= on load, so both paracetamol products (p1 and p5)
       are on screen without paging. */
    /* Start each test from an empty cart. */
    await clearCart(page);
    await page.goto('/MediShopWebApp/products.html?q=paracetamol');
    await waitForProducts(page);
  });

  test(
    'adds a product to the cart from the grid',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Cart' },
        { type: 'story', description: 'CART-101' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('add_to_cart_p1').click();

      await expect(page.getByTestId('toast_title')).toHaveText('Added to cart');
      // INTENTIONAL FAILURE: wrong expected value to demo failure screenshots in the report.
      await expect(page.getByTestId('cart_count')).toHaveText('2');
    }
  );

  test(
    'updates quantities and recalculates the totals',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Cart' },
        { type: 'story', description: 'CART-102' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('add_to_cart_p1').click();
      await page.goto('/MediShopWebApp/cart.html');

      await expect(page.getByTestId('cart_line_total_p1')).toHaveText('$5.99');

      await page.getByTestId('increase_p1').click();
      await expect(page.getByTestId('quantity_p1')).toHaveValue('2');
      await expect(page.getByTestId('cart_line_total_p1')).toHaveText('$11.98');
      await expect(page.getByTestId('summary_subtotal')).toHaveText('$11.98');

      /* Typing a quantity directly works too. */
      await page.getByTestId('quantity_p1').fill('5');
      await page.getByTestId('quantity_p1').blur();
      await expect(page.getByTestId('cart_line_total_p1')).toHaveText('$29.95');
    }
  );

  test(
    'removes an item and shows the empty state',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Cart' },
        { type: 'story', description: 'CART-103' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('add_to_cart_p1').click();
      await page.goto('/MediShopWebApp/cart.html');

      await page.getByTestId('remove_p1').click();

      await expect(page.getByTestId('cart_empty')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
      await expect(page.getByTestId('cart_count')).toBeHidden();
    }
  );

  test(
    'applies a valid promo code and rejects an invalid one',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Cart' },
        { type: 'story', description: 'CART-104' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('add_to_cart_p5').click();
      await page.goto('/MediShopWebApp/cart.html');

      await page.getByLabel('Promo code').fill('NOPE');
      await page.getByRole('button', { name: 'Apply' }).click();
      await expect(page.getByTestId('promo_code_input_error')).toHaveText('That promo code is not valid');

      await page.getByLabel('Promo code').fill('WAY2SAVE');
      await page.getByRole('button', { name: 'Apply' }).click();

      await expect(page.getByTestId('promo_applied')).toContainText('WAY2SAVE applied');
      await expect(page.getByTestId('summary_discount')).toHaveText('-$3.85');
    }
  );

  test(
    'the cart total is subtotal plus tax plus shipping',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Cart' },
        { type: 'story', description: 'CART-105' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('add_to_cart_p1').click();
      await page.getByTestId('add_to_cart_p5').click();
      await page.goto('/MediShopWebApp/cart.html');

      const subtotal = toNumber(await page.getByTestId('summary_subtotal').innerText());
      const tax = toNumber(await page.getByTestId('summary_tax').innerText());
      const total = toNumber(await page.getByTestId('summary_total').innerText());

      /* Under $100 the flat $4.99 shipping applies. */
      await expect(page.getByTestId('summary_shipping')).toHaveText('$4.99');
      expect(tax).toBeCloseTo(subtotal * 0.08, 2);
      expect(total).toBeCloseTo(subtotal + tax + 4.99, 2);
    }
  );

  test(
    'checkout sends an anonymous shopper to sign in first',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Cart' },
        { type: 'story', description: 'CART-106' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('add_to_cart_p1').click();
      await page.goto('/MediShopWebApp/cart.html');
      await page.getByTestId('cart_checkout_button').click();

      await expect(page).toHaveURL(/MediShopWebApp\/login\.html\?redirect=checkout\.html/);
    }
  );
});

test.describe('Checkout', () => {
  /* These tests reuse the session captured by tests/auth.setup.ts. */
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    /* Start each test from an empty cart. */
    await clearCart(page);
    await page.goto('/MediShopWebApp/products.html?q=paracetamol');
    await waitForProducts(page);
    await page.getByTestId('add_to_cart_p5').click();
    await page.goto('/MediShopWebApp/checkout.html');
  });

  test(
    'blocks submission until the form is valid',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-101' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('checkout_place_order_button').click();

      await expect(page.getByTestId('checkout_house_input_error')).toHaveText('Address line is required');
      await expect(page.getByTestId('checkout_city_input_error')).toHaveText('City is required');
      await expect(page.getByTestId('terms_checkbox_error')).toHaveText('Please accept the terms to place your order');
      await expect(page).toHaveURL(/checkout\.html/);
    }
  );

  test(
    'validates the card details',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-102' },
      ],
    },
    async ({ page }) => {
      await page.getByLabel('Card number').fill('4242');
      await page.getByLabel('Expiry date').fill('13/29');
      await page.getByLabel('CVV').fill('1');

      await page.getByTestId('checkout_place_order_button').click();

      await expect(page.getByTestId('card_number_input_error')).toHaveText('Card number must be 16 digits');
      await expect(page.getByTestId('card_expiry_input_error')).toHaveText('Use the MM/YY format');
      await expect(page.getByTestId('card_cvv_input_error')).toHaveText('CVV must be 3 or 4 digits');
    }
  );

  test(
    'swaps the payment fields when the method changes',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-103' },
      ],
    },
    async ({ page }) => {
      await expect(page.getByTestId('card_fields')).toBeVisible();

      await page.getByTestId('payment_upi').check();
      await expect(page.getByTestId('card_fields')).toBeHidden();
      await expect(page.getByLabel('UPI ID')).toBeVisible();

      await page.getByTestId('payment_cod').check();
      await expect(page.getByTestId('upi_fields')).toBeHidden();
      await expect(page.getByTestId('cod_note')).toBeVisible();
    }
  );

  test(
    'express delivery adds a surcharge to the total',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-104' },
      ],
    },
    async ({ page }) => {
      const before = toNumber(await page.getByTestId('checkout_total').innerText());

      await page.getByTestId('shipping_express').check();

      /* Standard shipping ($4.99) is swapped for express ($12.99). */
      const after = toNumber(await page.getByTestId('checkout_total').innerText());
      expect(after).toBeCloseTo(before - 4.99 + 12.99, 2);
    }
  );

  test(
    'places an order end to end',
    {
      annotation: [
        { type: 'priority', description: 'P1' },
        { type: 'severity', description: 'critical' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-105' },
      ],
    },
    async ({ page }) => {
      await page.getByLabel('Full name').fill('Rahul Arora');
      await page.getByLabel('Mobile number').fill('5550192834');
      await page.getByTestId('checkout_house_input').fill('42 Willow Court, Sector 21');
      await page.getByLabel('City').fill('Chandigarh');
      await page.getByLabel('State').fill('Punjab');
      await page.getByLabel('Pincode').fill('160022');

      await page.getByLabel('Card number').fill('4242424242424242');
      await page.getByLabel('Expiry date').fill('1230');
      await page.getByLabel('CVV').fill('123');
      await page.getByLabel('Name on card').fill('RAHUL ARORA');

      const expected = await page.getByTestId('checkout_total').innerText();

      await page.getByTestId('terms_checkbox').check();
      await page.getByRole('button', { name: 'Place order' }).click();

      await page.waitForURL('**/order-confirmation.html?id=*');
      await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();
      await expect(page.getByTestId('confirmation_order_id')).toHaveText(/^MS-\d{4}-[A-Z]{2}$/);
      await expect(page.getByTestId('confirmation_total')).toHaveText(expected);
      await expect(page.getByTestId('cart_count')).toBeHidden();

      /* The new order shows at the top of the order history. */
      const orderId = await page.getByTestId('confirmation_order_id').innerText();
      await page.goto('/MediShopWebApp/orders.html');
      await expect(page.getByTestId(`order_card_${orderId}`)).toBeVisible();
      await expect(page.getByTestId(`order_status_${orderId}`)).toHaveText('Processing');
    }
  );
});
