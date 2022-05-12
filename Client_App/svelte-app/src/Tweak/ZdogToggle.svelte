<script>
  import { createEventDispatcher } from "svelte";
  let dispach = createEventDispatcher();
</script>

<button
  on:click={() => {
    dispach("click");
  }}
>
  3D
</button>

<style>
  button {
    position: absolute;
    bottom: 30px;
    left: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    height: 50px;
    width: 50px;
    z-index: 3;
    background-color: white;
    font-size: 1rem;
    font-weight: 600;
  }
</style>
