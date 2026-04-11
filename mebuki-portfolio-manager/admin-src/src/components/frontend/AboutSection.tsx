import type { AboutItem } from '../../types/settings';

type Props = {
	items: AboutItem[];
};

export function AboutSection( { items }: Props ) {
	const visible = items.filter(
		( row ) => row.title.trim() !== '' || row.content.trim() !== ''
	);
	if ( visible.length === 0 ) {
		return null;
	}

	return (
		<section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="mebuki-about-heading">
			<h2
				id="mebuki-about-heading"
				className="mb-10 font-[family-name:var(--mebuki-font-heading)] text-2xl font-semibold text-[var(--mebuki-text)] sm:text-3xl"
			>
				About
			</h2>
			<div className="space-y-12">
				{ visible.map( ( row ) => (
					<article
						key={ row.id }
						className="rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[color-mix(in_srgb,var(--mebuki-surface)_80%,transparent)] p-6 shadow-sm ring-1 ring-[color-mix(in_srgb,var(--mebuki-accent)_8%,transparent)] sm:p-8"
					>
						{ row.title.trim() !== '' ? (
							<h3 className="mb-4 font-[family-name:var(--mebuki-font-heading)] text-xl font-semibold text-[var(--mebuki-text)]">
								{ row.title }
							</h3>
						) : null }
						{ row.content.trim() !== '' ? (
							<div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed text-[var(--mebuki-text-muted)] sm:text-base">
								{ row.content }
							</div>
						) : null }
					</article>
				) ) }
			</div>
		</section>
	);
}
