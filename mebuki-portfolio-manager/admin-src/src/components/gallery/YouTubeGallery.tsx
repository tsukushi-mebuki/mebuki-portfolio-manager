import type { Dispatch, SetStateAction } from 'react';
import type { MebukiFormState } from '../../types/settings';
import type { ToastVariant } from '../Toast';
import { GalleryReviewItemsSection } from './GalleryReviewItemsSection';

type Props = {
	form: MebukiFormState;
	setForm: Dispatch<SetStateAction<MebukiFormState>>;
	onNotify: ( message: string, variant: ToastVariant ) => void;
};

/**
 * サイト設定 — YouTube ギャラリー（口コミ収集 URL 付き）
 */
export function YouTubeGallery( { form, setForm, onNotify }: Props ) {
	return (
		<GalleryReviewItemsSection
			galleryKey="youtube_gallery"
			form={ form }
			setForm={ setForm }
			onNotify={ onNotify }
		/>
	);
}
