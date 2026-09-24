import { test, expect, Page } from '@playwright/test';
import { FILES, STORAGE_STATE, addToCart, saveTestCard, uploadPrescription } from './helpers';

/* Signed in for every test, using the state saved by tests/auth.setup.ts. */
test.use({ storageState: STORAGE_STATE });

test.describe('My prescriptions', () => {
  test(
    'opens from the profile menu',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Prescriptions' },
        { type: 'story', description: 'RX-101' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/profile.html');

      await page.getByTestId('profile_menu_prescriptions').click();

      await page.waitForURL('**/prescriptions.html');
      await expect(page.getByTestId('prescriptions_heading')).toHaveText('My prescriptions');
      await expect(page.getByTestId('prescriptions_empty')).toBeVisible();
    }
  );

  test(
    'uploads a text prescription and waits for it to be verified',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Prescriptions' },
        { type: 'story', description: 'RX-102' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/prescriptions.html');
      await page.getByRole('button', { name: 'Upload prescription' }).click();

      const dialog = page.getByTestId('prescription_dialog');
      await expect(dialog).toBeVisible();

      await page.getByLabel('Prescription file').setInputFiles(FILES.prescriptionText);
      await expect(page.getByTestId('rx_file_selected')).toContainText('prescription.txt');

      await page.getByLabel('Patient name').fill('Rahul Arora');
      await page.getByLabel('Prescribing doctor').fill('Dr. Meera Kapoor');
      await page.getByTestId('rx_notes_input').fill('Repeat prescription — 3 month supply');
      await page.getByTestId('rx_consent_checkbox').check();
      await page.getByTestId('prescription_save_button').click();

      await expect(dialog).toBeHidden();
      await expect(page.getByTestId('prescription_file_0')).toHaveText('prescription.txt');
      await expect(page.getByTestId('prescription_type_0')).toHaveText('Text · TXT');

      /* The pharmacist "review" is deliberately async — auto-waiting handles it. */
      await expect(page.getByTestId('prescription_status_0')).toHaveText('Under review');
      await expect(page.getByTestId('prescription_status_0')).toHaveText('Verified');

      await page.reload();
      await expect(page.getByTestId('prescription_status_0')).toHaveText('Verified');
    }
  );

  test(
    'previews the uploaded text file and deletes it',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Prescriptions' },
        { type: 'story', description: 'RX-103' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/prescriptions.html');
      await page.getByRole('button', { name: 'Upload prescription' }).click();
      await page.getByLabel('Prescription file').setInputFiles(FILES.prescriptionText);
      await page.getByLabel('Patient name').fill('Rahul Arora');
      await page.getByTestId('rx_consent_checkbox').check();
      await page.getByTestId('prescription_save_button').click();

      await page.getByTestId('view_prescription_0').click();
      await expect(page.getByTestId('prescription_preview_text')).toContainText('Amoxicillin 250mg');
      await expect(page.getByTestId('view_patient')).toHaveText('Rahul Arora');
      await page.getByTestId('prescription_view_done_button').click();

      await page.getByTestId('delete_prescription_0').click();
      await expect(page.getByTestId('prescriptions_empty')).toBeVisible();
    }
  );

  test(
    'rejects a file type that is not JPG, DOCX or TXT',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Prescriptions' },
        { type: 'story', description: 'RX-104' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/prescriptions.html');
      await page.getByRole('button', { name: 'Upload prescription' }).click();

      await page.getByLabel('Prescription file').setInputFiles(FILES.unsupported);

      await expect(page.getByTestId('rx_file_input_error'))
        .toHaveText('Only JPG, DOCX or TXT files are accepted');
    }
  );

  test(
    'validates the file, patient name and consent checkbox',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Prescriptions' },
        { type: 'story', description: 'RX-105' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/prescriptions.html');
      await page.getByRole('button', { name: 'Upload prescription' }).click();

      await page.getByLabel('Patient name').fill('');
      await page.getByTestId('prescription_save_button').click();

      await expect(page.getByTestId('rx_file_input_error')).toHaveText('Choose a prescription file to upload');
      await expect(page.getByTestId('rx_patient_input_error')).toHaveText('Patient name is required');
      await expect(page.getByTestId('rx_consent_checkbox_error'))
        .toHaveText('Please confirm the prescription is valid');
      await expect(page.getByTestId('prescription_dialog')).toBeVisible();
    }
  );

  test(
    'stores an image prescription with an inline preview',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Prescriptions' },
        { type: 'story', description: 'RX-106' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/prescriptions.html');
      await page.getByRole('button', { name: 'Upload prescription' }).click();

      await page.getByLabel('Prescription file').setInputFiles(FILES.prescriptionImage);
      await page.getByLabel('Patient name').fill('Rahul Arora');
      await page.getByTestId('rx_consent_checkbox').check();
      await page.getByTestId('prescription_save_button').click();

      await expect(page.getByTestId('prescription_file_0')).toHaveText('prescription.jpg');
      await expect(page.getByTestId('prescription_type_0')).toHaveText('Image · JPG');

      await page.getByTestId('view_prescription_0').click();
      await expect(page.getByTestId('prescription_preview_image'))
        .toHaveAttribute('src', /^data:image\/jpeg;base64,/);
    }
  );
});

