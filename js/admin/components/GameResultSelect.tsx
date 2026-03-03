import { SelectControl } from '@wordpress/components';
import type { Translations } from '../../shared';

interface GameResultSelectProps {
	value: string | null;
	onChange: ( value: string | null ) => void;
	t: Translations;
	disabled?: boolean;
}

export function GameResultSelect( {
	value,
	onChange,
	t,
	disabled,
}: GameResultSelectProps ) {
	const options = [
		{ label: t.training.notPlayed, value: '' },
		{ label: '1 - 0', value: '1-0' },
		{ label: '½ - ½', value: '0.5-0.5' },
		{ label: '0 - 1', value: '0-1' },
	];

	return (
		<SelectControl
			value={ value || '' }
			options={ options }
			onChange={ ( v ) => onChange( v || null ) }
			disabled={ disabled }
			__nextHasNoMarginBottom
		/>
	);
}
