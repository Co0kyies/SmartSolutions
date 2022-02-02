<script>
  import { Route } from "tinro";
  import LayerOne from "./LayerOne.svelte";
  import Nav from "./Nav.svelte";
  let numberOfNavs = 0;
</script>

<LayerOne
  ><Nav
    options={[
      { option: "Продажби", icon: "bag-fill", href: "/sales" },
      { option: "Матеряли", icon: "tools", href: "/materials" },
      { option: "Служители", icon: "person-badge", href: "/employees" },
      { option: "Клиенти", icon: "person", href: "/clients" },
    ]}
    main="true"
    on:mount={() => {
      numberOfNavs++;
    }}
  /></LayerOne
>
<h1>{numberOfNavs}</h1>

<style>
  h1 {
    margin-left: 15rem;
  }
</style>
