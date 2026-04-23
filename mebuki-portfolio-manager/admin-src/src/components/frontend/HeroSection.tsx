import type { HeroConfig } from '../../types/settings';

type Props = {
	siteName: string;
	hero: HeroConfig;
};

export function HeroSection( { siteName, hero }: Props ) {
	const title = hero.title.trim() || siteName || 'Portfolio';
	const subtitle = hero.subtitle.trim();
	const cover = hero.cover_image_url.trim();

	return (
		<section
			className="relative overflow-hidden border-b border-[color-mix(in_srgb,var(--mebuki-text)_8%,transparent)]"
			aria-label="ヒーロー"
		>
			{ cover !== '' ? (
				<>
					<img
						src={ cover }
						alt=""
						className="absolute inset-0 h-full w-full object-cover"
					/>
					<div
						className="absolute inset-0 bg-gradient-to-t from-[var(--mebuki-bg)] via-[color-mix(in_srgb,var(--mebuki-bg)_55%,transparent)] to-[color-mix(in_srgb,var(--mebuki-bg)_20%,transparent)]"
						aria-hidden
					/>
				</>
			) : (
				<div
					className="absolute inset-0 bg-gradient-to-br from-[var(--mebuki-surface)] via-[var(--mebuki-bg)] to-[color-mix(in_srgb,var(--mebuki-accent)_12%,var(--mebuki-bg))]"
					aria-hidden
				/>
			) }
			<div className="relative mx-auto flex min-h-[min(52vh,28rem)] max-w-5xl flex-col justify-end gap-3 px-4 pb-14 pt-24 sm:px-6 lg:px-8">
				<h1
					className="font-[family-name:var(--mebuki-font-heading)] text-3xl font-bold tracking-tight text-[var(--mebuki-text)] sm:text-4xl md:text-5xl"
					style={ { textShadow: '0 2px 24px color-mix(in srgb, var(--mebuki-bg) 80%, transparent)' } }
				>
					{ title }
				</h1>
				{ subtitle !== '' ? (
					<p className="max-w-2xl text-base leading-relaxed text-[var(--mebuki-text-muted)] sm:text-lg">
						{ subtitle }
					</p>
				) : null }
			</div>
		</section>
	);
}
