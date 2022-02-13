<script>
  import { onMount } from "svelte";
  export let data;
  let canvas;
  onMount(() => {
    console.log(data);
    let config = {
      type: "line",
      data: data,
    };
    const myChart = new Chart(canvas, config);
  });
</script>

<canvas bind:this={canvas} />
