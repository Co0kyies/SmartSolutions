<script>
  import {
    tweakSelectedHeight,
    tweakSelectedWidth,
    tweakSelectedDepth,
    tweakSelectedCount,
  } from "../../store";
  import { Button } from "sveltestrap";
  import { calcPrice } from "./calcPrice";
  let price = "";
</script>

<Button
  on:click={() => {
    price =
      calcPrice(
        $tweakSelectedHeight,
        $tweakSelectedWidth,
        $tweakSelectedDepth,
        $tweakSelectedCount
      ) + "лв.";
  }}
  color="success">Изчисли Цена</Button
>
<span>
  {price}
</span>

<style>
  span {
    margin-left: 1rem;
  }
</style>
