function cliensBar(ordersDB, clientsArray) {
  let idItemsMap = {};
  clientsArray.forEach((element) => {
    idItemsMap[element.clientID] = 0;
  });
  
  for (const order in ordersDB) {
    if (Object.hasOwnProperty.call(ordersDB, order)) {
    }
  }
}
