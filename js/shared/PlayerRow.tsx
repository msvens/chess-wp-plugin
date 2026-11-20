import type { Element } from '@wordpress/element';
import { playerUrl } from './chessMsvens';
import './player-link.css';

interface Props {
	ssfId?: number | null;
	link: boolean;
	// The row's <td> cells; `false` for a conditional cell that is left out.
	children: Element | false | Array< Element | false >;
}

/**
 * A table row for one player. When links are on and the player has an SSF id,
 * clicking anywhere on the row opens their chess.msvens.com page in a new tab.
 *
 * @param props          Component props.
 * @param props.ssfId    SSF member id, if any.
 * @param props.link     Whether the block links players.
 * @param props.children The row's <td> cells.
 */
export default function PlayerRow( { ssfId, link, children }: Props ) {
	if ( ! link || ! ssfId || ssfId <= 0 ) {
		return <tr>{ children }</tr>;
	}
	const url = playerUrl( ssfId );
	return (
		<tr
			className="rc-player-row"
			onClick={ () =>
				window.open( url, '_blank', 'noopener,noreferrer' )
			}
		>
			{ children }
		</tr>
	);
}
