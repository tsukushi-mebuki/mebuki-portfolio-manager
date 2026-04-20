import { buildReviewCollectionUrl } from './reviewUrl';
import type { ToastVariant } from '../Toast';

type ReviewTargetType = 'youtube' | 'illustration';

type Props = {
	siteUrl: string | undefined;
	portfolioPath: string | undefined;
	itemType: ReviewTargetType;
	itemId: string;
	onNotify: ( message: string, variant: ToastVariant ) => void;
};

export function ReviewUrlCopyButton( {
	siteUrl,
	portfolioPath,
	itemType,
	itemId,
	onNotify,
}: Props ) {
	const trimmedId = itemId.trim();
	const disabled = ! siteUrl?.trim() || trimmedId === '';

	const copy = async () => {
		if ( disabled || ! siteUrl ) {
			return;
		}
		const url = buildReviewCollectionUrl(
			siteUrl,
			itemType,
			trimmedId,
			portfolioPath
		);
		if ( ! url ) {
			onNotify( 'サイト URL が取得できませんでした。', 'error' );
			return;
		}
		try {
			await navigator.clipboard.writeText( url );
			onNotify( '口コミ用URLをコピーしました', 'success' );
		} catch {
			onNotify(
				'クリップボードへのコピーに失敗しました。ブラウザの権限を確認してください。',
				'error'
			);
		}
	};

	return (
		<button
			type="button"
			disabled={ disabled }
			title={
				disabled
					? 'item_id がまだありません。一度「保存」すると発行され、コピーできるようになります。'
					: '口コミURLをコピー'
			}
			aria-label="口コミURLをコピー"
			onClick={ () => void copy() }
			className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 disabled:cursor-not-allowed disabled:opacity-45"
		>
			<svg
				className="h-3.5 w-3.5 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				aria-hidden
			>
				<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
				<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
			</svg>
			<span className="hidden sm:inline">口コミURLをコピー</span>
			<span className="sm:hidden">コピー</span>
		</button>
	);
}
