<script>
  import LayerOne from "./LayerOne.svelte";
  import Nav from "./Nav/Nav.svelte";
  import AllSalesBar from "./AllSalesBar.svelte";
  import SalesPerModelBar from "./SalesPerModelBar.svelte";
  import SalesPerClientBar from "./SalesPerClientBar.svelte";
  import { selectedMenu, type } from "./store";
  import { app } from "./firabase";

  selectedMenu.subscribe((value) => {});
  type.subscribe((value) => {
    console.log(value);
  });
</script>

<LayerOne>
  <Nav
    options={[
      {
        option: "Продажби",
        icon: "bag-fill",
        subMenus: [{ type: "Всички Продажби" }, { type: "Продажби по месеци" }],
      },

      {
        option: "Клиенти",
        icon: "person",
        subMenus: [{ type: "Клиенти" }],
      },
    ]}
    main="true"
  />
</LayerOne>
<main>
  {#if $selectedMenu == "Продажби"}
    {#if $type == "Всички Продажби"}
      <AllSalesBar />{:else if $type == "Продажби по месеци"}
      <SalesPerModelBar />{/if}
  {/if}
  {#if $selectedMenu == "Клиенти"}
    <SalesPerClientBar />{/if}
</main>

<style>
  main {
    position: absolute;
    left: 4rem;
    width: calc(100% - 4rem);
    height: 100%;
  }
</style>
