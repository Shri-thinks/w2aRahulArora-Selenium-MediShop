# MediShop Test Cases

This document describes the 59 product test cases scripted in the `tests` folder. The steps are written for a manual tester and use the same demo data as the automated suite.

## Common Test Data

- Demo user: `trainer@way2automation.com` / `way2automation`
- Demo user name: Rahul Arora
- Test card: `4242 4242 4242 4242`, expiry `12/29`, CVV `123`
- Checkout address: `42 Willow Court, Sector 21`, Chandigarh, Punjab, `160022`
- Products: `p1` Paracetamol 500mg, `p2` Amoxicillin 250mg, `p4` Amlodipine Besylate 5mg, `p5` Crocin Advance
- Prescription files: `tests/fixtures/prescription.txt`, `tests/fixtures/prescription.jpg`, `tests/fixtures/scan.pdf`
- Seeded delivered order: `MS-8492-AX`
- Seeded processing order: `MS-9255-CZ`

## Authentication Setup

The setup test `authenticate as the demo user` in `tests/auth.setup.ts` is test infrastructure, not a product test case. It signs in with the demo credentials, enables Remember me, verifies the dashboard, and saves `playwright/.auth/user.json` for tests that need an authenticated session.

## Login and Authentication

Source: `tests/01-login.spec.ts`

| ID | Test case | Prerequisites and data | Manual steps |
| --- | --- | --- | --- |
| LOGIN-001 | Anonymous visitors are redirected to Login | Anonymous browser session | Open `index.html`; wait for the splash screen to redirect; verify the Login page and the “Welcome back” heading. |
| LOGIN-002 | A user can sign in with valid credentials | Demo email and password | Open Login; enter the demo email and password; click Sign in; verify Home opens with the Rahul Arora greeting and account menu. |
| LOGIN-003 | Invalid credentials are rejected | Email `wrong@way2automation.com`; password `nope` | Enter the invalid values; click Sign in; verify the invalid-credentials message; confirm the user remains on Login. |
| LOGIN-004 | Empty and malformed fields are validated | Empty form; invalid email `not-an-email` | Click Sign in with empty fields; verify both required errors; enter the invalid email and submit; verify the email-format error. |
| LOGIN-005 | Password visibility can be toggled | Any password, such as `way2automation` | Enter a password; verify it is hidden; click Show password and verify it is visible; click Hide password and verify it is hidden again. |
| LOGIN-006 | Remember me stores the session persistently | Demo credentials; Remember me checked | Fill the login form; check Remember me; sign in; inspect browser storage; verify `medishop.session` is in local storage and not session storage. |
| LOGIN-007 | The forgot-password dialog sends a reset confirmation | Demo email | Click Forgot password; verify the dialog; enter the demo email; submit; verify the “Reset link sent” toast and that the dialog closes. |
| LOGIN-008 | Protected pages redirect anonymous visitors | Anonymous browser session | Open `orders.html`; verify redirect to Login with `redirect=orders.html`; verify the sign-in-required message. |
| LOGIN-009 | A signed-in user can sign out | Demo credentials | Sign in; open the account menu; click Logout; verify redirect to Login and the signed-out message. |

## Shop and Product Details

Source: `tests/02-shop.spec.ts`

