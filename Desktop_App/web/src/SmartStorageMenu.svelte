<script>
  import { smartStorage } from "./store";
</script>

<main>
  <div class="grid mt-5">
    <div class="decor H1401ST22">{$smartStorage["H1401"]}</div>
    <div class="decor H3331">{$smartStorage["H3331"]}</div>
    <div class="decor U960ST9">{$smartStorage["U960ST9"]}</div>
  </div>
</main>

<style>
  main {
    display: flex;
    justify-content: center;
  }
  .grid {
    display: grid;
    grid-template-columns: 400px 400px;
    grid-gap: 10px;
  }
  .decor {
    height: 280px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: rgb(0, 0, 0);
  }
  .H1401ST22 {
    background-image: url("./decors/EG_H1401ST22_Cascina_Pine.jpg");
  }
  .H3331 {
    background-image: url("./decors/NNEB_OAK.jpg");
  }
  .U960ST9 {
    background-image: url("./decors/EG_U960ST9_Onyx_Grey.jpg");
  }
</style>
