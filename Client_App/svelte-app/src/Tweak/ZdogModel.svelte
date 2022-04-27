<script>
  import { onMount, onDestroy } from "svelte";
  import {
    tweak,
    tweakSelectedWidth,
    tweakSelectedDepth,
    tweakSelectedHeight,
    tweakMainDecor,
    tweakFirstDoor,
    tweakSecondDoor,
    tweakThirdDoor,
  } from "../store";

  let svg;
  let render;
  let testShape;
  let colorPick;

  let unsubscribeFunctionsArray = [];
  // rendering sizes
  onMount(() => {
    const zoom = 16;
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

    let decorColorsMap = {
      H3331: "#aa6a10",
      H1401: "#d8d8d8",
      U960ST9: "#696969",
    };

    let corpus = new Zdog.Box({
      addTo: scene,
      width: $tweakSelectedWidth,
      height: $tweakSelectedHeight,
      depth: $tweakSelectedDepth,
      stroke: false,
      color: decorColorsMap[$tweakMainDecor],
    });

    //Creating the handles functions
    function createRightHandle(door) {
      console.log(door);
      new Zdog.Shape({
        addTo: door,
        // no path set, default to single point
        stroke: 4,
        color: "#000",
        translate: { x: door.translate.x / 2, z: 1 },
      });
    }

    let firstDoor;
    let secondDoor;
    let thirdDoor;

    if ($tweak == 1) {
      firstDoor = new Zdog.Box({
        addTo: scene,
        width: $tweakSelectedWidth - 8,
        height: $tweakSelectedHeight - 5,
        depth: 1.8,
        color: decorColorsMap[$tweakFirstDoor],
        translate: { z: $tweakSelectedDepth / 2 + 5 },
      });
      createRightHandle(firstDoor);
    }

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
    //Sizes
    unsubscribeFunctionsArray.push(
      tweakSelectedHeight.subscribe((value) => {})
    );
    unsubscribeFunctionsArray.push(tweakSelectedWidth.subscribe((value) => {}));
    unsubscribeFunctionsArray.push(tweakThirdDoor.subscribe((value) => {}));

    //Colors

    unsubscribeFunctionsArray.push(tweakMainDecor.subscribe((value) => {}));
    unsubscribeFunctionsArray.push(tweakFirstDoor.subscribe((value) => {}));
    if ($tweak > 1) {
      unsubscribeFunctionsArray.push(tweakSecondDoor.subscribe((value) => {}));
    }
    if ($tweak > 2) {
      unsubscribeFunctionsArray.push(tweakThirdDoor.subscribe((value) => {}));
    }
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
    z-index: 2;
  }
  div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: #aa6a10;
  }
</style>
