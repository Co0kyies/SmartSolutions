<script>
  import { Route } from "tinro";

  import { database, auth } from "./firebase";
  import { debugErrorMap, onAuthStateChanged, signOut } from "firebase/auth";
  import { ref, onValue } from "firebase/database";

  import Header from "./Header.svelte";
  import Catalog from "./Catalog.svelte";
  import Tweak from "./Tweak.svelte";
  import Footer from "./Footer.svelte";
  import LoginRegister from "./LoginRegister.svelte";

  import { user, authUser, userId } from "./store";

  import { detach_before_dev } from "svelte/internal";

  let defalutUserObj = {
    email: "Зареждане...",
    totalCount: 0,
    totalPrice: 0,
  };
  $user = defalutUserObj;

  onAuthStateChanged(auth, (userA) => {
    if (userA) {
      startListeningToRealTimeDB(database, userA.uid);
      $userId = userA.uid;
      $authUser = 1;
    } else {
      $user = defalutUserObj;
    }
  });

  function startListeningToRealTimeDB(database, userId) {
    const starCountRef = ref(database, "/website/" + userId);
    onValue(starCountRef, (snapshot) => {
      $user = snapshot.val();
      user.subscribe((value) => {});
    });
  }

  function userSignOut() {
    signOut(auth)
      .then(() => {
        $user = defalutUserObj;
        $authUser = 0;
      })
      .catch((error) => {
        console.log(error);
      });
  }
</script>

<Route>
  <Route path="/">
    <Header on:userSignOut={userSignOut} />
    <Catalog />
    <!-- <Tweak /> -->
    <Footer />
  </Route>
  <Route path="tweak">
    <Header on:userSignOut={userSignOut} />
    <Tweak />
    <Footer />
  </Route>
  <Route path="/login">
    <LoginRegister menu="login" />
  </Route>
  <Route path="/register">
    <LoginRegister menu="register" />
  </Route>
  <Route path="/cart">
    <h1>SHOPPING CART</h1>
  </Route>
</Route>
