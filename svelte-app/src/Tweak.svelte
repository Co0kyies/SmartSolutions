<script>
  import { tweak, tweakSelectedOption } from "./store";
  import Nav from "./Tweak/Nav.svelte";
  import SizesMenu from "./Tweak/SizesMenu.svelte";
  let model = $tweak;

  //
  let heightArray = [];
  let widthArray = [];
  let dephtArray = [];
  let siezesForDifferentModels = {
    2: [
      [80, 110],
      [50, 60],
      [170, 250],
    ],
  };
  {
    let a = siezesForDifferentModels[model];
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
  //
  let options = [
    "Размери",
    "Декори",
    "Прилагане на Декори",
    "Финилизиране на поръчката",
  ];

  let selectedDepth;
  let selectedWidth;
  let selectedHeight;
  let selectedCount;

  let firstDecor;
  let secondDecor;

  let decors = [
    { number: "H3331", desc: "Nebraska Oak" },
    { number: "H1401ST22", desc: "Cascina Pine" },
    { number: "U960ST9", desc: "Onyx Grey" },
  ];
</script>

<main>
  <div id="pic" />
  <div id="config">
    <Nav />
    <h2>
      {#if model == 1}
        Гардероб с 1 врата
      {:else}
        Гардероб с {model} врати
      {/if}
    </h2>
    <!-- {#if selectedOption == options[0]}
      <div class="option">
        <span>Широчина: </span>
        <select bind:value={selectedWidth}>
          {#each widthArray as x}
            <option value={x}>{x} см</option>
          {/each}
        </select>
      </div>
      <div class="option">
        <span>Дълбочина:</span>
        <select bind:value={selectedDepth}>
          {#each dephtArray as x}
            <option value={x}>{x} см</option>
          {/each}
        </select>
      </div>
      <div class="opt">
        <span>Височина:</span>
        <select bind:value={selectedHeight}>
          {#each heightArray as x}
            <option value={x}>{x} см</option>
          {/each}
        </select>
      </div>
      <div class="options">
        <span>Количество: </span>
        <input bind:value={selectedCount} type="number" />
      </div>
    {:else if selectedOption == options[1]}
      <div class="optionDecors">
        <h3>Възможностни за първи декор</h3>
        {#each decors as x}
          <div class="decore" />
        {/each}
        <div>
          <div class="decor">
            H3332ST10 Grey Nebraska Oak <img
              src="./img/H3331_Detail.psd.png"
              alt=""
            />
          </div>
        </div>
      </div>
    {:else if selectedOption == options[2]}{/if} -->
    {#if $tweakSelectedOption == "Размери"}
      <SizesMenu />
    {/if}
  </div>
</main>

<style>
  main {
    width: 100%;
    height: calc(100% - 8rem);
    display: grid;
    grid-template-columns: 4fr 5fr;
  }
  #pic {
    background-color: blue;
    position: relative;
  }
  #config {
    position: relative;
  }
</style>
