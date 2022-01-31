<script>
  import { user } from "../store";
  import { ref, onValue, off } from "firebase/database";
  import { database, auth, writeToDatabase } from "../firebase";
  import { onAuthStateChanged } from "firebase/auth";
  import CountComponent from "./CountComponent.svelte";
  import ConfigToggle from "./ConfigToggle.svelte";
  import DeleteButton from "./DeleteButton.svelte";
  import ConfigMenu from "./ConfigMenu.svelte";
  import DropdownToggle from "./DropdownToggle.svelte";
  import SmallButton from "./SmallButton.svelte";
  import { Icon } from "sveltestrap";
  let dropdown = true;
  let config = false;

  export let key;

  let numberOfDoors;
  if ($user.inBasket[key].model == "aura 1 врата") {
    numberOfDoors = 1;
  } else if ($user.inBasket[key].model == "aura 2 врати") {
    numberOfDoors = 2;
  } else {
    numberOfDoors = 3;
  }
  console.log($user);
  console.log($user.inBasket[key].model);
</script>

<div class="my-card">
  <div class="flex">
    {#if $user.inBasket[key].model == "aura 2 врати"}
      <img src="./img/ED_{numberOfDoors}doors.jpg" alt="" />
    {:else}
      <img src="./img/ED_{numberOfDoors}doors.jpg" alt="" />
    {/if}

    <div id="count-component">
      <strong>{$user.inBasket[key].model}</strong>
      <CountComponent {key} />
    </div>

    <div id="config-toggle___delete-button">
      <SmallButton
        on:click={() => {
          config = !config;
        }}><Icon name="tools" /></SmallButton
      >
      <DeleteButton {key} />
    </div>
  </div>
  {#if config}
    <ConfigMenu {key} />
  {/if}
</div>

<style>
  .my-card {
    margin: 0.5rem 4%;
  }
  .flex {
    position: relative;
    display: flex;
    align-items: center;
  }
  .flex img {
    width: 6rem;
    margin-left: 2rem;
    border: solid rgba(0, 0, 0, 0.25) 0.1rem;
    border-radius: 0.25rem;
  }
  #count-component {
    position: absolute;
    display: flex;
    left: 10rem;
  }
  #count-component strong {
    margin-right: 1rem;
  }

  #config-toggle___delete-button {
    position: absolute;
    display: flex;
    right: 10rem;
  }
</style>
