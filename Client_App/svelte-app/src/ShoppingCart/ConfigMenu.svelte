<script>
  import DecorOptions from "./DecorOptions.svelte";
  import { Button } from "sveltestrap";
  import { user, authUser, userId, pricePerCubic } from "../store";
  import { writeToDatabase } from "../firebase";
  export let key;
  let selectedWidth = $user.inBasket[key].widht;
  let selectedHeight = $user.inBasket[key].height;
  let selectedDepth = $user.inBasket[key].depth;
  let mainDecor = $user.inBasket[key].mainDecor;
  let firstDoor = $user.inBasket[key].firstDoor;
  let secondDoor = $user.inBasket[key].secondDoor;
  let thirdDoor = $user.inBasket[key].thirdDoor;

  let widthArray = [];
  let heightArray = [];
  let dephtArray = [];

  let siezesForDifferentModels = {
    1: [
      [40, 55],
      [50, 60],
      [170, 250],
    ],
    2: [
      [80, 110],
      [50, 60],
      [170, 250],
    ],
    3: [
      [120, 165],
      [50, 60],
      [170, 250],
    ],
  };

  let numberOfDoors = 1;
  if ($user.inBasket[key].model == "aura 2 врати") {
    numberOfDoors = 2;
  }
  if ($user.inBasket[key].model == "aura 3 врати") {
    numberOfDoors = 3;
  }

  {
    let a = siezesForDifferentModels[numberOfDoors];
    for (let index = a[0][0]; index < a[0][1] + 1; index++) {
      widthArray.push(index);
    }
    for (let index = a[1][0]; index < a[1][1] + 1; index++) {
      dephtArray.push(index);
    }
    for (let index = a[2][0]; index < a[2][1] + 1; index++) {
      heightArray.push(index);
    }
  }

  function saveButton(params) {
    if ($authUser) {
      let path = "website/" + $userId + "/inBasket/" + key;
      writeToDatabase(path + "/widht", selectedWidth);
      writeToDatabase(path + "/depth", selectedDepth);
      writeToDatabase(path + "/heigh", selectedHeight);
      writeToDatabase(path + "/mainDecor", mainDecor);
      writeToDatabase(path + "/firstDoor", firstDoor);
      writeToDatabase(path + "/secondDoor", secondDoor);
      writeToDatabase(path + "/thirdDoor", thirdDoor);
      let count = $user.inBasket[key].count;
      let oldPricePerUnit = $user.inBasket[key].pricePerUnit;
      let oldPrice = $user.totalPrice;
      console.log(oldPrice);
      console.log(oldPricePerUnit, count);
      oldPrice -= oldPricePerUnit * count;
      let newPricePerUnit = Number(
        (
          selectedHeight *
          selectedDepth *
          selectedWidth *
          $pricePerCubic
        ).toFixed(2)
      );
      let totalPrice = Number((oldPrice + newPricePerUnit * count).toFixed(2));
      console.log(oldPrice, count);
      console.log(newPricePerUnit);
      console.log(totalPrice);
      writeToDatabase(path + "/pricePerUnit", newPricePerUnit);
      writeToDatabase("website/" + $userId + "/totalPrice", totalPrice);
    }
  }
</script>

<div id="main">
  <div id="sizes_and_decors">
    <div id="sizes">
      <div class="sizes_option">
        <span>Широчина: </span><select bind:value={selectedWidth}
          >{#each widthArray as x}
            <option value={x}>{x}</option>
          {/each}</select
        ><span>см</span>
      </div>
      <div class="sizes_option">
        <span>Дълбочина: </span><select bind:value={selectedDepth}
          >{#each dephtArray as x}
            <option value={x}>{x}</option>
          {/each}</select
        ><span>см</span>
      </div>

      <div class="sizes_option">
        <span>Височина: </span><select bind:value={selectedHeight}
          >{#each heightArray as x}
            <option value={x}>{x}</option>
          {/each}</select
        ><span>см</span>
      </div>
    </div>
    <div id="decors">
      <div class="decors_option">
        <span>Корпус: </span><select bind:value={mainDecor}
          ><DecorOptions /></select
        >
        <img src="./img/decor_{mainDecor}.jpg" alt="" />
      </div>
      {#if numberOfDoors == 1}
        <div class="decors_option">
          <span>Врата: </span><select bind:value={firstDoor}
            ><DecorOptions /></select
          >
          <img src="./img/decor_{firstDoor}.jpg" alt="" />
        </div>
      {:else}
        <div class="decors_option">
          <span>Лява врата: </span><select bind:value={firstDoor}
            ><DecorOptions /></select
          >
          <img src="./img/decor_{firstDoor}.jpg" alt="" />
        </div>
      {/if}
      {#if numberOfDoors == 2}
        <div class="decors_option">
          <span>Дясна Врата: </span><select bind:value={secondDoor}
            ><DecorOptions /></select
          >
          <img src="./img/decor_{secondDoor}.jpg" alt="" />
        </div>
      {:else if numberOfDoors == 3}
        <div class="decors_option">
          <span>Средна врата: </span><select bind:value={secondDoor}
            ><DecorOptions /></select
          >
          <img src="./img/decor_{secondDoor}.jpg" alt="" />
        </div>
      {/if}
      {#if numberOfDoors == 3}
        <div class="decors_option">
          <span>Дясна Врата: </span><select bind:value={thirdDoor}
            ><DecorOptions /></select
          >
          <img src="./img/decor_{thirdDoor}.jpg" alt="" />
        </div>
      {/if}
    </div>
  </div>
  <div id="buttons">
    <button on:click={saveButton} type="button" class="btn btn-success"
      >Запази</button
    >
    <button type="button" class="btn btn-danger">Отмени</button>
  </div>
</div>

<style>
  #main {
    display: grid;
    grid-template-columns: 2fr 2fr;
    margin: auto;
    margin-top: 3rem;
    width: 90%;
  }
  #sizes_and_decors {
    display: flex;
    width: 100%;

    /* justify-items: stretch; */
  }
  #sizes {
    display: block;
  }
  #sizes .sizes_option {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
  #decors {
    display: block;
    justify-items: center;
  }
  #decors .decors_option {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
  #decors img {
    height: 2.5rem;
    width: 2.5rem;
    margin-left: 0.3rem;
  }
  #decors select {
    /* width: 4rem; */
  }
  #buttons {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
  }
  #buttons button {
    position: absolute;
    width: 7rem;
  }
  #buttons button:nth-of-type(1) {
    right: 4rem;
  }
  #buttons button:nth-of-type(2) {
    right: 4rem;
    top: 2.5rem;
  }
  span {
    white-space: nowrap;
  }
</style>
