<script>
  import { orderByKey } from "firebase/database";
  import { each } from "svelte/internal";
  import { NavItem } from "sveltestrap";

  import CartElement from "./ShoppingCart/CartElement.svelte";
  import { user, authUser } from "./store";
  // let key = "-MueiyVtvCobVWuIx-db";
</script>

<div>
  <!-- {#each keys as key}
    <CartElement {key} />
  {/each} -->

  {#if $authUser && $user.inBasket}
    {#each Object.keys($user.inBasket) as key (key)}
      <CartElement {key} />
    {/each}
  {:else if !$authUser}
    {#each $user.inBasket as item, key (item)}
      <CartElement {key} />
    {/each}
  {/if}
  <div class="padding-box" />
</div>

<style>
  div {
    max-height: calc(100% - 12rem);
    overflow-y: scroll;
    max-width: 100%;
    width: 100%;
    overflow-x: hidden;
  }
  .padding-box {
    height: 6rem;
    width: 100%;
  }
</style>
