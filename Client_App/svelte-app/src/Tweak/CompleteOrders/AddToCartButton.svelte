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
  import { calcPrice } from "./calcPrice";
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
      numberOfDoors: $tweak,
    };

    if ($authUser) {
      //If the user is authorized

      const inBasketRef = ref(database, "website/" + $userId + "/inBasket");
      const newEntryRef = push(inBasketRef);
      set(newEntryRef, newEntry);
      console.log(newEntry);
      console.log(newEntry.key);
      let oldCount = $user.totalCount;
      writeToDatabase(
        "website/" + $userId + "/totalCount",
        oldCount + newEntry.count
      );
      writeToDatabase(
        "website/" +
          $userId +
          "/inBasket/" +
          newEntryRef.key +
          "/pricePerUnit/",
        calcPrice(
          $tweakSelectedHeight,
          $tweakSelectedWidth,
          $tweakSelectedDepth,
          $tweakSelectedCount
        )
      );
      let oldPrice = $user.totalPrice;
      writeToDatabase(
        "website/" + $userId + "/totalPrice",
        Number(
          (
            oldPrice +
            $user.inBasket[newEntryRef.key].pricePerUnit * newEntry.count
          ).toFixed(2)
        )
      );
    } else {
      // If the user is not authorized
      newEntry.pricePerUnit = calcPrice();
      $user.inBasket.push(newEntry);
      $user.totalCount += newEntry.count;
      $user.totalPrice = Number(($user.totalPrice + calcPrice()).toFixed(2));
      $user = $user;
    }

    // window.location.replace("/");
  }
  console.log(tweakSelectedDepth);
</script>

<Button
  on:click={addToCart}
  color="danger"
  style="background-color:rgb(119, 0, 0);">Добави в количка</Button
>
