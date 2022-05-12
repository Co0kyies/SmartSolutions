<script>
  export let option;
  export let value;
  let card;
</script>

<div>
  <strong>{option}</strong>
  {#if ["H3331", "H1401", "U960ST9"].includes(value)}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <strong
      class="red"
      on:mouseover={() => {
        card = true;
      }}
      on:mouseout={() => {
        card = false;
      }}
      >{value}
      {#if card}
        <div class="my-card">
          <img src="./img/decor_{value}.jpg" alt="" />
        </div>{/if}
    </strong>
  {:else}
    <span>{value}</span>
  {/if}
</div>
<br />

<style>
  div {
    display: flex;
  }
  strong {
    display: block;
    margin-right: 0.5rem;
  }
  .red {
    position: relative;
  }
  .red .my-card {
    position: absolute;
    z-index: 100;
    background-color: white;
    top: 0;
    left: 100%;
    width: 6rem;
    height: 6rem;
    padding: 0.35rem;
  }
  span {
    display: block;
  }
  .red {
    color: rgb(119, 0, 0);
    cursor: pointer;
  }
</style>
