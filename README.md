# MediShop — Web

A demo pharmacy storefront by **Way2Automation**, built for teaching UI test
automation with **Playwright**.

It is the web sibling of the MediShop mobile apps and deliberately mirrors their
catalogue, copy, colours and test IDs, so one set of course scenarios can be
taught across three platforms:

| Platform | Repository |
| --- | --- |
| Android | https://github.com/w2aRahul/w2aAndroidApp |
| iOS | https://github.com/w2aRahul/w2aIOSApp |
| Web | this project |

Everything runs in the browser — no backend, no database, no build step.
State lives in `localStorage` / `sessionStorage`, so every learner gets their own
isolated copy of the data and can reset it at any time.

---

## Quick start

```bash

# Optional: install Playwright and run the bundled example suite
npm install
npx playwright install chromium
npm test
```

For a fresh checkout, clone the repository and install the browser binary before
running the suite:

```bash
git clone https://github.com/w2aRahul/MediShopTestSuite.git
cd MediShopTestSuite
npm install
npx playwright install chromium
```
Base URL: https://www.way2automation.com
https://www.way2automation.com/MediShopWebApp/login.html

You can also open `index.html` directly from disk, but a server is recommended —
it is what `page.goto('/MediShopWebApp/login.html')` in the tests expects.

### Demo credentials

```
Username: trainer@way2automation.com
Password: way2automation
```

The login page has a **Fill the form for me** button, and learners can register
extra accounts through **Register your clinic** (stored in this browser only).

---

## What the site covers

| Page | File | Notes |
| --- | --- | --- |
| Splash | `index.html` | Branded pause, then auto-redirects — good `waitForURL` practice |
| Sign in | `login.html` | Validation, show/hide password, remember me, forgot-password dialog |
| Register | `signup.html` | Field validation, password strength, duplicate-account detection |
| Dashboard | `home.html` | Greeting, categories, promo banner, product rails |
| Shop | `products.html` | Search, category chips, sort, price/rating filters, skeleton loading, pagination |
| Product | `product.html?id=p1` | Gallery, quantity stepper, tabs, related products |
| Cart | `cart.html` | Quantity edits, remove, promo codes, live totals |
| Checkout | `checkout.html` | Address form, delivery speed, saved or new payment methods, card validation, prescription attachment |
| Confirmation | `order-confirmation.html` | Generated order reference and totals |
| Orders | `orders.html` | Search and status filter |
| Order details | `order-details.html?id=…` | Tracking timeline, reorder, cancel dialog, print invoice |
| Profile | `profile.html` | Account summary, wishlist, session details |
| Edit profile | `edit-profile.html` | Form with character counter |
| Addresses | `addresses.html` | Modal dialog CRUD, default address |
| Prescriptions | `prescriptions.html` | File upload (JPG / DOCX / TXT), type and size validation, async verification, inline preview |
| Payment methods | `payment-methods.html` | Save a card or UPI ID, masked card number, expiry validation, default method |
| Settings | `settings.html` | Working dark mode, toggles, language, reset demo data |
| Wellness | `wellness.html` | Hydration tracker and medication checklist |
| **Locator reference** | `locators.html` | **Every locator on the site, searchable** |

### Public vs protected pages

Home, Shop, Product and Cart are open to anonymous visitors. Checkout, Orders,
Profile, Addresses, Prescriptions, Payment methods, Settings and Wellness
require a session and redirect to
`login.html?redirect=<page>` — which makes both guest journeys and
authenticated journeys teachable on the same site.

---

## Locator strategy

Every interactive element is reachable by more than one strategy, so the same
scenario can be written several ways and compared.

```ts
// role — the recommended default
await page.getByRole('button', { name: 'Sign in' }).click();

// label — every input has a real <label for>
await page.getByLabel('Email address').fill('trainer@way2automation.com');

// placeholder
await page.getByPlaceholder('Search medicines, formulas...').fill('paracetamol');

// test id — data-testid, Playwright's default attribute (no config needed)
await page.getByTestId('add_to_cart_p1').click();

// alt text on every product image
await expect(page.getByAltText('Paracetamol 500mg')).toBeVisible();
```

Conventions:

* `data-testid` values are **snake_case**, matching the `testTag` /
  `accessibilityIdentifier` values in the Android and iOS apps
  (`email_id`, `password_id`, `signin_button`, `remember_me_checkbox`, …).
* Product-scoped IDs carry the product id: `product_card_p1`,
  `add_to_cart_p1`, `price_p1`, `quantity_p1`, `remove_p1`.
* Order-scoped IDs carry the order reference: `order_card_MS-8492-AX`.
* Icon-only buttons carry an `aria-label`; live regions use `role="status"`;
  errors use `role="alert"`.

Open **`locators.html`** in the browser for the full, searchable table.

---

## Features aimed at automation practice

* **Per-account data.** Cart, orders, addresses, prescriptions, saved cards and
  wishlist are namespaced per signed-in user (`medishop.cart::<email>`), so a
  newly registered clinic starts clean and each account keeps its own history.
  A guest cart is merged into the account on sign-in. Because of the namespace,
  tests should set data up through the UI (see `tests/helpers.ts`) rather than
  writing raw storage keys.
