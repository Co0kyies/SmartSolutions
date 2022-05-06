<script>
  import { getDatabase, ref, child, get, set } from "firebase/database";
  import { allMonthsArray } from "./store";
  import Loader from "./Loader.svelte";
  import LineChart from "./LineChart.svelte";

  // async function name(params) {
  //   let data = { labels: [] };
  //   let dataset1 = {
  //     label: "aura 1 врата",
  //     data: [],
  //     borderWidth: 1,
  //     backgroundColor: "rgba(255, 192, 203, 0.2);",
  //     borderColor: "red",
  //   };
  //   let dataset2 = {
  //     label: "aura 2 врати",
  //     data: [],
  //     borderWidth: 1,
  //     backgroundColor: "rgba(173, 216, 230, 0.2);",
  //     borderColor: "blue",
  //   };
  //   let dataset3 = {
  //     label: "aura 3 врати",
  //     data: [],
  //     borderWidth: 1,
  //     backgroundColor: "rgba(144, 238, 144, 0.2);",
  //     borderColor: "green",
  //   };
  //   const dbRef = ref(getDatabase());
  //   for (let index = 0; index < allMonthsArray.length; index++) {
  //     console.log("Here we go");
  //     const month = allMonthsArray[index];
  //     const snapshot = await get(child(dbRef, `/OrderKeys/${month}`));
  //     if (snapshot.val() != null) {
  //       let newDataEntry1 = 0;
  //       let newDataEntry2 = 0;
  //       let newDataEntry3 = 0;
  //       data.labels.push(month);
  //       for (let index = 0; index < snapshot.val().length; index++) {
  //         const orderKey = snapshot.val()[index];
  //         const orderItems = await get(
  //           child(dbRef, `allOrders/${orderKey}/items`)
  //         );
  //         for (let index = 0; index < orderItems.val().length; index++) {
  //           const itemKey = orderItems.val()[index];
  //           const model = await get(child(dbRef, `items/${itemKey}/model`));
  //           const modelVal = model.val();
  //           if (modelVal == "aura 1 врата") {
  //             newDataEntry1 += 1;
  //           }
  //           if (modelVal == "aura 2 врата") {
  //             newDataEntry2 += 1;
  //           }
  //           if (modelVal == "aura 3 врата") {
  //             newDataEntry3 += 1;
  //           }
  //         }
  //       }
  //       dataset1.data.push(newDataEntry1);
  //       dataset2.data.push(newDataEntry2);
  //       dataset3.data.push(newDataEntry3);
  //     }
  //   }
  //   data.datasets = [dataset1, dataset2, dataset3];
  //   console.log(data);
  //   set(ref(getDatabase(), "BI/salesPerModel/"), data);
  //   // chartData = {
  //   //   labels: months,
  //   //   datasets: [
  //   //     {
  //   //       label: "Всички поръчки",
  //   //       data: data,
  //   //       backgroundColor: [
  //   //         "rgba(255, 99, 132, 0.2)",
  //   //         "rgba(255, 159, 64, 0.2)",
  //   //         "rgba(255, 205, 86, 0.2)",
  //   //       ],
  //   //       borderColor: [
  //   //         "rgb(255, 99, 132)",
  //   //         "rgb(255, 159, 64)",
  //   //         "rgb(255, 205, 86)",
  //   //       ],
  //   //       borderWidht: 1,
  //   //     },
  //   //   ],
  //   // };
  //   // set(ref(dbRef, "BI/AllSalesBar"), chartData);
  // }
</script>

{#await get(child(ref(getDatabase()), "BI/salesPerModel"))}
  <Loader />
{:then snapshot}
  <LineChart data={snapshot.val()} />
{/await}

<style>
  body {
    background-color: rgba(144, 238, 144, 0.2);
  }
</style>
