<script>
  import { tweakFitstDecor } from "../store";
  import SubMenu from "./SelectDecorsMenu/SubMenu.svelte";
  import { Card } from "sveltestrap";
  let decors = [
    { number: "H3331", desc: "Nebraska Oak" },
    { number: "H1401ST22", desc: "Cascina Pine" },
    { number: "U960ST9", desc: "Onyx Grey" },
  ];
</script>

<div class="main">
  <Card body color="info" class="mb-3"
    ><SubMenu title="Изберете първи декор" decorNumber={1} />
    <SubMenu title="Изберете втори декор" decorNumber={2} />
  </Card>
</div>

<style>
  /* .main {
    margin: 3rem 0;
  } */
</style>
