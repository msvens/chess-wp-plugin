import { Fragment } from '@wordpress/element';

/**
 * Descriptions are stored as plain text (sanitize_textarea_field keeps the
 * newlines), so rendering them as a single text node collapses the editor's
 * paragraph breaks. Split them back out: a blank line starts a new paragraph,
 * a single newline is a line break within one.
 *
 * Deliberately plain text — no dangerouslySetInnerHTML, so there is no HTML
 * to sanitise and no XSS surface.
 */

/**
 * Split plain text into paragraphs on blank lines.
 *
 * @param text The authored plain-text description.
 */
export function toParagraphs( text: string ): string[] {
	return text
		.split( /\n\s*\n/ )
		.map( ( p ) => p.trim() )
		.filter( Boolean );
}

/**
 * Flatten plain text to a single line. For places that clamp the description to
 * a fixed number of lines (cards), where a real line break would waste the clamp.
 *
 * @param text The authored plain-text description.
 */
export function toSingleLine( text: string ): string {
	return text.replace( /\s*\n\s*/g, ' ' ).trim();
}

interface Props {
	text: string;
	className?: string;
}

export default function Description( { text, className }: Props ) {
	const paragraphs = toParagraphs( text );

	if ( paragraphs.length === 0 ) {
		return null;
	}

	return (
		<div className={ className }>
			{ paragraphs.map( ( paragraph, idx ) => (
				<p key={ idx }>
					{ paragraph.split( '\n' ).map( ( line, lineIdx ) => (
						<Fragment key={ lineIdx }>
							{ lineIdx > 0 && <br /> }
							{ line }
						</Fragment>
					) ) }
				</p>
			) ) }
		</div>
	);
}
