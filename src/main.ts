import {
	createModuleLogger,
	type DiscoveredSurfaceInfo,
	type HIDDevice,
	type OpenSurfaceResult,
	type SurfaceContext,
	type SurfacePlugin,
} from '@companion-surface/base'
import { CreativeConsoleWrapper } from './instance.js'
import { createSurfaceSchema } from './surface-schema.js'
import {
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

	checkSupportsHidDevice: (device: HIDDevice): DiscoveredSurfaceInfo<MXCreativeConsoleDeviceInfo> | null => {
		const pluginInfo = getMXCreativeConsoleDeviceInfo(device)
		if (!pluginInfo) return null

		logger.debug(`Checked HID device: ${device.manufacturer} ${device.product}`)

		return {
			surfaceId: `logi-mx-console:${device.serialNumber}`,
			description: `Logitech ${pluginInfo.model}`, // TODO - Get proper model name
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
		logger.debug(`Opening ${pluginInfo.model} (${surfaceId})`)

		return {
			surface: new CreativeConsoleWrapper(surfaceId, device, context),
			registerProps: {
				brightness: true,
				surfaceLayout: createSurfaceSchema(device.CONTROLS),
				pincodeMap: null, // TODO - define this
				configFields: null,
				location: null,
			},
		}
	},
}
export default CreativeConsolePlugin
