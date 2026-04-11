type Props = {
	label?: string;
	value: string;
	onChange: ( url: string ) => void;
};

export function MediaPickerButton( {
	label = 'メディアライブラリから選択',
	value,
	onChange,
}: Props ) {
	const openPicker = () => {
		const wp = window.wp;
		if ( ! wp?.media ) {
			window.alert(
				'メディアライブラリを読み込めませんでした。ページを再読み込みするか、管理者に連絡してください。'
			);
			return;
		}

		const frame = wp.media( {
			title: '画像を選択',
			library: { type: 'image' },
			multiple: false,
		} );

		frame.on( 'select', () => {
			const sel = frame.state().get( 'selection' );
			const first = sel?.first();
			const json = first?.toJSON() as { url?: string } | undefined;
			if ( json?.url ) {
				onChange( json.url );
			}
		} );

		frame.open();
	};

	return (
		<div className="flex flex-wrap items-center gap-3">
			<button
				type="button"
				onClick={ openPicker }
				className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
			>
				{ label }
			</button>
			{ value ? (
				<img
					src={ value }
					alt=""
					className="h-14 w-14 rounded-md border border-slate-200 object-cover"
				/>
			) : (
				<span className="text-xs text-slate-400">サムネイル未設定</span>
			) }
		</div>
	);
}
