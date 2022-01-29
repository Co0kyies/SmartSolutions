<script>
  import { Card, CardHeader, CardBody, CardTitle } from "sveltestrap";
  import { tweakFitstDecor, tweakSecondDecor } from "../../store";
  import { onDestroy } from "svelte";

  export let title = "Избери първи декор";
  export let decorNumber;
  let selectedDecor = "false";
  let decors = [
    { number: "H3331", desc: "Nebraska Oak" },
    { number: "H1401", desc: "Cascina Pine" },
    { number: "U960ST9", desc: "Onyx Grey" },
  ];

  if (decorNumber == 1) {
    selectedDecor = $tweakFitstDecor;
  } else {
    selectedDecor = $tweakSecondDecor;
  }
  onDestroy(() => {
    if (selectedDecor) {
      if (decorNumber == 1) {
        $tweakFitstDecor = selectedDecor;
      } else {
        $tweakSecondDecor = selectedDecor;
      }
    }
  });
</script>

<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardBody>
    <div class="card">
      {#each decors as decor}
        {#if selectedDecor == decor.number}
          <div
            class="decorOpt selected card"
            on:click={() => {
              selectedDecor = decor.number;
            }}
          >
            <img src="./img/decor_{decor.number}.jpg" alt="" />
            <p><span>{decor.number}</span><span>{decor.desc}</span></p>
          </div>
        {:else}
          <div
            class="decorOpt card"
            on:click={() => {
              selectedDecor = decor.number;
            }}
          >
            <img src="./img/decor_{decor.number}.jpg" alt="" />
            <p><span>{decor.number}</span><span>{decor.desc}</span></p>
          </div>
        {/if}
      {/each}
    </div>
  </CardBody>
</Card>

<style>
  :root {
    --decor-width: 6rem;
    --decor-padding: 0.5rem;
  }
  .card {
    display: flex;
    flex-direction: row;
    height: fit-content;
    padding: 1rem;
  }
  .card .decorOpt {
    cursor: pointer;
    display: block;
    width: var(--decor-width);
    height: 11rem;
    margin-right: 1.5rem;
    padding: var(--decor-padding);
    /* border: 0.5px grey solid; */
  }
  .card .selected {
    background-color: rgb(161, 161, 161);
  }
  .card .decorOpt img {
    width: calc(var(--decor-width) - (var(--decor-padding) * 2));
  }
</style>
