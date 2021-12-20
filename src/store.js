import { writable } from "svelte/store";

let viewTable = writable(false);

export { viewTable };