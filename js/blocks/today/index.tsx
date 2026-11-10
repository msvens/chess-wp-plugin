import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { DistrictDTO } from '@msvens/schack-se-sdk';

/**
 * SSF districts for the picker, fetched through the plugin's proxy. The
 * editor has no SSF base URL of its own, so it goes through apiFetch, which
 * already knows the REST root.
 */
function useDistricts(): DistrictDTO[] | null {
	const [ districts, setDistricts ] = useState< DistrictDTO[] | null >(
		null
	);

	useEffect( () => {
		let cancelled = false;
		apiFetch< DistrictDTO[] >( {
			path: '/rockaden/v1/ssf/organisation/districts',
		} )
			.then( ( data ) => {
				if ( ! cancelled ) {
					setDistricts(
						[ ...( data ?? [] ) ].sort( ( a, b ) =>
							a.name.localeCompare( b.name, 'sv' )
						)
					);
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setDistricts( [] );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [] );

	return districts;
}

registerBlockType( 'rockaden/today', {
	edit: function Edit( { attributes, setAttributes }: any ) {
		const blockProps = useBlockProps();
		const districts = useDistricts();

		const options = [
			{ label: 'All of Sweden', value: '0' },
			...( districts ?? [] ).map( ( d ) => ( {
				label: d.name,
				value: String( d.id ),
			} ) ),
		];
		// Keep a saved district visible while the list loads or if it fails.
		if (
			attributes.districtId &&
			! options.some(
				( o ) => o.value === String( attributes.districtId )
			)
		) {
			options.push( {
				label: `District #${ attributes.districtId }`,
				value: String( attributes.districtId ),
			} );
		}

		const districtName =
			options.find( ( o ) => o.value === String( attributes.districtId ) )
				?.label ?? 'All of Sweden';

		return (
			<>
				<InspectorControls>
					<PanelBody title="Settings">
						<SelectControl
							label="District"
							value={ String( attributes.districtId || 0 ) }
							options={ options }
							help={
								districts === null
									? 'Loading districts…'
									: undefined
							}
							onChange={ ( val: string ) =>
								setAttributes( {
									districtId: Number( val ) || 0,
								} )
							}
						/>
						<ToggleControl
							label="Show heading"
							help="“Today” / “Idag” above the list."
							checked={ attributes.showHeading }
							onChange={ ( val: boolean ) =>
								setAttributes( { showHeading: val } )
							}
						/>
						<ToggleControl
							label="Show note about missing tournaments"
							help="A tournament that ends today may be missing until results are reported."
							checked={ attributes.showNote }
							onChange={ ( val: boolean ) =>
								setAttributes( { showNote: val } )
							}
						/>
					</PanelBody>
				</InspectorControls>
				<div { ...blockProps }>
					<p
						style={ {
							padding: '2rem',
							background: '#f0f0f0',
							textAlign: 'center',
						} }
					>
						[Today — tournaments played today: { districtName }]
					</p>
				</div>
			</>
		);
	},
	save() {
		return null; // Dynamic block — rendered by render.php
	},
} );
