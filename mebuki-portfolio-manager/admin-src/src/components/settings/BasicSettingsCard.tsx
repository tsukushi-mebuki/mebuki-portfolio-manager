import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Dispatch, SetStateAction } from 'react';
import { SECTION_LABELS } from '../../lib/mergeSettings';
import type { MebukiFormState, SectionId } from '../../types/settings';
import {
	THEME_PRESET_LABELS,
	THEME_PRESETS,
	type ThemePresetId,
} from '../../lib/themePresets';

type Props = {
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
};

function SortableLayoutRow( { id }: { id: SectionId } ) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id } );

	return (
		<div
			ref={ setNodeRef }
			style={ {
				transform: CSS.Transform.toString( transform ),
				transition,
				opacity: isDragging ? 0.9 : 1,
			} }
			className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
		>
			<button
				type="button"
				className="inline-flex cursor-grab touch-none rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
				{ ...listeners }
				{ ...attributes }
				aria-label="表示順を変更"
			>
				<span aria-hidden className="select-none text-base leading-none">
					⋮⋮
				</span>
			</button>
			<span className="text-sm text-slate-800">{ SECTION_LABELS[ id ] }</span>
		</div>
	);
}

export function BasicSettingsCard( { form, setForm }: Props ) {
	const presetOptions = (
		Object.keys( THEME_PRESET_LABELS ) as ThemePresetId[]
	).map( ( id ) => ( { id, label: THEME_PRESET_LABELS[ id ] } ) );
	const sensors = useSensors(
		useSensor( PointerSensor, {
			activationConstraint: { distance: 8 },
		} ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

	const onDragEnd = ( event: DragEndEvent ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id ) {
			return;
		}
		setForm( ( prev ) => {
			const oldIndex = prev.layout_order.indexOf( active.id as SectionId );
			const newIndex = prev.layout_order.indexOf( over.id as SectionId );
			if ( oldIndex === -1 || newIndex === -1 ) {
				return prev;
			}
			return {
				...prev,
				layout_order: arrayMove( prev.layout_order, oldIndex, newIndex ),
			};
		} );
	};

	return (
		<div>
			<p className="text-xs text-slate-500">
				Stripe・通知メール・テーマプリセットを設定できます。
			</p>
			<div className="mt-4 grid gap-4 md:grid-cols-2">
				<div className="md:col-span-2">
					<label className="mb-1 block text-xs font-medium text-slate-600">
						テーマプリセット
					</label>
					<select
						className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.theme_preset }
						onChange={ ( e ) => {
							const p = e.target.value as ThemePresetId;
							setForm( ( f ) => ( {
								...f,
								theme_preset: p,
								theme: { ...THEME_PRESETS[ p ] },
							} ) );
						} }
					>
						{ presetOptions.map( ( o ) => (
							<option key={ o.id } value={ o.id }>
								{ o.label }
							</option>
						) ) }
					</select>
					<p className="mt-1 text-xs text-slate-500">
						保存時に <code className="rounded bg-slate-100 px-1">theme</code> オブジェクトへプリセット値がマージされます。
					</p>
				</div>

				<div>
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Stripe 公開鍵
					</label>
					<input
						type="text"
						autoComplete="off"
						className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.stripe_public_key }
						onChange={ ( e ) =>
							setForm( ( f ) => ( {
								...f,
								stripe_public_key: e.target.value,
							} ) )
						}
						placeholder="pk_live_..."
					/>
				</div>

				<div>
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Stripe シークレット鍵
					</label>
					<input
						type="password"
						autoComplete="new-password"
						className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.stripe_secret_key }
						onChange={ ( e ) =>
							setForm( ( f ) => ( {
								...f,
								stripe_secret_key: e.target.value,
							} ) )
						}
						placeholder="sk_live_..."
					/>
				</div>

				<div className="md:col-span-2">
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Stripe Webhook 署名シークレット
					</label>
					<input
						type="password"
						autoComplete="new-password"
						className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.stripe_webhook_secret }
						onChange={ ( e ) =>
							setForm( ( f ) => ( {
								...f,
								stripe_webhook_secret: e.target.value,
							} ) )
						}
						placeholder="whsec_..."
					/>
					<p className="mt-1 text-xs text-slate-500">
						Stripe ダッシュボードまたは{' '}
						<code className="rounded bg-slate-100 px-1">stripe listen</code>{' '}
						で発行される Webhook 署名用シークレットを貼り付けます。エンドポイントは{' '}
						<code className="rounded bg-slate-100 px-1">
							/wp-json/mebuki-pm/v1/webhooks/stripe
						</code>{' '}
						です。
					</p>
				</div>

				<div className="md:col-span-2">
					<label className="mb-1 block text-xs font-medium text-slate-600">
						管理者メール（通知・問い合わせ用）
					</label>
					<input
						type="email"
						className="w-full max-w-lg rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.admin_email }
						onChange={ ( e ) =>
							setForm( ( f ) => ( { ...f, admin_email: e.target.value } ) )
						}
						placeholder="admin@example.com"
					/>
				</div>

				<div className="md:col-span-2">
					<label className="mb-1 block text-xs font-medium text-slate-600">
						セクション表示順（layout_order）
					</label>
					<p className="mb-2 text-xs text-slate-500">
						下のセクション名をドラッグして、公開ページの表示順を変更できます。
					</p>
					<DndContext
						sensors={ sensors }
						collisionDetection={ closestCenter }
						onDragEnd={ onDragEnd }
					>
						<SortableContext
							items={ form.layout_order }
							strategy={ verticalListSortingStrategy }
						>
							<div className="space-y-2">
								{ form.layout_order.map( ( sectionId ) => (
									<SortableLayoutRow key={ sectionId } id={ sectionId } />
								) ) }
							</div>
						</SortableContext>
					</DndContext>
				</div>
			</div>
		</div>
	);
}
