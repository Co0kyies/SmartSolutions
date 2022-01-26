<script>
  export let title = "Избери първи декор";
  export let writable;
  import { Card, CardHeader, CardBody, CardTitle } from "sveltestrap";
  let decors = [
    { number: "H3331", desc: "Nebraska Oak" },
    { number: "H1401ST22", desc: "Cascina Pine" },
    { number: "U960ST9", desc: "Onyx Grey" },
  ];
</script>

<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardBody style:display="flex">
    {#each decors as decor}
      {#if writable == decor[number]}
        <div class="decorOpt">
          <img src="./img/decor_{decor[number]}.png" alt="" />
          <p><span>{decor[number]}</span><span>{decor[desc]}</span></p>
        </div>
      {/if}
    {/each}
  </CardBody>
</Card>

<!-- {#each options as option, i}
{#if $tweakSelectedOption == option}
  <div
    class="active"
    on:click={() => {
      $tweakSelectedOption = option;
      console.log($tweakSelectedOption);
    }}
  >
    <span>{i + 1}. {option}</span>
  </div>
{:else}
  <div
    on:click={() => {
      $tweakSelectedOption = option;
      console.log($tweakSelectedOption);
    }}
  >
    <span>{i + 1}. {option}</span>
  </div>
{/if}
{/each} -->
