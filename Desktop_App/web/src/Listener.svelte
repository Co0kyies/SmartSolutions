<script>
  export let path;
  import { app } from "./firebase";
  import { getDatabase, ref, onValue } from "firebase/database";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  let initiation = true;
  const db = getDatabase(app);
  const starCountRef = ref(db, path);
  onValue(starCountRef, (snapshot) => {
    if (initiation) {
      initiation = false;
    } else {
      dispatch("valueChange", { newValue: snapshot.val() });
    }
  });
</script>
