import { useState } from 'react';

type FaqRow = {
	question: string;
	answer: string;
};

type Props = {
	items: FaqRow[];
};

export function FAQSection( { items }: Props ) {
	const visible = items.filter(
		( row ) => row.question.trim() !== '' || row.answer.trim() !== ''
	);
	const [ openIndex, setOpenIndex ] = useState<number | null>( 0 );

	if ( visible.length === 0 ) {
		return null;
	}

	return (
		<section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="mebuki-faq-heading">
			<h2
				id="mebuki-faq-heading"
				className="mebuki-section-title mebuki-faq-title mb-10 font-[family-name:var(--mebuki-font-heading)] text-2xl font-semibold text-[var(--mebuki-text)] sm:text-3xl"
			>
				FAQ
			</h2>
			<div className="space-y-2">
				{ visible.map( ( row, i ) => {
					const open = openIndex === i;
					return (
						<div
							key={ `${ row.question }-${ i }` }
							className="mebuki-faq-card rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[var(--mebuki-surface)] shadow-sm"
						>
							<button
								type="button"
								className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-[family-name:var(--mebuki-font-heading)] text-base font-medium text-[var(--mebuki-text)] transition hover:bg-[color-mix(in_srgb,var(--mebuki-accent)_6%,transparent)]"
								aria-expanded={ open }
								onClick={ () => setOpenIndex( open ? null : i ) }
							>
								<span>{ row.question }</span>
								<span
									className={ `mebuki-faq-chevron text-[var(--mebuki-accent)] transition ${ open ? 'rotate-180' : '' }` }
									aria-hidden
								>
									▼
								</span>
							</button>
							{ open ? (
								<div className="border-t border-[color-mix(in_srgb,var(--mebuki-text)_8%,transparent)] px-4 py-4 text-sm leading-relaxed text-[var(--mebuki-text-muted)]">
									<p className="whitespace-pre-wrap">{ row.answer }</p>
								</div>
							) : null }
						</div>
					);
				} ) }
			</div>
		</section>
	);
}
