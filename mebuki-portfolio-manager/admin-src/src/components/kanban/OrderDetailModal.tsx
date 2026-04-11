import type { OrderRow } from '../../types/order';
import { formatOrderDate, formatYen } from '../../lib/kanbanUtils';

function DetailValue( { value }: { value: unknown } ) {
	if ( value === null || value === undefined ) {
		return <span className="text-slate-400">—</span>;
	}
	if ( typeof value === 'boolean' ) {
		return <span>{ value ? 'はい' : 'いいえ' }</span>;
	}
	if ( typeof value === 'number' ) {
		return <span>{ value }</span>;
	}
	if ( typeof value === 'string' ) {
		return <span className="whitespace-pre-wrap break-all">{ value }</span>;
	}
	if ( Array.isArray( value ) ) {
		if ( value.length === 0 ) {
			return <span className="text-slate-400">（空）</span>;
		}
		return (
			<ul className="ml-4 list-disc space-y-1 border-l border-slate-200 pl-3">
				{ value.map( ( item, i ) => (
					<li key={ i } className="text-sm">
						<DetailValue value={ item } />
					</li>
				) ) }
			</ul>
		);
	}
	if ( typeof value === 'object' ) {
		const entries = Object.entries( value as Record<string, unknown> );
		if ( entries.length === 0 ) {
			return <span className="text-slate-400">（空のオブジェクト）</span>;
		}
		return (
			<ul className="ml-1 space-y-2 border-l border-slate-200 pl-3">
				{ entries.map( ( [ k, v ] ) => (
					<li key={ k } className="text-sm">
						<span className="font-medium text-slate-700">{ k }</span>
						<span className="mx-1 text-slate-400">:</span>
						<DetailValue value={ v } />
					</li>
				) ) }
			</ul>
		);
	}
	return <span>{ String( value ) }</span>;
}

type Props = {
	order: OrderRow | null;
	onClose: () => void;
};

export function OrderDetailModal( { order, onClose }: Props ) {
	if ( ! order ) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="order-detail-title"
			onClick={ onClose }
		>
			<div
				className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
				onClick={ ( e ) => e.stopPropagation() }
			>
				<div className="flex items-start justify-between gap-2">
					<h2
						id="order-detail-title"
						className="text-lg font-semibold text-slate-900"
					>
						注文の詳細
					</h2>
					<button
						type="button"
						className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
						onClick={ onClose }
						aria-label="閉じる"
					>
						×
					</button>
				</div>

				<dl className="mt-4 space-y-3 text-sm">
					<div>
						<dt className="text-xs font-medium text-slate-500">顧客名</dt>
						<dd className="mt-0.5 text-slate-900">{ order.client_name }</dd>
					</div>
					<div>
						<dt className="text-xs font-medium text-slate-500">メール</dt>
						<dd className="mt-0.5">
							<a
								href={ `mailto:${ encodeURIComponent( order.client_email ) }` }
								className="text-sky-700 underline hover:text-sky-900"
							>
								{ order.client_email }
							</a>
						</dd>
					</div>
					<div>
						<dt className="text-xs font-medium text-slate-500">金額</dt>
						<dd className="mt-0.5 font-medium">
							{ formatYen( order.total_amount ) }
						</dd>
					</div>
					<div>
						<dt className="text-xs font-medium text-slate-500">ステータス</dt>
						<dd className="mt-0.5 font-mono text-xs">{ order.status }</dd>
					</div>
					<div>
						<dt className="text-xs font-medium text-slate-500">作成日時</dt>
						<dd className="mt-0.5">{ formatOrderDate( order.created_at ) }</dd>
					</div>
					<div>
						<dt className="text-xs font-medium text-slate-500">UUID</dt>
						<dd className="mt-0.5 break-all font-mono text-xs text-slate-700">
							{ order.uuid }
						</dd>
					</div>
					<div>
						<dt className="text-xs font-medium text-slate-500">注文 ID</dt>
						<dd className="mt-0.5 font-mono text-xs">{ order.id }</dd>
					</div>
					<div>
						<dt className="mb-1 text-xs font-medium text-slate-500">
							注文内容（order_details）
						</dt>
						<dd className="rounded-lg border border-slate-100 bg-slate-50 p-3">
							<DetailValue value={ order.order_details } />
						</dd>
					</div>
				</dl>
			</div>
		</div>
	);
}
