/**
 * Frontend hydration for the Training Group detail block.
 */
import { createRoot } from '@wordpress/element';
import TrainingGroupApp from './TrainingGroupApp';
import './training-group.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-training-group-block' )
	.forEach( ( el ) => {
		const groupId = Number( el.dataset.groupId ) || 0;
		const clubId = el.dataset.clubId || '';
		const canEdit = el.dataset.canEdit === '1';
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		createRoot( el ).render(
			<TrainingGroupApp
				groupId={ groupId }
				clubId={ clubId }
				canEdit={ canEdit }
				locale={ locale }
			/>
		);
	} );
