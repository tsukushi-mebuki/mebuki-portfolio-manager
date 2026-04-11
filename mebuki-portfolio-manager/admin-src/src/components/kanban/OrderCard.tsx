import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { OrderRow } from '../../types/order';
import { formatOrderDate, formatYen } from '../../lib/kanbanUtils';

type Props = {
	order: OrderRow;
	isUpdating: boolean;
	onOpenDetail: ( order: OrderRow ) => void;
};

export function OrderCard( { order, isUpdating, onOpenDetail }: Props ) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable( {
			id: `order-${ order.id }`,
			data: { order },
			disabled: isUpdating,
		} );

	const style = {
		transform: transform
			? CSS.Transform.toString( transform )
			: undefined,
		opacity: isDragging ? 0.55 : isUpdating ? 0.65 : 1,
	};

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			className={ `relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm ring-slate-900/5 ${
				isDragging ? 'z-10 ring-2 ring-sky-300' : 'ring-1'
			}` }
		>
			{ isUpdating ? (
				<div className="absolute inset-0 z-[1] flex items-center justify-center rounded-lg bg-white/70">
					<span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
				</div>
			) : null }
			<div className="flex gap-2">
				<button
					type="button"
					className="mt-0.5 shrink-0 cursor-grab touch-none rounded border border-slate-200 bg-slate-50 px-1 py-1 text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
					{ ...listeners }
					{ ...attributes }
					aria-label="カードを移動"
				>
					<span aria-hidden className="text-sm leading-none">
						⋮⋮
					</span>
				</button>
				<button
					type="button"
					className="min-w-0 flex-1 text-left"
					onClick={ () => onOpenDetail( order ) }
				>
					<p className="truncate font-medium text-slate-900">
						{ order.client_name }
					</p>
					<p className="mt-1 text-sm font-semibold text-sky-800">
						{ formatYen( order.total_amount ) }
					</p>
					<p className="mt-1 text-xs text-slate-500">
						{ formatOrderDate( order.created_at ) }
					</p>
				</button>
			</div>
		</div>
	);
}
