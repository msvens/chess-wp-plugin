import { playerUrl } from './chessMsvens';
import './player-link.css';

interface Props {
	name: string;
	ssfId?: number | null;
	link: boolean;
}

/**
 * A player's name, linked to their chess.msvens.com page (new tab) when links
 * are on and the player has an SSF id; plain text otherwise.
 *
 * @param props       Component props.
 * @param props.name  Name to show.
 * @param props.ssfId SSF member id, if any.
 * @param props.link  Whether the block links players.
 */
export default function PlayerName( { name, ssfId, link }: Props ) {
	if ( ! link || ! ssfId || ssfId <= 0 ) {
		return <>{ name }</>;
	}
	return (
		<a
			className="rc-player-link"
			href={ playerUrl( ssfId ) }
			target="_blank"
			rel="noopener noreferrer"
		>
			{ name }
		</a>
	);
}
