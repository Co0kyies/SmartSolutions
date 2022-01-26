<script>
  import SubMenu from "./SubMenu.svelte";
  let decors = [
    { number: "H3331", desc: "Nebraska Oak" },
    { number: "H1401ST22", desc: "Cascina Pine" },
    { number: "U960ST9", desc: "Onyx Grey" },
  ];
</script>

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
