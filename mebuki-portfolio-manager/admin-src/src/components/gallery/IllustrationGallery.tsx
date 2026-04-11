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
 * サイト設定 — イラストギャラリー（口コミ収集 URL 付き）
 */
export function IllustrationGallery( { form, setForm, onNotify }: Props ) {
	return (
		<GalleryReviewItemsSection
			galleryKey="illustration_gallery"
			form={ form }
			setForm={ setForm }
			onNotify={ onNotify }
		/>
	);
}
