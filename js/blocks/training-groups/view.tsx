/**
 * Frontend hydration for the Training Groups overview block.
 */
import { createRoot } from '@wordpress/element';
import TrainingGroupsApp from './TrainingGroupsApp';
import './training-groups.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-training-groups-block' )
	.forEach( ( el ) => {
		const canEdit = el.dataset.canEdit === '1';
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		createRoot( el ).render(
			<TrainingGroupsApp canEdit={ canEdit } locale={ locale } />
		);
	} );
