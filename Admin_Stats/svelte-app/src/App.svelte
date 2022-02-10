<script>
  import { Route } from "tinro";
  import LayerOne from "./LayerOne.svelte";
  import Nav from "./Nav/Nav.svelte";
  import { selectedMenu, type } from "./store";
  import { salesBar } from "./scripts/salesBar";

  salesBar();
  let barFunctions = {};
  let lineFunctions = {};
  let numberOfNavs = 0;
</script>

<LayerOne>
  <Nav
    options={[
      {
        option: "Продажби",
        icon: "bag-fill",
        subMenus: [{ type: "BarChart" }, { type: "LineChart" }],
      },
      {
        option: "Матеряли",
        icon: "tools",
        subMenus: [{ type: "BarChart" }, { type: "LineChart" }],
      },
      {
        option: "Служители",
        icon: "person-badge",
        subMenus: [{ type: "BarChart" }, { type: "LineChart" }],
      },
      {
        option: "Клиенти",
        icon: "person",
        subMenus: [{ type: "BarChart" }, { type: "LineChart" }],
      },
    ]}
    main="true"
    on:mount={() => {
      numberOfNavs++;
    }}
  />
</LayerOne>
<main>
  {$selectedMenu}
  {$type}

  <!-- {#if type == "bar"}
    <Bar func = {barFunctions[$selectedMenu]}>
    {:else}
    <Line func = {lineFunctions[$selectedMenu]}></Line>
  {/if} -->
</main>

<style>
  main {
    display: flex;
    align-items: center;
    padding-left: 4rem;
  }
  .p-8 {
    padding-left: 8rem;
  }
</style>
