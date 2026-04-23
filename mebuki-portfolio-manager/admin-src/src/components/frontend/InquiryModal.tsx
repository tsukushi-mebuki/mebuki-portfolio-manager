import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import type { PricingCalculationResult } from '../../core/logic/calculator';
import { postPublicOrder } from '../../lib/createPublicOrder';
import { postOrderCheckout } from '../../lib/orderCheckoutApi';
import type { InquiryTemplate } from '../../types/settings';

export type InquiryEstimateContext = {
	categoryId: string;
	categoryName: string;
	courseId: string | null;
	courseDisplayName: string;
	orderOptions: { id: string; name: string }[];
};

type Props = {
	open: boolean;
	onClose: () => void;
	calc: PricingCalculationResult;
	estimate: InquiryEstimateContext;
};

function generateUuidV4(): string {
	if ( typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ) {
		return crypto.randomUUID();
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, ( c ) => {
		const r = ( Math.random() * 16 ) | 0;
		const v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
		return v.toString( 16 );
	} );
}

function isValidEmail( value: string ): boolean {
	const v = value.trim();
	if ( v === '' ) {
		return false;
	}
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( v );
}

function formatOptionYen( n: number ): string {
	return new Intl.NumberFormat( 'ja-JP', {
		style: 'currency',
		currency: 'JPY',
		maximumFractionDigits: 0,
	} ).format( n );
}

