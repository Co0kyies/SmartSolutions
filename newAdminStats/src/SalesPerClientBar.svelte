<script>
  import BarChart from "./BarChart.svelte";
  import Loader from "./Loader.svelte";
  import { getDatabase, get, ref, child, set } from "firebase/database";
</script>

<main>
  {#await get(child(ref(getDatabase()), "BI/salesPerClient"))}
    <Loader />
  {:then snapshot}
    <BarChart data={snapshot.val()} />
  {/await}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
  }
</style>
