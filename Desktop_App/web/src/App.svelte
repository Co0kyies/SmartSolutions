<script>
  import { element } from "svelte/internal";

  import Header from "./Header.svelte";
  import Nav from "./Nav.svelte";
  import CuttingMachine from "./CuttingMachine.svelte";
  import MachineKant from "./MachineKant.svelte";
  // import anime from "animejs/lib/anime.es.js";

  let loading;
  let loadingCompleted;
  let test = "Test";
  let machinesMenu;

  function onSelectionOptionChange(event) {
    let selectedOption = event.detail.option;
    let optionMenus = machinesMenu.querySelectorAll("#machines-menu > div");
    function allElementsZeroZ() {
      optionMenus.forEach((element) => {
        element.style.zIndex = "0";
      });
    }
    allElementsZeroZ();
    if (selectedOption == "Машина Рязане") {
      optionMenus[0].style.zIndex = "1000";
    }
    if (selectedOption == "Машина Кант") {
      optionMenus[1].style.zIndex = "1000";
    }
    if (selectedOption == "Машина Дупчене") {
      optionMenus[2].style.zIndex = "1000";
    }
    if (selectedOption == "Склад") {
      optionMenus[3].style.zIndex = "1000";
    }
  }
  // eel.expose(my_javascript_function);
  // function my_javascript_function() {
  //   test = "Test Completed";
  //   console.log("Hello World");
  // }
</script>

<Header
  on:buttonPressed={() => {
    loading = true;
    console.log("Loading Started");
  }}
  on:loadingCompleted={() => {
    loading = false;
    loadingCompleted = true;
    console.log("Loading Completed");
  }}
/>
<Nav on:optionChange={onSelectionOptionChange} />

<main>
  {#if loading}
    <div class="loading-screen">
      <span>Зареждане..</span>
    </div>
  {/if}
  {#if loadingCompleted}
    <div bind:this={machinesMenu} id="machines-menu">
      <div><CuttingMachine /></div>
      <div><MachineKant /></div>
      <div style="background-color: red; " />
      <div style="background-color: yellow;" />
    </div>
  {/if}
</main>

<style>
  :global(:root) {
    --font-theme-color: rgb(163, 0, 0);
    --Header-height: 6rem;
    --Nav-height: 4rem;
    --body-background: rgb(75, 75, 75);
  }
  main {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100vh - var(--Header-height) - var(--Nav-height));
  }
  #machines-menu {
    display: flex;
    position: relative;
    overflow-x: hidden;
    /* overflow-y:; */
    height: calc(100vh - var(--Header-height) - var(--Nav-height));
    min-width: 100vw;
  }
  #machines-menu > div {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    height: 100%;
    min-width: 100%;
    background-color: var(--body-background);
  }
  #machines-menu > div:first-child {
    z-index: 1;
  }
</style>
