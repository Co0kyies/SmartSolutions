<script>
  import { toggle_class } from "svelte/internal";
  import { Collapse, Icon, Card } from "sveltestrap";
  export let text = "Текст ";
  let toggled = false;
</script>

<div id="collapse">
  <div
    on:click={() => {
      toggled = !toggled;
    }}
    id="toggler"
  >
    <h3>{text}</h3>
    <div id="icon-wrapper">
      {#if toggled}<Icon name="chevron-up" />{:else}
        <Icon name="chevron-down" />{/if}
    </div>
  </div>
  {#if toggled}
    <div id="body"><slot /></div>
  {/if}
</div>

<style>
  #collapse {
    background-color: rgb(232, 244, 254);
    border-radius: 0.25rem;
    border: 1px solid rgba(0, 0, 0, 0.125);
    padding: 0 2rem;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }
  #toggler {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 5rem;
  }
  h3 {
    font-weight: 700;
  }
</style>
