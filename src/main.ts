import {
	createModuleLogger,
	type DiscoveredSurfaceInfo,
	type SurfaceModelDefinition,
	type HIDDevice,
	type OpenSurfaceResult,
	type SurfaceContext,
	type SurfacePlugin,
} from '@companion-surface/base'
import { CreativeConsoleWrapper } from './instance.js'
import { createSurfaceSchema } from './surface-schema.js'
import { createSurfaceAppearance } from './surface-appearance.js'
import {
	DEVICE_MODELS,
	getMXCreativeConsoleDeviceInfo,
	openMxCreativeConsole,
	type MXCreativeConsoleDeviceInfo,
} from '@logitech-mx-creative-console/node'

const logger = createModuleLogger('Plugin')

const CreativeConsolePlugin: SurfacePlugin<MXCreativeConsoleDeviceInfo> = {
	init: async (): Promise<void> => {
		// Not used
	},
	destroy: async (): Promise<void> => {
		// Not used
	},

	getSurfaceModels: async (): Promise<SurfaceModelDefinition[]> => {
		return Object.values(DEVICE_MODELS).map((model) => ({
			id: model.id,
			// With the manufacturer, as a connected surface describes itself
			name: `${model.manufacturer} ${model.name}`,
			layout: createSurfaceSchema(model.controls),
			appearance: createSurfaceAppearance(model),
		}))
	},

	checkSupportsHidDevice: (device: HIDDevice): DiscoveredSurfaceInfo<MXCreativeConsoleDeviceInfo> | null => {
		const pluginInfo = getMXCreativeConsoleDeviceInfo(device)
		if (!pluginInfo) return null

		logger.debug(`Checked HID device: ${device.manufacturer} ${device.product}`)

		return {
			surfaceId: `logi-mx-console:${device.serialNumber}`,
			description: `${pluginInfo.modelInfo.manufacturer} ${pluginInfo.modelInfo.name}`, // TODO - Get proper model name
			pluginInfo: pluginInfo,
		}
	},

	openSurface: async (
		surfaceId: string,
		pluginInfo: MXCreativeConsoleDeviceInfo,
		context: SurfaceContext,
	): Promise<OpenSurfaceResult> => {
		const device = await openMxCreativeConsole(pluginInfo.path, {
			jpegOptions: {
				quality: 95,
				subsampling: 1, // 422
			},
		})
		logger.debug(`Opening ${pluginInfo.modelInfo.manufacturer} ${pluginInfo.modelInfo.name} (${surfaceId})`)

		return {
			surface: new CreativeConsoleWrapper(surfaceId, device, context),
			registerProps: {
				brightness: true,
				surfaceLayout: createSurfaceSchema(device.modelInfo.controls),
				surfaceAppearance: createSurfaceAppearance(device.modelInfo),
				modelId: device.modelInfo.id,
				pincodeMap: null, // TODO - define this
				configFields: null,
				location: null,
			},
		}
	},
}
export default CreativeConsolePlugin