| ID | Test case | Prerequisites and data | Manual steps |
| --- | --- | --- | --- |
| SHOP-001 | The first product page shows eight products | Shop page; product loading complete | Open Shop; verify “Showing 1–8 of 24 products”; count eight product cards. |
| SHOP-002 | Products can be filtered by search text | Search term `paracetamol` | Search for `paracetamol`; verify products `p1` and `p5`; verify the result count is two. |
| SHOP-003 | Products can be filtered by category | Antibiotic category | Click the Antibiotic chip; verify it is selected; verify every displayed card has the Antibiotic category. |
| SHOP-004 | Products can be sorted by lowest price | Product catalogue | Select Price low to high; verify the displayed prices are in ascending order. |
| SHOP-005 | Price and rating filters work together | Minimum 10; maximum 20; rating 4.5 | Enter the price range; select rating 4.5; verify at least one result and verify every price is between 10 and 20. |
| SHOP-006 | An empty search can be cleared | Search term `zzzzz` | Search for `zzzzz`; verify the empty state and “No products found”; click Clear filters; verify products return. |
| SHOP-007 | Users can move to the next catalogue page | Product catalogue with 24 products | Click Next; verify products 9–16 of 24; verify the URL contains `page=2`; verify page 2 is selected. |
| SHOP-008 | A product detail page shows correct information | Cardiology category; product `p4` | Select Cardiology; open Amlodipine; verify the URL, name, price `$14.99`, image, and In stock status. |
| SHOP-009 | Product information tabs can be switched | Product `p4` | Open Amlodipine; verify Details is visible and Safety is hidden; select Safety information; verify the safety content and selected tab. |
| SHOP-010 | The quantity stepper updates totals and respects limits | Product `p4`; starting quantity 1 | Open Amlodipine; verify decrease is disabled at one; increase twice; verify quantity three and line total `$44.97`. |

## Cart and Checkout

Source: `tests/03-cart-checkout.spec.ts`

| ID | Test case | Prerequisites and data | Manual steps |
| --- | --- | --- | --- |
| CART-001 | A product can be added from the product grid | Empty cart; search `paracetamol`; product `p1` | Search for paracetamol; add Paracetamol; verify the “Added to cart” toast and cart count one. |
| CART-002 | Cart quantity changes recalculate totals | Empty cart; product `p1` at `$5.99` | Add `p1`; open Cart; verify `$5.99`; increase quantity to two and verify `$11.98`; enter quantity five and verify `$29.95`. |
| CART-003 | An item can be removed from the cart | Empty cart; product `p1` | Add `p1`; open Cart; remove it; verify the empty-cart message and hidden cart count. |
| CART-004 | Valid and invalid promo codes are handled | Product `p5`; invalid code `NOPE`; valid code `WAY2SAVE` | Add `p5`; apply `NOPE` and verify an error; apply `WAY2SAVE`; verify it is applied and the discount is `-$3.85`. |
| CART-005 | Cart total equals subtotal plus tax plus shipping | Products `p1` and `p5`; order below $100 | Add both products; open Cart; read subtotal, tax, shipping, and total; verify shipping is `$4.99`, tax is 8%, and the total adds correctly. |
| CART-006 | Anonymous checkout requires sign-in | Anonymous session; product `p1` | Add a product; open Cart; click Checkout; verify redirect to Login with `redirect=checkout.html`. |
| CHECKOUT-001 | Checkout blocks an incomplete form | Authenticated session; product `p5`; empty form | Open Checkout; click Place order; verify address, city, and terms errors; verify the page remains on Checkout. |
| CHECKOUT-002 | Invalid card details are rejected | Authenticated session; card `4242`; expiry `13/29`; CVV `1` | Enter the invalid card values; submit; verify the card number, expiry, and CVV validation messages. |
| CHECKOUT-003 | Payment fields change with the payment method | Authenticated session; product `p5` | Verify card fields; select UPI and verify UPI fields; select COD and verify UPI fields are hidden and the COD note appears. |
| CHECKOUT-004 | Express delivery adds the correct surcharge | Authenticated session; standard delivery selected | Record the total; select Express; verify the total increases by `$8.00`, replacing `$4.99` shipping with `$12.99`. |
| CHECKOUT-005 | A complete checkout places an order | Authenticated session; product `p5`; address; test card | Fill customer, address, and card fields; accept terms; place the order; verify confirmation, order ID, total, empty cart, and Processing status in order history. |

## Account

Source: `tests/04-account.spec.ts`

