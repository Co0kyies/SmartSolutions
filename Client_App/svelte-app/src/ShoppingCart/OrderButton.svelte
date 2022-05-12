<script>
  import { user, authUser, userId, pricePerCubic } from "../store";
  import { database, writeToDatabase } from "../firebase";
  import { ref, push, set, get, getDatabase, child } from "firebase/database";
  import { orderFunction } from "./orderFunction";

  import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "sveltestrap";
  import SizesMenu from "../Tweak/SizesMenu.svelte";
  let open = false;
  let cities = [
    "Благоевград",
    "Бургас",
    "Варна",
    "Велико Търново",
    "Видин",
    "Враца",
    "Габрово",
    "Добрич",
    "Кърджали",
    "Ловеч",
    "Монтана",
    "Пазарджик",
    "Перник",
    "Плевен",
    "Пловдив",
    "Разграад",
    "Русе",
    "Силистра",
    "София",
    "Смолян",
    "Сливен",
    "Стара Загора",
    "Хасково",
    "Шумен",
    "Ямбол",
  ];
  let exampleAdresses = [
    "Ул Стефан Караджа 8",
    "Ул Васил Левски 23",
    "Ул Генерал Мутафчийски 4",
    "Ул Гео Милев 5",
    "Ул Васил Левски 4",
    "Ул Централна Гара",
    "Ул Димчо Дебелянов 3",
    "Ул Любен Каравелов 38",
    "Ул Стражарин 25",
    "Ул Георги Господинов 32",
    "Ул Фънки Войвода",
  ];
  const monthMap = {
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
  let adress;
  let city;
  const toggle = () => (open = !open);

  function makeAnOrder(
    simulate = false,
    customInBasket,
    customTotalPrice,
    customDate,
    customCity,
    customAdress
  ) {
    if ($authUser) {
      // Make an Order
      let order;
      let allOrdersRef = ref(database, "allOrders/");
      let newOrderRef = push(allOrdersRef);
      let orderId = newOrderRef.key;

      function makeAnOrderAndAddToDatabase() {
        if (simulate) {
          order = {
            city: customCity,
            dateOrdered: customDate,
            totalPrice: customTotalPrice,
            userID: $userId,
            adress: customAdress,
          };
        } else {
          console.log(city);
          order = {
            city: city,
            dateOrdered: `${new Date().getDate()}-${
              new Date().getMonth() + 1
            }-${new Date().getFullYear()}`,
            totalPrice: $user.totalPrice,
            userID: $userId,
            adress: adress,
          };
        }

        allOrdersRef = ref(database, "allOrders/");
        newOrderRef = push(allOrdersRef);
        orderId = newOrderRef.key;
        set(newOrderRef, order);
      }
      makeAnOrderAndAddToDatabase();
      //
      //

      //
      function makeOrderKey() {
        let dateOrdered = order.dateOrdered;
        let monthIndex = "";
        let iritatingTroughMonths = false;
        //Collection the index of the month
        for (let index = 0; index < dateOrdered.length; index++) {
          if (iritatingTroughMonths) {
            if (dateOrdered[index] == "-") {
              break;
            } else {
              monthIndex += dateOrdered[index];
            }
          } else {
            if (dateOrdered[index] == "-") {
              iritatingTroughMonths = true;
            }
          }
        }
        //Maping to the month
        let month = monthMap[monthIndex];
        console.log(monthIndex, month);
        let dbRef = ref(getDatabase());
        get(child(dbRef, `orderKeys/${month}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              let arrayOfKeys = snapshot.val();
              arrayOfKeys.push(orderId);
              writeToDatabase(`orderKeys/${month}`, arrayOfKeys);
            } else {
              writeToDatabase(`orderKeys/${month}`, [orderId]);
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }
      makeOrderKey();
      //Make an Item
      let inBasketKeys;
      if (simulate) {
        inBasketKeys = Object.keys(customInBasket);
      } else {
        inBasketKeys = Object.keys($user.inBasket);
      }
      let itemKeys = [];
      function makeItemsInDB() {
        for (let i = 0; i < inBasketKeys.length; i++) {
          const key = inBasketKeys[i];
          let item;
          if (simulate) {
            item = customInBasket[key];
          } else {
            item = $user.inBasket[key];
          }
          //Calculating the materials Needed
          const kgPerSquare = 10;
          const pageDepth = 1.8;
          let materials = [];
          let totalWeight = 0;
          let cubicMeters = 0;

          function calcMaterial(page, door, totalDoors) {
            let map = {
              sides: {
                x: "depth",
                y: "height",
                decor: "mainDecor",
                holesSides: ["x1", "x2", "y1", "y2"],
              },
              top: {
                x: "widht",
                y: "depth",
                decor: "mainDecor",
                holesSides: ["x2", "y1", "y2"],
              },
              back: {
                x: "widht",
                y: "height",
                decor: "mainDecor",
                holesSides: ["x1", "x2", "y1", "y2"],
              },
            };
            let side = {};
            if (page == "door") {
              side["y"] = item.height;
              side["x"] = item.widht / totalDoors;
              side["holes"] = [];
              function pushHolesLeftDoor() {
                side.holes.push(
                  [3.5, 10],
                  [3.5, 15],
                  [3.5, side.y - 15],
                  [3.5, side.y - 10]
                );
              }
              function pushHolesRightDoor(params) {
                let x = side.x - 3.5;
                let heigh = side.y;
                side.holes.push(
                  [x, 10],
                  [x, 15],
                  [x, heigh - 15],
                  [x, heigh - 10]
                );
              }
              if (door == 1) {
                side["decor"] = item.firstDoor;
                pushHolesLeftDoor();
              }
              if (door == 2) {
                side["decor"] = item.secondDoor;
                pushHolesLeftDoor();
                pushHolesRightDoor();
              }
              if (door == 3) {
                side["decor"] = item.thirdDoor;
                pushHolesLeftDoor();
                pushHolesRightDoor();
                pushHolesRightDoor();
              }
            } else {
              side["x"] = item[map[page]["x"]];
              side["y"] = item[map[page]["y"]];
              side["decor"] = item.mainDecor;
              side["holes"] = [];
              //Make the wholes

              for (let i = 0; i < map[page].holesSides.length; i++) {
                let a = map[page].holesSides[i];
                let holes = side["holes"];
                if (a == "x1") {
                  holes.push([10, 3.5], [15, 3.5]);
                  holes.push([side["x"] - 15, 3.5], [side["x"] - 10, 3.5]);
                  if (side.x > 180) {
                    holes.push(
                      [side.x / 2 + 2.5, 3.5],
                      [side.x / 2 - 2.5, 3.5]
                    );
                  }
                }
                if (a == "x2") {
                  holes.push([10, side.y - 3.5], [15, side.y - 3.5]);
                  holes.push(
                    [side["x"] - 15, side.y - 3.5],
                    [side["x"] - 10, side.y - 3.5]
                  );
                  if (side.x > 180) {
                    holes.push(
                      [side.x / 2 + 2.5, side.y - 3.5],
                      [side.x / 2 - 2.5, side.y - 3.5]
                    );
                  }
                }
                if (a == "y1") {
                  holes.push([3.5, 10], [3.5, 15]);
                  holes.push([3.5, side.y - 15], [3.5, side.y - 10]);
                  if (side.y > 180) {
                    holes.push(
                      [3.5, side.y / 2 + 2.5],
                      [3.5, side.y / 2 - 2.5]
                    );
                  }
                }
                if (a == "y2") {
                  holes.push([side.x - 3.5, 10], [side.x - 3.5, 15]);
                  holes.push(
                    [side.x - 3.5, side.y - 15],
                    [side.x - 3.5, side.y - 10]
                  );
                  if (side.y > 180) {
                    holes.push(
                      [side.x - 3.5, side.y / 2 + 2.5],
                      [side.x - 3.5, side.y / 2 - 2.5]
                    );
                  }
                }
              }
            }

            materials.push(side);
            let sideSquareMeters = (side["x"] * side["y"]) / 10000;
            cubicMeters += (side["x"] * side["y"] * pageDepth) / 1000000;
            totalWeight += sideSquareMeters * kgPerSquare;
          }

          //The Sides
          for (let i = 0; i < 2; i++) {
            calcMaterial("sides");
          }
          //Top & Bottom
          for (let i = 0; i < 2; i++) {
            calcMaterial("top");
          }
          //Back
          calcMaterial("back");
          //Doors
          for (let i = 0; i < item.numberOfDoors; i++) {
            calcMaterial("door", i + 1, item.numberOfDoors);
          }

          for (let i = 0; i < item.count; i++) {
            let newItem = {
              materials: materials,
              cubicMeters: cubicMeters,
              totalWeight: totalWeight,
              height: item.height,
              width: item.widht,
              depth: item.depth,
              mainDecor: item.mainDecor,
              firstDoor: item.firstDoor,
              secondDoor: item.secondDoor,
              thirdDoor: item.thirdDoor,
              model: item.model,
              numberOfDoors: item.numberOfDoors,
            };

            const itemsDBRef = ref(database, "items");
            const newItemRef = push(itemsDBRef);
            itemKeys.push(newItemRef.key);
            set(newItemRef, newItem)
              .then(connectItemsWithOrders)
              .then(() => {
                addToRoutes();
              });
          }
        }
      }
      makeItemsInDB();

      let orderTotalWeight = 0;
      let orderCubicMeters = 0;
      function connectItemsWithOrders() {
        writeToDatabase("allOrders/" + orderId + "/items", itemKeys);
        writeToDatabase(
          "allOrders/" + orderId + "/itemsCount",
          itemKeys.length
        );
        const dbRef = ref(getDatabase());

        //Updating ItemKeys
        //Useless

        // function updateItemKeys(params) {
        // get(child(dbRef, "itemKeys"))
        // .then((snapshot) => {
        //   if (snapshot.exists()) {
        //     let currentKeys = snapshot.val();
        //     for (let index = 0; index < itemKeys.length; index++) {
        //       currentKeys.push(itemKeys[index]);
        //     }
        //     writeToDatabase(`itemKeys`, currentKeys);
        //   } else {
        //     writeToDatabase(`itemKeys`, itemKeys);
        //   }
        // })
        // .catch((error) => {
        //   console.log(error);
        // });
        // }
        //
        for (let i = 0; i < itemKeys.length; i++) {
          let itemId = itemKeys[i];
          get(child(dbRef, `items/${itemId}`))
            .then((snapshot) => {
              if (snapshot.exists()) {
                orderTotalWeight += snapshot.val().totalWeight;
                orderCubicMeters += snapshot.val().cubicMeters;
                if (i + 1 == itemKeys.length) {
                  writeToDatabase(
                    `allOrders/${orderId}/cubicMeters`,
                    orderCubicMeters
                  );
                  writeToDatabase(
                    `allOrders/${orderId}/totalWeight`,
                    orderTotalWeight
                  );
                }
              } else {
                console.log("No data available");
              }
            })
            .catch((error) => {
              console.error(error);
            });
        }
      }
      //
      //
      //
      //
      //
      //Make Routes
      if (simulate == true) {
        city = customCity;
      }

      const maxWeight = 5000;
      const maxCubicMeters = 800;
      function addToRoutes() {
        function createNewRoute(routeLenght) {
          function calcDateToShippment() {
            if (simulate) {
              let day = 0;
              let month = 0;
              let i = 0;
              while (true) {
                if (customDate[i] == "-") {
                  i++;
                  break;
                }
                day += customDate[i];
                i++;
              }
              while (true) {
                if (customDate[i] == "-") {
                  i++;
                  break;
                }
                month += customDate[i];
                i++;
              }
              if ((month = 1 && day > 28)) {
                return "2-28-2022";
              } else return `${day + 1}-${month + 1}-2022`;
            } else {
              return `${new Date().getDate() - 1}-${
                new Date().getMonth() + 2
              }-${new Date().getFullYear()}`;
            }
          }
          let newRoute = {
            maxCubicMeters: maxCubicMeters,
            maxWeight: maxWeight,
            cubicMeters: orderCubicMeters,
            totalWeight: orderTotalWeight,
            orders: [orderId],
            dateToShippment: calcDateToShippment(),
          };
          writeToDatabase(`routes/${city}/${routeLenght}`, newRoute);
        }

        const dbRef = ref(getDatabase());
        get(child(dbRef, `routes/${city}`)).then((snapshot) => {
          if (snapshot.exists()) {
            const snapshotVal = snapshot.val();
            const routeLenght = snapshotVal.length;
            const route = snapshotVal[routeLenght - 1];
            if (route) {
              if (
                route.totalWeight + orderTotalWeight > maxWeight ||
                route.cubicMeters + orderCubicMeters > maxCubicMeters
              ) {
                //Creating new order
                createNewRoute(routeLenght);
              } else {
                //Add the Order
                let orders = route.orders;
                orders.push(orderId);
                writeToDatabase(
                  `routes/${city}/${routeLenght - 1}/orders`,
                  orders
                );

                //Update Weight
                writeToDatabase(
                  `routes/${city}/${routeLenght - 1}/totalWeight`,
                  route.totalWeight + orderTotalWeight
                );
                //Update Cubic
                writeToDatabase(
                  `routes/${city}/${routeLenght - 1}/cubicMeters`,
                  route.cubicMeters + orderCubicMeters
                );
              }
              //OR
            }
          } else {
            createNewRoute(0);
          }
        });
      }
      function removeElementsFromeCart() {
        writeToDatabase(`website/${$userId}/inBasket`, null);
      }
      removeElementsFromeCart();
    } else {
      alert("Само регистрираните потребители могат да правят поръчки");
    }
    toggle();
  }
  function simulateOrder() {
    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }
    function generateOrder(month, day) {
      let customInBasket = {};
      let itemsOrderedTotalCount = getRandomInt(5, 20);
      let itemsOrderedCount = [];
      while (itemsOrderedTotalCount > 0) {
        let newItemCount;
        if (itemsOrderedTotalCount > 15) {
          newItemCount = getRandomInt(1, 15);
        } else {
          newItemCount = itemsOrderedTotalCount;
        }
        itemsOrderedTotalCount -= newItemCount;
        itemsOrderedCount.push(newItemCount);
      }

      for (const key in itemsOrderedCount) {
        if (Object.hasOwnProperty.call(itemsOrderedCount, key)) {
          customInBasket[key] = {
            count: itemsOrderedCount[key],
          };
          let numberOfDoors = getRandomInt(1, 4);
          let model;
          if (numberOfDoors == 1) {
            customInBasket[key].model = "aura 1 врата";
          } else {
            customInBasket[key].model = `aura ${numberOfDoors} врати`;
          }
          customInBasket[key].numberOfDoors = numberOfDoors;

          let decors = ["H3331", "H1401ST22", "U960ST9"];
          customInBasket[key].mainDecor = decors[getRandomInt(0, 3)];
          customInBasket[key].firstDoor = decors[getRandomInt(0, 3)];
          customInBasket[key].secondDoor = decors[getRandomInt(0, 3)];
          customInBasket[key].thirdDoor = decors[getRandomInt(0, 3)];
        }
        let siezesForDifferentModels = {
          1: [
            [40, 55],
            [50, 60],
            [170, 250],
          ],
          2: [
            [80, 110],
            [50, 60],
            [170, 250],
          ],
          3: [
            [120, 165],
            [50, 60],
            [170, 250],
          ],
        };
        let itemSizes =
          siezesForDifferentModels[customInBasket[key].numberOfDoors];
        let widht = getRandomInt(itemSizes[0][0], itemSizes[0][1] + 1);
        let depth = getRandomInt(itemSizes[1][0], itemSizes[1][1] + 1);
        let height = getRandomInt(itemSizes[2][0], itemSizes[2][1] + 1);

        customInBasket[key].pricePerUnit = Number(
          (widht * depth * height * $pricePerCubic).toFixed(2)
        );
        customInBasket[key].widht = widht;
        customInBasket[key].depth = depth;
        customInBasket[key].height = height;
      }
      let customTotalPrice = 0;
      for (const key in customInBasket) {
        if (Object.hasOwnProperty.call(customInBasket, key)) {
          let item = customInBasket[key];
          customTotalPrice += Number(
            (item.count * item.pricePerUnit).toFixed(2)
          );
        }
      }

      customTotalPrice = String(customTotalPrice);
      let a = false;
      let charsAfterDot = 0;
      for (let char = 0; char < customTotalPrice.length; char++) {
        if (customTotalPrice[char] == ".") {
          a = true;
        } else {
          if (a == true) {
            charsAfterDot++;
          }
        }
      }
      if (charsAfterDot > 2) {
        customTotalPrice = Math.floor(Number(customTotalPrice));
      } else {
        customTotalPrice = Number(customTotalPrice);
      }

      let customCity = cities[getRandomInt(0, cities.length)];
      let customAdress =
        exampleAdresses[getRandomInt(0, exampleAdresses.length)];

      let customDate = `${day}-${month}-2022`;
      //   let customInBasket = {
      //     akfjas: {
      //       model: "aura 1 врата",
      //       widht: 80,
      //       depth: 50,
      //       heigh: 170,
      //       mainDecor: "H3331",
      //       firstDoor: "H3331",
      //       secondDoor: "H3331",
      //       thirdDoor: "H3331",
      //       count: 2,
      //       numberOfDoors: 3,
      //     },
      //   };
      //   let customTotalPrice = 2000;
      //   let customCity = "Русе";
      //   let customDate = "01-01-2021";
      //   let customAdress = "Стефан Караджа 8";
      console.log(
        customInBasket,
        customTotalPrice,
        customDate,
        customCity,
        customAdress
      );
      makeAnOrder(
        true,
        customInBasket,
        customTotalPrice,
        customDate,
        customCity,
        customAdress
      );
    }
    let irritation = 1;
    for (let month = 1; month < 4; month++) {
      if (month == 2) {
        for (let day = 1; day < 29; day++) {
          irritation++;
          // setTimeout(generateOrder.bind(month, day), 3000 * irritation);
          function functionParser() {
            let scopedDay = day;
            let scopedMonth = month;
            function functionParsed() {
              // generateOrder(day, month);
              generateOrder(scopedMonth, scopedDay);
            }
            return functionParsed;
          }
          let functionParsed = functionParser();

          setTimeout(functionParsed, 6000 * irritation);
        }
      } else {
        for (let day = 1; day < 32; day++) {
          irritation++;
          // setTimeout(generateOrder.bind(month, day), 3000 * irritation);
          function functionParser() {
            let scopedDay = day;
            let scopedMonth = month;
            function functionParsed() {
              // generateOrder(day, month);
              generateOrder(scopedMonth, scopedDay);
            }
            return functionParsed;
          }
          let functionParsed = functionParser();

          setTimeout(functionParsed, 6000 * irritation);
        }
      }
    }
    // generateOrder(3, 6);
  }
  function deleteAllDatabase() {
    writeToDatabase("allOrders", null);
    writeToDatabase("items", null);
    writeToDatabase("routes", null);
    writeToDatabase("itemKeys", null);
    writeToDatabase("orderKeys", null);
  }
</script>

<div>
  <button class="btn btn-danger" on:click={toggle}>Направете поръчка</button>
  <Modal isOpen={open} {toggle}>
    <ModalHeader>Завършете Поръчката</ModalHeader>
    <ModalBody>
      <div class="option">
        <span>Град: </span><select bind:value={city}>
          {#each cities as city}
            <option value={city}>{city}</option>
          {/each}
        </select>
      </div>
      <div class="option">
        <span>Адрес: </span> <input bind:value={adress} type="text" />
      </div>
      <strong>Цена: {$user.totalPrice} лв.</strong>
    </ModalBody>
    <ModalFooter>
      <Button
        color="success"
        on:click={() => {
          makeAnOrder(false);
        }}>Завърши поръчка</Button
      >
      <Button color="secondary" on:click={toggle}>Отмени</Button>
    </ModalFooter>
  </Modal>
</div>

<style>
  button {
    position: absolute;
    right: 1.5rem;
    z-index: 3;
  }
  .option {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
</style>
