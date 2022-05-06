import eel
# import subprocess, sys
import requests
import shutil
import json
import uuid
import sqlite3
import os
import glob
eel.init("web/public")

# utilities
def delete_all_files_in_folder(dir):
    filelist = glob.glob(os.path.join(dir, "*"))
    for f in filelist:
        os.remove(f)
# utilities

def runPDFtoPrinter():
    p = subprocess.Popen(["powershell.exe", 
              "./powershell/script.ps1"], 
              stdout=sys.stdout)    
    p.communicate()

@eel.expose
def dump_orders(data):
    with open("./JSON_DB/orders.json", "w") as write_file:
        json.dump(data, write_file)
    make_barcodes()
    prepare_cutting_machine()
    create_cutting_machine_sql()
    add_barcodes_to_progress_db()
    # get_PDFs_labelry()
    return 1




def make_barcodes():
    with open("./JSON_DB/barcodes.json", "r") as read_barcodes:
        barcodes = json.load(read_barcodes)
    with open("./JSON_DB/orders.json", "r") as read_file:
        courses = json.load(read_file)
        barcode_num = 0
        for course in courses:
            destination = course["destination"]
            for key in course:
                if key != "destination":
                    order_id = key
                    for itemId in course[order_id]:
                        model = course[order_id][itemId]["model"]
                        for material in course[order_id][itemId]["materials"]:
                            barcode_num += 1
                            barcode_lenght = 9
                            barcode = ""
                            barcode_str = str(barcode_num)
                            for x in range(barcode_lenght - len(barcode_str)):
                                barcode += "0"
                            barcode += barcode_str
                            newDict = {
                                "Height": material["y"],
                                "Width": material["x"],
                                "Decor": material["decor"],
                                "Course": destination,
                                "OrderId": order_id,
                                "ItemModel": model,
                                "Holes": material["holes"]
                            }
                            barcodes["allBarcodes"].append(barcode)
                            barcodes[barcode] = newDict
    with open("./JSON_DB/barcodes.json", "w") as write_barcodes:
        json.dump(barcodes, write_barcodes)
                        
def prepare_cutting_machine():
    prepared_data = {}
    with open("./JSON_DB/barcodes.json", "r") as read_barcodes:
        barcodesJSON = json.load(read_barcodes)
        allBarcodes = barcodesJSON["allBarcodes"]
        for barcode in allBarcodes:
            barcode_obj = barcodesJSON[barcode]
            course = barcode_obj["Course"]
            try:
                prepared_data[course]
            except:
                prepared_data[course] = {}
            decor = barcode_obj["Decor"]
            try:
                prepared_data[course][decor]
            except:
                prepared_data[course][decor] = []            
            widht = barcode_obj["Width"]
            height = barcode_obj["Height"]
            square_centimeters = int(widht) * int(height)

            printing_sets = prepared_data[course][decor]
            max_square_centimeters =  250 * 300
            make_new_printing_set = True
            for printing_set in printing_sets:
                # printing_set template
                    # printing_set = {
                    #     squareCentimeters: 30
                    #     barcodes: []
                    # }
                current_square_centimeters = printing_set["squareCentimeters"]
                if square_centimeters + current_square_centimeters < max_square_centimeters:
                    printing_set["squareCentimeters"] += square_centimeters
                    printing_set["barcodes"].append(barcode)
                    make_new_printing_set = False
                    break
            if make_new_printing_set:
                printing_sets.append(
                    {
                        "squareCentimeters": square_centimeters,
                        "barcodes": [barcode]
                    }
                )
    with open("./JSON_DB/cutting_machine.json", "w") as write_cutting_machine:
        json.dump(prepared_data, write_cutting_machine)

def create_cutting_machine_sql():
    connection = sqlite3.connect("./SQLite_DB/cutting_machine.db")
    cursor = connection.cursor()
    cursor.execute("CREATE TABLE printing_sets(barcode text Primary Key, decor text, course text, printing_set_id text)")
    connection.commit()
    with open("./JSON_DB/cutting_machine.json", "r") as read_file:
        cutting_machine_JSON = json.load(read_file)
        for course_key in cutting_machine_JSON:
            course_obj = cutting_machine_JSON[course_key]
            for decor_key in course_obj:
                decor_obj = course_obj[decor_key]
                for printing_set in decor_obj:
                    printing_set_unique_id = str(uuid.uuid4())
                    barcodes = printing_set["barcodes"]
                    for barcode in barcodes:
                        cursor.executemany("INSERT INTO printing_sets VALUES (?,?,?,?)", [(str(barcode), decor_key, course_key, printing_set_unique_id)])
    connection.commit()
    connection.close()

