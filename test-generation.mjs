import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

console.log('Navigating to localhost:3000...');
await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Take screenshot of initial state
await page.screenshot({ path: '/tmp/uigen-01-initial.png', fullPage: false });
console.log('Screenshot 1: Initial state saved');

// Look for a textarea or input for the chat
const chatInput = await page.locator('textarea, input[type="text"]').first();
if (await chatInput.isVisible()) {
  console.log('Found chat input, typing prompt...');
  await chatInput.fill('Build a pricing page with three tiers: Starter, Pro, and Enterprise. Include a recommended badge on the Pro tier.');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/uigen-02-typed.png', fullPage: false });
  console.log('Screenshot 2: Prompt typed');

  // Find and click the send button, or press Enter
  const sendButton = await page.locator('button[type="submit"]').first();
  if (await sendButton.isVisible()) {
    console.log('Clicking send button...');
    await sendButton.click();
  } else {
    console.log('Pressing Enter to send...');
    await chatInput.press('Enter');
  }

  // Wait for generation to complete (watch for streaming to finish)
  console.log('Waiting for generation...');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/uigen-03-generating.png', fullPage: false });
  console.log('Screenshot 3: During generation');

  // Wait longer for full generation
  await page.waitForTimeout(30000);
  await page.screenshot({ path: '/tmp/uigen-04-complete.png', fullPage: false });
  console.log('Screenshot 4: After generation');

  // Try to find and click on the preview panel if there's a toggle
  const previewTab = page.locator('text=Preview').first();
  if (await previewTab.isVisible().catch(() => false)) {
    await previewTab.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: '/tmp/uigen-05-preview.png', fullPage: false });
  console.log('Screenshot 5: Preview panel');
} else {
  console.log('No chat input found on the page');
  // Maybe we need to log in or create a project first
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: '/tmp/uigen-01-no-input.png', fullPage: false });
}

console.log('Done! Closing browser in 5 seconds...');
await page.waitForTimeout(5000);
await browser.close();
