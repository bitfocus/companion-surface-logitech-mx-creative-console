import {
	CardGenerator,
	HostCapabilities,
	SurfaceDrawProps,
	SurfaceContext,
	SurfaceInstance,
	createModuleLogger,
	ModuleLogger,
} from '@companion-surface/base'
import { getControlId } from './util.js'
import type { MXCreativeConsole } from '@logitech-mx-creative-console/node'
import { setTimeout } from 'node:timers/promises'

export class CreativeConsoleWrapper implements SurfaceInstance {
	readonly #logger: ModuleLogger

	readonly #device: MXCreativeConsole

	readonly #surfaceId: string
	readonly #context: SurfaceContext

	public get surfaceId(): string {
		return this.#surfaceId
	}
	public get productName(): string {
		return `Logitech ${this.#device.PRODUCT_NAME}`
	}

	public constructor(surfaceId: string, device: MXCreativeConsole, context: SurfaceContext) {
		this.#logger = createModuleLogger(`Instance/${surfaceId}`)
		this.#device = device
		this.#surfaceId = surfaceId
		this.#context = context

		this.#device.on('error', (error) => {
			this.#logger.error(`Error: ${error}`)
			this.#context.disconnect(error as Error)
		})

		this.#device.on('down', (control) => {
			this.#context.keyDownById(getControlId(control))
		})

		this.#device.on('up', (control) => {
			this.#context.keyUpById(getControlId(control))
		})

		this.#device.on('rotate', (control, amount) => {
			if (amount > 0) {
				this.#context.rotateRightById(getControlId(control))
			} else {
				this.#context.rotateLeftById(getControlId(control))
			}
		})
	}

	async init(): Promise<void> {
		await this.blank()
	}
	async close(): Promise<void> {
		await this.blank().catch(() => null)

		await this.#device.resetToLogo().catch(() => null)

		await this.#device.close().catch(() => null)
	}

	updateCapabilities(_capabilities: HostCapabilities): void {
		// Not used
	}

	async ready(): Promise<void> {
		// Nothing to do
	}

	async setBrightness(percent: number): Promise<void> {
		await this.#device.setBrightness(percent)
	}
	async blank(): Promise<void> {
		await this.#device.clearPanel()
	}
	async draw(signal: AbortSignal, drawProps: SurfaceDrawProps): Promise<void> {
		const control = this.#device.CONTROLS.find((control) => getControlId(control) === drawProps.controlId)
		if (!control) return

		if (control.type === 'button') {
			if (control.feedbackType === 'lcd') {
				if (!drawProps.image || control.pixelSize.width === 0 || control.pixelSize.height === 0) {
					return
				}

				const maxAttempts = 3
				for (let attempts = 1; attempts <= maxAttempts; attempts++) {
					try {
						await this.#device.fillKeyBuffer(control.index, drawProps.image)
						return
					} catch (e) {
						if (signal.aborted) return

						if (attempts == maxAttempts) {
							this.#logger.debug(`fillImage failed after ${attempts} attempts: ${e}`)
							this.#context.disconnect(e as Error)
							return
						}
						await setTimeout(20)
					}
				}
			}
			// } else if (control.type === 'encoder' && control.hasLed) {
			// 	const color = render.style ? colorToRgb(render.bgcolor) : { r: 0, g: 0, b: 0 }
			// 	await this.#surface.setEncoderColor(control.index, color.r, color.g, color.b)
		}
	}
	async showStatus(_signal: AbortSignal, _cardGenerator: CardGenerator): Promise<void> {
		// Not implemented
		// TODO
	}
}
