<script>
  import { createEventDispatcher } from "svelte";
  import { Card } from "sveltestrap";
  import { tweakFitstDecor, tweakSecondDecor } from "../../store";

  const dispatch = createEventDispatcher();

  function handleMessage(event) {
    alert(event.detail.text);
  }
  let decors = {
    H3331: "Nebraska Oak",
    H1401: "Cascina Pine",
    U960ST9: "Onyx Grey",
  };
  let selected;
  let options = [1, 2];
</script>

<div class="my-card flexbox">
  {#each options as option}
    {#if selected == option}
      {#if option == 1}
        <div
          on:click={() => {
            selected = option;
            dispatch("selectDecor", { decor: $tweakFitstDecor });
          }}
          class="my-card option selected"
        >
          <img src="./img/decor_{$tweakFitstDecor}.jpg" alt="" />
          <p>{decors[$tweakFitstDecor]}</p>
        </div>
      {:else}
        <div
          on:click={() => {
            selected = option;
            dispatch("selectDecor", { decor: $tweakSecondDecor });
          }}
          class="my-card option selected"
        >
          <img src="./img/decor_{$tweakSecondDecor}.jpg" alt="" />
          <p>{decors[$tweakSecondDecor]}</p>
        </div>
      {/if}
    {:else if option == 1}
      <div
        on:click={() => {
          selected = option;
          dispatch("selectDecor", { decor: $tweakFitstDecor });
        }}
        class="my-card option "
      >
        <img src="./img/decor_{$tweakFitstDecor}.jpg" alt="" />
        <p>{decors[$tweakFitstDecor]}</p>
      </div>
    {:else}
      <div
        on:click={() => {
          selected = option;
          dispatch("selectDecor", { decor: $tweakSecondDecor });
        }}
        class="my-card option "
      >
        <img src="./img/decor_{$tweakSecondDecor}.jpg" alt="" />
        <p>{decors[$tweakSecondDecor]}</p>
      </div>
    {/if}
  {/each}
</div>

<style>
  :root {
    --option-padding: 0.5rem;
    --option-widht: 6rem;
  }

  .my-card {
    padding: 1rem;
    border-radius: 0.25rem;
    border: 1px solid rgba(0, 0, 0, 0.125);
    background-color: white;
  }
  .flexbox {
    display: flex;
  }
  .my-card.option {
    padding: var(--option-padding);
  }
  .option {
    width: var(--option-widht);
    height: 11rem;
    margin-right: 1.5rem;
  }
  .option img {
    width: 6rem;
  }

  .selected {
    background-color: rgb(161, 161, 161);
  }
  .option img {
    width: calc(var(--decor-width) - (var(--decor-padding) * 2));
  }
</style>
