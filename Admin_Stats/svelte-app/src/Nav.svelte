<script>
  import { Icon, Button } from "sveltestrap";
  import { onDestroy, onMount, createEventDispatcher } from "svelte";
  export let numberOfNavs;
  export let options;
  export let main = false;
  let selected;

  let dispach = createEventDispatcher();
  onMount(() => {
    dispach("mount");
  });
  onDestroy(() => {
    dispach("destroy");
  });
</script>

<div id="menu">
  {#if main}
    <div class="option logo">
      <h2 class="not-hovered">S</h2>
      <h2 class="hovered">Smart Soluttions</h2>
    </div>
  {:else}
    <div class="option" />
  {/if}
  {#each options as { option, icon, href }}
    {#if selected == option}
      <a {href}>
        <div
          on:click={() => {
            selected = option;
          }}
          class="option selected"
        >
          <i class={`bi-${icon}`} />
          <span>{option}</span>
        </div>
      </a>
    {:else}
      <a {href}>
        <div
          on:click={() => {
            selected = option;
          }}
          class="option"
        >
          <i class={`bi-${icon}`} />
          <span>{option}</span>
        </div>
      </a>
    {/if}
  {/each}
</div>

<style>
  a {
    text-decoration: none;
  }
  #menu {
    background-color: hsl(189, 80%, 40%);
    width: 4rem;
    transition: ease-out 0.1s;
  }
  #menu:hover {
    width: 14rem;
  }
  #menu:hover .hovered {
    display: block;
  }
  #menu:hover .not-hovered {
    display: none;
  }
  .logo {
    margin-top: 2rem;
  }
  .logo .hovered {
    display: none;
  }
  .hovered {
    font-size: 1.6rem;
  }
  .logo:hover .hovered {
    display: block;
  }
  .logo:hover .not-hovered {
    display: none;
  }
  .option {
    cursor: pointer;
    display: flex;
    position: relative;
    height: 3.5rem;
    width: 100%;
    font-size: 1.3rem;
    color: white;
    justify-content: center;
    align-items: center;
    margin: 0.1rem 0;
  }
  .option i {
    position: absolute;
    top: 50%;
    left: 2rem;
    transform: translate(-50%, -50%);
  }
  .selected {
    background-color: hsl(189, 80%, 48%);
  }
  .selected::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 5px;
    background-color: rgb(0, 255, 255);
    border-top-left-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;

    /* box-shadow: 0px 0px 1px 1px rgb(0, 255, 255); */
    /* in order: x offset, y offset, blur size, spread size, color */
    /* blur size and spread size are optional (they default to 0) */
  }
  .option span {
    display: none;
  }
  #menu:hover .option span {
    display: block;
    margin-left: 1rem;
  }

  .option:hover {
    background-color: hsl(189, 80%, 48%);
  }
</style>
