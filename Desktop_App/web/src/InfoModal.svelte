<script>
  import { fly } from "svelte/transition";
  import ProgressBar from "./ProgressBar.svelte";

  let loaded = false;
  let ordersProgress;
  function bindToOrdersProgress(obj) {
    console.log("Hello");
    debugger;
    let newArr = [];
    for (const key in obj) {
      newArr.push([key, obj[key]]);
    }
    ordersProgress = newArr;
    loaded = true;
  }

  eel.calculate_percentage_completion_order()(bindToOrdersProgress);
</script>

<div class="custom-modal" transition:fly={{ y: 100, duration: 1000 }}>
  <div class="m-5">
    {#if loaded}
      {#each ordersProgress as order}
        <div class="my-5">
          <span class="mx-6">{order[0]}</span>
          <div class="d-flex justify-content-center align-items-center">
            <span class="mx-2">{order[1]}%</span>
            <ProgressBar
              percentage={order[1]}
              width="80%"
              height="1rem"
              color="rgba(223, 77, 125, 0.658)"
            />
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .custom-modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 60%;
    background-color: rgba(46, 46, 46, 0.849);
    color: rgb(211, 211, 211);
  }
</style>