| ID | Test case | Prerequisites and data | Manual steps |
| --- | --- | --- | --- |
| ACCOUNT-001 | The dashboard shows the signed-in user | Authenticated demo session | Open Home; verify the Rahul Arora greeting and account-menu initials `RA`. |
| ACCOUNT-002 | The profile page shows account details | Authenticated demo session | Open Profile; verify the displayed name and demo email. |
| ACCOUNT-003 | Profile changes persist after saving | Authenticated demo session; name Dr. Rahul Arora; phone `+1 555 700 1234`; role Pharmacist | Open Edit profile; change the fields; save; open Profile; verify the changes. |
| ACCOUNT-004 | A delivery address can be added and deleted | Authenticated account with no addresses | Open Addresses; add a Clinic address with the supplied contact and location data; verify the card and Default status; delete it; verify the empty state. |
| ACCOUNT-005 | Address required fields are validated | Authenticated session; empty name; pincode `12` | Open Add address; leave the name empty; enter pincode `12`; save; verify both validation errors and that the dialog remains open. |
| ACCOUNT-006 | Dark mode persists between pages | Authenticated session | Open Settings; enable Dark mode; verify the dark theme; open Home and verify it remains; return to Settings and disable it. |
| ACCOUNT-007 | Order history can be filtered by status | Seeded history with three orders; delivered order `MS-8492-AX` | Open Orders; select Delivered; verify one order and `MS-8492-AX`; reset filters; verify three orders return. |
| ACCOUNT-008 | An order shows its tracking timeline | Seeded delivered order `MS-8492-AX` | Open Orders; view order details; verify the URL, Delivered status, four completed timeline entries, and total `$42.50`. |
| ACCOUNT-009 | A processing order can be cancelled | Processing order `MS-9255-CZ`; reason Ordered by mistake | Open the order; click Cancel; choose Ordered by mistake; confirm; verify Cancelled status and the cancellation reason. |
| ACCOUNT-010 | Wellness hydration can be tracked and reset | Authenticated session; initial count three | Open Wellness; add a glass and verify count four; change the goal to six; reset hydration; verify count zero and disabled Remove button. |

## Prescriptions and Payment Methods

Source: `tests/05-prescriptions-payments.spec.ts`

| ID | Test case | Prerequisites and data | Manual steps |
| --- | --- | --- | --- |
| RX-001 | Prescriptions opens from the profile menu | Authenticated account with no prescriptions | Open Profile; select Prescriptions; verify the page heading and empty state. |
| RX-002 | A text prescription can be uploaded and verified | `prescription.txt`; patient Rahul Arora; doctor Dr. Meera Kapoor; consent checked | Open Prescriptions; upload the TXT file; enter patient, doctor, and notes; accept consent; save; wait for Under review then Verified; reload and verify Verified remains. |
| RX-003 | A text prescription can be previewed and deleted | `prescription.txt`; patient Rahul Arora; consent checked | Upload and save the TXT file; open Preview; verify Amoxicillin text and patient name; close Preview; delete the prescription; verify the empty state. |
| RX-004 | Unsupported prescription file types are rejected | `tests/fixtures/scan.pdf` | Open the upload dialog; select the PDF; verify the accepted-file-types error. |
| RX-005 | Prescription required fields are validated | No file; empty patient name; consent unchecked | Open the upload dialog; leave fields empty; save; verify file, patient-name, and consent errors; verify the dialog remains open. |
| RX-006 | An image prescription can be uploaded and previewed | `prescription.jpg`; patient Rahul Arora; consent checked | Upload the JPG; enter the patient name; accept consent; save; verify filename and Image/JPG type; open Preview; verify a base64 JPEG image source. |
| PAY-001 | A demo card can be saved as the default method | Test card; default option checked | Open Payment methods; add a method; use the test-card button; check Default; save; verify Visa ending 4242 and expiry 12/29; open Profile and verify the payment summary and count. |
| PAY-002 | Expired cards and short CVVs are rejected | Card `5555555555554444`; expiry `01/20`; CVV `12` | Add a card with the invalid values; save; verify expired-card and short-CVV errors; verify the dialog remains open. |
| PAY-003 | A UPI method can become the default and a card can be deleted | Test card; UPI `rahul@okbank`; nickname Personal UPI | Save a test card; add a UPI method; enter its details; save; set UPI as default; verify the card is no longer default; delete the card; verify only UPI remains. |
| PAY-004 | A malformed UPI ID is rejected | UPI value `not-a-upi-id` | Add a UPI method; enter the malformed ID; save; verify the valid-UPI-format error. |
| PAY-005 | Anonymous users cannot open payment or prescription pages | New browser context with no storage state | Open Payment methods; verify Login redirect; open Prescriptions; verify Login redirect; close the page. |

