import type { Translations } from '../../shared/translations';
import {
	RATING_TYPES,
	PLAYER_CATEGORIES,
	generateRatingPeriods,
} from './utils';
import type { RatingType, PlayerCategory } from './utils';

interface Props {
	ratingDate: string;
	ratingType: RatingType;
	category: PlayerCategory;
	onDateChange: ( date: string ) => void;
	onTypeChange: ( type: RatingType ) => void;
	onCategoryChange: ( cat: PlayerCategory ) => void;
	t: Translations;
}

const periods = generateRatingPeriods();

export default function RankingFilters( {
	ratingDate,
	ratingType,
	category,
	onDateChange,
	onTypeChange,
	onCategoryChange,
	t,
}: Props ) {
	return (
		<div className="rc-rl__filters">
			<label className="rc-rl__filter">
				<span className="rc-rl__filter-label">
					{ t.ranking.ratingPeriod }
				</span>
				<select
					className="rc-rl__select"
					value={ ratingDate }
					onChange={ ( e ) => onDateChange( e.target.value ) }
				>
					{ periods.map( ( p ) => (
						<option key={ p } value={ p }>
							{ p.slice( 0, 7 ) }
						</option>
					) ) }
				</select>
			</label>

			<label className="rc-rl__filter">
				<span className="rc-rl__filter-label">
					{ t.ranking.eloType }
				</span>
				<select
					className="rc-rl__select"
					value={ ratingType }
					onChange={ ( e ) =>
						onTypeChange( Number( e.target.value ) as RatingType )
					}
				>
					<option value={ RATING_TYPES.STANDARD }>
						{ t.ranking.standard }
					</option>
					<option value={ RATING_TYPES.RAPID }>
						{ t.ranking.rapid }
					</option>
					<option value={ RATING_TYPES.BLITZ }>
						{ t.ranking.blitz }
					</option>
				</select>
			</label>

			<label className="rc-rl__filter">
				<span className="rc-rl__filter-label">
					{ t.ranking.memberType }
				</span>
				<select
					className="rc-rl__select"
					value={ category }
					onChange={ ( e ) =>
						onCategoryChange(
							Number( e.target.value ) as PlayerCategory
						)
					}
				>
					<option value={ PLAYER_CATEGORIES.ALL }>
						{ t.ranking.all }
					</option>
					<option value={ PLAYER_CATEGORIES.JUNIORS }>
						{ t.ranking.juniors }
					</option>
					<option value={ PLAYER_CATEGORIES.CADETS }>
						{ t.ranking.cadets }
					</option>
					<option value={ PLAYER_CATEGORIES.VETERANS }>
						{ t.ranking.veterans }
					</option>
					<option value={ PLAYER_CATEGORIES.WOMEN }>
						{ t.ranking.women }
					</option>
					<option value={ PLAYER_CATEGORIES.MINORS }>
						{ t.ranking.minors }
					</option>
					<option value={ PLAYER_CATEGORIES.KIDS }>
						{ t.ranking.kids }
					</option>
				</select>
			</label>
		</div>
	);
}
