import { writable } from "svelte/store";

export let user = writable();
export let userId = writable();
export let authUser = writable(0);
export let tweak = writable(2);
export let pricePerCubic = writable(0.00068);
export let tweakMenuOptions = writable([
  "Размери",
  "Декори",
  "Прилагане на Декори",
  "Финилизиране",
]);

export let tweakSelectedOption = writable("Размери");
export let tweakSelectedDepth = writable();
export let tweakSelectedWidth = writable();
export let tweakSelectedHeight = writable();
export let tweakSelectedCount = writable(1);
export let tweakFitstDecor = writable("H3331");
export let tweakSecondDecor = writable("H1401");
export let tweakMainDecor = writable("H3331");
export let tweakFirstDoor = writable("H1401");
export let tweakSecondDoor = writable("H1401");
export let tweakThirdDoor = writable("H1401");
