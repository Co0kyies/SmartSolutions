<script>
  import Listener from "./Listener.svelte";
</script>

<Listener
  on:valueChange={() => {
    eel.start_arduino();
  }}
  path="/holes"
/>
