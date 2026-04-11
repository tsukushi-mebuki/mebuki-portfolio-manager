export function youtubeVideoId( url: string ): string | null {
	const u = url.trim();
	if ( u === '' ) {
		return null;
	}
	try {
		const parsed = new URL( u );
		if ( parsed.hostname.includes( 'youtube.com' ) ) {
			const v = parsed.searchParams.get( 'v' );
			if ( v ) {
				return v;
			}
			const m = parsed.pathname.match( /\/embed\/([^/?]+)/ );
			if ( m ) {
				return m[ 1 ];
			}
		}
		if ( parsed.hostname === 'youtu.be' ) {
			const id = parsed.pathname.replace( /^\//, '' ).split( '/' )[ 0 ];
			return id || null;
		}
	} catch {
		return null;
	}
	return null;
}

export function youtubeEmbedSrc( url: string ): string | null {
	const id = youtubeVideoId( url );
	return id ? `https://www.youtube.com/embed/${ id }` : null;
}

export function youtubeThumbUrl( url: string ): string | null {
	const id = youtubeVideoId( url );
	return id ? `https://img.youtube.com/vi/${ id }/hqdefault.jpg` : null;
}
