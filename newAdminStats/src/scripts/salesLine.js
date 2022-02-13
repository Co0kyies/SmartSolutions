// import { ordersDB } from "./exampleOrdersDB";

export function salesLine(ordersDB, itemsDB) {
  //Now working only for January, February, March
  let monthsMap = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };
  let January = [];
  let February = [];
  let March = [];
  let April = [];
  let May = [];
  let June = [];
  let July = [];
  let August = [];
  let September = [];
  let October = [];
  let November = [];
  let December = [];

  let months = [
    January,
    February,
    March,
    April,
    May,
    June,
    July,
    August,
    September,
    October,
    November,
    December,
  ];

  let labels = [];
  let datasets = [];
  for (const order in ordersDB) {
    let dataOrdered = ordersDB[order].dateOrdered;
    function getDate(dateOrdered) {
      let monthIndex = "";
      let dayRemoved = false;
      for (let char = 0; char < dateOrdered.length; char++) {
        if (!dayRemoved) {
          if (dateOrdered[char] == "-") {
            dayRemoved = true;
          }
        } else {
          if (dateOrdered[char] == "-") {
            return monthIndex;
          } else {
            monthIndex += dateOrdered[char];
          }
        }
      }
    }
    let monthIndex = getDate(dataOrdered);
    let currentMonth;
    {
      if (monthIndex == 1) {
        currentMonth = January;
      }
      if (monthIndex == 2) {
        currentMonth = February;
      }
      if (monthIndex == 3) {
        currentMonth = March;
      }
      if (monthIndex == 4) {
        currentMonth = April;
      }
      if (monthIndex == 5) {
        currentMonth = May;
      }
      if (monthIndex == 6) {
        currentMonth = June;
      }
      if (monthIndex == 7) {
        currentMonth = July;
      }
      if (monthIndex == 8) {
        currentMonth = August;
      }
      if (monthIndex == 9) {
        currentMonth = September;
      }
      if (monthIndex == 10) {
        currentMonth = October;
      }
      if (monthIndex == 11) {
        currentMonth = November;
      }
      if (monthIndex == 12) {
        currentMonth = December;
      }
    }
    for (let index = 0; index < ordersDB[order].items.length; index++) {
      let itemKey = ordersDB[order].items[index];
      currentMonth.push(itemKey);
    }
  }
  let modelsColorsMap = {
    "aura 1 врата": "#0084ff",
    "aura 2 врати": "#dc143c",
    "aura 3 врати": "#adff2f",
  };

  Object.keys(modelsColorsMap).forEach((model) => {
    let data = [];
    let iriteration = 0;
    months.forEach((month) => {
      if (month.length > 0) {
        let count = 0;
        month.forEach((itemKey) => {
          if (itemsDB[itemKey].model == model) {
            count++;
          }
        });
        data.push(count);
        iriteration++;
      }
    });
    let dataset = {
      label: model,
      data: data,
      borderColor: modelsColorsMap[model],
    };
    datasets.push(dataset);
  });
  for (let index = 0; index < months.length; index++) {
    if (months[index].length > 0) {
      labels.push(monthsMap[index + 1]);
    }
  }

  return {
    labels: labels,
    datasets: datasets,
  };
}