@eel.expose
def get_printing_set():
    connection = sqlite3.connect("./SQLite_DB/cutting_machine.db")
    cursor = connection.cursor()
    printing_sets = [printing_set[0] for printing_set in cursor.execute("SELECT DISTINCT printing_set_id from printing_sets;")]
    printing_set = printing_sets[0]
    barcodes = cursor.execute("SELECT DISTINCT barcode,decor FROM printing_sets WHERE printing_set_id=:p", {"p":printing_set})
    for decor_touple in barcodes:
        barcode = decor_touple[0]
        change_progress_db_value(barcode, "Разкрой")
        decor = decor_touple[1]
    def prepare_PDFs():
        barcodes = [barcode_touple[0] for barcode_touple in cursor.execute("SELECT barcode FROM printing_sets WHERE printing_set_id=:p", {"p":printing_set})]
        for barcode in barcodes:
            os.rename(f"./pdf_files/{barcode}.pdf", f"./pdf_to_print/{barcode}.pdf")
    prepare_PDFs()
            # runPDFtoPrinter()
    cursor.execute("DELETE FROM printing_sets WHERE printing_set_id=:p", {"p":printing_set})
    connection.commit()
    connection.close()
    if len(printing_sets) > 1:
        return [decor, 1]
    else:
        return [decor, 0]

@eel.expose
def find_barcode(barcode):
    with open("./JSON_DB/barcodes.json", "r") as read_barcodes:
        barcodesJSON = json.load(read_barcodes)
        return barcodesJSON[barcode]

def get_PDFs_labelry():
    with open("./JSON_DB/barcodes.json", "r") as read_barcodes:
        barcodes = json.load(read_barcodes)
        for key in barcodes:
            if key != "allBarcodes":
                barcode = key
                barcodeDict = barcodes[key]
                hight = barcodeDict["Height"]
                widht = barcodeDict["Width"]
                decor = barcodeDict["Decor"]
                course_id = barcodeDict["Course"]
                order_id = barcodeDict["OrderId"]
                item_model = barcodeDict["ItemModel"]

                zpl = f"^XA^FX Top section with logo, name and address.^CF0,60^FO50,50^GB100,100,100^FS^FO75,75^FR^GB100,100,100^FS^FO93,93^GB40,40,40^FS^FO220,50^FDSmart Solutions.^FS^CF0,30^FO220,115^FDOrder No. ORDERNUMBER^FS^FO220,155^FDCourse No. CourseNumber^FS^FO220,195^FDDestination: Ruse^FS^FO50,250^GB700,3,3^FS^FX Second section with recipient address and permit information.^CFA,30^FO150,300^FDCourseId:  {course_id}^FS^FO150,340^FDOrderId: {order_id}^FS^FO150,380^FDItemModel: {item_model}^FS^FO150,420^FDHeight: {hight}^FS^FO150,460^FDWidth: {widht}^FS^FO150,500^FDDecor: {decor}^FS^CFA,15^FO50,550^GB700,3,3^FS^FX Third section with bar code.^BY5,2,270^FO100,600^BC^FD{barcode}^FS^XZ"

                url = 'http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/'
                files = {'file' : zpl}
                headers = {'Accept' : 'application/pdf'} # omit this line to get PNG images back
                response = requests.post(url, headers = headers, files = files, stream = True)
                if response.status_code == 200:
                    response.raw.decode_content = True
                    with open(f'pdf_files/{barcode}.pdf', 'wb') as out_file: # change file name for PNG images
                        shutil.copyfileobj(response.raw, out_file)
                else:
                    print('Error: ' + response.text)


# Progress Tasks Database -- START

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

@eel.expose
def change_progress_db_value(barcode, machine):
    connection = sqlite3.connect("./SQLite_DB/progress.db")
    cursor = connection.cursor()
    cursor.execute(f"UPDATE progress_track SET {machine} = 1 WHERE barcode = '{barcode}'")
    connection.commit()
    connection.close()

def calc_percentage(x, y):
    return int(x/y*100)
@eel.expose
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
    return (order_percentages)

# Progress Tasks Database -- END



def delete_all_JSON():
    def delete_barcodes():
        with open("./JSON_DB/barcodes.json", "w") as write_barcodes:
            json.dump({"allBarcodes": []}, write_barcodes)
    def delete_orders():
        with open("./JSON_DB/orders.json", "w") as write_orders:
            json.dump([], write_orders)
    delete_barcodes()
    delete_orders()

def delete_sqlite_db():
    try:
        os.remove("./SQLite_DB/cutting_machine.db")
        os.remove("./SQLite_DB/progress.db")
    except:
        print("Hi I don't do anything")
def delete_PDF_files():
    try:
        delete_all_files_in_folder("./pdf_files")
    except:
        print("Hi I don't do anything")
    try: 
        delete_all_files_in_folder("./pdf_to_print")
    except:
        print("Hi I don't do anything")

delete_all_JSON()
delete_sqlite_db()
delete_PDF_files()
eel.start("index.html")
