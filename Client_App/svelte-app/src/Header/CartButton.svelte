<script>
  import { Icon } from "sveltestrap";
  import Dropdown from "./Dropdown.svelte";
  let dropdown = false;
  let icon;
</script>

<div
  on:click={() => {
    dropdown = true;
  }}
>
  <Icon bind:this={icon} name="cart-fill" />
  {#if dropdown}
    <Dropdown
      on:closeDropdown={() => {
        dropdown = false;
      }}
    />
  {/if}
</div>

<style>
  * {
    font-size: 1.5rem;
  }
</style>
