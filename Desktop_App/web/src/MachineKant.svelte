<script>
  import anime from "animejs";
  import { linear } from "svelte/easing";
  import Listener from "./Listener.svelte";

  let decorDiv;
  let decorInfoDiv;
  let ongoingAnimation = false;
  function startAnimation(event) {
    let barcode = event.detail.newValue;
    eel.find_barcode(barcode)((barcodeObj) => {
      if (!ongoingAnimation) {
        ongoingAnimation = true;
        function fillDecorInfoDiv() {
          console.log(barcodeObj);
          decorInfoDiv.innerHTML += `<span style="color: white;" class="d-block ">  [ Height: ${barcodeObj["Heigh"]}см ]</span>`;
          decorInfoDiv.innerHTML += `<span style="color: white;" class="d-block ">  [ Widht: ${barcodeObj["Widht"]}см ]</span>`;
        }
        fillDecorInfoDiv();

        decorDiv.style.opacity = "100";
        let decors = [
          { number: "H3331", desc: "Nebraska Oak" },
          { number: "H1401ST22", desc: "Cascina Pine" },
          { number: "U960ST9", desc: "Onyx Grey" },
        ];
        let decor = barcodeObj["Decor"];
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
        function resetElements() {
          document
            .querySelectorAll("#decor-machine-kant> div")
            .forEach((div) => {
              let element = div.querySelector(".el");
              element.style.opacity = 0;
              element.style.width = "8px";
              element.style.height = "8px";
            });
        }
        resetElements();

        let tl = anime.timeline({
          duration: 7500,
          easing: "linear",
        });
        tl.add({
          targets: " #decor-machine-kant > div:nth-child(1) > .el",
          width: "100%",
          begin: function () {
            decorDiv.querySelector(
              "div:nth-child(1) > .el"
            ).style.opacity = 100;
          },
        })
          .add({
            targets: " #decor-machine-kant > div:nth-child(2) > .el",
            height: "100%",
            begin: function () {
              decorDiv.querySelector(
                "div:nth-child(2) > .el"
              ).style.opacity = 100;
            },
          })
          .add({
            targets: " #decor-machine-kant > div:nth-child(3) > .el",
            width: "100%",
            begin: function () {
              decorDiv.querySelector(
                "div:nth-child(3) > .el"
              ).style.opacity = 100;
            },
          })
          .add({
            targets: " #decor-machine-kant > div:nth-child(4) > .el",
            height: "100%",
            begin: function () {
              decorDiv.querySelector(
                "div:nth-child(4) > .el"
              ).style.opacity = 100;
            },
            complete: function () {
              ongoingAnimation = false;
            },
          });
      }
    });
  }
</script>

<Listener path="/kant" on:valueChange={startAnimation} />

<div class="container-md" />
<div class="row mt-4 ">
  <div class="col-8 d-flex justify-content-center">
    <div bind:this={decorDiv} id="decor-machine-kant">
      <div class="d-flex flex-row justify-content-start">
        <div class="el" />
      </div>
      <div class="d-flex flex-column justify-content-start">
        <div class="el" />
      </div>
      <div class="d-flex flex-row justify-content-end"><div class="el" /></div>
      <div class="d-flex flex-column justify-content-end">
        <div class="el" />
      </div>
    </div>
  </div>
  <div class="col-4 d-flex mt-5">
    <div bind:this={decorInfoDiv} class="decor-info" />
  </div>
</div>

<style>
  #decor-machine-kant {
    position: relative;
    height: 550px;
    width: 500px;
  }

  #decor-machine-kant > div {
    position: absolute;
  }
  .el {
    background-color: black;
    height: 8px;
    width: 8px;
    opacity: 0;
  }
  #decor-machine-kant > div:nth-child(1) {
    top: 0;
    left: 0;
    width: 100%;
  }
  #decor-machine-kant > div:nth-child(2) {
    top: 0;
    left: calc(100% - 8px);
    height: 100%;
  }
  #decor-machine-kant > div:nth-child(3) {
    top: calc(100% - 8px);
    left: 0;
    width: 100%;
  }
  #decor-machine-kant > div:nth-child(4) {
    top: 0;
    left: 0;
    height: 100%;
  }
</style>
