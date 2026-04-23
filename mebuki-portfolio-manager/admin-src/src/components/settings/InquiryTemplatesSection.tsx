import type { Dispatch, SetStateAction } from 'react';
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

	const addTemplate = () => {
		setForm( ( f ) => ( {
			...f,
			inquiry_templates: {
				items: [
					...f.inquiry_templates.items,
					{
						id: newLocalId(),
						title: '',
						pricing_category_ids: [],
						body: '',
					},
				],
			},
		} ) );
	};

	const removeTemplate = ( index: number ) => {
		setForm( ( f ) => ( {
			...f,
			inquiry_templates: {
				items: f.inquiry_templates.items.filter( ( _, i ) => i !== index ),
			},
		} ) );
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

	return (
		<div className="space-y-3">
			<p className="text-xs text-slate-500">
				テンプレートは、選択された料金カテゴリに応じてお問い合わせフォームへ挿入する想定です。
			</p>
			{ templates.length === 0 ? (
				<p className="text-sm text-slate-500">
					問い合わせテンプレートがまだありません。
				</p>
			) : null }
			{ templates.map( ( row, index ) => (
				<div
					key={ row.id }
					className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3"
				>
					<div className="flex items-center justify-between gap-2">
						<span className="text-xs font-medium text-slate-500">
							テンプレート { index + 1 }
						</span>
						<button
							type="button"
							className="text-xs text-rose-600 hover:text-rose-800"
							onClick={ () => removeTemplate( index ) }
						>
							削除
						</button>
					</div>
					<div>
						<label className="mb-1 block text-xs text-slate-600">タイトル</label>
						<input
							type="text"
							className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
							value={ row.title }
							onChange={ ( e ) =>
								updateTemplate( index, { title: e.target.value } )
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
											checked={ row.pricing_category_ids.includes( category.id ) }
											onChange={ () => toggleCategory( index, category.id ) }
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
							value={ row.body }
							onChange={ ( e ) =>
								updateTemplate( index, { body: e.target.value } )
							}
							placeholder="お問い合わせ時に補足メッセージへ流し込む本文を入力"
						/>
					</div>
				</div>
			) ) }
			<button
				type="button"
				className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-sky-300 hover:bg-sky-50/50"
				onClick={ addTemplate }
			>
				＋ 問い合わせテンプレートを追加
			</button>
		</div>
	);
}
