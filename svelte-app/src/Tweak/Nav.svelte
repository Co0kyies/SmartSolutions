<script>
  import { tweakSelectedOption } from "../store";
  let options = ["Размери", "Декори", "Прилагане на Декори", "Финилизиране"];
</script>

<nav>
  {#each options as option, i}
    {#if $tweakSelectedOption == option}
      <div
        class="active"
        on:click={() => {
          $tweakSelectedOption = option;
        }}
      >
        <span>{i + 1}. {option}</span>
      </div>
    {:else}
      <div
        on:click={() => {
          $tweakSelectedOption = option;
        }}
      >
        <span>{i + 1}. {option}</span>
      </div>
    {/if}
  {/each}
</nav>

<style>
  nav {
    display: flex;
  }
  div {
    display: flex;
    position: relative;
    width: calc(100% / 4);
    justify-content: center;
    align-items: center;
    background-color: rgb(206, 206, 206);
    height: 4rem;
  }
  div::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: red;
    height: 2px;
    width: 0;
    transition: 0.3s;
  }
  /* div::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: red;
    height: 2px;
  } */
  div:hover::before,
  div:hover::after {
    width: 100%;
  }
  .active {
    color: rgb(119, 0, 0);
  }
  .active::before {
    width: 100%;
  }
</style>
