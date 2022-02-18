<script>
  export let name;
  import { onMount } from "svelte";
  import anime from "animejs/lib/anime.es.js";
  import { app } from "./firebase";
  import { getDatabase, ref, get, child, set } from "firebase/database";

  function schedule() {
    let courses = [];
    const dbRef = ref(getDatabase());
    get(child(dbRef, `schedule`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          console.log(snapshot.val());
          let snapshotVal = snapshot.val();
          for (let index = 0; index < snapshotVal.length; index++) {
            let course = snapshotVal[index];
            let ordersArray = course.orders;
            for (let index = 0; index < ordersArray.length; index++) {
              let orderId = ordersArray[index];
              function parentFunc() {
                let scopedCourse = course;
                let scopedOrdersArray = ordersArray;
                let scopedOrderId = orderId;
                let newCourseEntry = {};
                newCourseEntry.destination = scopedCourse.destination;
                newCourseEntry[scopedOrderId] = {};
                function childFunc(snapshot) {
                  if (snapshot.exists()) {
                    let orderItems = snapshot.val();
                    for (let index = 0; index < orderItems.length; index++) {
                      let itemId = orderItems[index];
                      newCourseEntry[scopedOrderId][itemId] = {};
                      get(child(dbRef, `items/${itemId}/model`)).then(
                        (snapshot) => {
                          if (snapshot.exists()) {
                            newCourseEntry[scopedOrderId][itemId].model =
                              snapshot.val();
                          }
                        }
                      );
                      get(child(dbRef, `items/${itemId}/materials`)).then(
                        (snapshot) => {
                          if (snapshot.exists()) {
                            newCourseEntry[scopedOrderId][itemId].materials =
                              snapshot.val();
                          }
                        }
                      );
                      setTimeout(() => {
                        courses.push(newCourseEntry);
                      }, 10000);
                    }
                  } else {
                  }
                }
                return childFunc;
              }
              // let childFunc = parentFunc()
              get(child(dbRef, `allOrders/${orderId}/items`)).then(
                parentFunc()
              );
            }
          }
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
    setTimeout(() => {
      eel.dump_orders(courses);
    }, 15000);
  }
</script>

<main>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn
    how to build Svelte apps.
  </p>
  <button on:click={schedule} />
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
