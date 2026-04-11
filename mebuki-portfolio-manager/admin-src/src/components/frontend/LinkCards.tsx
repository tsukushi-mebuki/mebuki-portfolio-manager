import type { LinkCardItem } from '../../types/settings';

type Props = {
	items: LinkCardItem[];
};

export function LinkCards( { items }: Props ) {
	const visible = items.filter(
		( row ) =>
			row.title.trim() !== '' || row.url.trim() !== '' || row.thumbnail_url.trim() !== ''
	);
	if ( visible.length === 0 ) {
		return null;
	}

	return (
		<section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="mebuki-links-heading">
			<h2
				id="mebuki-links-heading"
				className="mb-10 font-[family-name:var(--mebuki-font-heading)] text-2xl font-semibold text-[var(--mebuki-text)] sm:text-3xl"
			>
				Links
			</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{ visible.map( ( row ) => (
					<a
						key={ row.id }
						href={ row.url.trim() !== '' ? row.url : '#' }
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-col overflow-hidden rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[var(--mebuki-surface)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)] hover:shadow-md"
					>
						<div className="aspect-[16/10] w-full overflow-hidden bg-[color-mix(in_srgb,var(--mebuki-text)_6%,transparent)]">
							{ row.thumbnail_url.trim() !== '' ? (
								<img
									src={ row.thumbnail_url }
									alt=""
									className="h-full w-full object-cover"
									loading="lazy"
								/>
							) : (
								<div className="flex h-full items-center justify-center text-xs text-[var(--mebuki-text-muted)]">
									No image
								</div>
							) }
						</div>
						<div className="p-4">
							<h3 className="font-[family-name:var(--mebuki-font-heading)] text-base font-semibold text-[var(--mebuki-text)]">
								{ row.title.trim() !== '' ? row.title : row.url }
							</h3>
						</div>
					</a>
				) ) }
			</div>
		</section>
	);
}
