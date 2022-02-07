<script>
  import { diameter } from "./store";
  import { onMount } from "svelte";

  let item;
  // zdog-demo.js
  console.log(item);
  onMount(() => {
    console.log(item);
    //create illo
    let illo = new Zdog.Illustration({
      // set canvas with selector
      element: item,
      dragRotate: true,
    });

    // add circle
    new Zdog.Ellipse({
      addTo: illo,
      diameter: 80,
      stroke: 20,
      color: "#636",
    });
    function animate() {
      illo.updateRenderGraph();
      requestAnimationFrame(animate);
    }

    animate();

    // update & render
    illo.updateRenderGraph();
  });
</script>

<canvas class="hhh" bind:this={item} width="240" height="240" />
<button
  on:click={() => {
    console.log(item);
  }}>hey</button
>

<style>
</style>
