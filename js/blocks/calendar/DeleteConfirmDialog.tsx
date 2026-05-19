import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';

interface DeleteConfirmDialogProps {
	event: CalendarEvent;
	t: Translations[ 'calendar' ];
	commonT: Translations[ 'common' ];
	onCancel: () => void;
	onDeleted: ( event: CalendarEvent ) => void;
}

interface RawEvent {
	id: number;
	excludedDates?: string[];
}

export default function DeleteConfirmDialog( {
	event,
	t,
	commonT,
	onCancel,
	onDeleted,
}: DeleteConfirmDialogProps ) {
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const parentId = event.parentId
		? Number( event.parentId )
		: Number( event.id );
	const isRecurringOccurrence = Boolean( event.parentId );

	async function deleteSeries() {
		setBusy( true );
		setError( null );
		try {
			await apiFetch( {
				path: `/rockaden/v1/events/${ parentId }`,
				method: 'DELETE',
				parse: false,
			} );
			onDeleted( event );
		} catch ( err ) {
			setBusy( false );
			setError(
				err instanceof Error ? err.message : 'Failed to delete event'
			);
		}
	}

	async function deleteOccurrence() {
		setBusy( true );
		setError( null );
		try {
			const parent = await apiFetch< RawEvent >( {
				path: `/rockaden/v1/events/${ parentId }`,
			} );
			const occurrenceDate = event.startDate.substring( 0, 10 );
			const current = Array.isArray( parent.excludedDates )
				? parent.excludedDates
				: [];
			const nextExcluded = current.includes( occurrenceDate )
				? current
				: [ ...current, occurrenceDate ];
			await apiFetch( {
				path: `/rockaden/v1/events/${ parentId }`,
				method: 'PUT',
				data: { excludedDates: nextExcluded },
			} );
			onDeleted( event );
		} catch ( err ) {
			setBusy( false );
			setError(
				err instanceof Error ? err.message : 'Failed to update event'
			);
		}
	}

	return (
		<div className="rc-cal__confirm" role="dialog" aria-modal="true">
			<p className="rc-cal__confirm-prompt">{ t.deleteConfirm }</p>
			{ error && <p className="rc-cal__confirm-error">{ error }</p> }
			<div className="rc-cal__confirm-actions">
				{ isRecurringOccurrence ? (
					<>
						<button
							type="button"
							className="rc-cal__btn rc-cal__btn--danger"
							disabled={ busy }
							onClick={ deleteOccurrence }
						>
							{ t.deleteThisOnly }
						</button>
						<button
							type="button"
							className="rc-cal__btn rc-cal__btn--danger"
							disabled={ busy }
							onClick={ deleteSeries }
						>
							{ t.deleteSeries }
						</button>
					</>
				) : (
					<button
						type="button"
						className="rc-cal__btn rc-cal__btn--danger"
						disabled={ busy }
						onClick={ deleteSeries }
					>
						{ t.delete }
					</button>
				) }
				<button
					type="button"
					className="rc-cal__btn"
					disabled={ busy }
					onClick={ onCancel }
				>
					{ commonT.cancel }
				</button>
			</div>
		</div>
	);
}
