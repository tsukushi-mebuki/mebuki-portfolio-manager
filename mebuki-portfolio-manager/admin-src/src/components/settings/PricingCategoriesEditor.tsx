import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type {
	MebukiFormState,
	PricingCategory,
	PricingCourse,
	PricingOption,
} from '../../types/settings';
import { newLocalId } from '../../lib/mergeSettings';

type Props = {
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
};

function updateCategories(
	setForm: Props[ 'setForm' ],
	updater: ( cats: PricingCategory[] ) => PricingCategory[]
) {
	setForm( ( f ) => ( {
		...f,
		pricing: { categories: updater( f.pricing.categories ) },
	} ) );
}

export function PricingSection( { form, setForm }: Props ) {
	const categories = form.pricing.categories;
	const [ activeCategoryId, setActiveCategoryId ] = useState<string | null>(
		null
	);

	useEffect( () => {
		if ( categories.length === 0 ) {
			return;
		}
		if (
			! activeCategoryId ||
			! categories.some( ( c ) => c.id === activeCategoryId )
		) {
			setActiveCategoryId( categories[ 0 ].id );
		}
	}, [ categories, activeCategoryId ] );

	const activeIndex = useMemo( () => {
		if ( categories.length === 0 ) {
			return -1;
		}
		const i = categories.findIndex( ( c ) => c.id === activeCategoryId );
		return i >= 0 ? i : 0;
	}, [ categories, activeCategoryId ] );

	const addCategory = () => {
		const id = newLocalId();
		updateCategories( setForm, ( cats ) => [
			...cats,
			{
				id,
				name: '',
				courses_intro: '',
				courses: [],
				options: [],
				notes: '',
			},
		] );
		setActiveCategoryId( id );
	};

	const patchCategory = (
		index: number,
		patch: Partial<PricingCategory> | ( ( c: PricingCategory ) => PricingCategory )
	) => {
		updateCategories( setForm, ( cats ) => {
			const next = [ ...cats ];
			const cur = next[ index ];
			if ( ! cur ) {
				return cats;
			}
			next[ index ] =
				typeof patch === 'function' ? patch( cur ) : { ...cur, ...patch };
			return next;
		} );
	};

	const removeCategory = ( index: number ) => {
		const removedId = categories[ index ]?.id;
		updateCategories( setForm, ( cats ) =>
			cats.filter( ( _, i ) => i !== index )
		);
		if ( activeCategoryId !== removedId ) {
			return;
		}
		const nextCats = categories.filter( ( _, i ) => i !== index );
		if ( nextCats.length === 0 ) {
			setActiveCategoryId( null );
			return;
		}
		const nextIndex = Math.min( index, nextCats.length - 1 );
		setActiveCategoryId( nextCats[ nextIndex ]!.id );
	};

	const addCourse = ( catIndex: number ) => {
		patchCategory( catIndex, ( c ) => ( {
			...c,
			courses: [
				...c.courses,
				{
					id: newLocalId(),
					name: '',
					description: '',
					amount: '',
				},
			],
		} ) );
	};

	const patchCourse = (
		catIndex: number,
		courseIndex: number,
		patch: Partial<PricingCourse>
	) => {
		patchCategory( catIndex, ( c ) => {
			const courses = [ ...c.courses ];
			const row = courses[ courseIndex ];
			if ( ! row ) {
				return c;
			}
			courses[ courseIndex ] = { ...row, ...patch };
			return { ...c, courses };
		} );
	};

	const removeCourse = ( catIndex: number, courseIndex: number ) => {
		patchCategory( catIndex, ( c ) => ( {
			...c,
			courses: c.courses.filter( ( _, i ) => i !== courseIndex ),
		} ) );
	};

	const addOption = ( catIndex: number ) => {
		patchCategory( catIndex, ( c ) => ( {
			...c,
			options: [
				...c.options,
				{
					id: newLocalId(),
					name: '',
					description: '',
					amount: '',
				},
			],
		} ) );
	};

	const patchOption = (
		catIndex: number,
		optIndex: number,
		patch: Partial<PricingOption>
	) => {
		patchCategory( catIndex, ( c ) => {
			const options = [ ...c.options ];
			const row = options[ optIndex ];
			if ( ! row ) {
				return c;
			}
			options[ optIndex ] = { ...row, ...patch };
			return { ...c, options };
		} );
	};

	const removeOption = ( catIndex: number, optIndex: number ) => {
		patchCategory( catIndex, ( c ) => ( {
			...c,
			options: c.options.filter( ( _, i ) => i !== optIndex ),
		} ) );
	};

	const cat = activeIndex >= 0 ? categories[ activeIndex ] : undefined;
	const ci = activeIndex;

	return (
		<div className="space-y-6">
			<p className="text-xs text-slate-500">
				カテゴリ（タブ）→ コース説明 → コース（単一選択のベース料金）→
				オプション（複数選択で加算）→ 備考の順でポートフォリオに表示されます。
			</p>

			<div className="flex flex-wrap items-end gap-2 border-b border-slate-200 pb-3">
				<div
					className="flex min-w-0 flex-1 flex-wrap gap-2"
					role="tablist"
					aria-label="料金カテゴリ"
				>
					{ categories.length === 0 ? (
						<p className="text-sm text-slate-500">
							カテゴリがまだありません。右の＋から追加できます。
						</p>
					) : (
						categories.map( ( c, i ) => {
							const selected = c.id === activeCategoryId;
							return (
								<button
									key={ c.id }
									type="button"
									role="tab"
									aria-selected={ selected }
									className={
										selected
											? 'rounded-t-md border border-b-0 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-900/5'
											: 'rounded-t-md px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800'
									}
									onClick={ () => setActiveCategoryId( c.id ) }
								>
									{ c.name.trim() !== ''
										? c.name
										: `カテゴリ ${ i + 1 }` }
								</button>
							);
						} )
					) }
				</div>
				<button
					type="button"
					className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-medium leading-none text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
					aria-label="カテゴリを追加"
					title="カテゴリを追加"
					onClick={ addCategory }
				>
					+
				</button>
			</div>

			{ cat !== undefined && ci >= 0 ? (
				<div
					key={ cat.id }
					className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
					role="tabpanel"
				>
					<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
							カテゴリ { ci + 1 }
						</span>
						<button
							type="button"
							className="text-xs text-rose-600 hover:text-rose-800"
							onClick={ () => removeCategory( ci ) }
						>
							カテゴリを削除
						</button>
					</div>
					<div className="mb-4">
						<label className="mb-1 block text-xs font-medium text-slate-600">
							カテゴリ名（タブ表示）
						</label>
						<input
							type="text"
							className="w-full max-w-md rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
							value={ cat.name }
							onChange={ ( e ) =>
								patchCategory( ci, { name: e.target.value } )
							}
							placeholder="例: イラスト制作"
						/>
					</div>

					<div className="mb-4 border-t border-slate-100 pt-4">
						<label className="mb-1 block text-xs font-medium text-slate-600">
							コース説明（コース一覧の上に表示）
						</label>
						<textarea
							className="min-h-[72px] w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
							value={ cat.courses_intro }
							onChange={ ( e ) =>
								patchCategory( ci, { courses_intro: e.target.value } )
							}
							placeholder="このカテゴリの料金の前提や説明を入力"
						/>
					</div>

					<div className="mb-6 border-t border-slate-100 pt-4">
						<div className="mb-2 flex items-center justify-between gap-2">
							<h3 className="text-sm font-medium text-slate-800">コース</h3>
							<button
								type="button"
								className="text-xs text-sky-700 hover:text-sky-900"
								onClick={ () => addCourse( ci ) }
							>
								＋ コースを追加
							</button>
						</div>
						{ cat.courses.length === 0 ? (
							<p className="text-xs text-slate-500">コースがありません。</p>
						) : null }
						<div className="space-y-3">
							{ cat.courses.map( ( row, ri ) => (
								<div
									key={ row.id }
									className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
								>
									<div className="mb-2 flex items-center justify-between">
										<span className="text-xs text-slate-500">
											コース { ri + 1 }
										</span>
										<button
											type="button"
											className="text-xs text-rose-600 hover:text-rose-800"
											onClick={ () => removeCourse( ci, ri ) }
										>
											削除
										</button>
									</div>
									<div className="grid gap-2 sm:grid-cols-2">
										<div className="sm:col-span-2">
											<label className="mb-1 block text-xs text-slate-600">
												コース名
											</label>
											<input
												type="text"
												className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
												value={ row.name }
												onChange={ ( e ) =>
													patchCourse( ci, ri, {
														name: e.target.value,
													} )
												}
											/>
										</div>
										<div className="sm:col-span-2">
											<label className="mb-1 block text-xs text-slate-600">
												説明
											</label>
											<textarea
												className="min-h-[56px] w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
												value={ row.description }
												onChange={ ( e ) =>
													patchCourse( ci, ri, {
														description: e.target.value,
													} )
												}
											/>
										</div>
										<div>
											<label className="mb-1 block text-xs text-slate-600">
												金額（ベース）
											</label>
											<input
												type="text"
												className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
												value={ row.amount }
												onChange={ ( e ) =>
													patchCourse( ci, ri, {
														amount: e.target.value,
													} )
												}
												placeholder="例: ¥12,000"
											/>
										</div>
									</div>
								</div>
							) ) }
						</div>
					</div>

					<div className="border-t border-slate-100 pt-4">
						<div className="mb-2 flex items-center justify-between gap-2">
							<h3 className="text-sm font-medium text-slate-800">オプション（加算）</h3>
							<button
								type="button"
								className="text-xs text-sky-700 hover:text-sky-900"
								onClick={ () => addOption( ci ) }
							>
								＋ オプションを追加
							</button>
						</div>
						{ cat.options.length === 0 ? (
							<p className="text-xs text-slate-500">オプションがありません。</p>
						) : null }
						<div className="space-y-3">
							{ cat.options.map( ( row, oi ) => (
								<div
									key={ row.id }
									className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
								>
									<div className="mb-2 flex items-center justify-between">
										<span className="text-xs text-slate-500">
											オプション { oi + 1 }
										</span>
										<button
											type="button"
											className="text-xs text-rose-600 hover:text-rose-800"
											onClick={ () => removeOption( ci, oi ) }
										>
											削除
										</button>
									</div>
									<div className="grid gap-2 sm:grid-cols-2">
										<div className="sm:col-span-2">
											<label className="mb-1 block text-xs text-slate-600">
												名称
											</label>
											<input
												type="text"
												className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
												value={ row.name }
												onChange={ ( e ) =>
													patchOption( ci, oi, {
														name: e.target.value,
													} )
												}
											/>
										</div>
										<div className="sm:col-span-2">
											<label className="mb-1 block text-xs text-slate-600">
												説明
											</label>
											<textarea
												className="min-h-[48px] w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
												value={ row.description }
												onChange={ ( e ) =>
													patchOption( ci, oi, {
														description: e.target.value,
													} )
												}
											/>
										</div>
										<div>
											<label className="mb-1 block text-xs text-slate-600">
												加算金額
											</label>
											<input
												type="text"
												className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
												value={ row.amount }
												onChange={ ( e ) =>
													patchOption( ci, oi, {
														amount: e.target.value,
													} )
												}
												placeholder="例: ¥3,000"
											/>
										</div>
									</div>
								</div>
							) ) }
						</div>
					</div>

					<div className="mt-6 border-t border-slate-100 pt-4">
						<label className="mb-1 block text-xs font-medium text-slate-600">
							備考（オプションの下に表示）
						</label>
						<textarea
							className="min-h-[72px] w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
							value={ cat.notes }
							onChange={ ( e ) =>
								patchCategory( ci, { notes: e.target.value } )
							}
							placeholder="注意事項や補足など"
						/>
					</div>
				</div>
			) : null }
		</div>
	);
}
