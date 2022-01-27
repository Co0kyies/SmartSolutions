import { writable } from "svelte/store";

export let user = writable();
export let userId = writable();
export let authUser = writable(0);
export let tweak = writable(2);

export let tweakSelectedOption = writable("Декори");
export let tweakSelectedDepth = writable();
export let tweakSelectedWidth = writable();
export let tweakSelectedHeight = writable();
export let tweakSelectedCount = writable(1);
export let tweakFitstDecor = writable("H1401");
export let tweakSecondDecor = writable("H3331");
