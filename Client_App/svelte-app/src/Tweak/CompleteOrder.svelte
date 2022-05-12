<script>
  import OptionElement from "./CompleteOrders/OptionElement.svelte";

  import {
    tweak,
    tweakSelectedHeight,
    tweakSelectedWidth,
    tweakSelectedDepth,
    tweakMainDecor,
    tweakFirstDoor,
    tweakSecondDoor,
    tweakThirdDoor,
    tweakSelectedCount,
  } from "../store";
  import AddToCartButton from "./CompleteOrders/AddToCartButton.svelte";
  import ShowPriceButton from "./CompleteOrders/ShowPriceButton.svelte";
</script>

<div class="my-card">
  <OptionElement option={"Широчина: "} value={$tweakSelectedWidth} />
  <OptionElement option={"Дълбочина: "} value={$tweakSelectedDepth} />
  <OptionElement option={"Височина: "} value={$tweakSelectedHeight} />
  <OptionElement option="Корпус: " value={$tweakMainDecor} />
  {#if $tweak == 1}
    <OptionElement option="Врата: " value={$tweakFirstDoor} />
  {:else if $tweak == 2}
    <OptionElement option="Лява Врата: " value={$tweakFirstDoor} />
    <OptionElement option="Дясна Врата: " value={$tweakSecondDoor} />
  {:else}
    <OptionElement option="Лява Врата: " value={$tweakFirstDoor} />
    <OptionElement option="Средна Врата: " value={$tweakSecondDoor} />
    <OptionElement option="Дясна Врата: " value={$tweakThirdDoor} />
  {/if}
  <OptionElement option="Брой: " value={$tweakSelectedCount} />
  <AddToCartButton />
  <ShowPriceButton />
</div>

<style>
</style>
