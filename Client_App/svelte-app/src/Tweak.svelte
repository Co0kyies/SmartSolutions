<script>
  import {
    tweak,
    tweakSelectedOption,
    tweakSelectedCount,
    tweakSelectedDepth,
    tweakSelectedHeight,
    tweakSelectedWidth,
  } from "./store";
  import Nav from "./Tweak/Nav.svelte";
  import SizesMenu from "./Tweak/SizesMenu.svelte";
  import { onDestroy } from "svelte";

  let options = [
    "Размери",
    "Декори",
    "Прилагане на Декори",
    "Финилизиране на поръчката",
  ];

  let firstDecor;
  let secondDecor;

  let decors = [
    { number: "H3331", desc: "Nebraska Oak" },
    { number: "H1401ST22", desc: "Cascina Pine" },
    { number: "U960ST9", desc: "Onyx Grey" },
  ];

  onDestroy(() => {
    $tweakSelectedWidth = undefined;
    $tweakSelectedHeight = undefined;
    $tweakSelectedDepth = undefined;
    $tweakSelectedCount = undefined;
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
      {#if $tweakSelectedOption == options[0]}
        <SizesMenu />
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    width: 100%;
    height: calc(100% - 8rem);
    display: grid;
    grid-template-columns: 4fr 5fr;
  }
  #pic {
    background-color: blue;
    position: relative;
  }
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  #config {
    position: relative;
  }
  .padding-box {
    padding: 1rem 3rem;
  }
</style>
