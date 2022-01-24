import { writable } from "svelte/store";

export let user = writable();
export let userId = writable();
export let authUser = writable(0);
export let tweak = writable();

export let tweakSelectedOption = writable();
export let tweakSelectedDepth = writable();
export let tweakSelectedWidth = writable();
export let tweakSelectedHeight = writable();
export let tweakSelectedCount = writable();
