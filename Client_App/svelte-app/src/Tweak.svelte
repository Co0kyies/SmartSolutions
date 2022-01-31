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
    tweakMainDecor,
    tweakFirstDoor,
    tweakSecondDoor,
    tweakThirdDoor,
    tweakMenuOptions,
  } from "./store";
  import Nav from "./Tweak/Nav.svelte";
  import SizesMenu from "./Tweak/SizesMenu.svelte";
  import SelectDecorsMenu from "./Tweak/SelectDecorsMenu.svelte";
  import ApplyDecorsMenu from "./Tweak/ApplyDecorsMenu.svelte";
  import CompleteOrder from "./Tweak/CompleteOrder.svelte";
  import { onMount, onDestroy } from "svelte";

  let options = $tweakMenuOptions;

  let snapshot = {
    tweakSelectedHeight: $tweakSelectedHeight,
    tweakSelectedWidth: $tweakSelectedWidth,
    tweakSelectedDepth: $tweakSelectedDepth,
    tweakSelectedCount: $tweakSelectedCount,
    tweakFitstDecor: $tweakFitstDecor,
    tweakSecondDecor: $tweakSecondDecor,
    tweakMainDecor: $tweakMainDecor,
    tweakFirstDoor: $tweakFirstDoor,
    tweakSecondDoor: $tweakSecondDoor,
    tweakThirdDoor: $tweakThirdDoor,
  };

  onDestroy(() => {
    $tweakSelectedOption = "Размери";
    $tweakSelectedWidth = snapshot["tweakSelectedWidth"];
    $tweakSelectedHeight = snapshot["tweakSelectedHeight"];
    $tweakSelectedDepth = snapshot["tweakSelectedDepth"];
    $tweakSelectedCount = snapshot["tweakSelectedCount"];
    $tweakFitstDecor = snapshot["tweakFitstDecor"];
    $tweakSecondDecor = snapshot["tweakSecondDecor"];
    $tweakMainDecor = snapshot["tweakMainDecor"];
    $tweakFirstDoor = snapshot["tweakFirstDoor"];
    $tweakSecondDoor = snapshot["tweakSecondDoor"];
    $tweakThirdDoor = snapshot["tweakThirdDoor"];
  });
</script>

<main>
  <div id="pic">
    <img src="./img/ED_{$tweak}doors.jpg" alt="" />
    <!-- <span>Wardrobes_{$tweakMainDecor}_{$tweakFirstDoor}_{$tweakSecondDoor}</span
    > -->
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
        {:else}
          <CompleteOrder />
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
