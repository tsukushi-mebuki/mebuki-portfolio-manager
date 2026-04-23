import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { newLocalId } from '../../lib/mergeSettings';
import type { InquiryTemplate, MebukiFormState } from '../../types/settings';

type Props = {
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
};

function updateTemplateAt(
	items: InquiryTemplate[],
	index: number,
	patch: Partial<InquiryTemplate>
): InquiryTemplate[] {
	return items.map( ( row, i ) => ( i === index ? { ...row, ...patch } : row ) );
}

export function InquiryTemplatesSection( { form, setForm }: Props ) {
	const templates = form.inquiry_templates.items;
	const categories = form.pricing.categories;
	const [ activeTemplateId, setActiveTemplateId ] = useState<string | null>( null );

	useEffect( () => {
		if ( templates.length === 0 ) {
			setActiveTemplateId( null );
			return;
		}
		if (
			! activeTemplateId ||
			! templates.some( ( row ) => row.id === activeTemplateId )
		) {
			setActiveTemplateId( templates[ 0 ].id );
		}
	}, [ templates, activeTemplateId ] );

	const activeIndex = useMemo( () => {
		if ( templates.length === 0 ) {
			return -1;
		}
		const i = templates.findIndex( ( row ) => row.id === activeTemplateId );
		return i >= 0 ? i : 0;
	}, [ templates, activeTemplateId ] );

	const addTemplate = () => {
		const id = newLocalId();
		setForm( ( f ) => ( {
			...f,
			inquiry_templates: {
				items: [
					...f.inquiry_templates.items,
					{
						id,
						title: '',
						pricing_category_ids: [],
						body: '',
					},
				],
			},
		} ) );
		setActiveTemplateId( id );
	};

	const removeTemplate = ( index: number ) => {
		const removedId = templates[ index ]?.id;
		setForm( ( f ) => ( {
			...f,
			inquiry_templates: {
				items: f.inquiry_templates.items.filter( ( _, i ) => i !== index ),
			},
		} ) );
		if ( removedId !== activeTemplateId ) {
			return;
		}
		const nextRows = templates.filter( ( _, i ) => i !== index );
		if ( nextRows.length === 0 ) {
			setActiveTemplateId( null );
			return;
		}
		const nextIndex = Math.min( index, nextRows.length - 1 );
		setActiveTemplateId( nextRows[ nextIndex ].id );
	};

	const updateTemplate = ( index: number, patch: Partial<InquiryTemplate> ) => {
		setForm( ( f ) => ( {
			...f,
			inquiry_templates: {
				items: updateTemplateAt( f.inquiry_templates.items, index, patch ),
			},
		} ) );
	};

	const toggleCategory = ( index: number, categoryId: string ) => {
		const current = templates[ index ]?.pricing_category_ids ?? [];
		const set = new Set( current );
		if ( set.has( categoryId ) ) {
			set.delete( categoryId );
		} else {
			set.add( categoryId );
		}
		updateTemplate( index, { pricing_category_ids: [ ...set ] } );
	};

	const activeTemplate = activeIndex >= 0 ? templates[ activeIndex ] : undefined;

	return (
		<div className="space-y-6">
			<p className="text-xs text-slate-500">
				テンプレートは、選択された料金カテゴリに応じてお問い合わせフォームへ挿入する想定です。
			</p>
			<div className="flex flex-wrap items-end gap-2 border-b border-slate-200 pb-3">
				<div
					className="flex min-w-0 flex-1 flex-wrap gap-2"
					role="tablist"
					aria-label="問い合わせテンプレート"
				>
					{ templates.length === 0 ? (
						<p className="text-sm text-slate-500">
							問い合わせテンプレートがまだありません。右の＋から追加できます。
						</p>
					) : (
						templates.map( ( row, index ) => {
							const selected = row.id === activeTemplateId;
							return (
								<button
									key={ row.id }
									type="button"
									role="tab"
									aria-selected={ selected }
									className={
										selected
											? 'rounded-t-md border border-b-0 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-900/5'
											: 'rounded-t-md px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800'
									}
									onClick={ () => setActiveTemplateId( row.id ) }
								>
									{ row.title.trim() !== ''
										? row.title
										: `テンプレート ${ index + 1 }` }
								</button>
							);
						} )
					) }
				</div>
				<button
					type="button"
					className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-medium leading-none text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
					aria-label="テンプレートを追加"
					title="テンプレートを追加"
					onClick={ addTemplate }
				>
					+
				</button>
			</div>

			{ activeTemplate && activeIndex >= 0 ? (
				<div
					key={ activeTemplate.id }
					className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
					role="tabpanel"
				>
					<div className="flex items-center justify-between gap-2">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
							テンプレート { activeIndex + 1 }
						</span>
						<button
							type="button"
							className="text-xs text-rose-600 hover:text-rose-800"
							onClick={ () => removeTemplate( activeIndex ) }
						>
							テンプレートを削除
						</button>
					</div>
					<div>
						<label className="mb-1 block text-xs text-slate-600">タイトル</label>
						<input
							type="text"
							className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
							value={ activeTemplate.title }
							onChange={ ( e ) =>
								updateTemplate( activeIndex, { title: e.target.value } )
							}
							placeholder="例: お見積り相談テンプレート"
						/>
					</div>
					<div>
						<label className="mb-1 block text-xs text-slate-600">
							使用する料金カテゴリ（複数選択可）
						</label>
						{ categories.length > 0 ? (
							<div className="space-y-1.5 rounded-md border border-slate-200 bg-white px-3 py-2">
								{ categories.map( ( category ) => (
									<label
										key={ category.id }
										className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
									>
										<input
											type="checkbox"
											checked={ activeTemplate.pricing_category_ids.includes(
												category.id
											) }
											onChange={ () =>
												toggleCategory( activeIndex, category.id )
											}
										/>
										<span>
											{ category.name.trim() !== ''
												? category.name
												: '(名称未設定カテゴリ)' }
										</span>
									</label>
								) ) }
							</div>
						) : null }
						{ categories.length === 0 ? (
							<p className="mt-1 text-xs text-amber-700">
								料金カテゴリが未登録です。先に「料金表」でカテゴリを追加してください。
							</p>
						) : null }
					</div>
					<div>
						<label className="mb-1 block text-xs text-slate-600">本文</label>
						<textarea
							className="min-h-[140px] w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm leading-relaxed focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
							value={ activeTemplate.body }
							onChange={ ( e ) =>
								updateTemplate( activeIndex, { body: e.target.value } )
							}
							placeholder="お問い合わせ時に補足メッセージへ流し込む本文を入力"
						/>
					</div>
				</div>
			) : null }
		</div>
	);
}
