import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8000';

export default defineConfig({
	testDir: './scenarios',
	fullyParallel: false,
	retries: 0,
	// ログイン・管理画面 SPA・保存 API・公開ページのハイドレートを含め、60s では必ず不足する。
	timeout: 300_000,
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	reporter: [
		['list'],
		['html', { outputFolder: 'playwright-report', open: 'never' }],
	],
});
