<script>
  import { text } from "svelte/internal";
  import {
    tweak,
    tweakMainDecor,
    tweakFirstDoor,
    tweakSecondDoor,
    tweakThirdDoor,
  } from "../store";
  import Collapse from "./ApplyDecorsMenu/Collapse.svelte";
  import SelectedDecors from "./ApplyDecorsMenu/SelectedDecors.svelte";
</script>

<Collapse text="Корпус"
  ><SelectedDecors
    on:selectDecor={(event) => {
      $tweakMainDecor = event.detail.decor;
    }}
  /></Collapse
>

{#if $tweak == 1}
  <Collapse text="Врата"
    ><SelectedDecors
      on:selectDecor={(event) => {
        $tweakFirstDoor = event.detail.decor;
      }}
    /></Collapse
  >
{:else}
  <Collapse text="Лява врата"
    ><SelectedDecors
      on:selectDecor={(event) => {
        $tweakFirstDoor = event.detail.decor;
      }}
    /></Collapse
  >
{/if}

{#if $tweak == 2}
  <Collapse text="Дясна врата"
    ><SelectedDecors
      on:selectDecor={(event) => {
        $tweakSecondDoor = event.detail.decor;
      }}
    /></Collapse
  >
{:else if $tweak == 3}
  <Collapse text="Средна врата"
    ><SelectedDecors
      on:selectDecor={(event) => {
        $tweakSecondDoor = event.detail.decor;
      }}
    /></Collapse
  >
{/if}

{#if $tweak == 3}
  <Collapse text="Дясна врата"
    ><SelectedDecors
      on:selectDecor={(event) => {
        $tweakThirdDoor = event.detail.decor;
      }}
    /></Collapse
  >
{/if}
