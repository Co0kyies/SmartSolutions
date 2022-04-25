<script>
  import { onMount, onDestroy } from "svelte";
  import { tweakMainDecor } from "../store";

  let svg;
  let render;
  let testShape;
  let colorPick;

  let unsubscribeFunctionsArray = [];
  // rendering sizes
  onMount(() => {
    const zoom = 7;
    const sceneWidth = 16;
    const sceneHeight = 16;
    let viewWidth = sceneWidth * zoom;
    let viewHeight = sceneHeight * zoom;
    let svgWidth = svg.clientHeight;
    let svgHeight = svg.clientWidth;
    // set viewBox using zoom
    svg.setAttribute(
      "viewBox",
      `${-viewWidth / 2}  ${-viewHeight / 2} ` + `${viewWidth} ${viewHeight}`
    );
    // rendering variable
    let isSpinning = false;
    const TAU = Zdog.TAU;

    // create an scene Anchor to hold all items
    let scene = new Zdog.Anchor();

    // ----- model ----- //

    // add shapes to scene
    testShape = new Zdog.Shape({
      addTo: scene,
      path: [
        { x: 8, y: -8 },
        { x: 8, y: 0 },
        { x: -8, y: 8 },
      ],
      translate: { z: 10 },
      color: "#00",
      stroke: 3,
      fill: true,
    });

    new Zdog.Shape({
      addTo: scene,
      path: [
        { x: 0, y: -8 },
        { x: 8, y: 8 },
        { x: -8, y: 8 },
      ],
      translate: { z: 10 },
      color: "#E62",
      stroke: 3,
      fill: true,
    });

    new Zdog.Ellipse({
      addTo: scene,
      diameter: 20,
      translate: { z: -10 },
      stroke: 5,
      color: "#636",
    });

    // ----- animate ----- //

    function animate() {
      // make changes to model, like rotating scene
      scene.rotate.y += isSpinning ? 0.03 : 0;
      scene.updateGraph();
      render();
      requestAnimationFrame(animate);
    }

    render = function () {
      empty(svg);
      scene.renderGraphSvg(svg);
    };

    animate();

    function empty(element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }

    // ----- drag ----- //

    let dragStartRX, dragStartRY;
    let minSize = Math.min(svgWidth, svgHeight);

    // add drag-rotatation with Dragger
    new Zdog.Dragger({
      startElement: svg,
      onDragStart: function () {
        isSpinning = false;
        dragStartRX = scene.rotate.x;
        dragStartRY = scene.rotate.y;
      },
      onDragMove: function (pointer, moveX, moveY) {
        scene.rotate.x = dragStartRX - ((moveY * 0.1) / minSize) * TAU;
        scene.rotate.y = dragStartRY - ((moveX * 0.1) / minSize) * TAU;
      },
    });

    // Subscribing the store values
    let decorColorsMap = {
      H3331: "#d8b15e",
      H1401: "#d8d8d8",
      U960ST9: "#696969",
    };
    unsubscribeFunctionsArray.push(
      tweakMainDecor.subscribe((value) => {
        console.log("Hello I work");
        testShape.color = decorColorsMap[value];
      })
    );
  });
  onDestroy(() => {
    unsubscribeFunctionsArray.forEach((fn) => {
      fn();
    });
  });
</script>

<!-- <canvas bind:this={canvas} /> -->
<svg bind:this={svg} />

<div>
  <button
    class="test-button-color-change-zdog"
    on:click={() => {
      console.log($tweakMainDecor);
    }}>ClickMe</button
  >
  <input bind:value={colorPick} />
</div>

<style>
  svg {
    cursor: move;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgb(197, 197, 197);
    z-index: 10000000000;
  }
  div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: #696969;
  }
</style>
