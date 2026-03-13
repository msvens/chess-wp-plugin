import { useState } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import type { Translations } from '../../shared';
import type { Participant, SsfRatingInfo } from '../types';
import { removeParticipant } from '../api';
import { ratingForTimeControl, ratingLabel } from './ratingUtils';

interface ParticipantListProps {
	groupId: number;
	participants: Participant[];
	ratings: Map< number, SsfRatingInfo >;
	timeControl: string;
	t: Translations;
	onUpdated: () => void;
	onAddClick: () => void;
	readOnly?: boolean;
}

export function ParticipantList( {
	groupId,
	participants,
	ratings,
	timeControl,
	t,
	onUpdated,
	onAddClick,
	readOnly,
}: ParticipantListProps ) {
	const [ removing, setRemoving ] = useState< string | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	const [ showInactive, setShowInactive ] = useState( false );

	const active = participants.filter( ( p ) => p.active );
	const inactive = participants.filter( ( p ) => ! p.active );

	async function handleRemove( participantId: string ) {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( t.training.removeParticipant + '?' ) ) {
			return;
		}
		setRemoving( participantId );
		setError( null );
		try {
			await removeParticipant( groupId, participantId );
			onUpdated();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to remove participant' );
		} finally {
			setRemoving( null );
		}
	}

	function getRating( p: Participant ): string {
		if ( p.ssfId === null ) {
			return t.training.ratingUnavailable;
		}
		const r = ratings.get( p.ssfId );
		if ( ! r ) {
			return t.training.ratingUnavailable;
		}
		const val = ratingForTimeControl( r, timeControl );
		return val ? String( val ) : t.training.ratingUnavailable;
	}

	return (
		<div>
			{ error && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			{ ! readOnly && (
				<div style={ { marginBottom: 12 } }>
					<Button variant="primary" onClick={ onAddClick }>
						{ t.training.addParticipant }
					</Button>
				</div>
			) }

			<table className="widefat striped">
				<thead>
					<tr>
						<th>{ t.training.name }</th>
						<th>{ ratingLabel( timeControl, t ) }</th>
						{ ! readOnly && <th></th> }
					</tr>
				</thead>
				<tbody>
					{ active.map( ( p ) => (
						<tr key={ p.id }>
							<td>{ p.name }</td>
							<td>{ getRating( p ) }</td>
							{ ! readOnly && (
								<td>
									<Button
										variant="tertiary"
										isDestructive
										isBusy={ removing === p.id }
										disabled={ removing !== null }
										onClick={ () => handleRemove( p.id ) }
									>
										{ t.training.removeParticipant }
									</Button>
								</td>
							) }
						</tr>
					) ) }
					{ active.length === 0 && (
						<tr>
							<td
								colSpan={ readOnly ? 2 : 3 }
								style={ {
									textAlign: 'center',
									fontStyle: 'italic',
								} }
							>
								{ t.training.noGroups }
							</td>
						</tr>
					) }
				</tbody>
			</table>

			{ inactive.length > 0 && (
				<div style={ { marginTop: 16 } }>
					<Button
						variant="link"
						onClick={ () => setShowInactive( ! showInactive ) }
					>
						{ t.training.inactive } ({ inactive.length })
					</Button>
					{ showInactive && (
						<table
							className="widefat striped"
							style={ { marginTop: 8 } }
						>
							<tbody>
								{ inactive.map( ( p ) => (
									<tr key={ p.id } style={ { opacity: 0.6 } }>
										<td>{ p.name }</td>
										<td>{ getRating( p ) }</td>
										<td></td>
									</tr>
								) ) }
							</tbody>
						</table>
					) }
				</div>
			) }
		</div>
	);
}
