/**
 * Frontend hydration for the Training Groups overview block.
 */
import { createRoot } from '@wordpress/element';
import {
	parseFields,
	TRAINING_GROUP_FIELD_DEFAULTS,
} from '../../shared/overviewFields';
import TrainingGroupsApp from './TrainingGroupsApp';
import './training-groups.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-training-groups-block' )
	.forEach( ( el ) => {
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		const layout = el.dataset.layout === 'list' ? 'list' : 'cards';
		const fields = parseFields(
			el.dataset.fields,
			TRAINING_GROUP_FIELD_DEFAULTS
		);
		createRoot( el ).render(
			<TrainingGroupsApp
				locale={ locale }
				layout={ layout }
				fields={ fields }
			/>
		);
	} );
