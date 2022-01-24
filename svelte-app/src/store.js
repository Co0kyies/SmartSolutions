import { writable } from "svelte/store";

export let user = writable();
export let userId = writable();
export let authUser = writable(0);
export let tweak = writable(2)

export let tweakSelectedOption = writable()