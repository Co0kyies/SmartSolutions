<script>
  import { Icon } from "sveltestrap";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let dropdown;
</script>

<div
  on:click={() => {
    dispatch("click");
  }}
>
  {#if dropdown}
    <Icon name="chevron-up" />
  {:else}
    <Icon name="chevron-down" />
  {/if}
</div>

<style>
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
  }
  div:hover {
    background-color: rgb(230, 230, 230);
  }
</style>
