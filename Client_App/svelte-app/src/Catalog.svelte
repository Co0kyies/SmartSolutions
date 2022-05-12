<script>
  import { user, tweak } from "./store";
  import { writeToDatabase } from "./firebase";
  let array = ["1", "2", "3"];
  function button(doors) {
    $tweak = doors;
  }
</script>

<main>
  <h1>Каталог:</h1>
  <div id="grid">
    <a
      href="tweak"
      on:click={() => {
        button(1);
      }}
    >
      <div class="card">
        <img src="./img/ED_1doors.jpg" alt="" />
        <p>Гардероб с 1 врата</p>
      </div>
    </a>
    <a
      href="tweak"
      on:click={() => {
        button(2);
      }}
    >
      <div class="card">
        <img src="./img/ED_2doors.jpg" alt="" />
        <p>Гардероби с 2 врати</p>
      </div>
    </a>
    <a
      href="tweak"
      on:click={() => {
        button(3);
      }}
    >
      <div class="card">
        <img src="./img/ED_3doors.jpg" alt="" />
        <p>Гардероб с 3 врати</p>
      </div>
    </a>
  </div>
</main>

<style>
  a {
    text-decoration: none;
    color: black;
  }
  a:hover {
    text-decoration: none;
    color: black;
  }
  main {
    min-height: calc(100% - 8rem);
    background-color: grey;
    overflow-y: hidden;
    padding-top: 2rem;
    padding-left: 2rem;
  }
  h1 {
    color: white;
  }
  #grid {
    display: grid;
    grid-template-columns: repeat(3, 15rem);
    grid-gap: 1rem;
  }
  .card {
    width: 100%;
    height: 20rem;
  }
  .card:hover {
    transform: scale(105%);
    transition: 0.3s;
  }
  img {
    width: 100%;
  }
  p {
    margin-top: 0.5rem;
    margin-left: 0.5rem;
    font-weight: 700;
  }
</style>
