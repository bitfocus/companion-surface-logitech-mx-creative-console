// @ts-check

// eslint-disable-next-line n/no-extraneous-import
import { DEVICE_MODELS2, VENDOR_ID } from '@logitech-mx-creative-console/core'
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

for (const product of Object.values(DEVICE_MODELS2)) {
	usbIds.productIds.push(...product.productIds)
}

// Remove duplicates
// @ts-expect-error minimum 1 required
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
