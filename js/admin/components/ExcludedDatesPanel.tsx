import { useState } from '@wordpress/element';
import { Button, SelectControl, Notice } from '@wordpress/components';
import type { Translations } from '../../shared';
import type { EventData } from '../types';
import { updateEvent } from '../api';

interface ExcludedDatesPanelProps {
	event: EventData;
	scheduleDates: string[];
	t: Translations;
	onUpdated: () => void;
}

export function ExcludedDatesPanel( {
	event,
	scheduleDates,
	t,
	onUpdated,
}: ExcludedDatesPanelProps ) {
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ selectedDate, setSelectedDate ] = useState( '' );

	const excluded = new Set( event.excludedDates ?? [] );

	// Available dates = schedule dates not already excluded
	const availableDates = scheduleDates.filter( ( d ) => ! excluded.has( d ) );

	async function handleExclude() {
		if ( ! selectedDate ) {
			return;
		}
		setSaving( true );
		setError( null );
		try {
			const newExcluded = [ ...event.excludedDates, selectedDate ].sort();
			await updateEvent( event.id, { excludedDates: newExcluded } );
			setSelectedDate( '' );
			onUpdated();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to update excluded dates' );
		} finally {
			setSaving( false );
		}
	}

	async function handleRemove( date: string ) {
		setSaving( true );
		setError( null );
		try {
			const newExcluded = event.excludedDates.filter(
				( d ) => d !== date
			);
			await updateEvent( event.id, { excludedDates: newExcluded } );
			onUpdated();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to update excluded dates' );
		} finally {
			setSaving( false );
		}
	}

	const dateOptions = [
		{ label: `— ${ t.training.selectEvent } —`, value: '' },
		...availableDates.map( ( d ) => ( { label: d, value: d } ) ),
	];

	return (
		<div
			style={ {
				marginTop: 16,
				padding: 12,
				background: '#f9f9f9',
				borderRadius: 4,
			} }
		>
			<h4 style={ { margin: '0 0 8px' } }>
				{ t.training.excludedDates }
			</h4>

			{ error && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			{ event.excludedDates.length > 0 && (
				<ul
					style={ {
						margin: '0 0 12px',
						padding: 0,
						listStyle: 'none',
					} }
				>
					{ event.excludedDates.map( ( date ) => (
						<li
							key={ date }
							style={ {
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								marginBottom: 4,
							} }
						>
							<span>{ date }</span>
							<Button
								variant="tertiary"
								size="small"
								isDestructive
								onClick={ () => handleRemove( date ) }
								disabled={ saving }
							>
								✕
							</Button>
						</li>
					) ) }
				</ul>
			) }

			{ availableDates.length > 0 && (
				<div
					style={ {
						display: 'flex',
						alignItems: 'flex-end',
						gap: 8,
					} }
				>
					<div style={ { flex: 1 } }>
						<SelectControl
							value={ selectedDate }
							options={ dateOptions }
							onChange={ setSelectedDate }
						/>
					</div>
					<Button
						variant="secondary"
						onClick={ handleExclude }
						disabled={ ! selectedDate || saving }
						isBusy={ saving }
						style={ { marginBottom: 8 } }
					>
						{ t.training.addExclusion }
					</Button>
				</div>
			) }
		</div>
	);
}
