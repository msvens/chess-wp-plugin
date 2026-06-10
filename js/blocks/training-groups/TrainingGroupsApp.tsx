import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { TrainingGroup } from '../../admin/types';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import GroupCard from './GroupCard';

interface Props {
	canEdit: boolean;
	locale: string;
}

export default function TrainingGroupsApp( { canEdit, locale }: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );
	const [ groups, setGroups ] = useState< TrainingGroup[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ showPast, setShowPast ] = useState( false );

	useEffect( () => {
		apiFetch< TrainingGroup[] >( { path: '/rockaden/v1/training-groups' } )
			.then( ( data ) => {
				// Exclude hidden (draft); show the rest grouped by lifecycle.
				setGroups( data.filter( ( g ) => g.status !== 'draft' ) );
				setLoading( false );
			} )
			.catch( () => {
				setLoading( false );
			} );
	}, [] );

	// Junior on the left, Adult + Mixed on the right — reused for ongoing and past.
	const columns = ( list: TrainingGroup[] ) => {
		const junior = list.filter( ( g ) => g.audience === 'junior' );
		const adult = list.filter(
			( g ) => g.audience === 'adult' || g.audience === 'mixed'
		);
		return (
			<div className="rc-tg__columns">
				{ junior.length > 0 && (
					<section className="rc-tg__column">
						<h2 className="rc-tg__column-title">
							{ t.training.audiences.junior }
						</h2>
						<div className="rc-tg__grid">
							{ junior.map( ( group ) => (
								<GroupCard
									key={ group.id }
									group={ group }
									canEdit={ canEdit }
									lang={ lang }
								/>
							) ) }
						</div>
					</section>
				) }
				{ adult.length > 0 && (
					<section className="rc-tg__column">
						<h2 className="rc-tg__column-title">
							{ t.training.audiences.adult }
						</h2>
						<div className="rc-tg__grid">
							{ adult.map( ( group ) => (
								<GroupCard
									key={ group.id }
									group={ group }
									canEdit={ canEdit }
									lang={ lang }
								/>
							) ) }
						</div>
					</section>
				) }
			</div>
		);
	};

	if ( loading ) {
		return <p className="rc-tg__loading">{ t.common.loading }</p>;
	}

	if ( groups.length === 0 ) {
		return <p className="rc-tg__empty">{ t.training.noGroups }</p>;
	}

	const ongoing = groups.filter( ( g ) => g.status !== 'completed' );
	const past = groups.filter( ( g ) => g.status === 'completed' );
	const pastVisible = showPast || ongoing.length === 0;

	return (
		<div className="rc-tg">
			{ ongoing.length > 0 && columns( ongoing ) }

			{ past.length > 0 && (
				<div className="rc-tg__past">
					<button
						type="button"
						className="rc-tg__past-toggle"
						aria-expanded={ pastVisible }
						onClick={ () => setShowPast( ( v ) => ! v ) }
					>
						{ pastVisible ? '▾' : '▸' } { t.training.pastGroups } (
						{ past.length })
					</button>
					{ pastVisible && columns( past ) }
				</div>
			) }
		</div>
	);
}
