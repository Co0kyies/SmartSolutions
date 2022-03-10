<script>
  import anime from "animejs";
  import { linear } from "svelte/easing";
  let decorDiv;
  let stopMachine = false;
  function startMachine() {
    console.log("Hello World");
    let decor;
    let moreSetsBool;
    function assignDecorANDSetsBool(arr) {
      decor = arr[0];
      moreSetsBool = arr[1];
      animation(decor);
      if (moreSetsBool == 1) {
        if (!stopMachine) {
          setTimeout(startMachine, 35000);
        }
      }
    }
    eel.get_printing_set()(assignDecorANDSetsBool);
    // startAnimation(decor);
  }
  function stopMachineFunc() {
    stopMachine = true;
  }
  function animation(decor) {
    let decors = [
      { number: "H3331", desc: "Nebraska Oak" },
      { number: "H1401ST22", desc: "Cascina Pine" },
      { number: "U960ST9", desc: "Onyx Grey" },
    ];
    console.log(decor);
    if (decor == "H3331") {
      decorDiv.style.backgroundImage = "url('./decors/NNEB_OAK.jpg')";
    }
    if (decor == "H1401") {
      decorDiv.style.backgroundImage =
        "url('./decors/EG_H1401ST22_Cascina_Pine.jpg')";
    }
    if (decor == "U960ST9") {
      decorDiv.style.backgroundImage =
        "url('./decors/EG_U960ST9_Onyx_Grey.jpg')";
    }
    decorDiv.style.opacity = "100";
    let tl = anime.timeline({
      duration: 7500,
      easing: "linear",
    });
    function resetElements() {
      document
        .querySelectorAll("#decor-cutting-machine > div")
        .forEach((element) => {
          element.style.opacity = 0;
          element.style.width = "6px";
          element.style.height = "6px";
        });
    }
    resetElements();
    tl.add({
      targets: " #decor-cutting-machine > div:nth-child(1)",
      height: "100%",
      begin: function () {
        decorDiv.querySelector("div:nth-child(1)").style.opacity = 100;
      },
    })
      .add({
        targets: " #decor-cutting-machine > div:nth-child(2)",
        height: "100%",
        begin: function () {
          decorDiv.querySelector("div:nth-child(2)").style.opacity = 100;
        },
      })
      .add({
        targets: " #decor-cutting-machine > div:nth-child(3)",
        width: "33.34%",
        begin: function () {
          decorDiv.querySelector("div:nth-child(3)").style.opacity = 100;
        },
      })
      .add({
        targets: " #decor-cutting-machine > div:nth-child(4)",
        width: "33.34%",
        begin: function () {
          decorDiv.querySelector("div:nth-child(4)").style.opacity = 100;
        },
      });
  }
</script>

<main>
  <div class="container-md">
    <div class="mt-4 row">
      <div class="col-8 d-flex justify-content-center">
        <div bind:this={decorDiv} id="decor-cutting-machine">
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
      <div class="col-4 d-flex flex-column justify-content-around">
        <button
          on:click={() => {
            stopMachine = false;
            startMachine();
          }}
          class="btn-circle btn-success">Старт</button
        ><button
          on:click={() => {
            stopMachine = true;
          }}
          class="btn-circle btn-danger">Стоп</button
        >
      </div>
    </div>
  </div>
</main>

<style>
  main {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }
  #decor-cutting-machine {
    position: relative;
    height: 550px;
    width: 500px;
    opacity: 0;
  }
  #decor-cutting-machine > div {
    position: absolute;
    background-color: black;
    height: 6px;
    width: 6px;
    opacity: 0;
  }
  #decor-cutting-machine > div:nth-child(1) {
    top: 0;
    left: 33%;
  }
  #decor-cutting-machine > div:nth-child(2) {
    top: 0;
    left: 66%;
  }
  #decor-cutting-machine > div:nth-child(3) {
    top: 33%;
    left: 66%;
  }
  #decor-cutting-machine > div:nth-child(4) {
    top: 66%;
    left: 66%;
  }
  .btn-circle {
    width: 130px;
    height: 130px;
    border-radius: 50%;
  }
  .btn-success {
    border: chartreuse 5px solid;
  }
  .btn-danger {
    border: coral 5px solid;
  }
</style>
