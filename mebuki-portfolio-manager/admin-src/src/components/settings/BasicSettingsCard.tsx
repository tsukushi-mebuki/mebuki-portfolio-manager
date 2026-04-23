import type { Dispatch, SetStateAction } from 'react';
import type { MebukiFormState } from '../../types/settings';
import {
	THEME_PRESET_LABELS,
	THEME_PRESETS,
	type ThemePresetId,
} from '../../lib/themePresets';
import { LayoutOrderEditor } from './LayoutOrderEditor';

type Props = {
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
};

export function BasicSettingsCard( { form, setForm }: Props ) {
	const presetOptions = (
		Object.keys( THEME_PRESET_LABELS ) as ThemePresetId[]
	).map( ( id ) => ( { id, label: THEME_PRESET_LABELS[ id ] } ) );

	return (
		<div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
			<h2 className="text-base font-semibold text-slate-900">基本設定</h2>
			<p className="mt-1 text-xs text-slate-500">
				Stripe・通知メール・テーマプリセット・ページ上のセクション表示順
			</p>

			<div className="mt-4 grid gap-4 md:grid-cols-2">
				<div className="md:col-span-2">
					<label className="mb-1 block text-xs font-medium text-slate-600">
						テーマプリセット
					</label>
					<select
						className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.theme_preset }
						onChange={ ( e ) => {
							const p = e.target.value as ThemePresetId;
							setForm( ( f ) => ( {
								...f,
								theme_preset: p,
								theme: { ...THEME_PRESETS[ p ] },
							} ) );
						} }
					>
						{ presetOptions.map( ( o ) => (
							<option key={ o.id } value={ o.id }>
								{ o.label }
							</option>
						) ) }
					</select>
					<p className="mt-1 text-xs text-slate-500">
						保存時に <code className="rounded bg-slate-100 px-1">theme</code> オブジェクトへプリセット値がマージされます。
					</p>
				</div>

				<div>
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Stripe 公開鍵
					</label>
					<input
						type="text"
						autoComplete="off"
						className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.stripe_public_key }
						onChange={ ( e ) =>
							setForm( ( f ) => ( {
								...f,
								stripe_public_key: e.target.value,
							} ) )
						}
						placeholder="pk_live_..."
					/>
				</div>

				<div>
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Stripe シークレット鍵
					</label>
					<input
						type="password"
						autoComplete="new-password"
						className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.stripe_secret_key }
						onChange={ ( e ) =>
							setForm( ( f ) => ( {
								...f,
								stripe_secret_key: e.target.value,
							} ) )
						}
						placeholder="sk_live_..."
					/>
				</div>

				<div className="md:col-span-2">
					<label className="mb-1 block text-xs font-medium text-slate-600">
						Stripe Webhook 署名シークレット
					</label>
					<input
						type="password"
						autoComplete="new-password"
						className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.stripe_webhook_secret }
						onChange={ ( e ) =>
							setForm( ( f ) => ( {
								...f,
								stripe_webhook_secret: e.target.value,
							} ) )
						}
						placeholder="whsec_..."
					/>
					<p className="mt-1 text-xs text-slate-500">
						Stripe ダッシュボードまたは{' '}
						<code className="rounded bg-slate-100 px-1">stripe listen</code>{' '}
						で発行される Webhook 署名用シークレットを貼り付けます。エンドポイントは{' '}
						<code className="rounded bg-slate-100 px-1">
							/wp-json/mebuki-pm/v1/webhooks/stripe
						</code>{' '}
						です。
					</p>
				</div>

				<div className="md:col-span-2">
					<label className="mb-1 block text-xs font-medium text-slate-600">
						管理者メール（通知・問い合わせ用）
					</label>
					<input
						type="email"
						className="w-full max-w-lg rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
						value={ form.admin_email }
						onChange={ ( e ) =>
							setForm( ( f ) => ( { ...f, admin_email: e.target.value } ) )
						}
						placeholder="admin@example.com"
					/>
				</div>
			</div>

			<LayoutOrderEditor form={ form } setForm={ setForm } />
		</div>
	);
}
