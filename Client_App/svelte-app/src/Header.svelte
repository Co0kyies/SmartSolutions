<script>
  import { createEventDispatcher } from "svelte";
  import { authUser, user } from "./store.js";
  import {
    Button,
    Icon,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    DropdownToggle,
    Card,
    CardBody,
  } from "sveltestrap";
  import CartButton from "./Header/CartButton.svelte";

  const dispatch = createEventDispatcher();

  function dispachSignOutEvenet() {
    dispatch("userSignOut");
  }
</script>

<header>
  <div id="logo">
    <a href="/"><h1>Wardrobes</h1></a>
  </div>
  <div class="login-greetings">
    {#if $authUser}
      <Dropdown>
        <DropdownToggle color="light">
          <Icon name="person-circle" />
          {$user["email"]}
        </DropdownToggle><DropdownMenu>
          <DropdownItem>
            <p>История на покупки</p>
          </DropdownItem>
          <DropdownItem on:click={dispachSignOutEvenet}>
            <p>Излез от профила си</p>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    {:else}
      <a href="/login"><Button outline color="secondary">Login</Button></a>
    {/if}
  </div>
  <a id="cart-button" href="/cart"
    ><Icon name="cart-fill" />
    {#if $authUser && $user.inBasket && Object.keys($user.inBasket).length > 0}
      <div id="items-in-cart">{Object.keys($user.inBasket).length}</div>
    {:else if $user.inBasket && $user.inBasket.length != 0}
      <div id="items-in-cart">{$user.inBasket.length}</div>
    {/if}
  </a>
</header>

<style lang="css">
  header {
    display: flex;
    position: relative;
    width: 100%;
    background-color: white;
    height: 6rem;
    align-items: center;
    padding-top: 1rem;
  }
  #logo {
    margin-left: 3rem;
  }
  #logo h1 {
    font-size: 4rem;
  }
  .login-greetings {
    position: absolute;
    right: 16%;
  }
  #cart-button {
    position: absolute;
    right: 10%;
    font-size: 1.5rem;
    color: black;
  }
  #items-in-cart {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: 0;
    right: -0.4rem;
    height: 1rem;
    width: 1rem;
    border-radius: 50%;
    background-color: red;
    font-size: 0.8rem;
    color: white;
  }
  a {
    color: black;
    text-decoration: none;
  }
  a:hover {
    color: black;
    text-decoration: none;
  }
</style>
