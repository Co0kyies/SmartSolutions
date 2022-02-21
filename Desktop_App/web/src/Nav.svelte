<script>
  export let selectedOption;
</script>

<nav>
  {#each ["Машина Рязане", "Машина Кант", "Машина Дупчене", "Склад"] as optionName}
    {#if selectedOption == optionName}
      <div
        on:click={() => {
          selectedOption = optionName;
        }}
        class="option selected"
      >
        <span>{optionName}</span>
      </div>
    {:else}
      <div
        on:click={() => {
          selectedOption = optionName;
        }}
        class="option"
      >
        <span>{optionName}</span>
      </div>
    {/if}
  {/each}
</nav>

<style>
  nav {
    display: flex;
    height: var(--Nav-height);
    align-items: center;
    background-color: grey;
  }
  .option {
    flex-grow: 1;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  span {
    position: relative;
    display: inline-flex;
    align-items: center;
    color: white;
    height: 100%;
  }
  span:hover {
    color: var(--font-theme-color);
  }

  span::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    height: 3px;
    width: 0;
    transition: 0.5s;
    background-color: var(--font-theme-color);
  }
  span:hover::after {
    width: 150%;
  }

  .selected span {
    color: var(--font-theme-color);
  }
  .selected span::after {
    width: 150%;
  }
</style>
