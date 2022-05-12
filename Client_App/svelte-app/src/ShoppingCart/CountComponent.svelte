<script>
  import { ref, onValue, off } from "firebase/database";
  import { database, auth, writeToDatabase } from "../firebase";
  import { onAuthStateChanged } from "firebase/auth";
  import { userId, authUser, user } from "../store";

  import SmallButton from "./SmallButton.svelte";
  export let key;

  let count;
  function increase() {
    if ($authUser) {
      writeToDatabase(
        "website/" + $userId + "/inBasket/" + key + "/count",
        $user.inBasket[key].count + 1
      );
      writeToDatabase(
        "website/" + $userId + "/totalCount",
        $user.totalCount + 1
      );

      writeToDatabase(
        "website/" + $userId + "/totalPrice",
        Number(($user.totalPrice + $user.inBasket[key].pricePerUnit).toFixed(2))
      );
    } else {
      $user.inBasket[key].count = $user.inBasket[key].count + 1;
      $user.totalCount = $user.totalCount + 1;
      $user.totalPrice = Number(
        ($user.totalPrice + $user.inBasket[key].pricePerUnit).toFixed(2)
      );
    }
  }

  function decrease() {
    if ($authUser && $user.inBasket[key].count > 1) {
      writeToDatabase(
        "website/" + $userId + "/inBasket/" + key + "/count",
        $user.inBasket[key].count - 1
      );
      writeToDatabase(
        "website/" + $userId + "/totalCount",
        $user.totalCount - 1
      );

      writeToDatabase(
        "website/" + $userId + "/totalPrice",
        Number(($user.totalPrice - $user.inBasket[key].pricePerUnit).toFixed(2))
      );
    } else if ($user.inBasket[key].count > 1) {
      $user.inBasket[key].count = $user.inBasket[key].count - 1;
      $user.totalCount = $user.totalCount - 1;
      $user.totalPrice = Number(
        ($user.totalPrice - $user.inBasket[key].pricePerUnit).toFixed(2)
      );
    }
  }
</script>

<div>
  <SmallButton on:click={increase}>+</SmallButton>
  <SmallButton class="white">{$user.inBasket[key].count}</SmallButton>
  <SmallButton on:click={decrease}>-</SmallButton>
</div>

<style>
  div {
    display: flex;
  }
</style>