test.describe('Payment methods', () => {
  test(
    'saves the demo card as the default method',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Payments' },
        { type: 'story', description: 'PAY-101' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/payment-methods.html');
      await expect(page.getByTestId('payments_empty')).toBeVisible();

      await page.getByRole('button', { name: 'Add payment method' }).click();
      await page.getByRole('button', { name: 'Use test card' }).click();
      await expect(page.getByLabel('Card number')).toHaveValue('4242 4242 4242 4242');

      await page.getByTestId('pm_default_checkbox').check();
      await page.getByTestId('payment_save_button').click();

      await expect(page.getByTestId('payment_dialog')).toBeHidden();
      await expect(page.getByTestId('payment_label_0')).toHaveText('Visa •••• 4242');
      await expect(page.getByTestId('payment_type_0')).toHaveText('Visa');
      await expect(page.getByTestId('payment_default_0')).toHaveText('Default');
      await expect(page.getByTestId('payment_holder_0')).toContainText('expires 12/29');

      /* The default shows up as a summary on the profile page. */
      await page.goto('/MediShopWebApp/profile.html');
      await expect(page.getByTestId('profile_menu_payments')).toContainText('Visa ending 4242');
      await expect(page.getByTestId('stat_payments_count')).toHaveText('1');
    }
  );

  test(
    'rejects an expired card and a short CVV',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Payments' },
        { type: 'story', description: 'PAY-102' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/payment-methods.html');
      await page.getByRole('button', { name: 'Add payment method' }).click();

      await page.getByLabel('Card number').fill('5555555555554444');
      await page.getByLabel('Expiry date').fill('0120');
      await page.getByLabel('CVV').fill('12');
      await page.getByLabel('Name on card').fill('Rahul Arora');
      await page.getByTestId('payment_save_button').click();

      await expect(page.getByTestId('pm_card_expiry_input_error')).toHaveText('This card has expired');
      await expect(page.getByTestId('pm_card_cvv_input_error')).toHaveText('CVV must be 3 or 4 digits');
      await expect(page.getByTestId('payment_dialog')).toBeVisible();
    }
  );

  test(
    'saves a UPI ID and switches the default between methods',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Payments' },
        { type: 'story', description: 'PAY-103' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/payment-methods.html');

      await page.getByRole('button', { name: 'Add payment method' }).click();
      await page.getByRole('button', { name: 'Use test card' }).click();
      await page.getByTestId('payment_save_button').click();
      await expect(page.getByTestId('payment_default_0')).toBeVisible();

      await page.getByRole('button', { name: 'Add payment method' }).click();
      await page.getByLabel('Payment type').selectOption('UPI');
      await expect(page.getByTestId('pm_card_fields')).toBeHidden();
      await page.getByLabel('UPI ID').fill('rahul@okbank');
      await page.getByTestId('pm_nickname_input').fill('Personal UPI');
      await page.getByTestId('payment_save_button').click();

      await expect(page.getByTestId('payment_label_1')).toHaveText('rahul@okbank');

      await page.getByTestId('set_default_payment_1').click();
      await expect(page.getByTestId('payment_default_1')).toHaveText('Default');
      await expect(page.getByTestId('payment_default_0')).toHaveCount(0);

      await page.getByTestId('delete_payment_0').click();
      await expect(page.getByTestId('payment_card_1')).toHaveCount(0);
      await expect(page.getByTestId('payment_label_0')).toHaveText('rahul@okbank');
    }
  );

  test(
    'rejects a malformed UPI ID',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Payments' },
        { type: 'story', description: 'PAY-104' },
      ],
    },
    async ({ page }) => {
      await page.goto('/MediShopWebApp/payment-methods.html');
      await page.getByRole('button', { name: 'Add payment method' }).click();
      await page.getByLabel('Payment type').selectOption('UPI');

      await page.getByLabel('UPI ID').fill('not-a-upi-id');
      await page.getByTestId('payment_save_button').click();

      await expect(page.getByTestId('pm_upi_id_input_error'))
        .toHaveText('Enter a valid UPI ID, e.g. name@bank');
    }
  );

  test(
    'redirects anonymous visitors to the login page',
    {
      annotation: [
        { type: 'priority', description: 'P1' },
        { type: 'severity', description: 'critical' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Payments' },
        { type: 'story', description: 'PAY-105' },
      ],
    },
    async ({ browser }) => {
      const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });

      await page.goto('/MediShopWebApp/payment-methods.html');
      await page.waitForURL(/login\.html\?redirect=/);

      await page.goto('/MediShopWebApp/prescriptions.html');
      await page.waitForURL(/login\.html\?redirect=/);

      await page.close();
    }
  );
});

