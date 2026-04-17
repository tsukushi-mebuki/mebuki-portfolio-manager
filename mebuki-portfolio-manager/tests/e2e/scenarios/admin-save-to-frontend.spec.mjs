import { expect, test } from '@playwright/test';

const adminUser = process.env.E2E_ADMIN_USER;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const adminPath = process.env.E2E_ADMIN_PATH || '/wp-admin/admin.php?page=mebuki-pm';

/** 公開ポートフォリオの描画領域（アサーションをここに閉じて誤検知を防ぐ） */
function portfolioRoot(page) {
	return page.locator('#mebuki-frontend-root');
}

const ASSERT_PUBLIC_MS = 45_000;
const HYDRATE_MS = 60_000;
/** 管理画面: ログイン後の遷移・REST GET・メイン UI 描画まで（CI では読み込みが遅いことがある） */
const ADMIN_READY_MS = 120_000;

/** プラグイン設定画面（admin.php?page=mebuki-pm） */
function isMebukiPmScreen(url) {
	return url.pathname.endsWith('admin.php') && url.searchParams.get('page') === 'mebuki-pm';
}

/**
 * WordPress REST URL は環境により
 * - /wp-json/mebuki-pm/v1/settings/me
 * - /?rest_route=/mebuki-pm/v1/settings/me
 * の両方があり得る。
 */
function isSettingsMeGetResponse(resp) {
	if (resp.request().method() !== 'GET') {
		return false;
	}
	const raw = resp.url();
	if (raw.includes('/mebuki-pm/v1/settings/me')) {
		return true;
	}
	try {
		const url = new URL(raw);
		return (url.searchParams.get('rest_route') || '').includes('/mebuki-pm/v1/settings/me');
	} catch {
		return false;
	}
}

async function waitForAdminReady(page, baseURL) {
	const adminUrl = new URL(adminPath, baseURL).toString();
	// SettingsEditor は設定 GET 完了まで「保存」もセクションも出さない（読み込み中のみ）。
	// CI では /wp-json 側が 404 の後に ?rest_route 側で成功することがあるため、
	// 最初のレスポンスではなく「成功レスポンス」を待つ。
	const settingsLoaded = page.waitForResponse(
		(resp) => isSettingsMeGetResponse(resp) && resp.ok(),
		{ timeout: ADMIN_READY_MS }
	);
	await page.goto(adminUrl, { waitUntil: 'load' });
	await page.waitForURL(isMebukiPmScreen, { timeout: ADMIN_READY_MS });
	await settingsLoaded;
	await expect(page.getByRole('heading', { name: 'サイト表示マスター' })).toBeVisible({
		timeout: ADMIN_READY_MS,
	});
}

async function loginAndOpenAdmin(page, baseURL) {
	await page.goto('/wp-login.php');
	await page.locator('#user_login').fill(adminUser);
	await page.locator('#user_pass').fill(adminPassword);
	await page.locator('#wp-submit').click();
	// 一度 admin 画面へ明示遷移するため、ログイン直後の遷移先（ダッシュボード/ログインリダイレクト）に依存しない。
	await waitForAdminReady(page, baseURL);
}

function sectionCard(page, sectionId) {
	return page.locator(`[data-section-id="${sectionId}"]`).first();
}

async function saveSettings(page) {
	const responsePromise = page.waitForResponse(
		(resp) =>
			resp.url().includes('mebuki-pm/v1/settings/me') &&
			resp.request().method() === 'POST' &&
			resp.status() >= 200 &&
			resp.status() < 300,
		{ timeout: 60_000 }
	);
	await page.getByRole('button', { name: '保存' }).click();
	await responsePromise;
	await expect(page.getByText('保存しました。')).toBeVisible();
}

/**
 * [mebuki_portfolio] 付き公開ページへの候補パス（優先順）。
 * - E2E_FRONTEND_PATH があればそれのみ
 * - 未設定時は ?page_id= を最優先し、続けて index.php・きれいな URL（パーマリンク未反映の Docker/CI 向け）
 */
