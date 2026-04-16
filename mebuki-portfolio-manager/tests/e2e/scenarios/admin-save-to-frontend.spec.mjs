import { expect, test } from '@playwright/test';

const adminUser = process.env.E2E_ADMIN_USER;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const adminPath = process.env.E2E_ADMIN_PATH || '/wp-admin/admin.php?page=mebuki-pm';
const frontendPath = process.env.E2E_FRONTEND_PATH || '/';

test.describe('Admin save to frontend smoke', () => {
	test.skip(
		!adminUser || !adminPassword,
		'E2E_ADMIN_USER / E2E_ADMIN_PASSWORD are required.'
	);

	test('管理画面で保存したAboutが公開ページに表示される', async ({ page, baseURL }) => {
		const marker = Date.now().toString();
		const aboutTitle = `E2E About ${marker}`;
		const aboutBody = `E2E Body ${marker}`;

		await page.goto('/wp-login.php');
		await page.locator('#user_login').fill(adminUser);
		await page.locator('#user_pass').fill(adminPassword);
		await page.locator('#wp-submit').click();
		await page.waitForURL(/wp-admin/);

		await page.goto(new URL(adminPath, baseURL).toString());
		await expect(page.getByRole('heading', { name: 'サイト表示マスター' })).toBeVisible();

		const addButton = page.getByRole('button', {
			name: '＋ タイトル＋本文のブロックを追加',
		});
		if (await addButton.count()) {
			await addButton.first().click();
		}

		await page.locator('label:has-text("タイトル") + input').first().fill(aboutTitle);
		await page.locator('label:has-text("本文") + textarea').first().fill(aboutBody);

		await page.getByRole('button', { name: '保存' }).click();
		await expect(page.getByText('保存しました。')).toBeVisible();

		await page.goto(new URL(frontendPath, baseURL).toString());
		await expect(page.getByText(aboutTitle)).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(aboutBody)).toBeVisible({ timeout: 15_000 });
	});
});
