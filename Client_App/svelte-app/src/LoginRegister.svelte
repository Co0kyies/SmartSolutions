<script>
  export let menu;
  import { Icon, Button } from "sveltestrap";
  import { auth, database } from "./firebase";
  import { signInWithEmailAndPassword } from "firebase/auth";
  import { ref, onValue } from "firebase/database";
  import { user, authUser } from "./store";

  let conditions = {
    login: {
      text: "Вход",
      func: function login(auth, email, password) {
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            // Signed in
            debugger;
            // Simulate an HTTP redirect:
            window.location.replace("/");
            // ...
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
          });
      },
    },
    register: { text: "Регистрация", func: function () {} },
  };

  let email;
  let password;
  let userVal;
  userVal = user.subscribe((value) => {
    userVal = value;
  });
</script>

<main>
  <a id="home-button" href="/">Return Home</a>
  <div id="icon">
    <Icon name="person-circle" />
  </div>
  <h1>{conditions[menu].text}</h1>
  <!-- {#if menu == "register"}
    <div>
      <h2>Име:</h2>
      <input bind:value={userName} type="text" />
    </div>
  {/if} -->
  <div>
    <h2>Е-Мейл:</h2>
    <input bind:value={email} type="text" />
  </div>
  <div>
    <h2>Парола:</h2>
    <input bind:value={password} type="text" />
  </div>
  {#if menu == "login"}
    <a href="/register">Регистрация</a>
  {:else}
    <a href="/login"> Вход</a>
  {/if}
  <Button
    color="danger"
    class="mt-3"
    on:click={conditions.login.func(auth, email, password)}
    >{conditions[menu].text}</Button
  >
</main>

<style>
  #home-button {
    position: absolute;
    display: block;
    top: 4rem;
    left: 4rem;
  }
  main {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    transform: translateY(-7%);
  }
  main #icon {
    display: block;
    font-size: 10rem;
  }
  main h1 {
    position: relative;
  }
  main a {
    position: relative;
    transform: translateX(-50%);
  }
</style>
