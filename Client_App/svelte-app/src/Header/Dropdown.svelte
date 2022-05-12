<script>
  import { createEventDispatcher } from "svelte";
  import { user } from "../store";
  import { Card, CardBody } from "sveltestrap";
  const dispatch = createEventDispatcher();

  let stupidShit = 1;
  function close() {
    dispatch("closeDropdown");
  }

  function test() {
    if (!$user.inBasket) {
      return 1;
    }
  }

  let dropdown;
  let userVar;
</script>

<div bind:this={dropdown}>
  {#if $user.inBasket}
    Items in cart
  {:else}
    Get fucked
  {/if}
</div>

<svelte:window
  on:click={(e) => {
    if (e.target != dropdown) {
      if (stupidShit != 0) {
        stupidShit = 0;
      } else {
        close();
      }
    }
  }}
/>

<style>
  div {
    position: absolute;
    top: 2rem;
    right: -3rem;
    z-index: 3;
    width: 25rem;
    height: 8rem;
    /* background-color: red;  */
    display: flex;
    justify-content: center;
    align-items: center;
    border: rgb(180, 180, 180) 0.5px solid;
    border-radius: 8px;
    background-color: white;
  }
</style>
