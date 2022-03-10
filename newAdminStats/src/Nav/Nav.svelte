<script>
  import { onDestroy, onMount, createEventDispatcher } from "svelte";
  import { selectedMenu, type } from "../store";
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
  {#each options as { option, icon, href, subMenus }}
    {#if $selectedMenu == option}
      <div
        on:click={() => {
          $selectedMenu = option;
        }}
        class="option selected"
      >
        <div class="option-box">
          <i class={`bi-${icon}`} />
          <span>{option}</span>
        </div>
        <div class="suboptions">
          {#each subMenus as opt}
            <div
              class="sub-option"
              on:click={() => {
                $type = opt.type;
              }}
            >
              <span class="ml-1">{opt.type}</span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div
        on:click={() => {
          $selectedMenu = option;
        }}
        class="option "
      >
        <div class="option-box">
          <i class={`bi-${icon}`} />
          <span>{option}</span>
        </div>
        <div class="suboptions">
          {#each subMenus as opt}
            <div
              class="sub-option"
              on:click={() => {
                $type = opt.type;
              }}
            >
              <span class="ml-1">{opt.type}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</div>

<style>
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
    position: relative;
    cursor: pointer;
    font-size: 1.3rem;
    color: white;
    margin: 0.1rem 0;
  }
  .option .option-box {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 3.5rem;
    width: 100%;
  }
  .option .option-box span {
    display: none;
  }
  #menu:hover .option .option-box span {
    display: block;
  }
  .option .option-box i {
    position: absolute;
    top: 50%;
    left: 2rem;
    transform: translate(-50%, -50%);
  }

  .option .suboptions {
    background-color: hsl(189, 80%, 26%);
    height: 0;
    overflow: hidden;
    transition: ease-in 0.2s;
  }
  .option .suboptions > div {
    display: flex;
    /* justify-content: center; */
    align-items: center;
    height: 3rem;
  }
  .option .suboptions > div:hover {
    background-color: rgba(255, 255, 255, 0.212);
  }
  .option:hover .suboptions {
    height: 6rem;
  }

  .option.selected {
    background-color: hsl(189, 80%, 48%);
  }
  .option.selected::after {
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

  .option:hover {
    background-color: hsl(189, 80%, 48%);
  }

  /* UTILITES */
  .d-flex {
    display: flex;
  }
  .justify-center {
    justify-content: center;
  }
  .align-center {
    align-items: center;
  }
  .ml-1 {
    margin-left: 1rem;
  }
</style>
