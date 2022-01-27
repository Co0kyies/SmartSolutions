<script>
  import {
    tweak,
    tweakSelectedOption,
    tweakSelectedCount,
    tweakSelectedDepth,
    tweakSelectedHeight,
    tweakSelectedWidth,
    tweakFitstDecor,
    tweakSecondDecor,
  } from "./store";
  import Nav from "./Tweak/Nav.svelte";
  import SizesMenu from "./Tweak/SizesMenu.svelte";
  import SelectDecorsMenu from "./Tweak/SelectDecorsMenu.svelte";
  import { onDestroy } from "svelte";

  let options = [
    "Размери",
    "Декори",
    "Прилагане на Декори",
    "Финилизиране на поръчката",
  ];

  onDestroy(() => {
    $tweakSelectedWidth = undefined;
    $tweakSelectedHeight = undefined;
    $tweakSelectedDepth = undefined;
    $tweakSelectedCount = undefined;
    $tweakFitstDecor = "H1401";
    $tweakSecondDecor = "U960ST9";
  });
</script>

<main>
  <div id="pic">
    <img src="./img/ED_{$tweak}doors.jpg" alt="" />
  </div>
  <div id="config">
    <Nav />
    <div class="padding-box">
      <h2>
        {#if $tweak == 1}
          Гардероб с 1 врата
        {:else}
          Гардероб с {$tweak} врати
        {/if}
      </h2>
      <div class="option-menu">
        {#if $tweakSelectedOption == options[0]}
          <SizesMenu />
        {:else if $tweakSelectedOption == options[1]}
          <SelectDecorsMenu />
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
  main {
    width: 100%;
    max-height: calc(100% - 8rem);
    display: grid;
    grid-template-columns: 4fr 5fr;
  }
  main #pic {
    background-color: blue;
    position: relative;
    max-height: inherit;
  }
  main #pic img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  #config {
    position: relative;
    overflow-y: hidden;
  }
  #config .padding-box {
    padding: 1rem 3rem;
    max-width: 100%;
    overflow-y: scroll;
  }
  #config .padding-box .option-menu {
    background-color: red;
  }
</style>
