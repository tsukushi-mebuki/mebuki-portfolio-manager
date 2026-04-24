import type { HeroConfig } from '../../types/settings';



type Props = {

	hero: HeroConfig;

};



const overlayJustifyClass: Record<HeroConfig['overlay_align'], string> = {

	left: 'justify-start',

	center: 'justify-center',

	right: 'justify-end',

};



export function HeroSection( { hero }: Props ) {

	const titleImg = hero.title_image_url.trim();

	const titleText = hero.title.trim();

	const subtitleImg = hero.subtitle_image_url.trim();

	const subtitleText = hero.subtitle.trim();

	const showTitleImage = titleImg !== '';

	const showTitleText = ! showTitleImage && titleText !== '';

	const showSubtitleImage = subtitleImg !== '';

	const showSubtitleText = ! showSubtitleImage && subtitleText !== '';

	const hasHeadline =

		showTitleImage || showTitleText || showSubtitleImage || showSubtitleText;



	const cover = hero.cover_image_url.trim();

	const overlay = hero.overlay_image_url.trim();

	const hasOverlay = overlay !== '';

	const overlayHeightPercent = Number.isFinite( hero.overlay_height_percent )
		? Math.max( 1, Math.min( 100, Math.round( hero.overlay_height_percent ) ) )
		: 28;



	return (

		<section

			className="relative overflow-hidden border-b border-[color-mix(in_srgb,var(--mebuki-text)_8%,transparent)]"

			aria-label="ヒーロー"

		>

			{ cover !== '' ? (

				<>

					<img

						src={ cover }

						alt=""

						className="absolute inset-0 z-0 h-full w-full object-cover"

					/>

					<div

						className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--mebuki-bg)] via-[color-mix(in_srgb,var(--mebuki-bg)_55%,transparent)] to-[color-mix(in_srgb,var(--mebuki-bg)_20%,transparent)]"

						aria-hidden

					/>

				</>

			) : (

				<div

					className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--mebuki-surface)] via-[var(--mebuki-bg)] to-[color-mix(in_srgb,var(--mebuki-accent)_12%,var(--mebuki-bg))]"

					aria-hidden

				/>

			) }

			<div

				className={

					hasOverlay

						? 'relative z-[1] mx-auto flex min-h-[min(52vh,28rem)] max-w-5xl flex-col px-4 sm:px-6 lg:px-8'

						: 'relative z-[1] mx-auto flex min-h-[min(52vh,28rem)] max-w-5xl flex-col justify-end gap-3 px-4 pb-14 pt-24 sm:px-6 lg:px-8'

				}

			>

				{ hasOverlay ? (

					<div

						className={ `relative z-10 flex w-full shrink-0 pt-24 pb-3 ${ overlayJustifyClass[ hero.overlay_align ] }` }

					>

						<img

							src={ overlay }

							alt=""

							className="h-auto w-auto object-contain drop-shadow-[0_4px_24px_color-mix(in_srgb,var(--mebuki-bg)_75%,transparent)]"

							style={ { maxHeight: `${ overlayHeightPercent }vh` } }

						/>

					</div>

				) : null }

				{ hasHeadline || hasOverlay ? (

					<div

						className={

							hasOverlay

								? 'relative z-[100] flex flex-1 flex-col justify-end gap-3 pb-14 pt-2'

								: 'relative z-[100] flex flex-col gap-3'

						}

					>

						{ showTitleImage ? (

							<h1 className="m-0">

								<img

									src={ titleImg }

									alt=""

									className="block max-h-[min(40vh,15rem)] w-auto max-w-full object-contain object-left"

									style={ {

										filter:

											'drop-shadow(0 2px 24px color-mix(in srgb, var(--mebuki-bg) 80%, transparent))',

									} }

								/>

							</h1>

						) : null }

						{ showTitleText ? (

							<h1

								className="font-[family-name:var(--mebuki-font-heading)] text-3xl font-bold tracking-tight text-[var(--mebuki-text)] sm:text-4xl md:text-5xl"

								style={ {

									textShadow:

										'0 2px 24px color-mix(in srgb, var(--mebuki-bg) 80%, transparent)',

								} }

							>

								{ titleText }

							</h1>

						) : null }

						{ showSubtitleImage ? (

							<p className="m-0 max-w-2xl">

								<img

									src={ subtitleImg }

									alt=""

									className="block max-h-[min(28vh,11rem)] w-auto max-w-full object-contain object-left"

								/>

							</p>

						) : null }

						{ showSubtitleText ? (

							<p className="max-w-2xl text-base leading-relaxed text-[var(--mebuki-text-muted)] sm:text-lg">

								{ subtitleText }

							</p>

						) : null }

					</div>

				) : null }

			</div>

		</section>

	);

}


