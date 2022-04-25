<script>
  import Listener from "./Listener.svelte";
  import anime from "animejs";

  let decorDiv;
  let ongoingAnimation = false;
  function startAnimation(event) {
    function clearDiv() {
      decorDiv.innerHTML = "";
    }
    if (!ongoingAnimation) {
      ongoingAnimation = true;
      let barcode = event.detail.newValue;
      clearDiv();
      eel.change_progress_db_value(barcode, "Дупчене");
      eel.find_barcode(barcode)((barcodeObj) => {
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
        let decorDivHeight = 550;
        let decorDivWidth = 500;
        console.log(barcodeObj);
        console.log(barcodeObj["Height"], barcodeObj["Width"]);
        let factorHeight = decorDivHeight / barcodeObj["Height"];
        let factorWidht = decorDivWidth / barcodeObj["Width"];
        console.log(factorWidht, factorHeight);
        for (let index = 0; index < barcodeObj["Holes"].length; index++) {
          const holes = barcodeObj["Holes"][index];
          let holeX = holes[0];
          let holeY = holes[1];
          let newHoles = [holeX * factorWidht, holeY * factorHeight];
          let el = document.createElement("div");
          el.className = "el";
          el.style.position = "absolute";
          el.style.top = holeY * factorHeight + "px";
          el.style.left = holeX * factorWidht + "px";
          el.style.width = "0px";
          el.style.height = "0px";
          el.style.backgroundColor = "black";
          el.style.borderRadius = "50%";
          decorDiv.appendChild(el);
        }
        let tl = anime.timeline({
          easing: "easeOutExpo",
        });
        let a;
        let els = document.querySelectorAll(".el");
        for (let index = 0; index < els.length; index++) {
          const element = els[index];
          const length = els.length;
          if (index == length - 1) {
            tl.add({
              targets: `#decor-machine-holes > .el:nth-child(${index + 1})`,
              duration: 30000 / length,
              width: "5px",
              height: "5px",
              complete: function () {
                ongoingAnimation = false;
              },
            });
          } else {
            tl.add({
              targets: `#decor-machine-holes > .el:nth-child(${index + 1})`,
              duration: 30000 / length,
              width: "5px",
              height: "5px",
            });
          }
        }
      });
    }
  }
</script>

<Listener path="/holes" on:valueChange={startAnimation} />
<div class="container-md">
  <mt-4 class="row mt-4">
    <div class="col-8 d-flex justify-content-center">
      <div bind:this={decorDiv} id="decor-machine-holes" />
    </div>
    <div class="col-4 d-flex justify-content-center" />
  </mt-4>
</div>

<style>
  #decor-machine-holes {
    position: relative;
    background-color: white;
    height: 550px;
    width: 500px;
    opacity: 0;
  }
</style>
