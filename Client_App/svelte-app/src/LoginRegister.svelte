<script>
  export let menu;
  import { Icon, Button } from "sveltestrap";
  import { auth, database, writeToDatabase } from "./firebase";
  import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
  } from "firebase/auth";
  import { ref, onValue } from "firebase/database";
  import { user, authUser, userEmail } from "./store";
  import {} from "./firebase";
  let errorMessage;
  let conditions = {
    login: {
      text: "Вход",
      func: function login(auth, email, password) {
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            debugger;
            // Signed in
            // Simulate an HTTP redirect:
            window.location.replace("/");
            // ...
          })
          .catch((error) => {
            errorMessage = error.message;
          });
      },
    },
    register: {
      text: "Регистрация",
      func: function register(auth, email, password) {
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            debugger;
            // Signed in
            const user = userCredential.user;
            console.log(user);
            let valueObj = {
              email: email,
              totalCount: 0,
              totalPrice: 0,
            };
            window.location.replace("/");
            // ...
          })
          .catch((error) => {
            errorMessage = error.message;
            // ..
          });
      },
    },
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
  <div>
    <h2>Е-Мейл:</h2>
    <input bind:value={email} type="text" />
  </div>
  <div>
    <h2>Парола:</h2>
    <input type="password" bind:value={password} />
  </div>

  {#if errorMessage}
    <div class="error">{errorMessage}</div>
  {/if}
  <Button
    color="danger"
    class="mt-3"
    on:click={conditions[menu].func(auth, email, password)}
    >{conditions[menu].text}</Button
  >
  {#if menu == "login"}
    <a href="/register">Регистрация</a>
  {:else}
    <span>Вече имате имате профил?</span>
    <a href="/login"> Вход</a>
  {/if}
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
  main span {
    display: inline-block;
  }
  main a {
    display: inline-block;
    /* position: relative;
    transform: translateX(-50%); */
  }
  .error {
    color: red;
  }
</style>
