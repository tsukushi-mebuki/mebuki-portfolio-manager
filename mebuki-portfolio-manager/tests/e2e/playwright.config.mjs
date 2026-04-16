import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8000';

export default defineConfig({
	testDir: './scenarios',
	fullyParallel: false,
	retries: 0,
	timeout: 60_000,
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	reporter: [['list']],
});
