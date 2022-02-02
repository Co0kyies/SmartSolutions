# import eel
# eel.init("web/public")
# eel.start("index.html")
import subprocess, sys

def runPDFtoPrinter():
    p = subprocess.Popen(["powershell.exe", 
              "./powershell/script.ps1"], 
              stdout=sys.stdout)    
    p.communicate()

runPDFtoPrinter()