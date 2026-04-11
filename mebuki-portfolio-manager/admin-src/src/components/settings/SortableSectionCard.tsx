import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Props = {
	id: string;
	title: string;
	children: ReactNode;
};

export function SortableSectionCard( { id, title, children }: Props ) {
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
		opacity: isDragging ? 0.92 : 1,
		zIndex: isDragging ? 2 : 0,
	};

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5"
		>
			<div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
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
				<h2 className="text-sm font-semibold text-slate-800">{ title }</h2>
			</div>
			<div className="p-4">{ children }</div>
		</div>
	);
}
