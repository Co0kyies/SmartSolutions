var faker = require('faker')
let array = []
for (let index = 0; index < 100; index++) {
    array.push(faker.name.firstName())
}
console.log(array)
console.log("Hello World")