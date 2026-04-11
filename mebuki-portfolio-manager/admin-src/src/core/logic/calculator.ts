import type { PricingCategory } from '../../types/settings';

/**
 * Extract a non-negative integer yen amount from free-form user strings
 * (e.g. "¥12,000", "12000円", "12,000 / お問い合わせ" → 12000).
 */
export function parsePriceAmount( input: string ): number {
	const digits = ( input ?? '' ).replace( /[^\d]/g, '' );
	if ( digits === '' ) {
		return 0;
	}
	const n = parseInt( digits, 10 );
	return Number.isFinite( n ) && n >= 0 ? n : 0;
}

export type PricingOptionLine = {
	id: string;
	name: string;
	amountYen: number;
};

export type PricingCalculationResult = {
	/** Sum of course + selected options (yen). */
	totalYen: number;
	/** Localized total for display. */
	totalFormatted: string;
	courseName: string | null;
	courseAmountYen: number;
	/** Selected options with resolved names and amounts. */
	optionLines: PricingOptionLine[];
	/** Option names only (for inquiry payloads). */
	optionNames: string[];
};

/**
 * Pure pricing total for one category + UI selection (no React / IO).
 */
export function calculatePricingTotal(
	category: PricingCategory,
	selectedCourseId: string | null,
	selectedOptionIds: readonly string[]
): PricingCalculationResult {
	const course = category.courses.find( ( c ) => c.id === selectedCourseId );
	const courseAmountYen = course ? parsePriceAmount( course.amount ) : 0;
	const courseName =
		course && course.name.trim() !== '' ? course.name.trim() : null;

	const idSet = new Set( selectedOptionIds );
	const optionLines: PricingOptionLine[] = [];
	for ( const opt of category.options ) {
		if ( ! idSet.has( opt.id ) ) {
			continue;
		}
		const amountYen = parsePriceAmount( opt.amount );
		optionLines.push( {
			id: opt.id,
			name: opt.name.trim() !== '' ? opt.name.trim() : 'オプション',
			amountYen,
		} );
	}

	const optionsSum = optionLines.reduce( ( s, x ) => s + x.amountYen, 0 );
	const totalYen = courseAmountYen + optionsSum;
	const totalFormatted = new Intl.NumberFormat( 'ja-JP', {
		style: 'currency',
		currency: 'JPY',
		maximumFractionDigits: 0,
	} ).format( totalYen );

	return {
		totalYen,
		totalFormatted,
		courseName,
		courseAmountYen,
		optionLines,
		optionNames: optionLines.map( ( o ) => o.name ),
	};
}
