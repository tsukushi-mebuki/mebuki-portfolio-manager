/// <reference types="vite/client" />

declare global {
	interface Window {
		mebukiPmRest?: {
			root: string;
			nonce: string;
			/** フロント公開サイトのルート（口コミ収集 URL 用） */
			siteUrl?: string;
			/** ログイン中ユーザーの公開ポートフォリオURL */
			portfolioPath?: string;
		};
		/** WordPress メディアモーダル（`wp_enqueue_media` 後） */
		wp?: {
			media: ( options: {
				title?: string;
				library?: { type?: string };
				multiple?: boolean;
			} ) => {
				on: ( event: string, handler: () => void ) => void;
				open: () => void;
				state: () => {
					get: ( key: string ) => {
						first: () => { toJSON: () => { url?: string } } | undefined;
					};
				};
			};
		};
	}
}

export {};
