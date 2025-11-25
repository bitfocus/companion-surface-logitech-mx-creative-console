import { assertNever, type SurfaceSchemaLayoutDefinition } from '@companion-surface/base'
import { getControlId } from './util.js'
import type { MXConsoleControlDefinition } from '@logitech-mx-creative-console/node'

export function createSurfaceSchema(controls: Readonly<MXConsoleControlDefinition[]>): SurfaceSchemaLayoutDefinition {
	const surfaceLayout: SurfaceSchemaLayoutDefinition = {
		stylePresets: {
			default: {
				// Ignore default, as it is hard to translate into for our existing layout
			},
			empty: {},
			rgb: { colors: 'hex' },
		},
		controls: {},
	}

	for (const control of controls) {
		const controlId = getControlId(control)
		switch (control.type) {
			case 'button':
				switch (control.feedbackType) {
					case 'none':
						surfaceLayout.controls[controlId] = {
							row: control.row,
							column: control.column,
							stylePreset: 'empty',
						}
						break
					case 'lcd': {
						const presetId = `btn_${control.pixelSize.width}x${control.pixelSize.height}`
						if (!surfaceLayout.stylePresets[presetId]) {
							surfaceLayout.stylePresets[presetId] = {
								bitmap: {
									w: control.pixelSize.width,
									h: control.pixelSize.height,
									format: 'rgb',
								},
							}
						}
						surfaceLayout.controls[controlId] = {
							row: control.row,
							column: control.column,
							stylePreset: presetId,
						}
						break
					}
					default:
						assertNever(control)
						break
				}
				break
			case 'encoder':
				if (control.hasLed) {
					surfaceLayout.controls[controlId] = {
						row: control.row,
						column: control.column,
						stylePreset: 'rgb',
					}
				} else {
					surfaceLayout.controls[controlId] = {
						row: control.row,
						column: control.column,
						stylePreset: 'empty',
					}
				}
				// Future: LED ring
				break
			default:
				assertNever(control)
				break
		}
	}

	return surfaceLayout
}
