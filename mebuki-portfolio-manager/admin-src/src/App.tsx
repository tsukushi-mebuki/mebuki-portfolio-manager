import { useState } from 'react';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { SettingsEditor } from './components/settings/SettingsEditor';

type AdminTab = 'settings' | 'kanban';

export default function App() {
	const [ tab, setTab ] = useState<AdminTab>( 'settings' );
	const rest = window.mebukiPmRest;

	const tabs: { id: AdminTab; label: string }[] = [
		{ id: 'settings', label: 'サイト設定' },
		{ id: 'kanban', label: 'タスク管理' },
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
							aria-selected={ tab === t.id }
							className={ `-mb-px rounded-t-lg border px-4 py-2.5 text-sm font-medium transition ${
								tab === t.id
									? 'border-slate-200 border-b-white bg-white text-slate-900 shadow-sm'
									: 'border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
							}` }
							onClick={ () => setTab( t.id ) }
						>
							{ t.label }
						</button>
					) ) }
				</nav>

				<div role="tabpanel" aria-labelledby={ `tab-${ tab }` }>
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
				</div>
			</div>
		</div>
	);
}