async function collectPortfolioPublicPaths(request, baseURL) {
	const env = (process.env.E2E_FRONTEND_PATH || '').trim();
	if (env) {
		return [env.startsWith('/') ? env : `/${env}`];
	}
	const base = String(baseURL ?? '').replace(/\/$/, '');
	if (!base) {
		throw new Error('Playwright の baseURL が空です。E2E_BASE_URL を設定してください。');
	}
	const params = { slug: 'portfolio-e2e', per_page: '1' };
	let res = await request.get(`${base}/wp-json/wp/v2/pages`, { params });
	if (!res.ok() && res.status() === 404) {
		// CI で rewrite が未収束なときは ?rest_route 経由にフォールバックする。
		res = await request.get(`${base}/`, {
			params: { rest_route: '/wp/v2/pages', ...params },
		});
	}
	if (!res.ok()) {
		throw new Error(
			`WP REST が ${res.status()} を返しました。E2E_BASE_URL と WordPress の起動を確認してください。`
		);
	}
	const pages = await res.json();
	const row = Array.isArray(pages) && pages[0] ? pages[0] : null;
	const pageId = row && (row.id ?? row.ID) != null ? Number(row.id ?? row.ID) : NaN;
	if (!row || !Number.isFinite(pageId) || pageId <= 0) {
		throw new Error(
			'slug `portfolio-e2e` の固定ページが見つかりません。scripts/setup-wp-e2e.php を実行するか、E2E_FRONTEND_PATH を設定してください。'
		);
	}
	const paths = [];
	paths.push(`/?page_id=${pageId}`);
	paths.push(`/index.php?page_id=${pageId}`);
	paths.push(`/?p=${pageId}`);
	// setup-wp-e2e.php で page_on_front をこの固定ページにしているため、
	// rewrite 不安定時の最終フォールバックとしてルートも候補に入れる。
	paths.push('/');
	if (row.link) {
		try {
			const p = new URL(row.link).pathname || '/';
			if (p !== '/') {
				paths.push(p);
			}
		} catch {
			// ignore malformed link
		}
	}
	const seen = new Set();
	const out = [];
	for (const p of paths) {
		if (seen.has(p)) continue;
		seen.add(p);
		out.push(p);
	}
	return out;
}

/**
 * ショートコード付き公開ページを開き、フロント React が実際にマウントされるまで待つ。
 * #mebuki-frontend-root は PHP が空 div を出すだけなので、attached だけでは未マウントでも通ってしまう。
 */
async function openPublicPortfolio(page, request, baseURL) {
	const paths = await collectPortfolioPublicPaths(request, baseURL);
	const errors = [];
	for (const path of paths) {
		const pageErrors = [];
		const onPageError = (err) => pageErrors.push(err.message);
		page.on('pageerror', onPageError);
		try {
			let response;
			try {
				response = await page.goto(path, { waitUntil: 'load' });
			} catch (e) {
				errors.push(`${path}: navigation ${String(e)}`);
				continue;
			}
			if (!response) {
				errors.push(`${path}: no response`);
				continue;
			}
			if (response.status() >= 400) {
				errors.push(`${path}: HTTP ${response.status()}`);
				continue;
			}
			try {
				await page.locator('#mebuki-frontend-root').waitFor({ state: 'attached', timeout: 25_000 });
			} catch (e) {
				errors.push(`${path}: no #mebuki-frontend-root (${String(e)})`);
				continue;
			}
			try {
				await page.waitForFunction(
					() => {
						const el = document.getElementById('mebuki-frontend-root');
						if (!el) {
							return false;
						}
						if (el.querySelector('[data-theme]')) {
							return true;
						}
						return el.childElementCount > 0;
					},
					{ timeout: HYDRATE_MS }
				);
			} catch (e) {
				const extra =
					pageErrors.length > 0 ? ` | pageerror: ${pageErrors.join('; ')}` : '';
				errors.push(`${path}: portfolio UI did not mount (${String(e)})${extra}`);
				continue;
			}
			return;
		} finally {
			page.off('pageerror', onPageError);
		}
	}
	throw new Error(
		`公開ポートフォリオページを開けませんでした。${errors.join(' | ')}`
	);
}

async function openReviewFormFromPortfolio(page, request, baseURL) {
	const writeLink = portfolioRoot(page).getByRole('link', { name: '口コミを書く' }).first();
	await expect(writeLink).toBeVisible({ timeout: ASSERT_PUBLIC_MS });
	const href = await writeLink.getAttribute('href');
	if (!href) {
		throw new Error('口コミフォームへのリンク href を取得できませんでした。');
	}
	const heading = page.getByRole('heading', { name: '口コミ投稿フォーム' });
	await page.goto(href, { waitUntil: 'load' });
	if ((await heading.count()) > 0) {
		await expect(heading).toBeVisible({ timeout: 20_000 });
		return;
	}
	// /reviews/ が環境依存で解決できないケースでは、公開ページにクエリを付けて直接フォーム表示へフォールバックする。
	const parsed = new URL(href);
	const target = parsed.searchParams.get('mebuki_review_target') || '';
	const itemId = parsed.searchParams.get('item_id') || '';
	if (!target || !itemId) {
		throw new Error(`口コミフォームURLのクエリが不足しています: ${href}`);
	}
	const publicPaths = await collectPortfolioPublicPaths(request, baseURL);
	const fallback = new URL(publicPaths[0], baseURL);
	fallback.searchParams.set('mebuki_review_target', target);
	fallback.searchParams.set('item_id', itemId);
	await page.goto(fallback.toString(), { waitUntil: 'load' });
	await expect(heading).toBeVisible({ timeout: 20_000 });
}

