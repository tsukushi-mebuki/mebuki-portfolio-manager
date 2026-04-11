import { buildReviewWriteUrl } from '../../frontend/reviewUrl';

type Props = {
	siteUrl: string;
	itemType: string;
	itemId: string;
	className?: string;
};

export function ReviewWriteButton( {
	siteUrl,
	itemType,
	itemId,
	className = '',
}: Props ) {
	const disabled = itemId.trim() === '';
	const href = disabled
		? '#'
		: buildReviewWriteUrl( siteUrl, itemType, itemId.trim() );

	const baseClass = `inline-flex items-center justify-center rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--mebuki-accent)_12%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--mebuki-accent)] transition hover:bg-[color-mix(in_srgb,var(--mebuki-accent)_22%,transparent)] ${ className }`;

	if ( disabled ) {
		return (
			<span
				role="button"
				aria-disabled="true"
				title="保存後に item_id が発行されると有効になります"
				className={ `${ baseClass } cursor-not-allowed opacity-40` }
			>
				口コミを書く
			</span>
		);
	}

	return (
		<a
			href={ href }
			title="この作品・動画について口コミを書く"
			className={ baseClass }
		>
			口コミを書く
		</a>
	);
}
