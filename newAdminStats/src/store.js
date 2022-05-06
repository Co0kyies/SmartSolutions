import { writable } from "svelte/store";
export let selectedMenu = writable("Продажби");
export let type = writable("Всички Продажби");
export let salesBarData = writable();
export let allMonthsArray = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