export function InquiryModal( {
	open,
	onClose,
	calc,
	estimate,
}: Props ) {
	const titleId = useId();
	const [ requestUuid, setRequestUuid ] = useState<string | null>( null );
	const [ clientName, setClientName ] = useState( '' );
	const [ clientEmail, setClientEmail ] = useState( '' );
	const [ message, setMessage ] = useState( '' );
	const [ selectedTemplateId, setSelectedTemplateId ] = useState( '' );
	const [ touched, setTouched ] = useState( false );
	const [ submitting, setSubmitting ] = useState( false );
	const [ stripeSubmitting, setStripeSubmitting ] = useState( false );
	const [ submitError, setSubmitError ] = useState<string | null>( null );
	const actionBusy = submitting || stripeSubmitting;
	const [ success, setSuccess ] = useState( false );
	const templates = useMemo( () => {
		const raw = window.mebukiPmSettings?.settings?.inquiry_templates;
		if ( ! raw || typeof raw !== 'object' ) {
			return [] as InquiryTemplate[];
		}
		const items = ( raw as { items?: unknown } ).items;
		if ( ! Array.isArray( items ) ) {
			return [] as InquiryTemplate[];
		}
		return items
			.map( ( row ) => {
				if ( ! row || typeof row !== 'object' ) {
					return null;
				}
				const o = row as Record<string, unknown>;
				if (
					typeof o.id !== 'string' ||
					! Array.isArray( o.pricing_category_ids )
				) {
					return null;
				}
				return {
					id: o.id,
					title: typeof o.title === 'string' ? o.title : '',
					pricing_category_ids: o.pricing_category_ids.filter(
						( x ): x is string => typeof x === 'string'
					),
					body: typeof o.body === 'string' ? o.body : '',
				} satisfies InquiryTemplate;
			} )
			.filter( ( row ): row is InquiryTemplate => row !== null )
			.filter( ( row ) => row.pricing_category_ids.includes( estimate.categoryId ) );
	}, [ estimate.categoryId ] );

	useEffect( () => {
		if ( ! open ) {
			return;
		}
		setRequestUuid( generateUuidV4() );
		setClientName( '' );
		setClientEmail( '' );
		setMessage( '' );
		setSelectedTemplateId( templates[ 0 ]?.id ?? '' );
		setTouched( false );
		setSubmitting( false );
		setStripeSubmitting( false );
		setSubmitError( null );
		setSuccess( false );
	}, [ open, templates ] );

	const selectedTemplate =
		templates.find( ( row ) => row.id === selectedTemplateId ) ?? null;

	function insertSelectedTemplate() {
		if ( ! selectedTemplate || selectedTemplate.body.trim() === '' ) {
			return;
		}
		setMessage( ( prev ) => {
			const base = prev.trim();
			return base === ''
				? selectedTemplate.body
				: `${ base }\n\n${ selectedTemplate.body }`;
		} );
	}

	useEffect( () => {
		if ( ! open ) {
			return;
		}
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, [ open ] );

	useEffect( () => {
		if ( ! open ) {
			return;
		}
		const onKey = ( e: KeyboardEvent ) => {
			if ( e.key === 'Escape' && ! submitting && ! stripeSubmitting ) {
				onClose();
			}
		};
		document.addEventListener( 'keydown', onKey );
		return () => document.removeEventListener( 'keydown', onKey );
	}, [ open, onClose, submitting, stripeSubmitting ] );

	if ( ! open ) {
		return null;
	}

	const nameErr =
		touched && clientName.trim() === '' ? '氏名を入力してください。' : null;
	const emailErr = touched
		? clientEmail.trim() === ''
			? 'メールアドレスを入力してください。'
			: ! isValidEmail( clientEmail )
				? '有効なメールアドレスを入力してください。'
				: null
		: null;

	async function handleSubmit( e: FormEvent ) {
		e.preventDefault();
		setTouched( true );
		setSubmitError( null );

		if (
			clientName.trim() === '' ||
			clientEmail.trim() === '' ||
			! isValidEmail( clientEmail )
		) {
			return;
		}

		const root = window.mebukiPmSettings?.root;
		const userSlug = ( window.mebukiPmSettings?.portfolioUserSlug ?? '' ).trim();
		if ( ! root || userSlug === '' ) {
			setSubmitError(
				'送信設定を読み込めませんでした。ページを再読み込みしてお試しください。'
			);
			return;
		}

		const uuid = requestUuid ?? generateUuidV4();
		if ( ! requestUuid ) {
			setRequestUuid( uuid );
		}

		setSubmitting( true );
		const result = await postPublicOrder( root, {
			user_slug: userSlug,
			uuid,
			client_name: clientName.trim(),
			client_email: clientEmail.trim(),
			message: message.trim(),
			total_amount: calc.totalYen,
			order_details_json: {
				category_name: estimate.categoryName,
				course: {
					id: estimate.courseId ?? '',
					name: estimate.courseDisplayName,
				},
				options: estimate.orderOptions,
			},
		} );

		setSubmitting( false );

		if ( result.ok ) {
			setSuccess( true );
			return;
		}

		setSubmitError( result.message );
	}

	const stripeMinMet = calc.totalYen >= 50;
	const rawSettings = window.mebukiPmSettings?.settings;
	const stripePublicKey =
		typeof rawSettings?.stripe_public_key === 'string'
			? rawSettings.stripe_public_key.trim()
			: '';
	const stripeSecretKey =
		typeof rawSettings?.stripe_secret_key === 'string'
			? rawSettings.stripe_secret_key.trim()
			: '';
	const stripeCheckoutEnabled = stripePublicKey !== '' && stripeSecretKey !== '';

	async function handleStripeCheckout() {
		setTouched( true );
		setSubmitError( null );

		if ( ! stripeCheckoutEnabled ) {
			return;
		}

		if (
			clientName.trim() === '' ||
			clientEmail.trim() === '' ||
			! isValidEmail( clientEmail )
		) {
			return;
		}

		if ( ! stripeMinMet ) {
			setSubmitError(
				'Stripe のカード決済は合計 50 円以上からご利用いただけます。'
			);
			return;
		}

		const root = window.mebukiPmSettings?.root;
		const userSlug = ( window.mebukiPmSettings?.portfolioUserSlug ?? '' ).trim();
		if ( ! root || userSlug === '' ) {
			setSubmitError(
				'送信設定を読み込めませんでした。ページを再読み込みしてお試しください。'
			);
			return;
		}

		const uuid = requestUuid ?? generateUuidV4();
		if ( ! requestUuid ) {
			setRequestUuid( uuid );
		}

		setStripeSubmitting( true );
		const result = await postOrderCheckout( root, {
			user_slug: userSlug,
			uuid,
			client_name: clientName.trim(),
			client_email: clientEmail.trim(),
			message: message.trim(),
			total_amount: calc.totalYen,
			order_details_json: {
				category_name: estimate.categoryName,
				course: {
					id: estimate.courseId ?? '',
					name: estimate.courseDisplayName,
				},
				options: estimate.orderOptions,
			},
		} );

		setStripeSubmitting( false );

		if ( result.ok ) {
			window.location.href = result.checkout_url;
			return;
		}

		setSubmitError( result.message );
	}

	return (
		<div
			className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
			role="presentation"
			onMouseDown={ ( e ) => {
				if ( e.target === e.currentTarget && ! actionBusy ) {
					onClose();
				}
			} }
		>
			<div
				className="absolute inset-0 bg-[color-mix(in_srgb,var(--mebuki-text)_45%,transparent)] backdrop-blur-[2px]"
				aria-hidden
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={ titleId }
				className="relative flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_12%,transparent)] bg-[var(--mebuki-surface)] shadow-2xl sm:max-h-[85vh] sm:rounded-[var(--mebuki-radius)]"
			>
				<div className="flex shrink-0 items-center justify-between border-b border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] px-4 py-3">
					<h2
						id={ titleId }
						className="font-[family-name:var(--mebuki-font-heading)] text-lg font-semibold text-[var(--mebuki-text)]"
					>
						お問い合わせ
					</h2>
					<button
						type="button"
						className="rounded-md p-2 text-[var(--mebuki-text-muted)] hover:bg-[color-mix(in_srgb,var(--mebuki-text)_6%,transparent)] hover:text-[var(--mebuki-text)]"
						onClick={ onClose }
						disabled={ actionBusy }
						aria-label="閉じる"
					>
						<span aria-hidden className="text-xl leading-none">
							×
						</span>
					</button>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
					{ success ? (
						<div className="space-y-4 py-4 text-center">
							<p className="font-[family-name:var(--mebuki-font-heading)] text-lg font-medium text-[var(--mebuki-text)]">
								送信しました
							</p>
							<p className="text-sm text-[var(--mebuki-text-muted)]">
								内容を確認のうえ、ご連絡いたします。
							</p>
							<button
								type="button"
								className="mt-2 rounded-[var(--mebuki-radius)] bg-[var(--mebuki-accent)] px-6 py-2.5 text-sm font-semibold text-white"
								onClick={ onClose }
							>
								閉じる
							</button>
						</div>
					) : (
						<form className="space-y-5" onSubmit={ handleSubmit } noValidate>
							<div
								className="rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[color-mix(in_srgb,var(--mebuki-bg)_80%,var(--mebuki-surface))] p-4"
								aria-live="polite"
							>
								<p className="text-xs font-medium uppercase tracking-wide text-[var(--mebuki-text-muted)]">
									見積もりサマリー
								</p>
								<p className="mt-2 font-[family-name:var(--mebuki-font-heading)] text-2xl font-bold text-[var(--mebuki-accent)]">
									{ calc.totalFormatted }
								</p>
								<dl className="mt-4 space-y-2 text-sm">
									<div className="flex justify-between gap-4">
										<dt className="text-[var(--mebuki-text-muted)]">カテゴリ</dt>
										<dd className="text-right font-medium text-[var(--mebuki-text)]">
											{ estimate.categoryName }
										</dd>
									</div>
									<div className="flex justify-between gap-4">
										<dt className="text-[var(--mebuki-text-muted)]">コース</dt>
										<dd className="text-right font-medium text-[var(--mebuki-text)]">
											{ estimate.courseDisplayName }
											<span className="ml-2 text-[var(--mebuki-text-muted)]">
												(
												{ formatOptionYen( calc.courseAmountYen ) }
												)
											</span>
										</dd>
									</div>
									{ calc.optionLines.length > 0 ? (
										<div>
											<dt className="mb-1 text-[var(--mebuki-text-muted)]">
												オプション
											</dt>
											<dd>
												<ul className="space-y-1 text-right">
													{ calc.optionLines.map( ( o ) => (
														<li
															key={ o.id }
															className="flex justify-end gap-2 text-[var(--mebuki-text)]"
														>
															<span>{ o.name }</span>
															<span className="text-[var(--mebuki-text-muted)]">
																+
																{ formatOptionYen( o.amountYen ) }
															</span>
														</li>
													) ) }
												</ul>
											</dd>
										</div>
									) : (
										<div className="flex justify-between gap-4">
											<dt className="text-[var(--mebuki-text-muted)]">
												オプション
											</dt>
											<dd className="text-[var(--mebuki-text-muted)]">なし</dd>
										</div>
									) }
								</dl>
							</div>

							<div>
								<label
									htmlFor="mebuki-inquiry-name"
									className="mb-1 block text-sm font-medium text-[var(--mebuki-text)]"
								>
									氏名
									<span className="text-rose-600">*</span>
								</label>
								<input
									id="mebuki-inquiry-name"
									type="text"
									autoComplete="name"
									className="w-full rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_18%,transparent)] bg-[var(--mebuki-bg)] px-3 py-2 text-sm text-[var(--mebuki-text)] focus:border-[var(--mebuki-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)]"
									value={ clientName }
									onChange={ ( e ) => setClientName( e.target.value ) }
									disabled={ actionBusy }
									aria-invalid={ Boolean( nameErr ) }
								/>
								{ nameErr ? (
									<p className="mt-1 text-xs text-rose-600" role="alert">
										{ nameErr }
									</p>
								) : null }
							</div>

							<div>
								<label
									htmlFor="mebuki-inquiry-email"
									className="mb-1 block text-sm font-medium text-[var(--mebuki-text)]"
								>
									メールアドレス
									<span className="text-rose-600">*</span>
								</label>
								<input
									id="mebuki-inquiry-email"
									type="email"
									autoComplete="email"
									inputMode="email"
									className="w-full rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_18%,transparent)] bg-[var(--mebuki-bg)] px-3 py-2 text-sm text-[var(--mebuki-text)] focus:border-[var(--mebuki-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)]"
									value={ clientEmail }
									onChange={ ( e ) => setClientEmail( e.target.value ) }
									disabled={ actionBusy }
									aria-invalid={ Boolean( emailErr ) }
								/>
								{ emailErr ? (
									<p className="mt-1 text-xs text-rose-600" role="alert">
										{ emailErr }
									</p>
								) : null }
							</div>

							<div>
								<label
									htmlFor="mebuki-inquiry-message"
									className="mb-1 block text-sm font-medium text-[var(--mebuki-text)]"
								>
									補足メッセージ
									<span className="text-[var(--mebuki-text-muted)]">（任意）</span>
								</label>
								{ templates.length > 0 ? (
									<div className="mb-2 rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_10%,transparent)] bg-[color-mix(in_srgb,var(--mebuki-bg)_78%,var(--mebuki-surface))] p-3">
										<p className="mb-2 text-xs text-[var(--mebuki-text-muted)]">
											このカテゴリで使えるテンプレートから選んで挿入できます。
										</p>
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
											<select
												className="min-w-0 flex-1 rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_18%,transparent)] bg-[var(--mebuki-bg)] px-3 py-2 text-sm text-[var(--mebuki-text)] focus:border-[var(--mebuki-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)]"
												value={ selectedTemplateId }
												onChange={ ( e ) =>
													setSelectedTemplateId( e.target.value )
												}
												disabled={ actionBusy }
											>
												{ templates.map( ( row ) => (
													<option key={ row.id } value={ row.id }>
														{ row.title.trim() !== ''
															? row.title
															: '（無題テンプレート）' }
													</option>
												) ) }
											</select>
											<button
												type="button"
												className="rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_20%,transparent)] px-3 py-2 text-sm font-medium text-[var(--mebuki-text)] hover:bg-[color-mix(in_srgb,var(--mebuki-text)_6%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
												onClick={ insertSelectedTemplate }
												disabled={
													actionBusy ||
													! selectedTemplate ||
													selectedTemplate.body.trim() === ''
												}
											>
												テンプレートを挿入
											</button>
										</div>
									</div>
								) : null }
								<textarea
									id="mebuki-inquiry-message"
									rows={ 4 }
									className="w-full resize-y rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_18%,transparent)] bg-[var(--mebuki-bg)] px-3 py-2 text-sm text-[var(--mebuki-text)] focus:border-[var(--mebuki-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mebuki-accent)_35%,transparent)]"
									value={ message }
									onChange={ ( e ) => setMessage( e.target.value ) }
									disabled={ actionBusy }
									placeholder="ご希望やご質問があればご記入ください"
								/>
							</div>

							{ submitError ? (
								<p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
									{ submitError }
								</p>
							) : null }

							<div className="flex flex-col-reverse flex-wrap gap-2 pt-1 sm:flex-row sm:justify-end">
								<button
									type="button"
									className="rounded-[var(--mebuki-radius)] border border-[color-mix(in_srgb,var(--mebuki-text)_20%,transparent)] px-4 py-2.5 text-sm font-medium text-[var(--mebuki-text)] hover:bg-[color-mix(in_srgb,var(--mebuki-text)_6%,transparent)]"
									onClick={ onClose }
									disabled={ actionBusy }
								>
									キャンセル
								</button>
								<button
									type="submit"
									className="rounded-[var(--mebuki-radius)] bg-[var(--mebuki-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={ actionBusy }
								>
									{ submitting ? '送信中…' : '送信する' }
								</button>
								{ stripeCheckoutEnabled ? (
									<button
										type="button"
										className="rounded-[var(--mebuki-radius)] bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md ring-2 ring-emerald-500/30 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
										disabled={ actionBusy || ! stripeMinMet }
										title={
											! stripeMinMet
												? '合計 50 円以上でご利用いただけます'
												: undefined
										}
										onClick={ handleStripeCheckout }
									>
										{ stripeSubmitting ? '決済へ移動中…' : 'Stripeで決済する' }
									</button>
								) : null }
							</div>
						</form>
					) }
				</div>
			</div>
		</div>
	);
}
