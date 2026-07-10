import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.APP_URL ?? 'http://localhost:9000';
const outputDir = process.env.OUTPUT_DIR ?? '/Users/luisherrera/Develop/portfolio/temp-projects-screenshots/payroll';
const email = process.env.LOGIN_EMAIL ?? 'johndoe@gmail.com';
const password = process.env.LOGIN_PASSWORD ?? 'Password123!';

const pages = [
  { name: '01-login', path: '/login', auth: false },
  { name: '02-dashboard', path: '/' },
  { name: '03-payroll-run', path: '/payroll/payroll-run' },
  { name: '04-timesheet', path: '/timesheet' },
  { name: '05-reports', path: '/reports' },
  { name: '06-employees', path: '/employees' },
  { name: '07-pay-period', path: '/payroll/pay-period' },
  { name: '08-generate-payslip', path: '/payroll/generate-payslip' },
  { name: '09-scheduler', path: '/scheduler' },
];

function appUrl(routePath) {
  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${baseUrl}/#${normalized}`;
}

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

async function waitForAppReady() {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function login() {
  await page.goto(appUrl('/login'), { waitUntil: 'domcontentloaded' });
  await waitForAppReady();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  await page.waitForFunction(() => {
    const hash = window.location.hash || '#/';
    return !hash.includes('/login');
  }, { timeout: 30000 });

  await waitForAppReady();
}

let loggedIn = false;

for (const target of pages) {
  try {
    if (target.auth !== false && !loggedIn) {
      await login();
      loggedIn = true;
    }

    await page.goto(appUrl(target.path), { waitUntil: 'domcontentloaded' });
    await waitForAppReady();

    const filePath = path.join(outputDir, `${target.name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved ${filePath}`);
  } catch (error) {
    console.error(`Failed ${target.name}:`, error instanceof Error ? error.message : error);
  }
}

await browser.close();
