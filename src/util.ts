import type { MXConsoleControlDefinition } from '@logitech-mx-creative-console/node'

export function getControlId(control: MXConsoleControlDefinition): string {
	return `${control.row}/${control.column}`
}
