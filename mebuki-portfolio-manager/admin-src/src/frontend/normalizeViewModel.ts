import { toFormState } from '../lib/mergeSettings';
import type { MebukiFormState } from '../types/settings';

export type FrontendViewModel = MebukiFormState;

export function toFrontendViewModel(
	raw: Record<string, unknown> | undefined
): FrontendViewModel {
	return toFormState( raw );
}
