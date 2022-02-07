<script>
  import { getDatabase, ref, child, get } from "firebase/database";
  function genreateRoutes() {
    const dbRef = ref(getDatabase());

    get(child(dbRef, `routes/${city}`)).then((snapshot) => {
      if (snapshot.exists()) {
      } else {
      }
    });
  }
</script>

<button class="btn btn-warning">Generate Routes</button>