test.describe('Checkout integration', () => {
  /* The address the demo user checks out with. */
  async function fillAddress(page: Page) {
    await page.getByTestId('checkout_house_input').fill('42 Willow Court, Sector 21');
    await page.getByTestId('checkout_city_input').fill('Chandigarh');
    await page.getByTestId('checkout_state_input').fill('Punjab');
    await page.getByTestId('checkout_pincode_input').fill('160022');
    await page.getByTestId('terms_checkbox').check();
  }

  test(
    'pays with the saved default card without re-entering it',
    {
      annotation: [
        { type: 'priority', description: 'P1' },
        { type: 'severity', description: 'critical' },
        { type: 'owner', description: 'Rahul' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-106' },
      ],
    },
    async ({ page }) => {
      await saveTestCard(page);
      await addToCart(page, 'paracetamol', 'p1');
      await page.goto('/MediShopWebApp/checkout.html');

      await expect(page.getByTestId('saved_payments')).toBeVisible();
      await expect(page.getByTestId('saved_payment_0')).toBeChecked();
      await expect(page.getByTestId('saved_payment_0')).toHaveValue(/^pm-/);
      /* The card / UPI / COD form is out of the way while a saved method is used. */
      await expect(page.getByTestId('new_payment_section')).toBeHidden();

      await fillAddress(page);
      await page.getByTestId('checkout_place_order_button').click();

      await page.waitForURL(/order-confirmation\.html/);
      await expect(page.getByTestId('confirmation_payment')).toHaveText('Visa •••• 4242');
    }
  );

  test(
    'switches back to entering a new card',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Ananya' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-107' },
      ],
    },
    async ({ page }) => {
      await saveTestCard(page);
      await addToCart(page, 'paracetamol', 'p1');
      await page.goto('/MediShopWebApp/checkout.html');

      await page.getByTestId('use_new_payment_method').check();
      await expect(page.getByTestId('new_payment_section')).toBeVisible();

      await fillAddress(page);
      await page.getByTestId('checkout_place_order_button').click();

      /* The manual card fields are validated again once they are in play. */
      await expect(page.getByTestId('card_number_input_error')).toHaveText('Card number is required');
      await expect(page).toHaveURL(/checkout\.html/);
    }
  );

  test(
    'links to the upload page and blocks Rx items with no prescription',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Vikram' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-108' },
      ],
    },
    async ({ page }) => {
      await saveTestCard(page);
      await addToCart(page, 'amoxicillin', 'p2');
      await page.goto('/MediShopWebApp/checkout.html');

      await expect(page.getByTestId('checkout_prescription_note')).toContainText('Amoxicillin 250mg');
      const link = page.getByTestId('checkout_prescription_link');
      await expect(link).toHaveText('Upload a prescription');
      await expect(link).toHaveAttribute('href', 'prescriptions.html');

      await fillAddress(page);
      await page.getByTestId('checkout_place_order_button').click();

      await expect(page.getByTestId('prescription_select_error'))
        .toHaveText('Upload a prescription before ordering Rx items');
      await expect(page).toHaveURL(/checkout\.html/);
    }
  );

  test(
    'attaches a saved prescription to an Rx order',
    {
      annotation: [
        { type: 'priority', description: 'P2' },
        { type: 'severity', description: 'major' },
        { type: 'owner', description: 'Meera' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-109' },
      ],
    },
    async ({ page }) => {
      await saveTestCard(page);
      await uploadPrescription(page);
      await addToCart(page, 'amoxicillin', 'p2');
      await page.goto('/MediShopWebApp/checkout.html');

      await expect(page.getByTestId('checkout_prescription_link')).toHaveText('My prescriptions');
      await expect(page.getByLabel('Attach a prescription')).toHaveValue(/^rx-/);
      await expect(page.getByLabel('Attach a prescription'))
        .toContainText('prescription.txt · Rahul Arora (Verified)');

      await fillAddress(page);
      await page.getByTestId('checkout_place_order_button').click();

      await page.waitForURL(/order-confirmation\.html/);
      await expect(page.getByTestId('confirmation_prescription')).toHaveText('prescription.txt');

      /* It stays on the order afterwards. */
      const orderId = await page.getByTestId('confirmation_order_id').innerText();
      await page.goto(`/MediShopWebApp/order-details.html?id=${orderId}`);
      await expect(page.getByTestId('order_prescription')).toHaveText('prescription.txt');
      await expect(page.getByTestId('order_payment')).toHaveText('Visa •••• 4242');
    }
  );

  test(
    'says when no prescription is needed',
    {
      annotation: [
        { type: 'priority', description: 'P3' },
        { type: 'severity', description: 'minor' },
        { type: 'owner', description: 'Priya' },
        { type: 'feature', description: 'Checkout' },
        { type: 'story', description: 'CHK-110' },
      ],
    },
    async ({ page }) => {
      await addToCart(page, 'paracetamol', 'p1');
      await page.goto('/MediShopWebApp/checkout.html');

      await expect(page.getByTestId('checkout_prescription_note'))
        .toHaveText('No prescription-only items in this order.');
      await expect(page.getByTestId('checkout_prescription_field')).toBeHidden();
      await expect(page.getByTestId('checkout_prescription_link')).toBeVisible();
    }
  );
});
