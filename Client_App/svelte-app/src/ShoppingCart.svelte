<script>
  import { orderByKey } from "firebase/database";
  import { each } from "svelte/internal";
  import { NavItem } from "sveltestrap";
  import CartElement from "./ShoppingCart/CartElement.svelte";
  import FinishOrderModal from "./ShoppingCart/FinishOrderModal.svelte";
  import OrderButton from "./ShoppingCart/OrderButton.svelte";
  import { user, authUser } from "./store";
  import {
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Button,
  } from "sveltestrap";
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
  {#if !$user.inBasket || $user.inBasket.length == 0}
    <div class="my-card"><h3>Вие нямате никакви артикули в количката</h3></div>
  {:else}
    <OrderButton />
  {/if}
  <div class="padding-box" />
</div>

<style>
  div {
    position: relative;
    max-height: calc(100% - 12rem);
    overflow-y: scroll;
    max-width: 100%;
    width: 80%;
    margin: auto;
    overflow-x: hidden;
  }
  .padding-box {
    height: 6rem;
    width: 100%;
  }
  .my-card {
    width: 100%;
    height: 8rem;
    margin: auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  button {
    position: absolute;
    z-index: 3;
    right: 1rem;
  }
</style>
