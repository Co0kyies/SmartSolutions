<script>
  import { Card, CardHeader, CardBody, CardTitle } from "sveltestrap";
  import { tweakFitstDecor, tweakSecondDecor } from "../../store";
  import { onDestroy } from "svelte";

  export let title = "Избери първи декор";
  export let decorNumber;
  let selectedDecor;
  let decors = [
    { number: "H3331", desc: "Nebraska Oak" },
    { number: "H1401", desc: "Cascina Pine" },
    { number: "U960ST9", desc: "Onyx Grey" },
  ];
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
    <Card class=" b decorsContainer">
      {#each decors as decor}
        {#if selectedDecor == decor.number}
          <div
            class="decorOpt selected"
            on:click={() => {
              selectedDecor = decor.number;
            }}
          >
            <img src="./img/decor_{decor.number}.jpg" alt="" />
            <p><span>{decor.number}</span><span>{decor.desc}</span></p>
          </div>
        {:else}
          <div
            class="decorOpt selected"
            on:click={() => {
              selectedDecor = decor.number;
            }}
          >
            <img src="./img/decor_{decor.number}.jpg" alt="" />
            <p><span>{decor.number}</span><span>{decor.desc}</span></p>
          </div>
        {/if}
      {/each}
    </Card>
  </CardBody>
</Card>

<style>
  .decorsContainer {
    background-color: khaki;
  }
  .decorOpt {
    width: 3rem;
    height: 5rem;
  }
  img {
    width: inherit;
  }
</style>
