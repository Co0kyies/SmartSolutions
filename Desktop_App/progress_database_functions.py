import os
import json
import sqlite3

def add_barcodes_to_progress_db():
    connection = sqlite3.connect("./SQLite_DB/progress.db")
    cursor = connection.cursor()
    cursor.execute("CREATE TABLE progress_track(barcode text Primary Key, OrderId text, Разкрой integar, Кантиране integar, Дупчене integar)")
    connection.commit()
    with open("./JSON_DB/barcodes.json", "r") as read_file:
        barcodes_JSON = json.load(read_file)
        for barcode in barcodes_JSON:
            if barcode != "allBarcodes":
                cursor.executemany("INSERT INTO progress_track VALUES (?,?,?,?,?)", [(str(barcode), barcodes_JSON[barcode]["OrderId"], 0, 0, 0)])
    connection.commit()
    connection.close()


def change_progress_db_value(barcode, machine):
    connection = sqlite3.connect("./SQLite_DB/progress.db")
    cursor = connection.cursor()
    cursor.execute(f"UPDATE progress_track SET {machine} = 1 WHERE barcode = '{barcode}'")
    connection.commit()
    connection.close()

def calc_percentage(x, y):
    return int(x/y*100)

def calculate_percentage_completion_order():
    connection = sqlite3.connect("./SQLite_DB/progress.db")
    cursor = connection.cursor()
    all_orders = cursor.execute("SELECT DISTINCT OrderId FROM progress_track")
    orders_dict = {}
    for order in all_orders:
        orders_dict[order[0]] = {"unfinished": 0, "finished": 0}
    rows = cursor.execute("SELECT * FROM progress_track")
    for row in rows:
        orderItem = orders_dict[row[1]]
        for i in range(2, 5):
            if row[i] == 0:
                orderItem["unfinished"] = orderItem["unfinished"] + 1
            else:
                orderItem["finished"] = orderItem["finished"] + 1
    order_percentages = {}
    for orderId in orders_dict:
        order_percentages[orderId] = calc_percentage(orders_dict[orderId]["finished"], orders_dict[orderId]["unfinished"])
    print(order_percentages)


calculate_percentage_completion_order()