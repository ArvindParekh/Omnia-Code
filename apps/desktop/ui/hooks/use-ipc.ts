import { useEffect, useLayoutEffect, useRef } from "react";
import type { IpcChannels, IpcEvents } from "@omnia/contracts";

export async function ipcInvoke<C extends keyof IpcChannels>(
	channel: C,
	args: IpcChannels[C]["args"],
): Promise<Awaited<IpcChannels[C]["result"]>> {
	return window.omnia.ipc.invoke(channel, args) as Promise<Awaited<IpcChannels[C]["result"]>>;
}

// Subscribes to an IPC event channel for the lifetime of the component.
// The ref is updated in useLayoutEffect (not during render) to satisfy
// react-hooks/refs, while the subscription itself only re-registers when
// the channel changes.
export function useIpcEvent<E extends keyof IpcEvents>(
	channel: E,
	handler: (data: IpcEvents[E]) => void,
): void {
	const handlerRef = useRef(handler);

	useLayoutEffect(() => {
		handlerRef.current = handler;
	});

	useEffect(() => {
		const unsubscribe = window.omnia.on(channel, (data) => handlerRef.current(data));
		return () => {
			unsubscribe();
		};
	}, [channel]);
}
