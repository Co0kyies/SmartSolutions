<script>
  import { app } from "./firebase";
  import { getDatabase, ref, onValue } from "firebase/database";
  import { smartStorage } from "./store";

  const db = getDatabase(app);
  const starCountRef = ref(db, "smartStorage");
  onValue(starCountRef, (snapshot) => {
    $smartStorage = snapshot.val();
  });
</script>
