import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	Notice,
	Placeholder,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useRef } from '@wordpress/element';
import { qrSvg } from '../../shared/qr';

interface QrCodeEntity {
	id: number;
	title: { raw?: string; rendered: string };
	rc_qr_url?: string;
}

function QrPreview( { url, size }: { url: string; size: number } ) {
	const ref = useRef< HTMLDivElement >( null );
	useEffect( () => {
		let cancelled = false;
		qrSvg( url ).then( ( svg ) => {
			if ( ! cancelled && ref.current ) {
				ref.current.innerHTML = svg;
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [ url ] );
	return (
		<div
			ref={ ref }
			className="rc-qr__code"
			style={ { width: size } }
			role="img"
			aria-label={ `QR code: ${ url }` }
		/>
	);
}

registerBlockType( 'rockaden/qr-code', {
	edit: function Edit( { attributes, setAttributes }: any ) {
		const blockProps = useBlockProps( {
			className: 'rockaden-qr-code-block',
		} );

		const codes = useSelect( ( select: any ) => {
			return select( coreStore ).getEntityRecords(
				'postType',
				'rc_qr_code',
				{ per_page: 100, status: 'publish' }
			) as QrCodeEntity[] | null;
		}, [] );

		const selected = codes?.find( ( c ) => c.id === attributes.qrCodeId );
		// A code's name, or its address when it has none.
		const label = ( c: QrCodeEntity ) =>
			c.title.raw || c.title.rendered || c.rc_qr_url || `#${ c.id }`;
		const url = selected?.rc_qr_url || '';
		// The chosen code was deleted, unpublished or lost its address.
		const broken =
			attributes.qrCodeId > 0 &&
			codes !== null &&
			( ! selected || ! url );

		const options = [
			{ label: '— Select QR code —', value: '' },
			...( codes || [] ).map( ( c ) => ( {
				label: label( c ),
				value: String( c.id ),
			} ) ),
		];

		let caption = '';
		if ( selected && attributes.caption === 'name' ) {
			caption = selected.title.raw || selected.title.rendered;
		} else if ( attributes.caption === 'url' ) {
			caption = url;
		}

		let body;
		if ( codes === null ) {
			body = <Placeholder label="QR Code">Loading QR codes…</Placeholder>;
		} else if ( broken ) {
			body = (
				<Notice status="warning" isDismissible={ false }>
					The selected QR code no longer exists or has no address.
					Pick another one in the block settings. Visitors see nothing
					here.
				</Notice>
			);
		} else if ( ! selected ) {
			body = (
				<Placeholder label="QR Code">
					Pick a saved QR code in the block settings. Codes are
					created under QR Codes in the admin menu.
				</Placeholder>
			);
		} else {
			body = (
				<>
					<QrPreview url={ url } size={ attributes.size } />
					{ caption && (
						<figcaption
							className="rc-qr__caption"
							style={ { maxWidth: attributes.size } }
						>
							{ caption }
						</figcaption>
					) }
				</>
			);
		}

		return (
			<>
				<InspectorControls>
					<PanelBody title="Settings">
						<SelectControl
							label="QR code"
							value={ String( attributes.qrCodeId || '' ) }
							options={ options }
							help={ url ? `Points to ${ url }` : undefined }
							onChange={ ( val: string ) =>
								setAttributes( {
									qrCodeId: Number( val ) || 0,
								} )
							}
						/>
						<SelectControl
							label="Caption"
							value={ attributes.caption }
							options={ [
								{ label: 'None', value: 'none' },
								{ label: 'Name', value: 'name' },
								{ label: 'Address', value: 'url' },
							] }
							onChange={ ( val: string ) =>
								setAttributes( { caption: val } )
							}
						/>
						<RangeControl
							label="Size (px)"
							value={ attributes.size }
							min={ 100 }
							max={ 400 }
							step={ 10 }
							onChange={ ( val?: number ) =>
								setAttributes( { size: val ?? 200 } )
							}
						/>
					</PanelBody>
				</InspectorControls>
				<figure { ...blockProps }>{ body }</figure>
			</>
		);
	},
	save() {
		return null; // Dynamic block — rendered by render.php
	},
} );
