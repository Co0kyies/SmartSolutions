import random 

json1 = []

for x in range(0, 300):
    item = {}
    number_of_doors = random.randint(1,3)
    if number_of_doors == 1:
        item["name"] = "aura 1 врата"
    else:
        item["name"] = f"aura {number_of_doors} врати"
        

    siezesForDifferentModels = {
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
    1: [
      [40, 55],
      [50, 60],
      [170, 250],
    ],
    3: [
      [120, 165],
      [50, 60],
      [170, 250],
    ]}

    widht_ref = siezesForDifferentModels[number_of_doors][0]
    depth_ref = siezesForDifferentModels[number_of_doors][1]
    height_red = siezesForDifferentModels[number_of_doors][2]

    item["widht"] = random.randint(widht_ref[0], widht_ref[1])
    item["depth"] = random.randint(depth_ref[0], depth_ref[1])
    item["height"] = random.randint(height_red[0], height_red[1])
    

    decors = ["H3331","H1401ST22","U960ST9"]
    item["mainDecor"] = decors[random.randint(0,2)]
    item["firstDoor"] = decors[random.randint(0,2)]
    if number_of_doors == 2:
        item["secondDoor"] = decors[random.randint(0,2)]
    if number_of_doors == 3:
        item["secondDoor"] = decors[random.randint(0,2)]
        item["thirdDoor"] = decors[random.randint(0,2)]

    print(item)

    

