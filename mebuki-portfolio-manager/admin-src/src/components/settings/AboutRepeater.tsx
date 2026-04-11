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
import { useMemo } from 'react';
import type { AboutItem, MebukiFormState } from '../../types/settings';
import { newLocalId } from '../../lib/mergeSettings';

type Props = {
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
};

function SortableAboutRow( {
	item,
	index,
	onChange,
	onRemove,
}: {
	item: AboutItem;
	index: number;
	onChange: ( id: string, patch: Partial<Pick<AboutItem, 'title' | 'content'>> ) => void;
	onRemove: ( id: string ) => void;
} ) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: item.id } );

	const style = {
		transform: CSS.Transform.toString( transform ),
		transition,
		opacity: isDragging ? 0.9 : 1,
	};

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			className="rounded-lg border border-slate-100 bg-slate-50/90 p-3"
		>
			<div className="mb-2 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="inline-flex cursor-grab touch-none rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-500 hover:bg-slate-50 active:cursor-grabbing"
						{ ...listeners }
						{ ...attributes }
						aria-label="ブロックの並び替え"
					>
						<span aria-hidden className="text-sm leading-none">
							⋮⋮
						</span>
					</button>
					<span className="text-xs font-medium text-slate-500">
						ブロック { index + 1 }
					</span>
				</div>
				<button
					type="button"
					className="text-xs text-rose-600 hover:text-rose-800"
					onClick={ () => onRemove( item.id ) }
				>
					削除
				</button>
			</div>
			<div className="space-y-2">
				<div>
					<label className="mb-1 block text-xs text-slate-600">タイトル</label>
					<input
						type="text"
						className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ item.title }
						onChange={ ( e ) =>
							onChange( item.id, { title: e.target.value } )
						}
						placeholder="例: 機材紹介"
					/>
				</div>
				<div>
					<label className="mb-1 block text-xs text-slate-600">本文</label>
					<textarea
						className="min-h-[100px] w-full resize-y rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ item.content }
						onChange={ ( e ) =>
							onChange( item.id, { content: e.target.value } )
						}
						placeholder="このブロックの本文"
					/>
				</div>
			</div>
		</div>
	);
}

export function AboutRepeater( { form, setForm }: Props ) {
	const items = form.about.items;
	const ids = useMemo( () => items.map( ( i ) => i.id ), [ items ] );

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 6 } } ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

	const onDragEnd = ( event: DragEndEvent ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id ) {
			return;
		}
		setForm( ( f ) => {
			const list = f.about.items;
			const oldIndex = list.findIndex( ( i ) => i.id === active.id );
			const newIndex = list.findIndex( ( i ) => i.id === over.id );
			if ( oldIndex === -1 || newIndex === -1 ) {
				return f;
			}
			return {
				...f,
				about: { items: arrayMove( list, oldIndex, newIndex ) },
			};
		} );
	};

	const updateItem = (
		id: string,
		patch: Partial<Pick<AboutItem, 'title' | 'content'>>
	) => {
		setForm( ( f ) => ( {
			...f,
			about: {
				items: f.about.items.map( ( row ) =>
					row.id === id ? { ...row, ...patch } : row
				),
			},
		} ) );
	};

	const removeItem = ( id: string ) => {
		setForm( ( f ) => ( {
			...f,
			about: {
				items: f.about.items.filter( ( row ) => row.id !== id ),
			},
		} ) );
	};

	const addItem = () => {
		setForm( ( f ) => ( {
			...f,
			about: {
				items: [
					...f.about.items,
					{ id: newLocalId(), title: '', content: '' },
				],
			},
		} ) );
	};

	return (
		<div className="space-y-3">
			{ items.length === 0 ? (
				<p className="text-sm text-slate-500">
					ブロックがありません。追加してください。
				</p>
			) : null }

			<DndContext
				sensors={ sensors }
				collisionDetection={ closestCenter }
				onDragEnd={ onDragEnd }
			>
				<SortableContext items={ ids } strategy={ verticalListSortingStrategy }>
					<div className="space-y-3">
						{ items.map( ( item, index ) => (
							<SortableAboutRow
								key={ item.id }
								item={ item }
								index={ index }
								onChange={ updateItem }
								onRemove={ removeItem }
							/>
						) ) }
					</div>
				</SortableContext>
			</DndContext>

			<button
				type="button"
				className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-sky-300 hover:bg-sky-50/50"
				onClick={ addItem }
			>
				＋ タイトル＋本文のブロックを追加
			</button>
		</div>
	);
}
