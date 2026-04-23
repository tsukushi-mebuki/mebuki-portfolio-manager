import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PricingCategory } from '../../types/settings';
import { calculatePricingTotal } from '../../core/logic/calculator';
import {
	InquiryModal,
	type InquiryEstimateContext,
} from './InquiryModal';

type Props = {
	pricing: { categories: PricingCategory[] };
};

type SelectionForCategory = {
	courseId: string | null;
	optionIds: string[];
};

function rowHasContent( ...parts: string[] ) {
	return parts.some( ( p ) => p.trim() !== '' );
}

function filterVisibleCourses( cat: PricingCategory ) {
	return cat.courses.filter( ( c ) =>
		rowHasContent( c.name, c.description, c.amount )
	);
}

function filterVisibleOptions( cat: PricingCategory ) {
	return cat.options.filter( ( o ) =>
		rowHasContent( o.name, o.description, o.amount )
	);
}

function buildInitialSelection( cat: PricingCategory ): SelectionForCategory {
	const visible = filterVisibleCourses( cat );
	const first = visible[ 0 ] ?? cat.courses[ 0 ];
	return {
		courseId: first?.id ?? null,
		optionIds: [],
	};
}

export function PricingSection( { pricing }: Props ) {
	const { categories } = pricing;

	const [ tabId, setTabId ] = useState<string | null>( null );
	const [ selectionByCat, setSelectionByCat ] = useState<
		Record<string, SelectionForCategory>
	>( {} );
	const [ inquiryOpen, setInquiryOpen ] = useState( false );

	const activeCategoryId = useMemo( () => {
		if ( categories.length === 0 ) {
			return null;
		}
		if ( tabId && categories.some( ( c ) => c.id === tabId ) ) {
			return tabId;
		}
		return categories[ 0 ].id;
	}, [ categories, tabId ] );

	const activeCategoryData = useMemo( () => {
		if ( ! activeCategoryId ) {
			return undefined;
		}
		return categories.find( ( c ) => c.id === activeCategoryId );
	}, [ categories, activeCategoryId ] );

	useEffect( () => {
		if ( categories.length === 0 ) {
			return;
		}
		if ( ! tabId || ! categories.some( ( c ) => c.id === tabId ) ) {
			setTabId( categories[ 0 ].id );
		}
	}, [ categories, tabId ] );

	useEffect( () => {
		setSelectionByCat( ( prev ) => {
			const next = { ...prev };
			for ( const cat of categories ) {
				if ( ! next[ cat.id ] ) {
					next[ cat.id ] = buildInitialSelection( cat );
				}
			}
			for ( const key of Object.keys( next ) ) {
				if ( ! categories.some( ( c ) => c.id === key ) ) {
					delete next[ key ];
				}
			}
			return next;
		} );
	}, [ categories ] );

	/** 表示対象のコース一覧から消えた ID が残っていれば先頭に寄せる（管理画面の編集に追従） */
	useEffect( () => {
		if ( ! activeCategoryData ) {
			return;
		}
		const visible = filterVisibleCourses( activeCategoryData );
		if ( visible.length === 0 ) {
			return;
		}
		const id = activeCategoryData.id;
		setSelectionByCat( ( prev ) => {
			const cur = prev[ id ];
			if (
				cur?.courseId &&
				visible.some( ( c ) => c.id === cur.courseId )
			) {
				return prev;
			}
			return {
				...prev,
				[ id ]: {
					courseId: visible[ 0 ].id,
					optionIds: cur?.optionIds ?? [],
				},
			};
		} );
	}, [ activeCategoryData ] );

	const visibleCategories = useMemo(
		() =>
			categories.filter( ( c ) =>
				rowHasContent( c.name ) ||
				rowHasContent( c.courses_intro ) ||
				rowHasContent( c.notes ) ||
				filterVisibleCourses( c ).length > 0 ||
				filterVisibleOptions( c ).length > 0
			),
		[ categories ]
	);

	const selection = activeCategoryData
		? selectionByCat[ activeCategoryData.id ]
		: undefined;

	const setCourseForActive = useCallback(
		( courseId: string | null ) => {
			if ( ! activeCategoryData ) {
				return;
			}
			const id = activeCategoryData.id;
			setSelectionByCat( ( prev ) => {
				const cur = prev[ id ] ?? buildInitialSelection( activeCategoryData );
				return {
					...prev,
					[ id ]: { ...cur, courseId },
				};
			} );
		},
		[ activeCategoryData ]
	);

	const toggleOptionForActive = useCallback(
		( optionId: string ) => {
			if ( ! activeCategoryData ) {
				return;
			}
			const id = activeCategoryData.id;
			setSelectionByCat( ( prev ) => {
				const cur = prev[ id ] ?? buildInitialSelection( activeCategoryData );
				const set = new Set( cur.optionIds );
				if ( set.has( optionId ) ) {
					set.delete( optionId );
				} else {
					set.add( optionId );
				}
				return {
					...prev,
					[ id ]: { ...cur, optionIds: [ ...set ] },
				};
			} );
		},
		[ activeCategoryData ]
	);

	const calc = useMemo( () => {
		if ( ! activeCategoryData || ! selection ) {
			return null;
		}
		return calculatePricingTotal(
			activeCategoryData,
			selection.courseId,
			selection.optionIds
		);
	}, [ activeCategoryData, selection ] );

	const inquiryEstimate: InquiryEstimateContext | null = useMemo( () => {
		if ( ! activeCategoryData || ! selection || ! calc ) {
			return null;
		}
		const course = activeCategoryData.courses.find(
			( c ) => c.id === selection.courseId
		);
		const courseDisplayName =
			course && course.name.trim() !== ''
				? course.name.trim()
				: calc.courseName ?? 'コース';
		return {
			categoryId: activeCategoryData.id,
			categoryName:
				activeCategoryData.name.trim() !== ''
					? activeCategoryData.name.trim()
					: 'カテゴリ',
			courseId: selection.courseId,
			courseDisplayName,
			orderOptions: calc.optionLines.map( ( o ) => ( {
				id: o.id,
				name: o.name,
			} ) ),
		};
	}, [ activeCategoryData, selection, calc ] );

	if ( visibleCategories.length === 0 ) {
		return null;
	}

	const coursesToShow = activeCategoryData
		? filterVisibleCourses( activeCategoryData )
		: [];
	const optionsToShow = activeCategoryData
		? filterVisibleOptions( activeCategoryData )
		: [];
	const courseSelected = Boolean( selection?.courseId );

	const surface =
		'rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[var(--mebuki-surface)]';

	return (
		<>
			{ calc && inquiryEstimate ? (
				<InquiryModal
					open={ inquiryOpen }
					onClose={ () => setInquiryOpen( false ) }
					calc={ calc }
					estimate={ inquiryEstimate }
				/>
			) : null }
			<section
				className="mx-auto max-w-5xl px-4 pb-32 pt-16 sm:px-6 lg:px-8"
				aria-labelledby="mebuki-pricing-heading"
			>
				<h2
					id="mebuki-pricing-heading"
					className="mb-10 font-[family-name:var(--mebuki-font-heading)] text-2xl font-semibold text-[var(--mebuki-text)] sm:text-3xl"
				>
					Pricing
				</h2>

				{ visibleCategories.length > 1 ? (
					<div
						className="mb-8 flex flex-wrap gap-2 border-b border-[color-mix(in_srgb,var(--mebuki-text)_12%,transparent)] pb-3"
						role="tablist"
						aria-label="料金カテゴリ"
					>
						{ visibleCategories.map( ( cat ) => {
							const selected = cat.id === activeCategoryId;
							return (
								<button
									key={ cat.id }
									type="button"
									role="tab"
									aria-selected={ selected }
									className={
										selected
											? 'rounded-t-md border border-b-0 border-[color-mix(in_srgb,var(--mebuki-text)_15%,transparent)] bg-[var(--mebuki-surface)] px-4 py-2 text-sm font-medium text-[var(--mebuki-text)]'
											: 'rounded-t-md px-4 py-2 text-sm font-medium text-[var(--mebuki-text-muted)] hover:text-[var(--mebuki-text)]'
									}
									onClick={ () => setTabId( cat.id ) }
								>
									{ cat.name.trim() !== '' ? cat.name : 'カテゴリ' }
								</button>
							);
						} ) }
					</div>
				) : null }

				{ activeCategoryData ? (
					<div className="space-y-8">
						{ activeCategoryData.courses_intro.trim() !== '' ? (
							<div
								className={ `${ surface } px-4 py-3 text-sm whitespace-pre-wrap text-[var(--mebuki-text)] shadow-sm` }
							>
								{ activeCategoryData.courses_intro }
							</div>
						) : null }
						<div>
							<h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--mebuki-text-muted)]">
								コースを選ぶ
							</h3>
							{ coursesToShow.length === 0 ? (
								<p className="text-sm text-[var(--mebuki-text-muted)]">
									このカテゴリに表示できるコースがありません。
								</p>
							) : (
								<div className="grid gap-3 sm:grid-cols-2">
									{ coursesToShow.map( ( course ) => {
										const checked = selection?.courseId === course.id;
										return (
											<label
												key={ course.id }
												className={ `cursor-pointer ${ surface } p-4 shadow-sm transition ring-2 ring-transparent has-[:checked]:ring-[var(--mebuki-accent)]` }
											>
												<input
													type="radio"
													className="sr-only"
													name={ `mebuki-pricing-course-${ activeCategoryData.id }` }
													checked={ checked }
													onChange={ () =>
														setCourseForActive( course.id )
													}
												/>
												<div className="flex items-start gap-3">
													<span
														className={ `mt-1 flex h-4 w-4 shrink-0 rounded-full border-2 ${
															checked
																? 'border-[var(--mebuki-accent)] bg-[var(--mebuki-accent)]'
																: 'border-[color-mix(in_srgb,var(--mebuki-text)_25%,transparent)]'
														}` }
														aria-hidden
													/>
													<div className="min-w-0 flex-1">
														<span className="font-[family-name:var(--mebuki-font-heading)] text-base font-semibold text-[var(--mebuki-text)]">
															{ course.name.trim() !== ''
																? course.name
																: 'コース' }
														</span>
														{ course.amount.trim() !== '' ? (
															<p className="mt-1 text-lg font-bold text-[var(--mebuki-accent)]">
																{ course.amount }
															</p>
														) : null }
														{ course.description.trim() !== '' ? (
															<p className="mt-2 whitespace-pre-wrap text-sm text-[var(--mebuki-text-muted)]">
																{ course.description }
															</p>
														) : null }
													</div>
												</div>
											</label>
										);
									} ) }
								</div>
							) }
						</div>

						{ optionsToShow.length > 0 ? (
							<details
								className={ `${ surface } overflow-hidden shadow-sm` }
								open={ courseSelected }
							>
								<summary className="cursor-pointer list-none px-4 py-3 font-[family-name:var(--mebuki-font-heading)] text-sm font-medium text-[var(--mebuki-text)] marker:content-none [&::-webkit-details-marker]:hidden">
									<span className="flex items-center justify-between gap-2">
										<span>オプション（複数選択）</span>
										<span className="text-xs font-normal text-[var(--mebuki-text-muted)]">
											{ courseSelected
												? '加算項目を選べます'
												: '先にコースを選択してください' }
										</span>
									</span>
								</summary>
								<div className="border-t border-[color-mix(in_srgb,var(--mebuki-text)_8%,transparent)] px-4 py-4">
									{ ! courseSelected ? (
										<p className="text-sm text-[var(--mebuki-text-muted)]">
											コースを選ぶとオプションを選択できます。
										</p>
									) : (
										<ul className="space-y-3">
											{ optionsToShow.map( ( opt ) => {
												const on = Boolean(
													selection?.optionIds.includes( opt.id )
												);
												return (
													<li key={ opt.id }>
														<label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:bg-[color-mix(in_srgb,var(--mebuki-text)_4%,transparent)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--mebuki-accent)]">
															<input
																type="checkbox"
																className="mt-1 h-4 w-4 shrink-0 rounded border-[color-mix(in_srgb,var(--mebuki-text)_30%,transparent)] text-[var(--mebuki-accent)] focus:ring-[var(--mebuki-accent)]"
																checked={ on }
																onChange={ () =>
																	toggleOptionForActive( opt.id )
																}
															/>
															<span className="min-w-0 flex-1">
																<span className="font-medium text-[var(--mebuki-text)]">
																	{ opt.name.trim() !== ''
																		? opt.name
																		: 'オプション' }
																</span>
																{ opt.amount.trim() !== '' ? (
																	<span className="ml-2 text-[var(--mebuki-accent)]">
																		{ opt.amount }
																	</span>
																) : null }
																{ opt.description.trim() !== '' ? (
																	<span className="mt-1 block whitespace-pre-wrap text-sm text-[var(--mebuki-text-muted)]">
																		{ opt.description }
																	</span>
																) : null }
															</span>
														</label>
													</li>
												);
											} ) }
										</ul>
									) }
								</div>
							</details>
						) : null }
						{ activeCategoryData.notes.trim() !== '' ? (
							<div
								className={ `${ surface } px-4 py-3 text-sm whitespace-pre-wrap text-[var(--mebuki-text-muted)] shadow-sm` }
							>
								{ activeCategoryData.notes }
							</div>
						) : null }
					</div>
				) : null }
			</section>

			{ calc ? (
				<div
					role="region"
					aria-label="料金シミュレーター固定バー"
					className="fixed bottom-0 left-0 right-0 z-50 border-t border-[color-mix(in_srgb,var(--mebuki-text)_12%,transparent)] bg-[var(--mebuki-surface)]/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-[var(--mebuki-surface)]/85"
					style={ { paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' } }
				>
					<div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
						<div>
							<p className="text-xs text-[var(--mebuki-text-muted)]">合計（税込目安）</p>
							<p className="font-[family-name:var(--mebuki-font-heading)] text-xl font-bold text-[var(--mebuki-text)]">
								{ calc.totalFormatted }
							</p>
						</div>
						<button
							type="button"
							className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--mebuki-radius)] bg-[var(--mebuki-accent)] px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mebuki-accent)]"
							onClick={ () => setInquiryOpen( true ) }
						>
							この内容で問い合わせる
						</button>
					</div>
				</div>
			) : null }
		</>
	);
}
