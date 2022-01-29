<script>
  import {
    user,
    authUser,
    userId,
    tweak,
    tweakSelectedHeight,
    tweakSelectedWidth,
    tweakSelectedDepth,
    tweakMainDecor,
    tweakFirstDoor,
    tweakSecondDoor,
    tweakThirdDoor,
    tweakSelectedCount,
  } from "../../store";
  import { ref, push, set } from "firebase/database";
  import { writeToDatabase, database } from "../../firebase";
  import { Button } from "sveltestrap";
  function addToCart() {
    const newEntry = {
      model: "aura " + $tweak + ($tweak == 1 ? " врата" : " врати"),
      height: $tweakSelectedHeight,
      widht: $tweakSelectedWidth,
      depth: $tweakSelectedDepth,
      mainDecor: $tweakMainDecor,
      firstDoor: $tweakFirstDoor,
      secondDoor: $tweakSecondDoor,
      thirdDoor: $tweakThirdDoor,
      count: $tweakSelectedCount,
    };
    if ($authUser) {
      //If the user is authorized

      const inBasketRef = ref(database, "website/" + $userId + "/inBasket");
      const newEntryRef = push(inBasketRef);
      set(newEntryRef, newEntry);
      console.log($user);
    } else {
      //If the user is not authorized
      $user.inBasket.push(newEntry);
      console.log($user);
    }
  }
</script>

<Button
  on:click={addToCart}
  color="danger"
  style="background-color:rgb(119, 0, 0);">Добави в количка</Button
>
