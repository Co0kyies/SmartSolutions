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
  import ApplyDecorsMenu from "./Tweak/ApplyDecorsMenu.svelte";
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
      <div class="options">
        {#if $tweakSelectedOption == options[0]}
          <SizesMenu />
        {:else if $tweakSelectedOption == options[1]}
          <SelectDecorsMenu />
        {:else if $tweakSelectedOption == options[2]}
          <ApplyDecorsMenu />
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
  :root {
    --footer-height: 6rem;
    --header-height: 6rem;
    --options-nav-size: 4rem;
  }

  main {
    display: flex;
    max-height: calc(100% - var(--footer-height) - var(--header-height));
    width: 100%;
  }
  main #pic {
    width: 44%;
    height: 100%;
  }
  main #pic img {
    width: 100%;
    height: 100%;
  }
  main #config {
    width: 56%;
  }
  main #config .padding-box {
    height: calc(100% - var(--options-nav-size));
    overflow-y: scroll;
    padding: 1rem 3rem;
  }
</style>
