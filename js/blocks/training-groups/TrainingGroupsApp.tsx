import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { TrainingGroup } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import GroupCard from './GroupCard';

interface Props {
	locale: string;
}

function toLanguage( locale: string ): Language {
	return locale.startsWith( 'sv' ) ? 'sv' : 'en';
}

export default function TrainingGroupsApp( { locale }: Props ) {
	const lang = toLanguage( locale );
	const t = getTranslation( lang );
	const [ groups, setGroups ] = useState< TrainingGroup[] >( [] );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		apiFetch< TrainingGroup[] >( { path: '/rockaden/v1/training-groups' } )
			.then( ( data ) => {
				// Only show active groups.
				setGroups( data.filter( ( g ) => g.status === 'active' ) );
				setLoading( false );
			} )
			.catch( () => {
				setLoading( false );
			} );
	}, [] );

	if ( loading ) {
		return <p className="rc-tg__loading">{ t.common.loading }</p>;
	}

	if ( groups.length === 0 ) {
		return <p className="rc-tg__empty">{ t.training.noGroups }</p>;
	}

	return (
		<div className="rc-tg">
			<div className="rc-tg__grid">
				{ groups.map( ( group ) => (
					<GroupCard key={ group.id } group={ group } lang={ lang } />
				) ) }
			</div>
		</div>
	);
}
