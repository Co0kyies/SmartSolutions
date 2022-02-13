// import { itemsDB } from "./exampleItemsDB";
export function salesBar(itemsDB) {
  let model1 = 0;
  let model2 = 0;
  let model3 = 0;
  for (const item in itemsDB) {
    if (Object.hasOwnProperty.call(itemsDB, item)) {
      let currentItem = itemsDB[item];
      let model = currentItem.model;
      if (model == "aura 1 врата") {
        model1++;
      }
      if (model == "aura 2 врати") {
        model2++;
      }
      if (model == "aura 3 врати") {
        model3++;
      }
    }
  }
  return {
    labels: ["aura 1 врата", ["aura 2 врати"], ["aura 3 врати"]],
    datasets: [
      {
        label: "Общи продажби",
        data: [model1, model2, model3],
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgb(255, 99, 132)",
          "rgb(75, 192, 192)",
          "rgb(54, 162, 235)",
        ],
        borderWidth: 1,
      },
    ],
  };
}
