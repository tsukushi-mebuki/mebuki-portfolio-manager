import type { Dispatch, SetStateAction } from 'react';
import type { MebukiFormState } from '../../types/settings';
import { newLocalId } from '../../lib/mergeSettings';
import { MediaPickerButton } from '../MediaPickerButton';

type Props = {
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
};

export function LinkCardsSection( { form, setForm }: Props ) {
	const items = form.link_cards.items;

	const updateRow = (
		index: number,
		patch: Partial<{
			title: string;
			url: string;
			thumbnail_url: string;
		}>
	) => {
		setForm( ( f ) => {
			const next = [ ...f.link_cards.items ];
			next[ index ] = { ...next[ index ], ...patch };
			return { ...f, link_cards: { items: next } };
		} );
	};

	const addRow = () => {
		setForm( ( f ) => ( {
			...f,
			link_cards: {
				items: [
					...f.link_cards.items,
					{
						id: newLocalId(),
						title: '',
						url: '',
						thumbnail_url: '',
					},
				],
			},
		} ) );
	};

	const removeRow = ( index: number ) => {
		setForm( ( f ) => ( {
			...f,
			link_cards: {
				items: f.link_cards.items.filter( ( _, i ) => i !== index ),
			},
		} ) );
	};

	return (
		<div className="space-y-3">
			{ items.length === 0 ? (
				<p className="text-sm text-slate-500">リンクカードがありません。</p>
			) : null }
			{ items.map( ( row, index ) => (
				<div
					key={ row.id }
					className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
				>
					<div className="mb-2 flex items-center justify-between gap-2">
						<span className="text-xs font-medium text-slate-500">
							カード { index + 1 }
						</span>
						<button
							type="button"
							className="text-xs text-rose-600 hover:text-rose-800"
							onClick={ () => removeRow( index ) }
						>
							削除
						</button>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<label className="mb-1 block text-xs text-slate-600">タイトル</label>
							<input
								type="text"
								className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								value={ row.title }
								onChange={ ( e ) =>
									updateRow( index, { title: e.target.value } )
								}
								placeholder="リンクタイトル"
							/>
						</div>
						<div className="sm:col-span-2">
							<label className="mb-1 block text-xs text-slate-600">URL</label>
							<input
								type="url"
								className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								value={ row.url }
								onChange={ ( e ) =>
									updateRow( index, { url: e.target.value } )
								}
								placeholder="https://..."
							/>
						</div>
						<div className="sm:col-span-2">
							<label className="mb-1 block text-xs text-slate-600">
								サムネイル
							</label>
							<MediaPickerButton
								value={ row.thumbnail_url }
								onChange={ ( url ) =>
									updateRow( index, { thumbnail_url: url } )
								}
							/>
							<input
								type="url"
								className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1.5 font-mono text-xs focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								value={ row.thumbnail_url }
								onChange={ ( e ) =>
									updateRow( index, {
										thumbnail_url: e.target.value,
									} )
								}
								placeholder="thumbnail_url（手入力も可）"
							/>
						</div>
					</div>
				</div>
			) ) }
			<button
				type="button"
				className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-sky-300 hover:bg-sky-50/50"
				onClick={ addRow }
			>
				＋ リンクカードを追加
			</button>
		</div>
	);
}

export function CredoSectionEditor( { form, setForm }: Props ) {
	return (
		<div className="space-y-3">
			<div>
				<label className="mb-1 block text-xs text-slate-600">見出し</label>
				<input
					type="text"
					className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
					value={ form.credo.title }
					onChange={ ( e ) =>
						setForm( ( f ) => ( {
							...f,
							credo: { ...f.credo, title: e.target.value },
						} ) )
					}
					placeholder="例: Credo / 大切にしていること"
				/>
			</div>
			<div>
				<label className="mb-1 block text-xs text-slate-600">本文</label>
				<textarea
					className="min-h-[140px] w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm leading-relaxed focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
					value={ form.credo.body }
					onChange={ ( e ) =>
						setForm( ( f ) => ( {
							...f,
							credo: { ...f.credo, body: e.target.value },
						} ) )
					}
					placeholder="信条や大切にしていることを入力"
				/>
			</div>
			<p className="text-xs text-slate-500">
				クレドはプロフィールとは独立したセクションとして表示され、並び順は
				セクションの DnD で変更できます。
			</p>
		</div>
	);
}

export { PricingSection } from './PricingCategoriesEditor';

export function FaqSection( { form, setForm }: Props ) {
	const items = form.faq.items;

	const updateRow = (
		index: number,
		patch: Partial<{ question: string; answer: string }>
	) => {
		setForm( ( f ) => {
			const next = [ ...f.faq.items ];
			next[ index ] = { ...next[ index ], ...patch };
			return { ...f, faq: { items: next } };
		} );
	};

	const addRow = () => {
		setForm( ( f ) => ( {
			...f,
			faq: {
				items: [ ...f.faq.items, { question: '', answer: '' } ],
			},
		} ) );
	};

	const removeRow = ( index: number ) => {
		setForm( ( f ) => ( {
			...f,
			faq: {
				items: f.faq.items.filter( ( _, i ) => i !== index ),
			},
		} ) );
	};

	return (
		<div className="space-y-3">
			{ items.length === 0 ? (
				<p className="text-sm text-slate-500">FAQ がまだありません。</p>
			) : null }
			{ items.map( ( row, index ) => (
				<div
					key={ `faq-${ index }` }
					className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
				>
					<div className="mb-2 flex items-center justify-between gap-2">
						<span className="text-xs font-medium text-slate-500">
							FAQ { index + 1 }
						</span>
						<button
							type="button"
							className="text-xs text-rose-600 hover:text-rose-800"
							onClick={ () => removeRow( index ) }
						>
							削除
						</button>
					</div>
					<div className="grid gap-2">
						<div>
							<label className="mb-1 block text-xs text-slate-600">質問</label>
							<input
								type="text"
								className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								value={ row.question }
								onChange={ ( e ) =>
									updateRow( index, { question: e.target.value } )
								}
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs text-slate-600">回答</label>
							<textarea
								className="min-h-[96px] w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
								value={ row.answer }
								onChange={ ( e ) =>
									updateRow( index, { answer: e.target.value } )
								}
							/>
						</div>
					</div>
				</div>
			) ) }
			<button
				type="button"
				className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-sky-300 hover:bg-sky-50/50"
				onClick={ addRow }
			>
				＋ FAQ を追加
			</button>
		</div>
	);
}
