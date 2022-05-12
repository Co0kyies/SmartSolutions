<script>
  import { onMount, onDestroy } from "svelte";
  import { add_flush_callback, detach_after_dev } from "svelte/internal";
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
  let unsubscribeFunctionsArray = [];

  function empty(element) {
    debugger;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

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

    // Models Specific Sizes //
    let doorsDepth = 1.8;
    let doorsMargin = 4;
    let decorColorsMap = {
      H3331: "#998466",
      H1401: "#d8d8d8",
      U960ST9: "#696969",
    };

    // ----- utilities ----- //

    //Calculate the widht of the doors
    function doorsWidth() {
      let numDoors = $tweak;
      let answer =
        ($tweakSelectedWidth - doorsMargin * (2 - 1 + numDoors)) / numDoors;
      return answer;
    }
    function doorsHeight() {
      return $tweakSelectedHeight - 5;
    }
    function doorTranslateX(doorNo) {
      let numDoors = $tweak;
      let remainingSideSpace = ($tweakSelectedWidth - doorsWidth()) / 2;
      return doorNo == 1
        ? remainingSideSpace - doorsMargin
        : doorsMargin - remainingSideSpace;
    }

    // ----- model ----- //

    // add shapes to scene

    let corpus = {
      addTo: scene,
      width: $tweakSelectedWidth,
      height: $tweakSelectedHeight,
      depth: $tweakSelectedDepth,
      stroke: false,
      rotate: { x: -0.17, y: -0.2 },
      // color: decorColorsMap[$tweakMainDecor],
      frontFace: decorColorsMap[$tweakMainDecor],
      leftFace: decorColorsMap[$tweakMainDecor],
      topFace: decorColorsMap[$tweakMainDecor],
      rareFace: "#000",
      rightFace: "#000",
      bottomFace: "#000",
    };

    let firstDoor;
    let secondDoor;
    let thirdDoor;

    if ($tweak == 1) {
      firstDoor = {
        addTo: corpus,
        width: doorsWidth(),
        height: doorsHeight(),
        depth: doorsDepth,
        color: decorColorsMap[$tweakFirstDoor],
        translate: { z: $tweakSelectedDepth / 2 + 8 },
      };
    }
    if ($tweak == 2) {
      firstDoor = {
        addTo: corpus,
        width: doorsWidth() - doorsMargin / 2,
        height: doorsHeight(),
        depth: doorsDepth,
        color: decorColorsMap[$tweakFirstDoor],
        translate: {
          x: doorTranslateX(1),
          z: $tweakSelectedDepth / 2 + 8,
        },
      };
      secondDoor = {
        addTo: corpus,
        width: doorsWidth() - doorsMargin / 2,
        height: doorsHeight(),
        depth: doorsDepth,
        color: decorColorsMap[$tweakSecondDoor],
        translate: {
          x: doorTranslateX(2),
          z: $tweakSelectedDepth / 2 + 8,
        },
      };
    }
    if ($tweak == 3) {
      firstDoor = {
        addTo: corpus,
        width: doorsWidth() - doorsMargin / 2,
        height: doorsHeight(),
        depth: doorsDepth,
        color: decorColorsMap[$tweakFirstDoor],
        translate: {
          x: doorTranslateX(1),
          z: $tweakSelectedDepth / 2 + 8,
        },
      };
      secondDoor = {
        addTo: corpus,
        width: doorsWidth() - doorsMargin / 2,
        height: doorsHeight(),
        depth: doorsDepth,
        color: decorColorsMap[$tweakSecondDoor],
        translate: {
          x: doorTranslateX(2),
          z: $tweakSelectedDepth / 2 + 8,
        },
      };
      thirdDoor = {
        addTo: corpus,
        width: doorsWidth() - doorsMargin / 2,
        height: doorsHeight(),
        depth: doorsDepth,
        color: decorColorsMap[$tweakSecondDoor],
        translate: {
          x: 0,
          z: $tweakSelectedDepth / 2 + 10,
        },
      };
    }

    function createRightHandle(door) {
      let handle = new Zdog.Shape({
        addTo: door,
        // no path set, default to single point
        stroke: 4,
        color: "#000",
        translate: { x: (doorsWidth() * 30) / 100, z: 2 },
      });
      return handle;
    }

    // ----- animate ----- //

    // function animate() {
    //   // make changes to model, like rotating scene
    //   scene.rotate.y += isSpinning ? 0.03 : 0;
    //   scene.updateGraph();
    //   render();
    //   requestAnimationFrame(animate);
    // }

    // let render = function () {
    //   empty(svg);
    //   scene.renderGraphSvg(svg);
    // };

    // animate();

    function empty(element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      scene.children = [];
    }

    function buildModel() {
      let corpusModel = new Zdog.Box(corpus);
      firstDoor.addTo = corpusModel;
      new Zdog.Box(firstDoor);
      try {
        secondDoor.addTo = corpusModel;
        new Zdog.Box(secondDoor);
      } catch {}
      try {
        thirdDoor.addTo = corpusModel;
        new Zdog.Box(thirdDoor);
      } catch {}
    }

    function render() {
      empty(svg);
      buildModel();
      scene.updateGraph();
      scene.renderGraphSvg(svg);
    }

    // ----- On-Change Events ----- //
    {
      //Sizes
      unsubscribeFunctionsArray.push(
        tweakSelectedHeight.subscribe((value) => {
          corpus.height = value;
          firstDoor.height = doorsHeight();
          if ($tweak > 1) {
            secondDoor.height = doorsHeight();
          }
          if ($tweak > 2) {
            thirdDoor.height = doorsHeight();
          }
          render();
        })
      );
      unsubscribeFunctionsArray.push(
        tweakSelectedWidth.subscribe((value) => {
          corpus.width = value;
          firstDoor.width = doorsWidth();
          if ($tweak > 1) {
            //If 2 or 3 doors
            secondDoor.width = doorsWidth();
            firstDoor.translate.x = doorTranslateX(1);
            secondDoor.translate.x = doorTranslateX(2);
          }
          if ($tweak > 2) {
            //If 3 doors
            thirdDoor.width = doorsWidth();
          }
          render();
        })
      );
      unsubscribeFunctionsArray.push(
        tweakSelectedDepth.subscribe((value) => {
          corpus.depth = value;
          render();
        })
      );
    }

    {
      //Colors
      unsubscribeFunctionsArray.push(
        tweakMainDecor.subscribe((value) => {
          corpus.frontFace = decorColorsMap[value];
          corpus.leftFace = decorColorsMap[value];
          corpus.topFace = decorColorsMap[value];
          render();
        })
      );
      unsubscribeFunctionsArray.push(
        tweakFirstDoor.subscribe((value) => {
          firstDoor.color = decorColorsMap[value];
          render();
        })
      );
      if ($tweak > 1) {
        unsubscribeFunctionsArray.push(
          tweakSecondDoor.subscribe((value) => {
            secondDoor.color = decorColorsMap[value];
            render();
          })
        );
      }
      if ($tweak > 2) {
        unsubscribeFunctionsArray.push(
          tweakThirdDoor.subscribe((value) => {
            thirdDoor.color = decorColorsMap[value];
            render();
          })
        );
      }
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
<div />

<style>
  svg {
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

    color: #998466;
    z-index: 1000000;
  }
</style>
