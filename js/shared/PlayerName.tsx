import { playerUrl } from './chessMsvens';
import './player-link.css';

interface Props {
	name: string;
	ssfId?: number | null;
	link: boolean;
	// Make the whole table row the click target (one player per row). The link
	// stays a real <a>; CSS stretches its hit area over the row.
	stretch?: boolean;
	// Accessible name when `name` is only part of it (e.g. first name alone).
	label?: string;
}

/**
 * A player's name, linked to their chess.msvens.com page (new tab) when links
 * are on and the player has an SSF id; plain text otherwise.
 *
 * @param props         Component props.
 * @param props.name    Name to show.
 * @param props.ssfId   SSF member id, if any.
 * @param props.link    Whether the block links players.
 * @param props.stretch Whether the link covers its table row.
 * @param props.label   Accessible name, when it differs from `name`.
 */
export default function PlayerName( {
	name,
	ssfId,
	link,
	stretch = false,
	label,
}: Props ) {
	if ( ! link || ! ssfId || ssfId <= 0 ) {
		return <>{ name }</>;
	}
	return (
		<a
			className={ `rc-player-link${
				stretch ? ' rc-player-link--row' : ''
			}` }
			href={ playerUrl( ssfId ) }
			target="_blank"
			rel="noopener noreferrer"
			aria-label={ label }
		>
			{ name }
		</a>
	);
}
