<script>
  import InfoModal from "./InfoModal.svelte";

  let modal = false;
</script>

<div style="z-index: 10000;">
  <button
    on:click={() => {
      modal = !modal;
    }}>!</button
  >

  {#if modal}
    <InfoModal />
  {/if}
</div>

<style>
  button {
    position: absolute;
    top: 2rem;
    right: 4rem;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: rgb(153, 153, 153);
    border: 0;
    color: white;
    font-weight: 900;
    font-size: 1.8rem;
    -webkit-box-shadow: 5px 10px 30px 2px rgba(0, 0, 0, 0.33);
    box-shadow: 5px 10px 30px 2px rgba(0, 0, 0, 0.33);
  }
  button:hover {
    background-color: rgb(114, 114, 114);
  }
  .custom-modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 60%;
    background-color: rgba(46, 46, 46, 0.74);
    color: rgb(211, 211, 211);
  }
</style>
