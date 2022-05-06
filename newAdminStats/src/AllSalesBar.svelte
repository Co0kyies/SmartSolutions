<script>
  import BarChart from "./BarChart.svelte";
  import Loader from "./Loader.svelte";
  import { getDatabase, get, ref, child, set } from "firebase/database";

  // async function loadData() {
  //   if ($salesBarData) {
  //     loading = false;
  //   } else {
  //     let months = [];
  //     let data = [];
  //     const dbRef = ref(getDatabase());
  //     for (let index = 0; index < allMonthsArray.length; index++) {
  //       const month = allMonthsArray[index];
  //       const snapshot = await get(child(dbRef, `/OrderKeys/${month}`));
  //       if (snapshot.val() != null) {
  //         months.push(month);
  //         let newDataEntry = 0;
  //         for (let index = 0; index < snapshot.val().length; index++) {
  //           const orderKey = snapshot.val()[index];
  //           const orderItemsCount = await get(
  //             child(dbRef, `allOrders/${orderKey}/itemsCount`)
  //           );
  //           newDataEntry += orderItemsCount.val();
  //         }
  //         data.push(newDataEntry);
  //       }
  //     }
  //     console.log(months);
  //     console.log(data);
  //     chartData = {
  //       labels: months,
  //       datasets: [
  //         {
  //           label: "Всички поръчки",
  //           data: data,
  //           backgroundColor: [
  //             "rgba(255, 99, 132, 0.2)",
  //             "rgba(255, 159, 64, 0.2)",
  //             "rgba(255, 205, 86, 0.2)",
  //           ],
  //           borderColor: [
  //             "rgb(255, 99, 132)",
  //             "rgb(255, 159, 64)",
  //             "rgb(255, 205, 86)",
  //           ],
  //           borderWidht: 1,
  //         },
  //       ],
  //     };
  //     loading = false;
  //     set(ref(dbRef, "BI/AllSalesBar"), chartData);
  //   }
  // }
  // loadData();
</script>

<main>
  {#await get(child(ref(getDatabase()), "BI/allSales"))}
    <Loader />
  {:then snapshot}
    <BarChart data={snapshot.val()} />
  {/await}
</main>

<style>
  main {
    width: 100%;
    height: 100%;
  }
</style>
