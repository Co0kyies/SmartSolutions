import eel
# import subprocess, sys
import requests
import shutil

# eel.init("web/public")
# eel.start("index.html")

def runPDFtoPrinter():
    p = subprocess.Popen(["powershell.exe", 
              "./powershell/script.ps1"], 
              stdout=sys.stdout)    
    p.communicate()


def test_labelary_API():
    zpl = '^XA^FX Top section with logo, name and address.^CF0,60^FO50,50^GB100,100,100^FS^FO75,75^FR^GB100,100,100^FS^FO93,93^GB40,40,40^FS^FO220,50^FDSmart Solutions.^FS^CF0,30^FO220,115^FDOrder No. ORDERNUMBER^FS^FO220,155^FDCourse No. CourseNumber^FS^FO220,195^FDDestination: Ruse^FS^FO50,250^GB700,3,3^FS^FX Second section with recipient address and permit information.^CFA,30^FO150,300^FDHeight: ^FS^FO150,340^FDWidth: ^FS^FO150,380^FDDecor: ^FS^CFA,15^FO50,500^GB700,3,3^FS^FX Third section with bar code.^BY5,2,270^FO100,550^BC^FD12345678^FS^XZ'

    # adjust print density (8dpmm), label width (4 inches), label height (6 inches), and label index (0) as necessary
    url = 'http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/'
    files = {'file' : zpl}
    headers = {'Accept' : 'application/pdf'} # omit this line to get PNG images back
    response = requests.post(url, headers = headers, files = files, stream = True)

    if response.status_code == 200:
        response.raw.decode_content = True
        with open('label.pdf', 'wb') as out_file: # change file name for PNG images
            shutil.copyfileobj(response.raw, out_file)
    else:
        print('Error: ' + response.text)

test_labelary_API()