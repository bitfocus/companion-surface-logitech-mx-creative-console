// @ts-check

import { DEVICE_MODELS, VENDOR_ID } from '@logitech-mx-creative-console/node'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
// eslint-disable-next-line n/no-unpublished-import
import prettier from 'prettier'

const manifestPath = path.join(import.meta.dirname, '../companion/manifest.json')

/** @type {import('@companion-surface/base').SurfaceModuleManifestUsbIds} */
const usbIds = {
	vendorId: VENDOR_ID,
	productIds: [0], // Fix
}

for (const model of Object.values(DEVICE_MODELS)) {
	for (const match of model.usb) {
		if (match.vendorId !== VENDOR_ID) throw new Error(`${model.id} has an unexpected vendorId`)
		usbIds.productIds.push(match.productId)
	}
}

// Remove duplicates
usbIds.productIds = Array.from(new Set(usbIds.productIds))

/** @type {import('@companion-surface/base').SurfaceModuleManifest} */
const manifest = JSON.parse(await readFileSync(manifestPath, 'utf8'))

const manifestStr = JSON.stringify({
	...manifest,
	usbIds: [usbIds],
})

const prettierConfig = await prettier.resolveConfig(manifestPath)

const formatted = await prettier.format(manifestStr, {
	...prettierConfig,
	parser: 'json',
})

writeFileSync(manifestPath, formatted)
