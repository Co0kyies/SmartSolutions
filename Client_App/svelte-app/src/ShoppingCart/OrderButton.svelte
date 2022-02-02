<script>
  import { user, authUser, userId } from "../store";
  import { database, writeToDatabase } from "../firebase";
  import { ref, push, set, get, getDatabase, child } from "firebase/database";

  import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "sveltestrap";
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
  let adress;
  let city;
  const toggle = () => (open = !open);
  function makeAnOrder() {
    if ($authUser) {
      // Make an Order
      let order = {
        city: city,
        dateOrdered: `${new Date().getDate()}-${
          new Date().getMonth() + 1
        }-${new Date().getFullYear()}`,
        totalPrice: $user.totalPrice,
        userID: $userId,
        adress: adress,
      };
      const allOrdersRef = ref(database, "allOrders/");
      const newOrderRef = push(allOrdersRef);
      const orderId = newOrderRef.key;
      set(newOrderRef, order);

      //
      //

      //
      //Make an Item
      let inBasketKeys = Object.keys($user.inBasket);
      let itemKeys = [];

      for (let i = 0; i < inBasketKeys.length; i++) {
        const key = inBasketKeys[i];
        const item = $user.inBasket[key];
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
            debugger;
            for (let i = 0; i < map[page].holesSides.length; i++) {
              let a = map[page].holesSides[i];
              let holes = side["holes"];
              if (a == "x1") {
                holes.push([10, 3.5], [15, 3.5]);
                holes.push([side["x"] - 15, 3.5], [side["x"] - 10, 3.5]);
                if (side.x > 180) {
                  holes.push([side.x / 2 + 2.5, 3.5], [side.x / 2 - 2.5, 3.5]);
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
                  holes.push([3.5, side.y / 2 + 2.5], [3.5, side.y / 2 - 2.5]);
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
        console.log(cubicMeters);
        console.log(totalWeight);
        console.log(materials);

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
          set(newItemRef, newItem);
          itemKeys.push(newItemRef.key);
        }
      } //
      //
      //
      //
      // Add Items to Order
      writeToDatabase("allOrders/" + orderId + "/items", itemKeys);
      debugger;
      let orderTotalWeight = 0;
      let orderCubicMeters = 0;
      const dbRef = ref(getDatabase());
      for (let i = 0; i < itemKeys.length; i++) {
        let itemId = itemKeys[i];
        get(child(dbRef, `items/${itemId}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              console.log(snapshot.val());
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
      //
      //
      //
      //
      //
      //Make Routes
      setTimeout(() => {
        function createNewRoute() {
          const routeRef = ref(database, `routes/${city}`);
          const newRouteRef = push(routeRef);
          set(newRouteRef, newRoute);
        }
        const maxWeight = 5000;
        const maxCubicMeters = 30;
        let newRoute = {
          maxWeight: maxWeight,
          maxCubicMeters: maxCubicMeters,
          currentWeight: orderTotalWeight,
          currentCubicMeters: orderCubicMeters,
          orders: [orderId],
          dateToShippment: `${new Date().getDate()}-${
            new Date().getMonth() + 2
          }-${new Date().getFullYear()}`,
        };
        get(child(dbRef, `routes/${city}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              let cityRoutes = snapshot.val();
              let noFreeRoutes = true;
              for (const key in cityRoutes) {
                let route = cityRoutes[key];
                if (
                  route.currentWeight + orderTotalWeight < route.maxWeight &&
                  route.currentCubicMeters + orderCubicMeters <
                    route.maxCubicMeters
                ) {
                  noFreeRoutes = false;
                  writeToDatabase(
                    `routes/${city}/${key}/orders/${route.orders.length}`,
                    orderId
                  );
                  writeToDatabase(
                    `routes/${city}/${key}/currentWeight`,
                    route.currentWeight + orderTotalWeight
                  );
                  writeToDatabase(
                    `routes/${city}/${key}/currentCubicMeters`,
                    route.currentCubicMeters + orderCubicMeters
                  );
                }
              }
              if (noFreeRoutes) {
                createNewRoute();
              }
            } else {
              createNewRoute();
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }, 5000);
    } else {
      alert("Само регистрираните потребители могат да правят поръчки");
    }
    toggle();
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
      <Button color="success" on:click={makeAnOrder}>Do Something</Button>
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
