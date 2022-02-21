import eel
# import subprocess, sys
import requests
import shutil
import json
import uuid

eel.init("web/public")


def runPDFtoPrinter():
    p = subprocess.Popen(["powershell.exe", 
              "./powershell/script.ps1"], 
              stdout=sys.stdout)    
    p.communicate()

@eel.expose
def dump_orders(data):
    with open("./JSON_DB/orders.json", "w") as write_file:
        print("Funcion Activated")
        json.dump(data, write_file)
    make_barcodes()
    eel.my_javascript_function()


@eel.expose
def test_returns_py():
    return 1



def make_barcodes():
    with open("./JSON_DB/barcodes.json", "r") as read_barcodes:
        barcodes = json.load(read_barcodes)
    with open("./JSON_DB/orders.json", "r") as read_file:
        courses = json.load(read_file)
        for course in courses:
            destination = course["destination"]
            for key in course:
                if key != "destination":
                    order_id = key
                    for itemId in course[order_id]:
                        model = course[order_id][itemId]["model"]
                        for material in course[order_id][itemId]["materials"]:
                            barcode = str(uuid.uuid4())
                            newDict = {
                                "Hight": material["y"],
                                "Widht": material["x"],
                                "Decor": material["decor"],
                                "Course": destination,
                                "OrderId": order_id,
                                "ItemModel": model,
                            }
                            barcodes["allBarcodes"].append(barcode)
                            barcodes[barcode] = newDict
    with open("./JSON_DB/barcodes.json", "w") as write_barcodes:
        json.dump(barcodes, write_barcodes)
                        


def get_PDFs_labelry():
    with open("./JSON_DB/barcodes.json", "r") as read_barcodes:
        barcodes = json.load(read_barcodes)
        for key in barcodes:
            if key != "allBarcodes":
                barcode = key
                barcodeDict = barcodes[key]
                hight = barcodeDict["Hight"]
                widht = barcodeDict["Widht"]
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

def delete_all_JSON():
    def delete_barcodes():
        with open("./JSON_DB/barcodes.json", "w") as write_barcodes:
            json.dump({"allBarcodes": []}, write_barcodes)
    def delete_orders():
        with open("./JSON_DB/orders.json", "w") as write_orders:
            json.dump([], write_orders)
    delete_barcodes()
    delete_orders()

delete_all_JSON()
eel.start("index.html")
