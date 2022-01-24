<script>
  import {
    tweak,
    tweakSelectedWidth,
    tweakSelectedDepth,
    tweakSelectedHeight,
    tweakSelectedCount,
  } from "../store";

  let heightArray = [];
  let widthArray = [];
  let dephtArray = [];
  let siezesForDifferentModels = {
    1: [
      [40, 55],
      [50, 60],
      [170, 250],
    ],
    2: [
      [80, 110],
      [50, 60],
      [170, 250],
    ],
    1: [
      [40, 55],
      [50, 60],
      [170, 250],
    ],
    3: [
      [120, 165],
      [50, 60],
      [170, 250],
    ],
  };
  {
    let a = siezesForDifferentModels[$tweak];
    for (let index = a[0][0]; index < a[0][1] + 1; index++) {
      widthArray.push(index);
    }
    for (let index = a[1][0]; index < a[1][1] + 1; index++) {
      dephtArray.push(index);
    }
    for (let index = a[2][0]; index < a[2][1] + 1; index++) {
      heightArray.push(index);
    }
  }
</script>

<div class="option">
  <span
    >Широчина: ({widthArray[0]}-{widthArray[widthArray.length - 1]}) см.</span
  >
  <select bind:value={$tweakSelectedWidth}>
    {#each widthArray as x}
      <option value={x}>{x} см</option>
    {/each}
  </select>
</div>
<div class="option">
  <span>Дълбочина: ({dephtArray[0]}-{dephtArray[dephtArray.length - 1]}) </span>
  <select bind:value={$tweakSelectedDepth}>
    {#each dephtArray as x}
      <option value={x}>{x} см</option>
    {/each}
  </select>
</div>
<div class="option">
  <span
    >Височина: ({heightArray[0]}-{heightArray[heightArray.length - 1]})
  </span>
  <select bind:value={$tweakSelectedHeight}>
    {#each heightArray as x}
      <option value={x}>{x} см</option>
    {/each}
  </select>
</div>
<div class="option">
  <span>Количество: </span>
  <input bind:value={$tweakSelectedCount} type="number" />
</div>

<style>
  .option {
    display: grid;
    grid-template-columns: 1fr 2fr;
    margin: 1.5rem 0;
  }
  span {
    text-align: center;
  }
</style>
