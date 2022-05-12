<script>
  import { Modal, ModalBody, ModalHeader, Button } from "sveltestrap";
  import { user } from "./store";
</script>

<footer>
  <span class="count-items-in-cart">Брой артикули: {$user.totalCount} </span>
  <span class="total-price">Обща цена: {$user.totalPrice} лв. </span>
  <a href="/cart"><Button secondary>Към Оферта</Button></a>
</footer>

<style>
  footer {
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 6rem;
    background-color: white;
    display: flex;
    align-items: center;
  }
  .count-items-in-cart {
    position: absolute;
    right: 35rem;
  }
  .total-price {
    position: absolute;
    right: 20rem;
  }
  a {
    position: absolute;
    right: 1.8rem;
  }
</style>
