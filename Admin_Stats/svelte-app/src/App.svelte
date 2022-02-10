<script>
  import { Route } from "tinro";

  import { Wave } from "svelte-loading-spinners";
  import BarChart from "./BarChart.svelte";
  import LineChart from "./LineChart.svelte";

  import LayerOne from "./LayerOne.svelte";
  import Nav from "./Nav/Nav.svelte";
  import { selectedMenu, type } from "./store";

  import {
    getAllItemsSnapshot,
    getAllOrdersSnapshot,
  } from "./scripts/firabase";

  import { salesBar } from "./scripts/salesBar";
  import { salesLine } from "./scripts/salesLine";

  // salesLine();
  let ordersLoaded = false;
  let itemsLoaded = false;
  let ordersDB;
  let itemsDB;

  getAllItemsSnapshot.then((snapshot) => {
    itemsDB = snapshot;
    itemsLoaded = true;
  });
  getAllOrdersSnapshot.then((snapshot) => {
    ordersDB = snapshot;
    ordersLoaded = true;
  });

  console.log(salesBar());
  if (itemsLoaded == true && ordersLoaded == true) {
  }
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
  <!-- {#if type == "bar"}
    <Bar func = {barFunctions[$selectedMenu]}>
    {:else}
    <Line func = {lineFunctions[$selectedMenu]}></Line>
  {/if} -->
  {#if itemsLoaded == true && ordersLoaded == true}
    <!-- {$selectedMenu}
    {$type} -->
    <!-- <BarChart data={salesBar(itemsDB)} /> -->
    <LineChart data={salesLine(ordersDB, itemsDB)} />
    <!-- <button
      style="position: relative; z-index: 99999999999999999999999999;"
      on:click={() => {
        salesLine(ordersDB, itemsDB);
      }}>Click Me</button -->
  {:else}
    <div id="loading-screen">
      <div id="loader">
        <Wave color="#0059ff" />
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    position: relative;
    height: 100%;
    align-items: center;
    padding-left: 4rem;
  }
  #loading-screen {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.712);
  }
  #loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
