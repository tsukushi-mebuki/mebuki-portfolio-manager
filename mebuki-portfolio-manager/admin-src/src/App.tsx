import { useCallback, useState } from 'react';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { SettingsEditor } from './components/settings/SettingsEditor';

type AdminTab = 'settings' | 'kanban' | 'portfolioPreview';

export default function App() {
	const [ tab, setTab ] = useState<AdminTab>( 'settings' );
	const rest = window.mebukiPmRest;
	const portfolioUrl = rest?.portfolioPath?.trim() ?? '';

	const openPortfolioInNewWindow = useCallback( () => {
		if ( ! portfolioUrl ) {
			return;
		}
		window.open( portfolioUrl, '_blank', 'noopener,noreferrer' );
	}, [ portfolioUrl ] );

	const tabs: { id: AdminTab; label: string }[] = [
		{ id: 'settings', label: 'サイト設定' },
		{ id: 'kanban', label: 'タスク管理' },
		{ id: 'portfolioPreview', label: 'ポートフォリオページ確認' },
	];

	return (
		<div className="min-h-screen bg-slate-50/80 p-4 md:p-6">
			<div className="mx-auto max-w-6xl">
				<nav
					className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-px"
					aria-label="管理メニュー"
				>
					{ tabs.map( ( t ) => (
						<button
							key={ t.id }
							type="button"
							role="tab"
							id={ `tab-${ t.id }` }
							aria-selected={ tab === t.id }
							className={ `-mb-px rounded-t-lg border px-4 py-2.5 text-sm font-medium transition ${
								tab === t.id
									? 'border-slate-200 border-b-white bg-white text-slate-900 shadow-sm'
									: 'border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
							}` }
							onClick={ () => {
								setTab( t.id );
								if ( t.id === 'portfolioPreview' ) {
									openPortfolioInNewWindow();
								}
							} }
						>
							{ t.label }
						</button>
					) ) }
				</nav>

				<div
					role="tabpanel"
					aria-labelledby={ `tab-${ tab }` }
				>
					{ tab === 'settings' ? (
						<div className="mx-auto max-w-3xl">
							<SettingsEditor />
						</div>
					) : null }
					{ tab === 'kanban' ? (
						rest?.root && rest?.nonce ? (
							<KanbanBoard root={ rest.root } nonce={ rest.nonce } />
						) : (
							<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
								REST の初期化情報がありません。
							</div>
						)
					) : null }
					{ tab === 'portfolioPreview' ? (
						<div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
							<h2 className="text-base font-semibold text-slate-900">
								公開ポートフォリオの確認
							</h2>
							<p className="mt-2 text-sm leading-relaxed text-slate-600">
								タブを選ぶと、訪問者向けのポートフォリオページを別ウィンドウで開きます。ポップアップが
								ブロックされた場合は、下のボタンから開いてください。
							</p>
							{ portfolioUrl ? (
								<button
									type="button"
									className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
									onClick={ openPortfolioInNewWindow }
								>
									ポートフォリオページを別ウィンドウで開く
								</button>
							) : (
								<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
									公開ポートフォリオの URL（portfolioPath）を取得できませんでした。ページを再読み込みしてください。
								</div>
							) }
						</div>
					) : null }
				</div>
			</div>
		</div>
	);
}
