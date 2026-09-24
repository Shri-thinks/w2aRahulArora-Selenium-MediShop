import { test, expect } from '@playwright/test';
import { waitForProducts } from './helpers';

test.describe('Shop and product detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/MediShopWebApp/products.html');
    await waitForProducts(page);
  });

  test(
    'lists the first page of products',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-101' },
      ],
    },
    async ({ page }) => {
      // INTENTIONAL FAILURE: wrong expected value to demo failure screenshots in the report.
      await expect(page.getByTestId('results_count')).toHaveText('Showing 1–10 of 24 products');
      await expect(page.getByTestId('product_grid').locator('article')).toHaveCount(8);
    }
  );

  test(
    'filters by search term',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-102' },
      ],
    },
    async ({ page }) => {
      await page.getByPlaceholder('Search medicines, formulas...').fill('paracetamol');
      await waitForProducts(page);

      /* Both the generic tablet and Crocin Advance mention paracetamol. */
      await expect(page.getByTestId('product_card_p1')).toBeVisible();
      await expect(page.getByTestId('product_card_p5')).toBeVisible();
      await expect(page.getByTestId('results_count')).toContainText('of 2 products');
    }
  );

  test(
    'filters by category chip',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-103' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('category_chip_antibiotic').click();
      await waitForProducts(page);

      await expect(page.getByTestId('category_chip_antibiotic')).toHaveAttribute('aria-pressed', 'true');
      for (const card of await page.getByTestId('product_grid').locator('article').all()) {
        await expect(card).toHaveAttribute('data-category', 'Antibiotic');
      }
    }
  );

  test(
    'sorts by price, low to high',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-104' },
      ],
    },
    async ({ page }) => {
      await page.getByLabel('Sort by').selectOption('price-asc');
      await waitForProducts(page);

      const prices = await page.getByTestId('product_grid').locator('article')
        .evaluateAll(cards => cards.map(c => Number(c.getAttribute('data-price'))));

      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    }
  );

  test(
    'combines a price range with a rating filter',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-105' },
      ],
    },
    async ({ page }) => {
      await page.getByLabel('Min price').fill('10');
      await page.getByLabel('Max price').fill('20');
      await page.getByLabel('Minimum rating').selectOption('4.5');
      await waitForProducts(page);

      const prices = await page.getByTestId('product_grid').locator('article')
        .evaluateAll(cards => cards.map(c => Number(c.getAttribute('data-price'))));

      expect(prices.length).toBeGreaterThan(0);
      prices.forEach(price => {
        expect(price).toBeGreaterThanOrEqual(10);
        expect(price).toBeLessThanOrEqual(20);
      });
    }
  );

  test(
    'shows an empty state and recovers from it',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-106' },
      ],
    },
    async ({ page }) => {
      await page.getByPlaceholder('Search medicines, formulas...').fill('zzzzz');
      await waitForProducts(page);

      await expect(page.getByTestId('no_results')).toBeVisible();
      await expect(page.getByTestId('results_count')).toHaveText('No products found');

      await page.getByTestId('empty_clear_filters_button').click();
      await waitForProducts(page);
      await expect(page.getByTestId('no_results')).toBeHidden();
    }
  );

  test(
    'pages through the catalogue',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-107' },
      ],
    },
    async ({ page }) => {
      await page.getByTestId('pagination_next').click();
      await waitForProducts(page);

      await expect(page.getByTestId('results_count')).toHaveText('Showing 9–16 of 24 products');
      await expect(page).toHaveURL(/MediShopWebApp\/products\.html\?page=2/);
      await expect(page.getByTestId('pagination_page_2')).toHaveAttribute('aria-current', 'page');
    }
  );

  test(
    'opens a product and reads its details',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-108' },
      ],
    },
    async ({ page }) => {
      /* Amlodipine is not a best seller, so narrow the grid before clicking it. */
      await page.getByTestId('category_chip_cardiology').click();
      await waitForProducts(page);

      await page.getByTestId('product_link_p4').click();

      await expect(page).toHaveURL(/product\.html\?id=p4/);
      await expect(page.getByTestId('product_name')).toHaveText('Amlodipine Besylate 5mg');
      // INTENTIONAL FAILURE: wrong expected value to demo failure screenshots in the report.
      await expect(page.getByTestId('product_price')).toHaveText('$12.99');
      await expect(page.getByAltText('Amlodipine Besylate 5mg')).toBeVisible();
      await expect(page.getByTestId('stock_status')).toContainText('In stock');
    }
  );

  test(
    'switches between product information tabs',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-109' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/product.html?id=p4');

      await expect(page.getByTestId('panel_details')).toBeVisible();
      await expect(page.getByTestId('panel_safety')).toBeHidden();

      await page.getByRole('tab', { name: 'Safety information' }).click();

      await expect(page.getByTestId('panel_safety')).toBeVisible();
      await expect(page.getByTestId('panel_safety')).toContainText('swelling of the ankles');
      await expect(page.getByRole('tab', { name: 'Safety information' }))
        .toHaveAttribute('aria-selected', 'true');
    }
  );

  test(
    'quantity stepper updates the line total and clamps at its bounds',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Catalogue' },
        { type: 'story', description: 'SHOP-110' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/product.html?id=p4');

      await expect(page.getByTestId('decrease_quantity_button')).toBeDisabled();

      await page.getByTestId('increase_quantity_button').click();
      await page.getByTestId('increase_quantity_button').click();

      await expect(page.getByTestId('quantity_input')).toHaveValue('3');
      await expect(page.getByTestId('line_total')).toHaveText('$44.97');
    }
  );
});
