<script>
  import { onMount } from "svelte";
  import { time_ranges_to_array } from "svelte/internal";
  let canvas;
  export let data;
  onMount(() => {
    let config = {
      type: "bar",
      data: data,
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
    const myChart = new Chart(canvas, config);
  });
</script>

<canvas bind:this={canvas} />
