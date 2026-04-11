import { useEffect, useRef } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export function Toast( {
	message,
	variant,
	onDismiss,
	durationMs = 5000,
}: {
	message: string;
	variant: ToastVariant;
	onDismiss: () => void;
	durationMs?: number;
} ) {
	const onDismissRef = useRef( onDismiss );
	onDismissRef.current = onDismiss;

	useEffect( () => {
		const t = window.setTimeout( () => onDismissRef.current(), durationMs );
		return () => window.clearTimeout( t );
	}, [ durationMs ] );

	const styles: Record<ToastVariant, string> = {
		success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
		error: 'border-rose-200 bg-rose-50 text-rose-900',
		info: 'border-sky-200 bg-sky-50 text-sky-900',
	};

	return (
		<div
			className={ `fixed right-4 top-4 z-50 max-w-md rounded-lg border px-4 py-3 text-sm shadow-lg ${ styles[ variant ] }` }
			role="status"
		>
			<div className="flex items-start gap-3">
				<p className="flex-1 leading-relaxed">{ message }</p>
				<button
					type="button"
					className="shrink-0 rounded px-1 text-slate-500 hover:text-slate-800"
					onClick={ onDismiss }
					aria-label="閉じる"
				>
					×
				</button>
			</div>
		</div>
	);
}
