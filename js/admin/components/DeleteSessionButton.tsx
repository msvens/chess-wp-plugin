import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import type { Translations } from '../../shared';
import { deleteSession } from '../api';

/**
 * Two-click delete for a training session, matching the group card's pattern:
 * the first click arms the button, the second commits, and blurring cancels.
 * Sessions are reachable from three places, so the confirm lives here rather
 * than being repeated in each.
 */
interface Props {
	sessionId: number;
	t: Translations;
	onDeleted: () => void;
	size?: 'small' | 'compact' | 'default';
	// Stop the click reaching a clickable row/card underneath.
	stopPropagation?: boolean;
}

export function DeleteSessionButton( {
	sessionId,
	t,
	onDeleted,
	size = 'small',
	stopPropagation = true,
}: Props ) {
	const [ confirming, setConfirming ] = useState( false );
	const [ busy, setBusy ] = useState( false );

	function handleClick( e: React.MouseEvent ) {
		if ( stopPropagation ) {
			e.stopPropagation();
		}
		if ( ! confirming ) {
			setConfirming( true );
			return;
		}
		setBusy( true );
		deleteSession( sessionId )
			.then( onDeleted )
			.catch( () => {
				setConfirming( false );
			} )
			.finally( () => setBusy( false ) );
	}

	return (
		<Button
			isDestructive
			variant={ confirming ? 'primary' : 'tertiary' }
			size={ size }
			isBusy={ busy }
			disabled={ busy }
			onClick={ handleClick }
			onBlur={ () => setConfirming( false ) }
		>
			{ confirming ? t.common.confirm : t.common.delete }
		</Button>
	);
}
