export interface ActionError {
	status: number;
	message: string;
	field?: string;
}

export type ValidationResult<T extends Record<string, unknown>> = {
	[K in keyof T]: string | null;
};
