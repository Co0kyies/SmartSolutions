<script>
  import { element } from "svelte/internal";

  import Header from "./Header.svelte";
  import Nav from "./Nav.svelte";
  // import anime from "animejs/lib/anime.es.js";

  let selectedOption;
  let loading;
  let loadingCompleted;
  let test = "Test";
  // eel.expose(my_javascript_function);
  // function my_javascript_function() {
  //   test = "Test Completed";
  //   console.log("Hello World");
  // }

  function testFunc() {
    function testReturnJS(n) {
      console.log(`Got this from python: ${n}`);
    }
    console.log(eel.test_returns_py());
    eel.test_returns_py()(testReturnJS);
  }
</script>

<Header
  on:buttonPressed={() => {
    loading = true;
  }}
  on:loadingCompleted={() => {
    loading = false;
    loadingCompleted = true;
  }}
/>
<Nav {selectedOption} />

<main>
  {#if loading}
    <div class="loading-screen">
      <span>Зареждане..</span>
    </div>
  {/if}
  {#if loadingCompleted}
    Hello World!
  {/if}
  <button on:click={testFunc} class="btn btn-danger">Click Me</button>
</main>

<style>
  :global(:root) {
    --font-theme-color: rgb(163, 0, 0);
    --Header-height: 6rem;
    --Nav-height: 4rem;
  }
  main {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100vh - var(--Header-height) - var(--Nav-height));
  }
</style>
