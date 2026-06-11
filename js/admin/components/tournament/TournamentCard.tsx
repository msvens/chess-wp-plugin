import { useState } from '@wordpress/element';
import {
	Card,
	CardBody,
	CardHeader,
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../../shared';
import type { Tournament } from '../../types';
import { deleteTournament } from '../../api';

interface TournamentCardProps {
	tournament: Tournament;
	t: Translations;
	onClick: () => void;
	onDeleted: () => void;
}

export function TournamentCard( {
	tournament,
	t,
	onClick,
	onDeleted,
}: TournamentCardProps ) {
	const activeCount = tournament.participants.filter(
		( p ) => p.active
	).length;
	const [ confirming, setConfirming ] = useState( false );

	function handleDelete( e: React.MouseEvent ) {
		e.stopPropagation();
		if ( ! confirming ) {
			setConfirming( true );
			return;
		}
		deleteTournament( tournament.id )
			.then( onDeleted )
			.catch( () => setConfirming( false ) );
	}

	return (
		<Card size="small" onClick={ onClick } style={ { cursor: 'pointer' } }>
			<CardHeader>
				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						width: '100%',
					} }
				>
					<Heading level={ 4 } style={ { margin: 0 } }>
						{ tournament.title }
					</Heading>
					<Button
						isDestructive
						variant={ confirming ? 'primary' : 'tertiary' }
						size="small"
						onClick={ handleDelete }
						onBlur={ () => setConfirming( false ) }
					>
						{ confirming ? t.common.confirm : t.common.delete }
					</Button>
				</div>
			</CardHeader>
			<CardBody>
				<div style={ { marginBottom: 6 } }>
					<span
						className={ `rc-status-pill is-${ tournament.status }` }
					>
						{ t.tournament.statuses[ tournament.status ] }
					</span>
					<span className="rc-category-pill">
						{ t.tournament.categories[ tournament.category ] }
					</span>
				</div>
				{ tournament.ssfGroupId > 0 && (
					<Text style={ { display: 'block', fontStyle: 'italic' } }>
						{ tournament.ssfTournamentName ||
							`SSF #${ tournament.ssfGroupId }` }
					</Text>
				) }
				{ tournament.ssfGroupId === 0 && (
					<Text style={ { display: 'block' } }>
						{ t.training.participants }: { activeCount }
					</Text>
				) }
				{ tournament.startDate && (
					<Text style={ { display: 'block' } }>
						{ tournament.startDate }
						{ tournament.endDate
							? ` — ${ tournament.endDate }`
							: '' }
					</Text>
				) }
			</CardBody>
		</Card>
	);
}
