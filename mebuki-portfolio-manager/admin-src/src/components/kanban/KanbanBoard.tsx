import {
	closestCorners,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { useCallback, useEffect, useState } from 'react';
import {
	boardColumnForStatus,
	formatOrderDate,
	formatYen,
	ordersByColumn,
} from '../../lib/kanbanUtils';
import { fetchOrdersMe, patchOrderStatus } from '../../lib/ordersApi';
import type { KanbanColumnId, OrderRow, OrderWorkflowStatus } from '../../types/order';
import { Toast, type ToastVariant } from '../Toast';
import { OrderCard } from './OrderCard';
import { OrderDetailModal } from './OrderDetailModal';

const COLUMNS: { id: KanbanColumnId; title: string }[] = [
	{ id: 'pending', title: '未対応' },
	{ id: 'in_progress', title: '対応中' },
	{ id: 'completed', title: '完了' },
];

function resolveDropColumn(
	overId: string,
	orders: OrderRow[]
): KanbanColumnId | null {
	if (
		overId === 'pending' ||
		overId === 'in_progress' ||
		overId === 'completed'
	) {
		return overId;
	}
	if ( overId.startsWith( 'order-' ) ) {
		const oid = parseInt( overId.slice( 'order-'.length ), 10 );
		const target = orders.find( ( o ) => o.id === oid );
		if ( target ) {
			return boardColumnForStatus( target.status );
		}
	}
	return null;
}

type Props = {
	root: string;
	nonce: string;
};

export function KanbanBoard( { root, nonce }: Props ) {
	const [ orders, setOrders ] = useState<OrderRow[]>( [] );
	const [ loading, setLoading ] = useState( true );
	const [ err, setErr ] = useState<string | null>( null );
	const [ updatingId, setUpdatingId ] = useState<number | null>( null );
	const [ activeOrder, setActiveOrder ] = useState<OrderRow | null>( null );
	const [ detailOrder, setDetailOrder ] = useState<OrderRow | null>( null );
	const [ toast, setToast ] = useState<{
		message: string;
		variant: ToastVariant;
	} | null >( null );

	const notify = useCallback( ( message: string, variant: ToastVariant ) => {
		setToast( { message, variant } );
	}, [] );

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 6 } } )
	);

	const load = useCallback( async () => {
		setLoading( true );
		setErr( null );
		try {
			const rows = await fetchOrdersMe( root, nonce );
			setOrders( rows );
		} catch ( e ) {
			setErr(
				e instanceof Error ? e.message : '注文一覧の取得に失敗しました。'
			);
		} finally {
			setLoading( false );
		}
	}, [ nonce, root ] );

	useEffect( () => {
		void load();
	}, [ load ] );

	const onDragStart = ( event: DragStartEvent ) => {
		const id = String( event.active.id );
		if ( ! id.startsWith( 'order-' ) ) {
			return;
		}
		const oid = parseInt( id.slice( 'order-'.length ), 10 );
		const o = orders.find( ( x ) => x.id === oid );
		setActiveOrder( o ?? null );
	};

	const onDragEnd = async ( event: DragEndEvent ) => {
		setActiveOrder( null );
		const { active, over } = event;
		if ( ! over ) {
			return;
		}
		const activeId = String( active.id );
		if ( ! activeId.startsWith( 'order-' ) ) {
			return;
		}
		const orderId = parseInt( activeId.slice( 'order-'.length ), 10 );
		const overId = String( over.id );
		const targetCol = resolveDropColumn( overId, orders );
		if ( ! targetCol ) {
			return;
		}
		const order = orders.find( ( o ) => o.id === orderId );
		if ( ! order ) {
			return;
		}
		const currentCol = boardColumnForStatus( order.status );
		if ( currentCol === targetCol ) {
			return;
		}

		const newStatus: OrderWorkflowStatus = targetCol;
		const prev = orders;
		setOrders( ( list ) =>
			list.map( ( o ) =>
				o.id === orderId ? { ...o, status: newStatus } : o
			)
		);
		setUpdatingId( orderId );
		try {
			const updated = await patchOrderStatus(
				root,
				nonce,
				orderId,
				newStatus
			);
			setOrders( ( list ) =>
				list.map( ( o ) => ( o.id === orderId ? updated : o ) )
			);
			notify( 'ステータスを更新しました。', 'success' );
		} catch ( e ) {
			setOrders( prev );
			notify(
				e instanceof Error ? e.message : '更新に失敗しました。',
				'error'
			);
		} finally {
			setUpdatingId( null );
		}
	};

	const buckets = ordersByColumn( orders );

	if ( loading ) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
				注文を読み込み中です…
			</div>
		);
	}

	if ( err ) {
		return (
			<div className="space-y-3">
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
					{ err }
				</div>
				<button
					type="button"
					className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
					onClick={ () => void load() }
				>
					再試行
				</button>
			</div>
		);
	}

	return (
		<div>
			{ toast ? (
				<Toast
					message={ toast.message }
					variant={ toast.variant }
					onDismiss={ () => setToast( null ) }
				/>
			) : null }

			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-xl font-semibold text-slate-900">
						タスク管理
					</h1>
					<p className="mt-1 text-sm text-slate-600">
						左のハンドルでカードをドラッグし、列を変えるとステータスが保存されます。
					</p>
				</div>
				<button
					type="button"
					className="self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
					onClick={ () => void load() }
				>
					一覧を再読み込み
				</button>
			</div>

			<DndContext
				sensors={ sensors }
				collisionDetection={ closestCorners }
				onDragStart={ onDragStart }
				onDragEnd={ ( e ) => void onDragEnd( e ) }
			>
				<div className="grid gap-4 lg:grid-cols-3">
					{ COLUMNS.map( ( col ) => (
						<KanbanColumn
							key={ col.id }
							id={ col.id }
							title={ col.title }
							orders={ buckets[ col.id ] }
							updatingId={ updatingId }
							onOpenDetail={ setDetailOrder }
						/>
					) ) }
				</div>

				<DragOverlay dropAnimation={ null }>
					{ activeOrder ? (
						<div className="w-64 rounded-lg border border-sky-200 bg-white p-3 shadow-lg ring-2 ring-sky-200">
							<p className="font-medium text-slate-900">
								{ activeOrder.client_name }
							</p>
							<p className="mt-1 text-sm font-semibold text-sky-800">
								{ formatYen( activeOrder.total_amount ) }
							</p>
							<p className="mt-1 text-xs text-slate-500">
								{ formatOrderDate( activeOrder.created_at ) }
							</p>
						</div>
					) : null }
				</DragOverlay>
			</DndContext>

			<OrderDetailModal
				order={ detailOrder }
				onClose={ () => setDetailOrder( null ) }
			/>
		</div>
	);
}

function KanbanColumn( {
	id,
	title,
	orders,
	updatingId,
	onOpenDetail,
}: {
	id: KanbanColumnId;
	title: string;
	orders: OrderRow[];
	updatingId: number | null;
	onOpenDetail: ( o: OrderRow ) => void;
} ) {
	const { setNodeRef, isOver } = useDroppable( { id } );

	return (
		<div
			ref={ setNodeRef }
			className={ `flex min-h-[280px] flex-col rounded-xl border bg-slate-50/80 p-3 transition ${
				isOver
					? 'border-sky-400 ring-2 ring-sky-200'
					: 'border-slate-200 ring-1 ring-slate-900/5'
			}` }
		>
			<h2 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">
				{ title }
				<span className="ml-2 font-normal text-slate-500">
					({ orders.length })
				</span>
			</h2>
			<div className="flex flex-1 flex-col gap-2">
				{ orders.length === 0 ? (
					<p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
						ここへドロップ
					</p>
				) : null }
				{ orders.map( ( o ) => (
					<OrderCard
						key={ o.id }
						order={ o }
						isUpdating={ updatingId === o.id }
						onOpenDetail={ onOpenDetail }
					/>
				) ) }
			</div>
		</div>
	);
}
