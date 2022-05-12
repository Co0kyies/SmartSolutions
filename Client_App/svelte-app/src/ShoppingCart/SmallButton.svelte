<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<button
  on:click={() => {
    dispatch("click");
  }}
  class={$$props.class}
>
  <slot />
</button>

<style>
  button {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgb(145, 145, 145);
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 0.25rem;
  }
  button:hover {
    background-color: rgb(194, 194, 194);
  }
  .white {
    background-color: white;
  }
  .white:hover {
    background-color: white;
  }
</style>
