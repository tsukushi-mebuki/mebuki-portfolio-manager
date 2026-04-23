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

type RowProps = {
	id: SectionId;
	label: string;
};

function SortableLayoutRow( { id, label }: RowProps ) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id } );

	const style = {
		transform: CSS.Transform.toString( transform ),
		transition,
		opacity: isDragging ? 0.88 : 1,
		zIndex: isDragging ? 2 : 0,
	};

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
		>
			<button
				type="button"
				className="inline-flex cursor-grab touch-none rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
				{ ...listeners }
				{ ...attributes }
				aria-label="セクションの並び替え"
			>
				<span aria-hidden className="select-none text-lg leading-none">
					⋮⋮
				</span>
			</button>
			<span className="text-sm font-medium text-slate-800">{ label }</span>
		</div>
	);
}

type Props = {
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
};

export function LayoutOrderEditor( { form, setForm }: Props ) {
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
		<div className="mt-6 border-t border-slate-100 pt-5">
			<h3 className="text-sm font-semibold text-slate-900">
				ページセクションの表示順
			</h3>
			<p className="mt-1 text-xs text-slate-500">
				ドラッグして並べ替えます。保存するとポートフォリオ上のセクション順（
				<code className="rounded bg-slate-100 px-1">layout_order</code>
				）に反映されます。
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
					<div className="mt-3 space-y-2">
						{ form.layout_order.map( ( id ) => (
							<SortableLayoutRow
								key={ id }
								id={ id }
								label={ SECTION_LABELS[ id ] }
							/>
						) ) }
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}
