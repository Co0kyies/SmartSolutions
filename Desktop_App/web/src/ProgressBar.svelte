<script>
  export let percentage;
  export let width;
  export let height;
  export let color;
  let bar;
</script>

<div class="bar" style="height:{height}; width:{width}">
  <div
    class="sub-bar"
    style="background-color: {color}; width: {percentage}%"
  />
</div>

<style>
  .bar {
    position: relative;
    border: solid black 1px;
    border-radius: 8px;
  }
  .sub-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: inherit;
  }
</style>