* **Persisted login.** "Remember me" writes the session to `localStorage`
  (captured by Playwright's `storageState`); leaving it unticked uses
  `sessionStorage`. A `medishop_session` cookie is set alongside.
* **Deliberate async.** Sign-in takes ~600 ms, the shop grid shows skeletons for
  ~350 ms, placing an order takes ~900 ms — so tests must rely on auto-waiting
  rather than fixed sleeps.
* **Live regions and toasts.** `role="status"` result counts and toast
  notifications for assertion practice.
* **Native `<dialog>` elements.** Forgot password, add address, cancel order,
  upload prescription, view prescription, add payment method.
* **Account data reused at checkout.** Saved addresses, saved cards / UPI IDs
  and uploaded prescriptions all appear as options on `checkout.html`; Rx-only
  items cannot be ordered until a prescription is attached.
* **File upload.** `prescriptions.html` accepts `.jpg`, `.docx` and `.txt` up to
  5 MB — practice `setInputFiles()`, wrong-type and oversize error paths, and an
  upload whose status flips from *Under review* to *Verified* asynchronously.
* **Rich forms.** Text, email, tel, number, password, select, checkbox, radio,
  textarea — each with field-level error messages.
* **URL state.** The shop syncs `?q=`, `?category=`, `?sort=` and `?page=` so
  deep links can be tested.
* **Dark mode.** Persisted across pages, ideal for visual regression demos.
* **Reset demo data.** In the footer and on the Settings page.

### Promo codes

| Code | Effect |
| --- | --- |
| `WAY2SAVE` | 10% off the order |
| `MEDI50` | $50 off orders over $200 |
| `FREESHIP` | Free shipping |

### Pricing rules

Tax is 8% of the discounted subtotal. Shipping is a flat **$4.99**, free over
**$100**; express delivery at checkout costs **$12.99**.

### Test card

`4242 4242 4242 4242`, any future `MM/YY` expiry, any 3–4 digit CVV.
No payment is ever processed. On `payment-methods.html` the **Use test card**
button fills the whole form in one click. Only the brand, expiry and last four
digits are stored — never the full number or the CVV.

---

## The example test suite

The complete manual test-case catalog is available in [testcases.md](testcases.md).
An Excel version with the same 59 test cases, prerequisites, and manual steps is
available in [testcases.xlsx](testcases.xlsx).

```
tests/
  auth.setup.ts          signs in once, saves playwright/.auth/user.json
  helpers.ts             shared constants and UI flows (sign in / out, register,
                         add to cart, save a card, upload a prescription, order)
  fixtures/              sample upload files (.txt, .jpg and an unsupported .pdf)
  01-login.spec.ts       authentication, validation, guards, storage
  02-shop.spec.ts        search, filters, sorting, pagination, product detail
  03-cart-checkout.spec.ts   cart maths, promo codes, full checkout journey
  04-account.spec.ts     profile, addresses, settings, orders, wellness
  05-prescriptions-payments.spec.ts
                         prescription uploads and saved payment methods
  06-account-isolation.spec.ts
                         each account keeps its own cart, orders and uploads
```

`playwright.config.ts` starts the demo server automatically via `webServer`, so
`npm test` is all that is needed. Specs that need a signed-in user opt in with:

```ts
test.use({ storageState: 'playwright/.auth/user.json' });
```

Useful commands:

```bash
npm test              # headless run
npm run test:headed   # watch it happen
npm run test:ui       # Playwright UI mode
npm run report        # open the last HTML report
npm run codegen       # record a new test against the site
```

---

## Project layout

```
index.html … wellness.html      one file per screen
prescriptions.html              prescription uploads
payment-methods.html            saved cards and UPI IDs
locators.html                   searchable locator reference
assets/
  css/styles.css                design system (light + dark)
  js/data.js                    product catalogue and seed orders
  js/store.js                   session, cart, orders, prescriptions,
                                payment methods, settings persistence
  js/app.js                     header, footer, icons, toasts, route guard
  js/theme-boot.js              applies the saved theme before first paint
  js/pages/*.js                 one script per screen
  img/*.svg                     locally generated product artwork
server.js                       zero-dependency static server
playwright.config.ts            test configuration
tests/                          example Playwright suite
```

---

## Hosting it for a class

The site is fully static, so any of these work:

* **GitHub Pages** — push the folder and enable Pages on the branch root.
* **Netlify / Vercel / Cloudflare Pages** — drag and drop, no build command.
* **Local network** — `node server.js 3000` and share your machine's IP.

Point Playwright at a hosted copy with the `BASE_URL` environment variable:

```bash
BASE_URL=https://your-host/medishop npm test
```

---

## Notes

This is a **demo environment**. There are no real medicines, prescriptions,
payments, or personal data, and nothing is ever sent to a server. All product
information is fictional and must not be used as medical guidance.

Built by Way2Automation for automation training.