test.describe('Admin save to frontend smoke', () => {
	test.skip(
		!adminUser || !adminPassword,
		'E2E_ADMIN_USER / E2E_ADMIN_PASSWORD are required.'
	);

	test('クレド: 保存内容が公開ページへ反映される', async ({ page, request, baseURL }) => {
		const marker = Date.now().toString();
		const credoTitle = `E2E Credo ${marker}`;
		const credoBody = `E2E Credo Body ${marker}`;

		await loginAndOpenAdmin(page, baseURL);
		const card = sectionCard(page, 'credo');
		await card.getByPlaceholder('例: Credo / 大切にしていること').fill(credoTitle);
		await card.getByPlaceholder('信条や大切にしていることを入力').fill(credoBody);
		await saveSettings(page);

		await openPublicPortfolio(page, request, baseURL);
		await expect(portfolioRoot(page).getByText(credoTitle)).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
		await expect(portfolioRoot(page).getByText(credoBody)).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
	});

	test('自己紹介: 保存内容が公開ページへ反映される', async ({ page, request, baseURL }) => {
		const marker = Date.now().toString();
		const aboutTitle = `E2E About ${marker}`;
		const aboutBody = `E2E About Body ${marker}`;

		await loginAndOpenAdmin(page, baseURL);
		const card = sectionCard(page, 'about');
		const addButton = card.getByRole('button', {
			name: '＋ タイトル＋本文のブロックを追加',
		});
		if ((await card.getByPlaceholder('例: 機材紹介').count()) === 0) {
			await addButton.click();
		}
		await card.getByPlaceholder('例: 機材紹介').first().fill(aboutTitle);
		await card.getByPlaceholder('このブロックの本文').first().fill(aboutBody);
		await saveSettings(page);

		await openPublicPortfolio(page, request, baseURL);
		await expect(portfolioRoot(page).getByText(aboutTitle)).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
		await expect(portfolioRoot(page).getByText(aboutBody)).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
	});

	test('YouTubeギャラリー: 保存内容が公開ページへ反映される', async ({
		page,
		request,
		baseURL,
	}) => {
		const marker = Date.now().toString();
		const title = `E2E YouTube ${marker}`;
		const url = `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=${marker.slice(-4)}`;

		await loginAndOpenAdmin(page, baseURL);
		const card = sectionCard(page, 'youtube_gallery');
		if ((await card.getByPlaceholder('表示名').count()) === 0) {
			await card.getByRole('button', { name: '＋ 動画を追加' }).click();
		}
		await card.getByPlaceholder('表示名').first().fill(title);
		await card.getByPlaceholder('https://www.youtube.com/watch?v=...').first().fill(url);
		await saveSettings(page);

		await openPublicPortfolio(page, request, baseURL);
		await expect(portfolioRoot(page).getByRole('heading', { name: title })).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
	});

	test('イラストギャラリー: 保存内容が公開ページへ反映される', async ({
		page,
		request,
		baseURL,
	}) => {
		const marker = Date.now().toString();
		const title = `E2E Illust ${marker}`;
		const url = `https://example.com/e2e-${marker}.jpg`;

		await loginAndOpenAdmin(page, baseURL);
		const card = sectionCard(page, 'illustration_gallery');
		await expect(card).toBeVisible({ timeout: ADMIN_READY_MS });
		if ((await card.getByPlaceholder('表示名').count()) === 0) {
			await card.getByRole('button', { name: '＋ イラストを追加' }).click();
		}
		await card.getByPlaceholder('表示名').first().fill(title);
		await expect(card.getByPlaceholder('https://...').first()).toBeVisible({
			timeout: ADMIN_READY_MS,
		});
		await card.getByPlaceholder('https://...').first().fill(url);
		await saveSettings(page);

		await openPublicPortfolio(page, request, baseURL);
		await expect(portfolioRoot(page).getByRole('heading', { name: title })).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
	});

	test('リンクカード: 保存内容が公開ページへ反映される', async ({ page, request, baseURL }) => {
		const marker = Date.now().toString();
		const title = `E2E Link ${marker}`;
		const url = `https://example.com/e2e-link-${marker}`;

		await loginAndOpenAdmin(page, baseURL);
		const card = sectionCard(page, 'link_cards');
		if ((await card.getByPlaceholder('リンクタイトル').count()) === 0) {
			await card.getByRole('button', { name: '＋ リンクカードを追加' }).click();
		}
		await card.getByPlaceholder('リンクタイトル').first().fill(title);
		await card.getByPlaceholder('https://...').first().fill(url);
		await saveSettings(page);

		await openPublicPortfolio(page, request, baseURL);
		await expect(portfolioRoot(page).getByRole('link', { name: title })).toHaveAttribute(
			'href',
			url
		);
	});

	test('料金表: 保存内容が公開ページへ反映される', async ({ page, request, baseURL }) => {
		const marker = Date.now().toString();
		const category = `E2E Category ${marker}`;
		const courseName = `E2E Course ${marker}`;

		await loginAndOpenAdmin(page, baseURL);
		const card = sectionCard(page, 'pricing');
		await expect(card).toBeVisible({ timeout: ADMIN_READY_MS });

		if ((await card.getByPlaceholder('例: イラスト制作').count()) === 0) {
			await card.getByRole('button', { name: '＋ カテゴリを追加' }).click();
		}
		await card.getByPlaceholder('例: イラスト制作').first().fill(category);
		if ((await card.locator('input[type="text"]').count()) < 2) {
			await card.getByRole('button', { name: '＋ コースを追加' }).first().click();
		}
		await card.locator('input[type="text"]').nth(1).fill(courseName);
		await saveSettings(page);

		await openPublicPortfolio(page, request, baseURL);
		await expect(portfolioRoot(page).getByText(courseName)).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
	});

	test('FAQ: 保存内容が公開ページへ反映される', async ({ page, request, baseURL }) => {
		const marker = Date.now().toString();
		const question = `E2E FAQ Q ${marker}`;
		const answer = `E2E FAQ A ${marker}`;

		await loginAndOpenAdmin(page, baseURL);
		const card = sectionCard(page, 'faq');
		if ((await card.locator('input[type="text"]').count()) === 0) {
			await card.getByRole('button', { name: '＋ FAQ を追加' }).click();
		}
		await card.locator('input[type="text"]').first().fill(question);
		await card.locator('textarea').first().fill(answer);
		await saveSettings(page);

		await openPublicPortfolio(page, request, baseURL);
		const questionNode = portfolioRoot(page).getByText(question).first();
		await expect(questionNode).toBeVisible({ timeout: ASSERT_PUBLIC_MS });
		const answerNode = portfolioRoot(page).getByText(answer);
		if ((await answerNode.count()) === 0) {
			await questionNode.click();
		}
		await expect(portfolioRoot(page).getByText(answer)).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
	});

	test('口コミ: 管理画面承認と設定保存が公開ページへ反映される', async ({
		page,
		request,
		baseURL,
	}) => {
		const marker = Date.now().toString();
		const youtubeTitle = `E2E Review Source ${marker}`;
		const reviewName = `E2E Reviewer ${marker}`;
		const reviewText = `E2E Review Body ${marker}`;
		const fallbackIconUrl = `https://example.com/fallback-${marker}.png`;

		await loginAndOpenAdmin(page, baseURL);

		const youtubeCard = sectionCard(page, 'youtube_gallery');
		if ((await youtubeCard.getByPlaceholder('表示名').count()) === 0) {
			await youtubeCard.getByRole('button', { name: '＋ 動画を追加' }).click();
		}
		await youtubeCard.getByPlaceholder('表示名').first().fill(youtubeTitle);
		await youtubeCard
			.getByPlaceholder('https://www.youtube.com/watch?v=...')
			.first()
			.fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ');

		const reviewsCard = sectionCard(page, 'reviews');
		await reviewsCard.locator('#review-fallback-icon-url').fill(fallbackIconUrl);
		await saveSettings(page);

		await openPublicPortfolio(page, request, baseURL);
		await openReviewFormFromPortfolio(page, request, baseURL);

		const form = page.locator('form');
		await form.locator('input[type="text"]').first().fill(reviewName);
		await form.locator('textarea').first().fill(reviewText);
		await page.getByRole('button', { name: '口コミを投稿する' }).click();
		await expect(page.getByText('口コミを送信しました。')).toBeVisible({ timeout: 15_000 });

		await waitForAdminReady(page, baseURL);

		const reviewRow = sectionCard(page, 'reviews').locator('div').filter({
			hasText: reviewName,
		}).first();
		const reviewSwitch = reviewRow.locator('button[role="switch"]');
		await expect(reviewSwitch).toBeVisible({ timeout: 15_000 });
		if ((await reviewSwitch.getAttribute('aria-checked')) !== 'true') {
			await reviewSwitch.click();
		}
		await expect(reviewSwitch).toHaveAttribute('aria-checked', 'true');

		await openPublicPortfolio(page, request, baseURL);
		await expect(portfolioRoot(page).getByText(reviewName)).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
		await expect(portfolioRoot(page).getByText(reviewText)).toBeVisible({
			timeout: ASSERT_PUBLIC_MS,
		});
		await expect(portfolioRoot(page).locator(`img[src="${fallbackIconUrl}"]`).first()).toBeVisible(
			{
				timeout: ASSERT_PUBLIC_MS,
			}
		);
	});
});
