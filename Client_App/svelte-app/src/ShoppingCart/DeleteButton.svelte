<script>
  import { user, userId, authUser } from "../store";
  import { Icon } from "sveltestrap";
  import SmallButton from "./SmallButton.svelte";
  import { writeToDatabase } from "../firebase";
  export let key;
  function deleteItem() {
    if ($authUser) {
      writeToDatabase(
        "website/" + $userId + "/totalCount",
        $user.totalCount - $user.inBasket[key].count
      );
      writeToDatabase(
        "website/" + $userId + "/totalPrice",
        Number(
          (
            $user.totalPrice -
            $user.inBasket[key].pricePerUnit * $user.inBasket[key].count
          ).toFixed(2)
        )
      );
      writeToDatabase("website/" + $userId + "/inBasket/" + key, null);
    } else {
      $user.totalCount = $user.totalCount - $user.inBasket[key].count;
      $user.totalPrice = Number(
        (
          $user.totalPrice -
          $user.inBasket[key].pricePerUnit * $user.inBasket[key].count
        ).toFixed(2)
      );
      $user.inBasket.splice(key, 1);
      $user = $user;
    }
  }
</script>

<SmallButton on:click={deleteItem}><Icon name="trash" /></SmallButton>
