import { registerBlockType } from '@wordpress/blocks';
import {
	useBlockProps,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	RangeControl,
	Button,
	Placeholder,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getTranslation, toLanguage } from '../../shared/translations';

interface AttachmentEntity {
	id: number;
	source_url: string;
	alt_text: string;
}

type AspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | 'auto';
type ImageFit = 'cover' | 'contain';
type BackdropStyle = 'blurred' | 'black';
type ConstrainMode = 'none' | 'width' | 'height';
type Alignment = 'left' | 'center' | 'right';

interface BlockAttrs {
	imageIds: number[];
	mode: 'slider' | 'carousel';
	autoplay: boolean;
	autoplayInterval: number;
	visibleItems: number;
	aspectRatio: AspectRatio;
	imageFit: ImageFit;
	backdropStyle: BackdropStyle;
	constrain: ConstrainMode;
	constraintValue: number;
	alignment: Alignment;
	allowFullscreen: boolean;
	cellSizing: 'aspect' | 'height';
	cellHeight: number;
}

interface EditProps {
	attributes: BlockAttrs;
	setAttributes: ( attrs: Partial< BlockAttrs > ) => void;
}

const lang = toLanguage(
	( typeof document !== 'undefined' && document.documentElement.lang ) || 'sv'
);
const t = getTranslation( lang );

