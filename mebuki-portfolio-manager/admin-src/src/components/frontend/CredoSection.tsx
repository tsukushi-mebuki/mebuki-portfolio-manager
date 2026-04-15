import type { CredoConfig } from '../../types/settings';

type Props = {
	credo: CredoConfig;
};

export function CredoSection( { credo }: Props ) {
	if ( credo.title.trim() === '' && credo.body.trim() === '' ) {
		return null;
	}

	return (
		<section
			className="border-y border-[color-mix(in_srgb,var(--mebuki-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--mebuki-accent)_6%,var(--mebuki-bg))] py-16"
			aria-labelledby="mebuki-credo-heading"
		>
			<div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
				{ credo.title !== '' ? (
					<h2
						id="mebuki-credo-heading"
						className="mb-6 font-[family-name:var(--mebuki-font-heading)] text-sm font-semibold uppercase tracking-[0.2em] text-[var(--mebuki-accent)]"
					>
						{ credo.title }
					</h2>
				) : null }
				{ credo.body !== '' ? (
					<p className="font-[family-name:var(--mebuki-font-heading)] text-xl font-medium leading-relaxed text-[var(--mebuki-text)] sm:text-2xl">
						{ credo.body }
					</p>
				) : null }
			</div>
		</section>
	);
}
