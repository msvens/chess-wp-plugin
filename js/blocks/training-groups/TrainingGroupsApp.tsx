import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { TrainingGroup } from '../../admin/types';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import GroupCard from './GroupCard';

interface Props {
	locale: string;
}

export default function TrainingGroupsApp( { locale }: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
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

	// Split by audience: Junior on the left, Adult + Mixed on the right.
	const juniorGroups = groups.filter( ( g ) => g.audience === 'junior' );
	const adultGroups = groups.filter(
		( g ) => g.audience === 'adult' || g.audience === 'mixed'
	);

	return (
		<div className="rc-tg">
			<div className="rc-tg__columns">
				{ juniorGroups.length > 0 && (
					<section className="rc-tg__column">
						<h2 className="rc-tg__column-title">
							{ t.training.audiences.junior }
						</h2>
						<div className="rc-tg__grid">
							{ juniorGroups.map( ( group ) => (
								<GroupCard
									key={ group.id }
									group={ group }
									lang={ lang }
								/>
							) ) }
						</div>
					</section>
				) }
				{ adultGroups.length > 0 && (
					<section className="rc-tg__column">
						<h2 className="rc-tg__column-title">
							{ t.training.audiences.adult }
						</h2>
						<div className="rc-tg__grid">
							{ adultGroups.map( ( group ) => (
								<GroupCard
									key={ group.id }
									group={ group }
									lang={ lang }
								/>
							) ) }
						</div>
					</section>
				) }
			</div>
		</div>
	);
}