## Checkout Integration

Source: `tests/05-prescriptions-payments.spec.ts`

| ID | Test case | Prerequisites and data | Manual steps |
| --- | --- | --- | --- |
| INTEGRATION-001 | Checkout can use a saved default card | Saved test card; product `p1`; valid address and terms | Save the test card; add Paracetamol; open Checkout; verify the saved payment is selected and new-payment fields are hidden; fill the address; accept terms; place the order; verify Visa ending 4242 on confirmation. |
| INTEGRATION-002 | Checkout can switch back to a new card | Saved test card; product `p1`; valid address and terms | Save the card; add Paracetamol; open Checkout; select Use new payment method; verify new fields appear; fill the address; submit; verify the required card-number error and remain on Checkout. |
| INTEGRATION-003 | Rx products require a prescription | Saved test card; Rx product `p2`; no saved prescription | Add Amoxicillin; open Checkout; verify the prescription note and upload link; fill the address; submit; verify the prescription-required error. |
| INTEGRATION-004 | A saved prescription can be attached to an Rx order | Saved test card; verified `prescription.txt`; product `p2`; valid address and terms | Save the card and prescription; add Amoxicillin; open Checkout; verify the prescription is selected; fill the address; place the order; verify confirmation and prescription filename; open order details and verify prescription and payment. |
| INTEGRATION-005 | Non-Rx checkout says that no prescription is needed | Product `p1` | Add Paracetamol; open Checkout; verify “No prescription-only items”; verify the prescription field is hidden and the upload link is visible. |

## Account Data Isolation

Source: `tests/06-account-isolation.spec.ts`

These tests register a unique clinic account through the UI instead of using the saved setup state.

| ID | Test case | Prerequisites and data | Manual steps |
| --- | --- | --- | --- |
| ISO-001 | A new clinic does not inherit another account’s data | Demo account; unique clinic account; product `p1`; test card; `prescription.txt` | Sign in as the demo user; add a product, save a card, and upload a prescription; sign out; register and sign in as a new clinic; verify empty cart, payments, prescriptions, and zero profile counts; sign back in as the demo user; verify the original data remains. |
| ISO-002 | Orders remain isolated between accounts | Demo account; unique clinic account; product `p1` | Sign in as the demo user; add `p1` and place an order; verify it in Orders; sign out; register and sign in as the clinic; verify the clinic cannot see the demo order but can see its own seeded order history. |
| ISO-003 | A guest cart follows the shopper after login | Anonymous cart; product `p1`; demo credentials | Add `p1` while anonymous; verify cart count one; sign in as the demo user; verify the count remains; open Cart and verify the `p1` row. |

## Shared Helpers and Fixtures

The helper functions in `tests/helpers.ts` support the tests but are not separate test cases. They handle login, registration, sign-out, product loading, cart cleanup, test-card setup, prescription upload, order placement, and currency parsing.

The fixture files are `tests/fixtures/prescription.txt` for a valid text prescription, `tests/fixtures/prescription.jpg` for a valid image prescription, and `tests/fixtures/scan.pdf` for unsupported-file validation.