registerBlockType( 'rockaden/carousel', {
	edit: function Edit( { attributes, setAttributes }: EditProps ) {
		const blockProps = useBlockProps();
		const {
			imageIds,
			mode,
			autoplay,
			autoplayInterval,
			visibleItems,
			aspectRatio,
			imageFit,
			backdropStyle,
			constrain,
			constraintValue,
			alignment,
			allowFullscreen,
			cellSizing,
			cellHeight,
		} = attributes;

		// Resolve image metadata from the core store for preview rendering.
		const attachments = useSelect(
			( select: any ) => {
				if ( ! imageIds || imageIds.length === 0 ) {
					return [];
				}
				return imageIds
					.map( ( id ) =>
						select( coreStore ).getEntityRecord(
							'postType',
							'attachment',
							id
						)
					)
					.filter( Boolean ) as AttachmentEntity[];
			},
			[ imageIds ]
		);

		function setImages( newImages: { id: number }[] ) {
			setAttributes( { imageIds: newImages.map( ( img ) => img.id ) } );
		}

		function moveImage( index: number, direction: -1 | 1 ) {
			const next = [ ...imageIds ];
			const target = index + direction;
			if ( target < 0 || target >= next.length ) {
				return;
			}
			[ next[ index ], next[ target ] ] = [
				next[ target ],
				next[ index ],
			];
			setAttributes( { imageIds: next } );
		}

		function removeImage( index: number ) {
			const next = imageIds.filter( ( _, i ) => i !== index );
			setAttributes( { imageIds: next } );
		}

		return (
			<>
				<InspectorControls>
					<PanelBody title={ t.carousel.displayMode } initialOpen>
						<SelectControl
							label={ t.carousel.displayMode }
							value={ mode }
							options={ [
								{
									label: t.carousel.modes.slider,
									value: 'slider',
								},
								{
									label: t.carousel.modes.carousel,
									value: 'carousel',
								},
							] }
							onChange={ ( v: string ) => {
								const nextMode = v as 'slider' | 'carousel';
								setAttributes( {
									mode: nextMode,
									// 'auto' can't form uniform cells in carousel mode.
									...( nextMode === 'carousel' &&
									aspectRatio === 'auto'
										? {
												aspectRatio:
													'16:9' as AspectRatio,
										  }
										: {} ),
								} );
							} }
						/>
						{ mode === 'carousel' && (
							<SelectControl
								label={ t.carousel.cellSizing }
								value={ cellSizing }
								options={ [
									{
										label: t.carousel.aspectRatio,
										value: 'aspect',
									},
									{
										label: t.carousel.exactHeight,
										value: 'height',
									},
								] }
								onChange={ ( v: string ) => {
									const next = v as 'aspect' | 'height';
									setAttributes( {
										cellSizing: next,
										...( next === 'height' &&
										cellHeight === 0
											? { cellHeight: 320 }
											: {} ),
									} );
								} }
							/>
						) }
						{ ( mode === 'slider' || cellSizing === 'aspect' ) && (
							<SelectControl
								label={ t.carousel.aspectRatio }
								value={ aspectRatio }
								options={ [
									{
										label: t.carousel.aspectRatios[
											'16:9'
										],
										value: '16:9',
									},
									{
										label: t.carousel.aspectRatios[ '4:3' ],
										value: '4:3',
									},
									{
										label: t.carousel.aspectRatios[ '1:1' ],
										value: '1:1',
									},
									{
										label: t.carousel.aspectRatios[ '3:4' ],
										value: '3:4',
									},
									{
										label: t.carousel.aspectRatios[
											'9:16'
										],
										value: '9:16',
									},
									{
										label: t.carousel.aspectRatios.auto,
										value: 'auto',
										disabled: mode === 'carousel',
									},
								] }
								onChange={ ( v: string ) =>
									setAttributes( {
										aspectRatio: v as AspectRatio,
									} )
								}
							/>
						) }
						{ mode === 'carousel' && cellSizing === 'height' && (
							<RangeControl
								label={ t.carousel.cellHeight }
								value={ cellHeight }
								onChange={ ( v ) =>
									setAttributes( { cellHeight: v ?? 0 } )
								}
								min={ 80 }
								max={ 800 }
								step={ 10 }
							/>
						) }
						<SelectControl
							label={ t.carousel.imageFit }
							value={ imageFit }
							options={ [
								{
									label: t.carousel.fits.contain,
									value: 'contain',
								},
								{
									label: t.carousel.fits.cover,
									value: 'cover',
								},
							] }
							onChange={ ( v: string ) =>
								setAttributes( {
									imageFit: v as ImageFit,
								} )
							}
						/>
						{ imageFit === 'contain' && (
							<SelectControl
								label={ t.carousel.backdropStyle }
								value={ backdropStyle }
								options={ [
									{
										label: t.carousel.backdrops.blurred,
										value: 'blurred',
									},
									{
										label: t.carousel.backdrops.black,
										value: 'black',
									},
								] }
								onChange={ ( v: string ) =>
									setAttributes( {
										backdropStyle: v as BackdropStyle,
									} )
								}
							/>
						) }
						{ mode === 'carousel' && (
							<RangeControl
								label={ t.carousel.visibleItems }
								value={ visibleItems }
								onChange={ ( v ) =>
									setAttributes( {
										visibleItems: v ?? 3,
									} )
								}
								min={ 2 }
								max={ 5 }
							/>
						) }
						<ToggleControl
							label={ t.carousel.autoplay }
							checked={ autoplay }
							onChange={ ( v: boolean ) =>
								setAttributes( { autoplay: v } )
							}
						/>
						{ autoplay && (
							<RangeControl
								label={ t.carousel.interval }
								value={ autoplayInterval }
								onChange={ ( v ) =>
									setAttributes( {
										autoplayInterval: v ?? 5,
									} )
								}
								min={ 2 }
								max={ 15 }
							/>
						) }
						<SelectControl
							label={ t.carousel.constrain }
							value={ constrain }
							options={ [
								{
									label: t.carousel.constraints.none,
									value: 'none',
								},
								{
									label: t.carousel.constraints.width,
									value: 'width',
								},
								{
									label: t.carousel.constraints.height,
									value: 'height',
								},
							] }
							onChange={ ( v: string ) => {
								const next = v as ConstrainMode;
								setAttributes( {
									constrain: next,
									// Provide a sensible default when first enabling.
									constraintValue:
										next !== 'none' && constraintValue === 0
											? 600
											: constraintValue,
								} );
							} }
						/>
						{ constrain !== 'none' && (
							<>
								<RangeControl
									label={
										constrain === 'width'
											? t.carousel.constraintWidth
											: t.carousel.constraintHeight
									}
									value={ constraintValue }
									onChange={ ( v ) =>
										setAttributes( {
											constraintValue: v ?? 0,
										} )
									}
									min={ 100 }
									max={ 2000 }
									step={ 10 }
								/>
								<SelectControl
									label={ t.carousel.alignment }
									value={ alignment }
									options={ [
										{
											label: t.carousel.alignments.left,
											value: 'left',
										},
										{
											label: t.carousel.alignments.center,
											value: 'center',
										},
										{
											label: t.carousel.alignments.right,
											value: 'right',
										},
									] }
									onChange={ ( v: string ) =>
										setAttributes( {
											alignment: v as Alignment,
										} )
									}
								/>
							</>
						) }
						<ToggleControl
							label={ t.carousel.allowFullscreen }
							checked={ allowFullscreen }
							onChange={ ( v: boolean ) =>
								setAttributes( { allowFullscreen: v } )
							}
						/>
					</PanelBody>
				</InspectorControls>
				<div { ...blockProps }>
					{ imageIds.length === 0 ? (
						<MediaUploadCheck>
							<Placeholder
								icon="images-alt2"
								label={
									t.carousel.modes.slider +
									' / ' +
									t.carousel.modes.carousel
								}
								instructions={ t.carousel.noImages }
							>
								<MediaUpload
									multiple
									gallery
									allowedTypes={ [ 'image' ] }
									value={ imageIds }
									onSelect={ setImages }
									render={ ( {
										open,
									}: {
										open: () => void;
									} ) => (
										<Button
											variant="primary"
											onClick={ open }
										>
											{ t.carousel.addImages }
										</Button>
									) }
								/>
							</Placeholder>
						</MediaUploadCheck>
					) : (
						<div>
							<MediaUploadCheck>
								<MediaUpload
									multiple
									gallery
									allowedTypes={ [ 'image' ] }
									value={ imageIds }
									onSelect={ setImages }
									render={ ( {
										open,
									}: {
										open: () => void;
									} ) => (
										<Button
											variant="secondary"
											onClick={ open }
											style={ {
												marginBottom: '0.75rem',
											} }
										>
											{ t.carousel.editImages }
										</Button>
									) }
								/>
							</MediaUploadCheck>
							<ul
								style={ {
									listStyle: 'none',
									margin: 0,
									padding: 0,
									display: 'flex',
									flexDirection: 'column',
									gap: '0.5rem',
								} }
							>
								{ imageIds.map( ( id, idx ) => {
									const att = attachments.find(
										( a ) => a && a.id === id
									);
									return (
										<li
											key={ id }
											style={ {
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												padding: '0.375rem',
												border: '1px solid #ddd',
												borderRadius: 4,
												background: '#fff',
											} }
										>
											{ att && (
												<img
													src={ att.source_url }
													alt={ att.alt_text || '' }
													style={ {
														width: 80,
														height: 60,
														objectFit: 'cover',
														borderRadius: 4,
													} }
												/>
											) }
											<span
												style={ {
													flex: 1,
													marginLeft: 8,
													fontSize: 13,
												} }
											>
												{ att?.alt_text || `#${ id }` }
											</span>
											<Button
												size="small"
												icon="arrow-up-alt2"
												label={ t.carousel.moveUp }
												disabled={ idx === 0 }
												onClick={ () =>
													moveImage( idx, -1 )
												}
											/>
											<Button
												size="small"
												icon="arrow-down-alt2"
												label={ t.carousel.moveDown }
												disabled={
													idx === imageIds.length - 1
												}
												onClick={ () =>
													moveImage( idx, 1 )
												}
											/>
											<Button
												size="small"
												icon="no-alt"
												label={ t.carousel.removeImage }
												isDestructive
												onClick={ () =>
													removeImage( idx )
												}
											/>
										</li>
									);
								} ) }
							</ul>
						</div>
					) }
				</div>
			</>
		);
	},
	save() {
		return null;
	},
} );
